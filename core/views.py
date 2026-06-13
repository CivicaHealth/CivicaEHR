from django.shortcuts import render
from .audit import log_action
from .rbac import (
    role_required, clinical_required, attending_required,
    get_patient_for_user, get_encounter_for_user, get_owned_object,
    FRONT_DESK, UNDERGRAD, STUDENT, ATTENDING, ALL_ROLES,
)
from django.shortcuts import redirect
from django.shortcuts import get_object_or_404

from django.contrib.auth.decorators import login_required
from django.utils import timezone

from .models import Patient
from .models import Encounter
from .models import SOAPNote
from .models import Appointment
from .models import LabOrder
from .models import Vital

from .forms import PatientForm
from .forms import EncounterForm
from .forms import SOAPNoteForm
from .forms import AppointmentForm
from .forms import LabOrderForm
from .forms import VitalForm


def is_ehr_admin(user):
    """Returns True if user has EHR admin privileges (Users tab + full audit log)."""
    if user.is_superuser:
        return True
    try:
        return bool(user.userprofile.is_admin)
    except Exception:
        return False



@login_required
@role_required(FRONT_DESK, UNDERGRAD, STUDENT, ATTENDING)
def patient_list(request):

    query = request.GET.get("q", "").strip()
    patients = list(Patient.objects.all())

    if query:
        q_lower = query.lower()
        patients = [
            p for p in patients
            if q_lower in (p.last_name or "").lower()
            or q_lower in (p.first_name or "").lower()
        ]

    patients = sorted(patients, key=lambda p: (p.last_name or "").lower())

    return render(
        request,
        "core/patient_list.html",
        {
            "patients": patients
        },
    )


@login_required
@role_required(FRONT_DESK, UNDERGRAD, STUDENT, ATTENDING)
def patient_detail(request, patient_id):

    patient = get_patient_for_user(request.user, patient_id)

    encounters = patient.encounters.prefetch_related(
        "vitals", "lab_orders", "diagnoses", "medications", "soap_note"
    ).order_by("-encounter_date")

    allergies = patient.allergies.all().order_by("allergen")

    problems = patient.problems.all().order_by(
        "status", "description"
    )

    try:
        social_history = patient.social_history
    except Exception:
        social_history = None

    return render(
        request,
        "core/patient_detail.html",
        {
            "patient":        patient,
            "encounters":     encounters,
            "allergies":      allergies,
            "problems":       problems,
            "social_history": social_history,
        },
    )


@login_required
@role_required(FRONT_DESK, UNDERGRAD, STUDENT, ATTENDING)
def patient_create(request):

    if request.method == "POST":

        form = PatientForm(request.POST)

        if form.is_valid():

            patient = form.save()
            log_action(request=request, action="create", instance=patient)

            return redirect(
                "patient_detail",
                patient_id=patient.id,
            )

    else:
        form = PatientForm()

    return render(
        request,
        "core/patient_form.html",
        {
            "form": form
        },
    )


@login_required
@clinical_required
def encounter_create(request, patient_id):

    patient = get_patient_for_user(request.user, patient_id)

    if request.method == "POST":

        form = EncounterForm(request.POST)

        if form.is_valid():

            encounter = form.save(commit=False)

            encounter.patient = patient

            encounter.save()
            log_action(request=request, action="create", instance=encounter)

            return redirect(
                "patient_detail",
                patient_id=patient.id,
            )

    else:
        form = EncounterForm()

    return render(
        request,
        "core/encounter_form.html",
        {
            "patient": patient,
            "form": form,
        },
    )


@login_required
@role_required(STUDENT, ATTENDING)
def soap_note_edit(request, encounter_id):

    encounter = get_encounter_for_user(request.user, encounter_id)

    try:
        soap_note = encounter.soap_note

    except SOAPNote.DoesNotExist:
        soap_note = None

    if request.method == "POST":

        form = SOAPNoteForm(
            request.POST,
            instance=soap_note,
        )

        if form.is_valid():

            note = form.save(commit=False)

            note.encounter = encounter
            is_new = note.pk is None
            note.save()
            log_action(request=request, action="create" if is_new else "update", instance=note)

            return redirect(
                "patient_detail",
                patient_id=encounter.patient.id,
            )

    else:

        form = SOAPNoteForm(
            instance=soap_note,
        )

    return render(
        request,
        "core/soap_note_form.html",
        {
            "encounter": encounter,
            "form": form,
        },
    )


