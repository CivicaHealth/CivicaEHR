from django import forms

from .models import Patient
from .models import Encounter
from .models import SOAPNote
from .models import Vital
from .models import Diagnosis
from .models import Medication
from .models import Allergy
from .models import Document
from .models import Appointment
from .models import LabOrder
from .models import Prescription
from .models import Referral


class PatientForm(forms.ModelForm):

    class Meta:

        model = Patient

        fields = [
            "first_name",
            "last_name",
            "date_of_birth",
            "sex",
            "phone",
            "email",
            "address",
        ]


class EncounterForm(forms.ModelForm):

    class Meta:

        model = Encounter

        fields = [
            "encounter_date",
            "reason_for_visit",
            "notes",
        ]

        widgets = {
            "encounter_date": forms.DateTimeInput(
                attrs={
                    "type": "datetime-local"
                }
            ),
        }


class SOAPNoteForm(forms.ModelForm):

    class Meta:

        model = SOAPNote

        fields = [
            "subjective",
            "objective",
            "assessment",
            "plan",
        ]

        widgets = {
            "subjective": forms.Textarea(
                attrs={"rows": 6}
            ),

            "objective": forms.Textarea(
                attrs={"rows": 6}
            ),

            "assessment": forms.Textarea(
                attrs={"rows": 6}
            ),

            "plan": forms.Textarea(
                attrs={"rows": 6}
            ),
        }


class VitalForm(forms.ModelForm):

    # Decimal vitals are stored as EncryptedCharField but presented as numeric inputs
    temperature = forms.DecimalField(
        max_digits=4, decimal_places=1, required=False,
        widget=forms.NumberInput(attrs={"placeholder": "°F", "step": "0.1"}),
    )
    weight_kg = forms.DecimalField(
        max_digits=5, decimal_places=2, required=False,
        widget=forms.NumberInput(attrs={"placeholder": "kg", "step": "0.01"}),
    )
    height_cm = forms.DecimalField(
        max_digits=5, decimal_places=2, required=False,
        widget=forms.NumberInput(attrs={"placeholder": "cm", "step": "0.01"}),
    )

    class Meta:

        model = Vital

        exclude = ["encounter", "created_at"]

        widgets = {
            "blood_pressure":    forms.TextInput(attrs={"placeholder": "e.g. 120/80"}),
            "heart_rate":        forms.NumberInput(attrs={"placeholder": "bpm"}),
            "respiratory_rate":  forms.NumberInput(attrs={"placeholder": "/min"}),
            "oxygen_saturation": forms.NumberInput(attrs={"placeholder": "%"}),
        }


class DiagnosisForm(forms.ModelForm):

    class Meta:

        model = Diagnosis

        fields = "__all__"

        exclude = ["encounter"]


class MedicationForm(forms.ModelForm):

    class Meta:

        model = Medication

        fields = "__all__"

        exclude = ["encounter"]


class AllergyForm(forms.ModelForm):

    class Meta:

        model = Allergy

        fields = "__all__"

        exclude = ["patient"]


class DocumentForm(forms.ModelForm):

    class Meta:

        model = Document

        fields = "__all__"

        exclude = ["encounter"]


class AppointmentForm(forms.ModelForm):
    """
    Includes the patient ForeignKey so it can be selected or pre-filled
    when scheduling from the appointment list or from a patient chart.
    """

    patient = forms.ModelChoiceField(
        queryset=Patient.objects.order_by("last_name", "first_name"),
        label="Patient",
        widget=forms.Select(),
    )

    class Meta:

        model = Appointment

        fields = [
            "patient",
            "appointment_date",
            "duration_minutes",
            "reason",
            "status",
            "notes",
        ]

        widgets = {
            "appointment_date": forms.DateTimeInput(
                attrs={"type": "datetime-local"}
            ),
            "duration_minutes": forms.Select(
                choices=[
                    (10,  "10 min"),
                    (15,  "15 min"),
                    (30,  "30 min"),
                    (45,  "45 min"),
                    (60,  "1 hour"),
                    (90,  "1 hr 30 min"),
                    (120, "2 hours"),
                    (180, "3 hours"),
                ]
            ),
            "notes": forms.Textarea(
                attrs={"rows": 3}
            ),
        }


class LabOrderForm(forms.ModelForm):

    class Meta:

        model = LabOrder

        fields = [
            "test_name",
            "status",
            "result",
        ]

        widgets = {
            "result": forms.Textarea(
                attrs={"rows": 4, "placeholder": "Enter result notes…"}
            ),
        }


class ReferralForm(forms.ModelForm):

    class Meta:

        model = Referral

        fields = [
            "specialist_name",
            "specialty",
            "reason",
            "status",
        ]

        widgets = {
            "reason": forms.Textarea(
                attrs={"rows": 4}
            ),
        }


class PrescriptionForm(forms.ModelForm):

    class Meta:

        model = Prescription

        fields = [
            "medication_name",
            "dosage",
            "frequency",
            "duration",
            "pharmacy",
            "status",
        ]

        widgets = {
            "medication_name": forms.TextInput(
                attrs={"placeholder": "e.g. Amoxicillin"}
            ),
            "dosage": forms.TextInput(
                attrs={"placeholder": "e.g. 500mg"}
            ),
            "frequency": forms.TextInput(
                attrs={"placeholder": "e.g. Twice daily"}
            ),
            "duration": forms.TextInput(
                attrs={"placeholder": "e.g. 10 days"}
            ),
            "pharmacy": forms.TextInput(
                attrs={"placeholder": "e.g. CVS Pharmacy"}
            ),
        }
