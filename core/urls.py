from django.urls import path

from . import views

urlpatterns = [

    path(
        "",
        views.patient_list,
        name="patient_list",
    ),

    path(
        "patients/new/",
        views.patient_create,
        name="patient_create",
    ),

    path(
        "patients/<int:patient_id>/",
        views.patient_detail,
        name="patient_detail",
    ),

    path(
        "patients/<int:patient_id>/encounters/new/",
        views.encounter_create,
        name="encounter_create",
    ),

    path(
        "encounters/<int:encounter_id>/soap/",
        views.soap_note_edit,
        name="soap_note_edit",
    ),

    path(
        "dashboard/",
        views.dashboard,
        name="dashboard",
    ),

    # ── Appointments ──────────────────────────────────────────────────────────

    path(
        "appointments/",
        views.appointment_list,
        name="appointment_list",
    ),

    path(
        "appointments/new/",
        views.appointment_calendar,
        name="appointment_calendar",
    ),

    path(
        "appointments/create/",
        views.appointment_create,
        name="appointment_create",
    ),

    path(
        "appointments/<int:appointment_id>/edit/",
        views.appointment_edit,
        name="appointment_edit",
    ),

    path(
        "appointments/<int:appointment_id>/status/",
        views.appointment_status,
        name="appointment_status",
    ),

    path(
        "appointments/<int:appointment_id>/delete/",
        views.appointment_delete,
        name="appointment_delete",
    ),

    # ── Lab Orders ────────────────────────────────────────────────────────────

    path(
        "labs/",
        views.lab_order_list,
        name="lab_order_list",
    ),

    path(
        "encounters/<int:encounter_id>/labs/new/",
        views.lab_order_create,
        name="lab_order_create",
    ),

    path(
        "labs/<int:order_id>/edit/",
        views.lab_order_edit,
        name="lab_order_edit",
    ),

    # ── Referrals ────────────────────────────────────────────────────────────

    path(
        "referrals/",
        views.referral_list,
        name="referral_list",
    ),

    path(
        "patients/<int:patient_id>/referrals/new/",
        views.referral_create,
        name="referral_create",
    ),

    path(
        "referrals/<int:referral_id>/edit/",
        views.referral_edit,
        name="referral_edit",
    ),

    # ── Vitals ────────────────────────────────────────────────────────────────

    path(
        "encounters/<int:encounter_id>/vitals/",
        views.vitals_edit,
        name="vitals_edit",
    ),

    path(
        "appointments/json/",
        views.appointment_json,
        name="appointment_json",
    ),

# ── Allergies ─────────────────────────────────────────────────────────────

    path(
        "patients/<int:patient_id>/allergies/save/",
        views.allergy_save,
        name="allergy_save",
    ),

    path(
        "allergies/<int:allergy_id>/delete/",
        views.allergy_delete,
        name="allergy_delete",
    ),

    # ── Problems ──────────────────────────────────────────────────────────────

    path(
        "patients/<int:patient_id>/problems/save/",
        views.problem_save,
        name="problem_save",
    ),

    path(
        "problems/<int:problem_id>/delete/",
        views.problem_delete,
        name="problem_delete",
    ),

    # ── Diagnoses ─────────────────────────────────────────────────────────────

    path(
        "encounters/<int:encounter_id>/diagnoses/save/",
        views.diagnosis_save,
        name="diagnosis_save",
    ),

    path(
        "diagnoses/<int:diagnosis_id>/delete/",
        views.diagnosis_delete,
        name="diagnosis_delete",
    ),

    # ── Medications ───────────────────────────────────────────────────────────

    path(
        "encounters/<int:encounter_id>/medications/save/",
        views.medication_save,
        name="medication_save",
    ),

    path(
        "medications/<int:medication_id>/delete/",
        views.medication_delete,
        name="medication_delete",
    ),

    # ── Prescriptions ─────────────────────────────────────────────────────────

    path(
        "prescriptions/",
        views.prescription_list,
        name="prescription_list",
    ),

    path(
        "encounters/<int:encounter_id>/prescriptions/new/",
        views.prescription_create,
        name="prescription_create",
    ),

    path(
        "prescriptions/<int:prescription_id>/edit/",
        views.prescription_edit,
        name="prescription_edit",
    ),

    # ── Social History ────────────────────────────────────────────────────────

    path(
        "patients/<int:patient_id>/social-history/save/",
        views.social_history_save,
        name="social_history_save",
    ),

    # ── Users ─────────────────────────────────────────────────────────────────

    path(
        "users/",
        views.user_list,
        name="user_list",
    ),

    path(
        "users/new/",
        views.user_create,
        name="user_create",
    ),

    path(
        "users/<int:user_id>/edit/",
        views.user_edit,
        name="user_edit",
    ),

    # ── HIPAA Audit Log ───────────────────────────────────────────────────────

    path(
        "hipaa-log/",
        views.hipaa_log_list,
        name="hipaa_log_list",
    ),


    # ── Logout with next-URL preservation ────────────────────────────────────

    path(
        "accounts/logout/",
        views.logout_with_next,
        name="logout",
    ),

    path(
        "session-ping/",
        views.session_ping,
        name="session_ping",
    ),
]