@login_required
def dashboard(request):

    patient_count     = Patient.objects.count()
    appointment_count = Appointment.objects.count()
    encounter_count   = Encounter.objects.count()
    recent_patients   = Patient.objects.order_by("-created_at")[:5]

    return render(
        request,
        "core/dashboard.html",
        {
            "patient_count": patient_count,
            "appointment_count": appointment_count,
            "encounter_count": encounter_count,
            "recent_patients": recent_patients,
        },
    )


# ── APPOINTMENTS ──────────────────────────────────────────────────────────────

@login_required
@role_required(FRONT_DESK, UNDERGRAD, STUDENT, ATTENDING)
def appointment_list(request):

    status_filter = request.GET.get("status", "")
    date_filter   = request.GET.get("date", "")

    appointments = Appointment.objects.select_related("patient").order_by(
        "appointment_date"
    )

    if status_filter:
        appointments = appointments.filter(status=status_filter)

    if date_filter:
        appointments = appointments.filter(appointment_date__date=date_filter)

    counts = {
        "all":         Appointment.objects.count(),
        "scheduled":   Appointment.objects.filter(status="scheduled").count(),
        "arrived":     Appointment.objects.filter(status="arrived").count(),
        "in_progress": Appointment.objects.filter(status="in_progress").count(),
        "completed":   Appointment.objects.filter(status="completed").count(),
        "cancelled":   Appointment.objects.filter(status="cancelled").count(),
        "no_show":     Appointment.objects.filter(status="no_show").count(),
    }

    return render(
        request,
        "core/appointment_list.html",
        {
            "appointments":  appointments,
            "status_filter": status_filter,
            "date_filter":   date_filter,
            "counts":        counts,
        },
    )


@login_required
@role_required(FRONT_DESK, UNDERGRAD, STUDENT, ATTENDING)
def appointment_calendar(request):
    """Calendar view for scheduling new appointments."""
    patients = Patient.objects.order_by("last_name", "first_name")
    return render(
        request,
        "core/appointment_calendar.html",
        {
            "patients": patients,
        },
    )


@login_required
@role_required(FRONT_DESK, UNDERGRAD, STUDENT, ATTENDING)
def appointment_json(request):
    """JSON feed for FullCalendar — returns appointments in the requested range."""
    import json
    from django.http import JsonResponse

    start = request.GET.get("start")
    end   = request.GET.get("end")

    appointments = Appointment.objects.select_related("patient")

    if start:
        appointments = appointments.filter(appointment_date__gte=start)
    if end:
        appointments = appointments.filter(appointment_date__lte=end)

    STATUS_COLORS = {
        "scheduled":   "#2f80ed",
        "arrived":     "#2e7d32",
        "in_progress": "#e65100",
        "completed":   "#27ae60",
        "cancelled":   "#e74c3c",
        "no_show":     "#e67e22",
    }

    events = []
    for appt in appointments:
        duration = getattr(appt, "duration_minutes", None) or 30
        from datetime import timedelta
        end_dt = appt.appointment_date + timedelta(minutes=duration)
        events.append({
            "id":    appt.id,
            "title": str(appt.patient),
            "start": appt.appointment_date.isoformat(),
            "end":   end_dt.isoformat(),
            "color": STATUS_COLORS.get(appt.status, "#2f80ed"),
            "extendedProps": {
                "reason":   appt.reason,
                "status":   appt.status,
                "notes":    appt.notes,
                "duration": duration,
                "patient_id": appt.patient.id,
            },
        })

    return JsonResponse(events, safe=False)


@login_required
@login_required
@role_required(FRONT_DESK, UNDERGRAD, STUDENT, ATTENDING)
def appointment_create(request):
    import json
    import traceback
    from django.http import JsonResponse
    from django.utils.dateparse import parse_datetime
    from django.utils import timezone as tz

    if request.method == "POST":
        try:
            data = json.loads(request.body)

            patient = get_patient_for_user(request.user, data.get("patient"))

            appt_dt = parse_datetime(data.get("appointment_date", ""))
            if appt_dt is None:
                return JsonResponse({"error": "Invalid date: " + str(data.get("appointment_date"))}, status=400)

            if tz.is_naive(appt_dt):
                appt_dt = tz.make_aware(appt_dt)

            appt = Appointment(
                patient          = patient,
                appointment_date = appt_dt,
                reason           = data.get("reason", ""),
                status           = data.get("status", "scheduled"),
                notes            = data.get("notes", ""),
            )
            if hasattr(Appointment, "duration_minutes"):
                appt.duration_minutes = int(data.get("duration_minutes") or 30)
            appt.save()

            return JsonResponse({"id": appt.id, "status": "ok"})

        except Exception as e:
            traceback.print_exc()
            return JsonResponse({"error": str(e), "trace": traceback.format_exc()}, status=500)

    return JsonResponse({"error": "Method not allowed"}, status=405)


@login_required
@role_required(FRONT_DESK, UNDERGRAD, STUDENT, ATTENDING)
def appointment_edit(request, appointment_id):
    import json
    from django.http import JsonResponse

    from .models import Appointment as ApptModel
    appointment = get_owned_object(ApptModel, request.user, id=appointment_id)

    if request.method == "POST":

        # JSON patch from calendar (drag/resize or modal edit)
        if request.content_type and "json" in request.content_type:
            data = json.loads(request.body)
            if "appointment_date" in data:
                from django.utils.dateparse import parse_datetime
                from django.utils import timezone as tz
                appt_dt = parse_datetime(data["appointment_date"])
                if appt_dt and tz.is_naive(appt_dt):
                    appt_dt = tz.make_aware(appt_dt)
                if appt_dt:
                    appointment.appointment_date = appt_dt
            if "duration_minutes" in data:
                appointment.duration_minutes = int(data["duration_minutes"] or 30)
            if "patient" in data:
                appointment.patient = get_patient_for_user(request.user, data["patient"])
            if "reason" in data:
                appointment.reason = data["reason"]
            if "status" in data:
                appointment.status = data["status"]
            if "notes" in data:
                appointment.notes = data["notes"]
            appointment.save()
            return JsonResponse({"status": "ok"})

        form = AppointmentForm(request.POST, instance=appointment)
        if form.is_valid():
            form.save()
            return redirect("appointment_list")

    else:
        form = AppointmentForm(instance=appointment)

    patients = Patient.objects.order_by("last_name")

    return render(
        request,
        "core/appointment_form.html",
        {
            "form":        form,
            "appointment": appointment,
            "patients":    patients,
            "editing":     True,
        },
    )


@login_required
@role_required(FRONT_DESK, UNDERGRAD, STUDENT, ATTENDING)
def appointment_status(request, appointment_id):
    """Quick status update via POST — used by the inline status buttons."""

    appointment = get_object_or_404(Appointment, id=appointment_id)

    if request.method == "POST":

        new_status = request.POST.get("status")

        if new_status in dict(Appointment.STATUS_CHOICES):

            appointment.status = new_status
            appointment.save()

    return redirect(request.POST.get("next", "appointment_list"))


@login_required
@role_required(STUDENT, ATTENDING)
def appointment_delete(request, appointment_id):
    from django.http import JsonResponse

    appointment = get_object_or_404(Appointment, id=appointment_id)

    if request.method == "POST":
        log_action(request=request, action="delete", instance=appointment,
                   extra=f"Deleted appointment id={appointment.id}")
        appointment.delete()

        return JsonResponse({"status": "deleted"})

    return render(
        request,
        "core/appointment_confirm_delete.html",
        {
            "appointment": appointment,
        },
    )


# ── LAB ORDERS ────────────────────────────────────────────────────────────────

@login_required
@role_required(UNDERGRAD, STUDENT, ATTENDING)
def lab_order_list(request):

    status_filter = request.GET.get("status", "")

    orders = LabOrder.objects.select_related(
        "encounter__patient"
    ).order_by("-ordered_at")

    if status_filter:
        orders = orders.filter(status=status_filter)

    counts = {
        "all":       LabOrder.objects.count(),
        "ordered":   LabOrder.objects.filter(status="ordered").count(),
        "completed": LabOrder.objects.filter(status="completed").count(),
        "cancelled": LabOrder.objects.filter(status="cancelled").count(),
    }

    return render(
        request,
        "core/lab_order_list.html",
        {
            "orders":        orders,
            "status_filter": status_filter,
            "counts":        counts,
        },
    )


@login_required
@role_required(UNDERGRAD, STUDENT, ATTENDING)
def lab_order_create(request, encounter_id):

    encounter = get_encounter_for_user(request.user, encounter_id)

    if request.method == "POST":

        form = LabOrderForm(request.POST)

        if form.is_valid():

            order = form.save(commit=False)
            order.encounter = encounter
            order.save()
            log_action(request=request, action="create", instance=order)

            return redirect("patient_detail", patient_id=encounter.patient.id)

    else:
        form = LabOrderForm()

    return render(
        request,
        "core/lab_order_form.html",
        {
            "form":      form,
            "encounter": encounter,
        },
    )


@login_required
@role_required(UNDERGRAD, STUDENT, ATTENDING)
def lab_order_edit(request, order_id):

    order = get_owned_object(LabOrder, request.user, id=order_id)

    if request.method == "POST":

        form = LabOrderForm(request.POST, instance=order)

        if form.is_valid():

            form.save()
            log_action(request=request, action="update", instance=order)

            # Return to wherever the user came from, defaulting to lab list
            next_url = request.POST.get("next", "")
            if next_url:
                return redirect(next_url)
            return redirect("lab_order_list")

    else:
        form = LabOrderForm(instance=order)

    return render(
        request,
        "core/lab_order_form.html",
        {
            "form":    form,
            "order":   order,
            "editing": True,
        },
    )


# ── VITALS ────────────────────────────────────────────────────────────────────

@login_required
@role_required(UNDERGRAD, STUDENT, ATTENDING)
def vitals_edit(request, encounter_id):

    encounter = get_encounter_for_user(request.user, encounter_id)

    # One vitals record per encounter; create if missing
    vital = encounter.vitals.first()

    if request.method == "POST":

        form = VitalForm(request.POST, instance=vital)

        if form.is_valid():

            is_new = vital is None
            v = form.save(commit=False)
            v.encounter = encounter
            v.save()
            log_action(request=request, action="create" if is_new else "update", instance=v)

            return redirect("patient_detail", patient_id=encounter.patient.id)

    else:
        form = VitalForm(instance=vital)

    return render(
        request,
        "core/vitals_form.html",
        {
            "form":      form,
            "encounter": encounter,
            "vital":     vital,
        },
    )



# ── ALLERGIES ─────────────────────────────────────────────────────────────────

@login_required
@clinical_required
def allergy_save(request, patient_id):
    """Create or update an allergy via POST (used by inline modal)."""
    from django.http import JsonResponse
    import json

    patient = get_patient_for_user(request.user, patient_id)

    if request.method == "POST":
        data = json.loads(request.body)
        allergy_id = data.get("id")

        if allergy_id:
            from .models import Allergy
            obj = get_object_or_404(Allergy, id=allergy_id, patient=patient)
        else:
            from .models import Allergy
            obj = Allergy(patient=patient)

        is_new = not bool(allergy_id)
        obj.allergen = data.get("allergen", "").strip()
        obj.reaction  = data.get("reaction", "").strip()
        obj.severity  = data.get("severity", "").strip()
        obj.save()
        log_action(request=request, action="create" if is_new else "update",
                   instance=obj, patient=patient)
        return JsonResponse({"id": obj.id, "status": "ok"})

    return JsonResponse({"error": "POST required"}, status=405)


@login_required
@clinical_required
def allergy_delete(request, allergy_id):
    from django.http import JsonResponse
    from .models import Allergy

    obj = get_object_or_404(Allergy, id=allergy_id)
    if request.method == "POST":
        log_action(request=request, action="delete", instance=obj, patient=obj.patient)
        obj.delete()
        return JsonResponse({"status": "deleted"})
    return JsonResponse({"error": "POST required"}, status=405)


# ── PROBLEMS (Medical History) ────────────────────────────────────────────────

@login_required
@clinical_required
def problem_save(request, patient_id):
    from django.http import JsonResponse
    import json
    from .models import Problem

    patient = get_patient_for_user(request.user, patient_id)

    if request.method == "POST":
        data = json.loads(request.body)
        problem_id = data.get("id")

        obj = get_object_or_404(Problem, id=problem_id, patient=patient) \
              if problem_id else Problem(patient=patient)

        is_new = not bool(problem_id)
        obj.icd10_code    = data.get("icd10_code", "").strip()
        obj.description   = data.get("description", "").strip()
        obj.status        = data.get("status", "active")
        obj.onset_date    = data.get("onset_date") or None
        obj.resolved_date = data.get("resolved_date") or None
        obj.save()
        log_action(request=request, action="create" if is_new else "update",
                   instance=obj, patient=patient)
        return JsonResponse({"id": obj.id, "status": "ok"})

    return JsonResponse({"error": "POST required"}, status=405)


@login_required
@clinical_required
def problem_delete(request, problem_id):
    from django.http import JsonResponse
    from .models import Problem

    obj = get_object_or_404(Problem, id=problem_id)
    if request.method == "POST":
        log_action(request=request, action="delete", instance=obj, patient=obj.patient)
        obj.delete()
        return JsonResponse({"status": "deleted"})
    return JsonResponse({"error": "POST required"}, status=405)


# ── DIAGNOSES (per encounter) ─────────────────────────────────────────────────

@login_required
@role_required(STUDENT, ATTENDING)
def diagnosis_save(request, encounter_id):
    from django.http import JsonResponse
    import json
    from .models import Diagnosis

    encounter = get_encounter_for_user(request.user, encounter_id)

    if request.method == "POST":
        data = json.loads(request.body)
        diag_id = data.get("id")

        obj = get_object_or_404(Diagnosis, id=diag_id, encounter=encounter) \
              if diag_id else Diagnosis(encounter=encounter)

        is_new = not bool(diag_id)
        obj.icd10_code  = data.get("icd10_code", "").strip()
        obj.description = data.get("description", "").strip()
        obj.save()
        log_action(request=request, action="create" if is_new else "update",
                   instance=obj, patient=encounter.patient)
        return JsonResponse({"id": obj.id, "status": "ok"})

    return JsonResponse({"error": "POST required"}, status=405)


@login_required
@role_required(STUDENT, ATTENDING)
def diagnosis_delete(request, diagnosis_id):
    from django.http import JsonResponse
    from .models import Diagnosis

    obj = get_object_or_404(Diagnosis, id=diagnosis_id)
    if request.method == "POST":
        log_action(request=request, action="delete", instance=obj,
                   patient=obj.encounter.patient)
        obj.delete()
        return JsonResponse({"status": "deleted"})
    return JsonResponse({"error": "POST required"}, status=405)


# ── MEDICATIONS (per encounter) ───────────────────────────────────────────────

@login_required
@role_required(STUDENT, ATTENDING)
def medication_save(request, encounter_id):
    from django.http import JsonResponse
    import json
    from .models import Medication

    encounter = get_encounter_for_user(request.user, encounter_id)

    if request.method == "POST":
        data = json.loads(request.body)
        med_id = data.get("id")

        obj = get_object_or_404(Medication, id=med_id, encounter=encounter) \
              if med_id else Medication(encounter=encounter)

        is_new = not bool(med_id)
        obj.name         = data.get("name", "").strip()
        obj.dosage       = data.get("dosage", "").strip()
        obj.instructions = data.get("instructions", "").strip()
        obj.save()
        log_action(request=request, action="create" if is_new else "update",
                   instance=obj, patient=encounter.patient)
        return JsonResponse({"id": obj.id, "status": "ok"})

    return JsonResponse({"error": "POST required"}, status=405)


@login_required
@role_required(STUDENT, ATTENDING)
def medication_delete(request, medication_id):
    from django.http import JsonResponse
    from .models import Medication

    obj = get_object_or_404(Medication, id=medication_id)
    if request.method == "POST":
        log_action(request=request, action="delete", instance=obj,
                   patient=obj.encounter.patient)
        obj.delete()
        return JsonResponse({"status": "deleted"})
    return JsonResponse({"error": "POST required"}, status=405)


# ── PRESCRIPTIONS ─────────────────────────────────────────────────────────────

@login_required
@role_required(STUDENT, ATTENDING)
def prescription_list(request):
    from .models import Prescription

    status_filter = request.GET.get("status", "")

    prescriptions = Prescription.objects.select_related(
        "encounter__patient"
    ).order_by("-created_at")

    if status_filter:
        prescriptions = prescriptions.filter(status=status_filter)

    counts = {
        "all":       Prescription.objects.count(),
        "draft":     Prescription.objects.filter(status="draft").count(),
        "sent":      Prescription.objects.filter(status="sent").count(),
        "cancelled": Prescription.objects.filter(status="cancelled").count(),
    }

    return render(
        request,
        "core/prescription_list.html",
        {
            "prescriptions": prescriptions,
            "status_filter": status_filter,
            "counts":        counts,
        },
    )


@login_required
@role_required(STUDENT, ATTENDING)
def prescription_create(request, encounter_id):
    from .models import Prescription
    from .forms import PrescriptionForm

    encounter = get_encounter_for_user(request.user, encounter_id)

    if request.method == "POST":
        form = PrescriptionForm(request.POST)
        if form.is_valid():
            rx = form.save(commit=False)
            rx.encounter = encounter
            rx.save()
            log_action(request=request, action="create", instance=rx)
            return redirect("patient_detail", patient_id=encounter.patient.id)
    else:
        form = PrescriptionForm()

    return render(
        request,
        "core/prescription_form.html",
        {
            "form":      form,
            "encounter": encounter,
        },
    )


@login_required
@role_required(STUDENT, ATTENDING)
def prescription_edit(request, prescription_id):
    from .models import Prescription
    from .forms import PrescriptionForm

    rx = get_object_or_404(Prescription, id=prescription_id)

    if request.method == "POST":
        form = PrescriptionForm(request.POST, instance=rx)
        if form.is_valid():
            form.save()
            log_action(request=request, action="update", instance=rx)
            next_url = request.POST.get("next", "")
            return redirect(next_url) if next_url else redirect("prescription_list")
    else:
        form = PrescriptionForm(instance=rx)

    return render(
        request,
        "core/prescription_form.html",
        {
            "form":    form,
            "rx":      rx,
            "editing": True,
        },
    )


# ── SOCIAL HISTORY ────────────────────────────────────────────────────────────

@login_required
@clinical_required
def social_history_save(request, patient_id):
    import json
    from django.http import JsonResponse
    from .models import SocialHistory

    patient = get_patient_for_user(request.user, patient_id)

    if request.method == "POST":
        data = json.loads(request.body)

        obj, _ = SocialHistory.objects.get_or_create(patient=patient)

        obj.tobacco_status = data.get("tobacco_status", "")
        obj.tobacco_note   = data.get("tobacco_note", "")
        obj.alcohol_status = data.get("alcohol_status", "")
        obj.alcohol_note   = data.get("alcohol_note", "")
        obj.drug_status    = data.get("drug_status", "")
        obj.drug_note      = data.get("drug_note", "")
        obj.occupation     = data.get("occupation", "")
        obj.exercise       = data.get("exercise", "")
        obj.diet           = data.get("diet", "")
        obj.notes          = data.get("notes", "")
        obj.save()
        log_action(request=request, action="update", instance=obj, patient=patient)

        return JsonResponse({"status": "ok"})

    return JsonResponse({"error": "POST required"}, status=405)


# ── USERS ─────────────────────────────────────────────────────────────────────

ROLE_CHOICES = [
    ("front_desk_volunteer",  "Front Desk Volunteer"),
    ("undergrad_staff",       "Undergrad Staff (Vitals/Lab)"),
    ("student_practitioner",  "Student Practitioner / Scribe"),
    ("attending_faculty",     "Attending Faculty (Preceptor)"),
]


@login_required
def user_list(request):
    from django.contrib.auth.models import User as DjangoUser
    from .models import UserProfile

    users = DjangoUser.objects.select_related("userprofile").order_by(
        "last_name", "first_name", "username"
    )

    return render(
        request,
        "core/user_list.html",
        {
            "users":        users,
            "role_choices": ROLE_CHOICES,
        },
    )


@login_required
def user_create(request):
    if not is_ehr_admin(request.user):
        return render(request, "core/403.html", status=403)
    from django.contrib.auth.models import User as DjangoUser
    from .models import UserProfile

    if request.method == "POST":
        username   = request.POST.get("username", "").strip()
        first_name = request.POST.get("first_name", "").strip()
        last_name  = request.POST.get("last_name", "").strip()
        email      = request.POST.get("email", "").strip()
        password   = request.POST.get("password", "")
        role       = request.POST.get("role", "")
        is_admin   = request.POST.get("is_admin") == "on"

        errors = []
        if not username:
            errors.append("Username is required.")
        elif DjangoUser.objects.filter(username=username).exists():
            errors.append("Username already exists.")
        if not password:
            errors.append("Password is required.")

        if errors:
            return render(request, "core/user_form.html", {
                "errors":       errors,
                "role_choices": ROLE_CHOICES,
                "form_data":    request.POST,
            })

        user = DjangoUser.objects.create_user(
            username=username,
            password=password,
            first_name=first_name,
            last_name=last_name,
            email=email,
        )
        # Never touch is_staff or is_superuser — those are Django admin flags
        user.save()

        UserProfile.objects.create(
            user=user, role=role,
            is_admin=(request.POST.get("is_admin") == "on"),
        )

        # Assign to the corresponding Django Group
        if role:
            from django.contrib.auth.models import Group
            user.groups.clear()
            try:
                user.groups.add(Group.objects.get(name=role))
            except Group.DoesNotExist:
                pass

        log_action(request=request, action="create",
                   extra=f"Created user username={username} role={role}")

        return redirect("user_list")

    return render(request, "core/user_form.html", {
        "role_choices": ROLE_CHOICES,
    })


@login_required
def user_edit(request, user_id):
    if not is_ehr_admin(request.user):
        return render(request, "core/403.html", status=403)
    from django.contrib.auth.models import User as DjangoUser
    from .models import UserProfile

    target = get_object_or_404(DjangoUser, id=user_id)
    profile, _ = UserProfile.objects.get_or_create(
        user=target, defaults={"role": ""}
    )

    if request.method == "POST":
        target.first_name = request.POST.get("first_name", "").strip()
        target.last_name  = request.POST.get("last_name", "").strip()
        target.email      = request.POST.get("email", "").strip()
        is_admin = request.POST.get("is_admin") == "on"

        new_password = request.POST.get("password", "").strip()
        if new_password:
            target.set_password(new_password)

        target.save()

        new_role = request.POST.get("role", "")
        profile.role     = new_role
        profile.is_admin = request.POST.get("is_admin") == "on"
        profile.save()

        # Reassign Django Group
        from django.contrib.auth.models import Group as DjangoGroup
        target.groups.clear()
        if new_role:
            try:
                target.groups.add(DjangoGroup.objects.get(name=new_role))
            except DjangoGroup.DoesNotExist:
                pass

        return redirect("user_list")

    return render(request, "core/user_form.html", {
        "editing":      True,
        "target":       target,
        "profile":      profile,
        "role_choices": ROLE_CHOICES,
    })


# ── HIPAA AUDIT LOG VIEWER ────────────────────────────────────────────────────

@login_required
def hipaa_log_list(request):
    from .models import HIPAALog

    action_filter  = request.GET.get("action", "")
    patient_filter = request.GET.get("patient", "")
    user_filter    = request.GET.get("user", "")

    # EHR admins see all logs; everyone else sees only their own
    logs = HIPAALog.objects.select_related("user", "patient").order_by("-timestamp")
    if not is_ehr_admin(request.user):
        logs = logs.filter(user=request.user)

    if action_filter:
        logs = logs.filter(action=action_filter)
    if patient_filter:
        logs = logs.filter(patient__id=patient_filter)
    if user_filter:
        logs = logs.filter(username_snapshot__icontains=user_filter)

    # Paginate — 100 per page
    from django.core.paginator import Paginator
    paginator = Paginator(logs, 100)
    page_num  = request.GET.get("page", 1)
    page      = paginator.get_page(page_num)

    from .models import HIPAALog as HL
    action_choices = HL.ACTION_CHOICES

    return render(
        request,
        "core/hipaa_log.html",
        {
            "page":           page,
            "action_filter":  action_filter,
            "patient_filter": patient_filter,
            "user_filter":    user_filter,
            "action_choices": action_choices,
            "total":          paginator.count,
        },
    )


# ── Error handlers ────────────────────────────────────────────────────────────

def handler403(request, exception=None):
    return render(request, "core/403.html", status=403)


# ── SECURE LOGIN VIEW (rate-limited) ──────────────────────────────────────────

def secure_login(request):
    """
    Rate-limited login view using database-backed attempt tracking.

    Limits (checked independently):
      - 5 failed attempts per IP within 5 minutes
      - 5 failed attempts per username within 5 minutes
    No external cache required — uses PostgreSQL.
    """
    from django.contrib.auth import authenticate, login
    from django.contrib.auth.forms import AuthenticationForm
    from django.utils import timezone
    from datetime import timedelta
    from .models import LoginAttempt

    WINDOW_MINUTES = 5
    MAX_ATTEMPTS   = 5

    ip       = _get_client_ip(request)
    username = request.POST.get('username', '').strip() if request.method == 'POST' else ''
    since    = timezone.now() - timedelta(minutes=WINDOW_MINUTES)

    def is_rate_limited():
        ip_failures = LoginAttempt.objects.filter(
            ip_address=ip,
            succeeded=False,
            timestamp__gte=since,
        ).count()
        if ip_failures >= MAX_ATTEMPTS:
            return True
        if username:
            user_failures = LoginAttempt.objects.filter(
                username__iexact=username,
                succeeded=False,
                timestamp__gte=since,
            ).count()
            if user_failures >= MAX_ATTEMPTS:
                return True
        return False

    if request.method == 'POST':
        if is_rate_limited():
            log_action(
                request=request,
                action='login_failure',
                extra=f"Rate limit exceeded ip={ip} username={username}",
            )
            return render(request, 'registration/login.html', {
                'form':         AuthenticationForm(),
                'rate_limited': True,
                'error':        'Too many login attempts. Please wait 5 minutes.',
            }, status=429)

        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            # Record successful attempt then clear failures
            LoginAttempt.objects.create(
                ip_address=ip, username=username, succeeded=True
            )
            LoginAttempt.objects.filter(
                username__iexact=username, succeeded=False
            ).delete()
            login(request, user)
            next_url = request.GET.get('next', '/')
            return redirect(next_url)
        else:
            # Record failure
            LoginAttempt.objects.create(
                ip_address=ip, username=username, succeeded=False
            )
            return render(request, 'registration/login.html', {
                'form':  form,
                'error': 'Invalid username or password.',
            })

    return render(request, 'registration/login.html', {
        'form': AuthenticationForm(),
    })


def _get_client_ip(request):
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


# ── SCREEN LOCK VERIFY ────────────────────────────────────────────────────────

@login_required
def screen_lock_verify(request):
    """
    AJAX endpoint called by the screen lock overlay.
    Verifies the current user's password without creating a new session.
    Returns JSON {ok: true} or {ok: false, error: '...'}.
    """
    import json
    from django.http import JsonResponse
    from django.contrib.auth import authenticate

    if request.method != 'POST':
        return JsonResponse({'ok': False, 'error': 'POST required'}, status=405)

    data     = json.loads(request.body)
    password = data.get('password', '')

    user = authenticate(
        request,
        username=request.user.username,
        password=password,
    )

    if user is not None:
        log_action(
            request=request,
            action='login_success',
            extra=f'Screen lock unlocked by {request.user.username}',
        )
        return JsonResponse({'ok': True})
    else:
        log_action(
            request=request,
            action='login_failure',
            extra=f'Screen lock failed for {request.user.username}',
        )
        return JsonResponse({'ok': False, 'error': 'Incorrect password.'})


# ── LOGOUT WITH NEXT ──────────────────────────────────────────────────────────

def logout_with_next(request):
    """
    Logs the user out and redirects to login, preserving the ?next= parameter
    so after re-login they return to the page they were on.
    """
    from django.contrib.auth import logout
    from django.shortcuts import redirect

    next_url = request.GET.get('next', '') or request.POST.get('next', '')
    logout(request)

    login_url = '/accounts/login/'
    if next_url:
        return redirect(f"{login_url}?next={next_url}")
    return redirect(login_url)


# ── SESSION PING ──────────────────────────────────────────────────────────────

def session_ping(request):
    """
    Lightweight endpoint to check if the current session is still valid.
    Called by the pageshow handler on back-button navigation.
    Returns {alive: true} if authenticated, {alive: false} otherwise.
    No @login_required — must return 200 even for logged-out users.
    """
    from django.http import JsonResponse
    return JsonResponse({'alive': request.user.is_authenticated})
