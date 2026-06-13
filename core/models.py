from django.db import models
from django.contrib.auth.models import User
from encrypted_model_fields.fields import (
    EncryptedCharField,
    EncryptedTextField,
    EncryptedEmailField,
    EncryptedDateField,
    EncryptedIntegerField,
)


class Patient(models.Model):

    first_name = EncryptedCharField(max_length=100)

    last_name = EncryptedCharField(max_length=100)

    date_of_birth = EncryptedDateField()

    sex = models.CharField(
        max_length=20,
        choices=[
            ("male", "Male"),
            ("female", "Female"),
            ("other", "Other"),
        ],
    )

    phone = EncryptedCharField(
        max_length=20,
        blank=True,
    )

    email = EncryptedEmailField(
        blank=True,
    )

    address = EncryptedTextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return f"{self.last_name}, {self.first_name}"


class Encounter(models.Model):

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="encounters",
    )

    encounter_date = models.DateTimeField()

    reason_for_visit = EncryptedCharField(
        max_length=255,
    )

    notes = EncryptedTextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return f"{self.patient} - {self.encounter_date}"


class SOAPNote(models.Model):

    encounter = models.OneToOneField(
        Encounter,
        on_delete=models.CASCADE,
        related_name="soap_note",
    )

    subjective = EncryptedTextField(
        blank=True,
    )

    objective = EncryptedTextField(
        blank=True,
    )

    assessment = EncryptedTextField(
        blank=True,
    )

    plan = EncryptedTextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return f"SOAP Note - {self.encounter}"


class Vital(models.Model):

    encounter = models.ForeignKey(
        Encounter,
        on_delete=models.CASCADE,
        related_name="vitals",
    )

    blood_pressure = EncryptedCharField(
        max_length=20,
        blank=True,
    )

    heart_rate = EncryptedIntegerField(
        null=True,
        blank=True,
    )

    temperature = EncryptedCharField(
        max_length=20,
        blank=True,
    )

    respiratory_rate = EncryptedIntegerField(
        null=True,
        blank=True,
    )

    oxygen_saturation = EncryptedIntegerField(
        null=True,
        blank=True,
    )

    weight_kg = EncryptedCharField(
        max_length=20,
        blank=True,
    )

    height_cm = EncryptedCharField(
        max_length=20,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return f"Vitals - {self.encounter}"


class Diagnosis(models.Model):

    encounter = models.ForeignKey(
        Encounter,
        on_delete=models.CASCADE,
        related_name="diagnoses",
    )

    icd10_code = models.CharField(
        max_length=20,
    )

    description = EncryptedCharField(
        max_length=255,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return f"{self.icd10_code} - {self.description}"


class Medication(models.Model):

    encounter = models.ForeignKey(
        Encounter,
        on_delete=models.CASCADE,
        related_name="medications",
    )

    name = EncryptedCharField(
        max_length=255,
    )

    dosage = EncryptedCharField(
        max_length=100,
        blank=True,
    )

    instructions = EncryptedTextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return self.name


class Allergy(models.Model):

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="allergies",
    )

    allergen = EncryptedCharField(
        max_length=255,
    )

    reaction = EncryptedCharField(
        max_length=255,
        blank=True,
    )

    severity = models.CharField(
        max_length=50,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return self.allergen


class Document(models.Model):

    encounter = models.ForeignKey(
        Encounter,
        on_delete=models.CASCADE,
        related_name="documents",
    )

    title = EncryptedCharField(
        max_length=255,
    )

    file = models.FileField(
        upload_to="documents/",
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return self.title


class Appointment(models.Model):

    STATUS_CHOICES = [
        ("scheduled",   "Scheduled"),
        ("arrived",     "Arrived"),
        ("in_progress", "In Progress"),
        ("completed",   "Completed"),
        ("cancelled",   "Cancelled"),
        ("no_show",     "No Show"),
    ]

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="appointments",
    )

    appointment_date = models.DateTimeField()

    reason = EncryptedCharField(
        max_length=255,
    )

    duration_minutes = models.PositiveIntegerField(
        default=30,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="scheduled",
    )

    notes = EncryptedTextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return f"{self.patient} - {self.appointment_date}"


class UserProfile(models.Model):

    ROLE_CHOICES = [
        ("front_desk_volunteer", "Front Desk Volunteer"),
        ("undergrad_staff",      "Undergrad Staff (Vitals/Lab)"),
        ("student_practitioner", "Student Practitioner / Scribe"),
        ("attending_faculty",    "Attending Faculty (Preceptor)"),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
    )

    role = models.CharField(
        max_length=50,
        choices=ROLE_CHOICES,
        blank=True,
        default="",
    )

    is_admin = models.BooleanField(
        default=False,
        help_text="Grants access to Users tab and full audit log view.",
    )

    title = models.CharField(
        max_length=100,
        blank=True,
    )

    def __str__(self):
        return f"{self.user.username} - {self.role}"


class Problem(models.Model):

    STATUS_CHOICES = [
        ("active",   "Active"),
        ("resolved", "Resolved"),
    ]

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="problems",
    )

    icd10_code = models.CharField(
        max_length=20,
    )

    description = EncryptedCharField(
        max_length=255,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active",
    )

    onset_date = models.DateField(
        null=True,
        blank=True,
    )

    resolved_date = models.DateField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return self.description


class LabOrder(models.Model):

    STATUS_CHOICES = [
        ("ordered",    "Ordered"),
        ("completed",  "Completed"),
        ("cancelled",  "Cancelled"),
    ]

    encounter = models.ForeignKey(
        Encounter,
        on_delete=models.CASCADE,
        related_name="lab_orders",
    )

    test_name = EncryptedCharField(
        max_length=255,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="ordered",
    )

    result = EncryptedTextField(
        blank=True,
    )

    ordered_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return self.test_name


class ImagingOrder(models.Model):

    STATUS_CHOICES = [
        ("ordered",   "Ordered"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    encounter = models.ForeignKey(
        Encounter,
        on_delete=models.CASCADE,
        related_name="imaging_orders",
    )

    study_name = EncryptedCharField(
        max_length=255,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="ordered",
    )

    result = EncryptedTextField(
        blank=True,
    )

    ordered_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return self.study_name


class Prescription(models.Model):

    STATUS_CHOICES = [
        ("draft",     "Draft"),
        ("sent",      "Sent"),
        ("cancelled", "Cancelled"),
    ]

    encounter = models.ForeignKey(
        Encounter,
        on_delete=models.CASCADE,
        related_name="prescriptions",
    )

    medication_name = EncryptedCharField(
        max_length=255,
    )

    dosage = EncryptedCharField(
        max_length=100,
    )

    frequency = EncryptedCharField(
        max_length=100,
    )

    duration = EncryptedCharField(
        max_length=100,
    )

    pharmacy = EncryptedCharField(
        max_length=255,
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="draft",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return self.medication_name


class AuditLog(models.Model):

    ACTION_CHOICES = [
        ("create", "Create"),
        ("update", "Update"),
        ("delete", "Delete"),
        ("view",   "View"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
    )

    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
    )

    model_name = models.CharField(
        max_length=100,
    )

    object_id = models.CharField(
        max_length=100,
    )

    timestamp = models.DateTimeField(
        auto_now_add=True,
    )

    details = models.TextField(
        blank=True,
    )

    def __str__(self):
        return f"{self.user} {self.action} {self.model_name}"


class PortalMessage(models.Model):

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="portal_messages",
    )

    subject = EncryptedCharField(
        max_length=255,
    )

    message = EncryptedTextField()

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    is_read = models.BooleanField(
        default=False,
    )

    def __str__(self):
        return self.subject


class SocialHistory(models.Model):

    TOBACCO_CHOICES = [
        ("never",   "Never"),
        ("former",  "Former"),
        ("current", "Current"),
    ]

    ALCOHOL_CHOICES = [
        ("never",      "Never"),
        ("occasional", "Occasional"),
        ("moderate",   "Moderate"),
        ("heavy",      "Heavy"),
    ]

    DRUG_CHOICES = [
        ("never",   "Never"),
        ("former",  "Former"),
        ("current", "Current"),
    ]

    patient = models.OneToOneField(
        Patient,
        on_delete=models.CASCADE,
        related_name="social_history",
    )

    tobacco_status = models.CharField(
        max_length=50,
        choices=TOBACCO_CHOICES,
        blank=True,
        default="",
    )

    tobacco_note = EncryptedCharField(
        max_length=255,
        blank=True,
    )

    alcohol_status = models.CharField(
        max_length=50,
        choices=ALCOHOL_CHOICES,
        blank=True,
        default="",
    )

    alcohol_note = EncryptedCharField(
        max_length=255,
        blank=True,
    )

    drug_status = models.CharField(
        max_length=50,
        choices=DRUG_CHOICES,
        blank=True,
        default="",
    )

    drug_note = EncryptedCharField(
        max_length=255,
        blank=True,
    )

    occupation = EncryptedCharField(
        max_length=255,
        blank=True,
    )

    exercise = EncryptedCharField(
        max_length=255,
        blank=True,
    )

    diet = EncryptedCharField(
        max_length=255,
        blank=True,
    )

    notes = EncryptedTextField(
        blank=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return f"Social History — {self.patient}"


class HIPAALog(models.Model):
    """
    Immutable HIPAA audit log. Never modified after creation.
    Delete and change permissions are revoked in the admin.
    """

    ACTION_CHOICES = [
        ("login_success", "Login Success"),
        ("login_failure", "Login Failure"),
        ("logout",        "Logout"),
        ("view",          "View"),
        ("create",        "Create"),
        ("update",        "Update"),
        ("delete",        "Delete"),
    ]

    user = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="hipaa_logs",
    )

    username_snapshot = models.CharField(
        max_length=150,
        blank=True,
    )

    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
        db_index=True,
    )

    model_name  = models.CharField(max_length=100, blank=True)
    object_id   = models.CharField(max_length=100, blank=True)
    object_repr = models.CharField(max_length=255, blank=True)

    patient = models.ForeignKey(
        "Patient",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="hipaa_logs",
    )

    ip_address = models.GenericIPAddressField(null=True, blank=True)

    extra = models.TextField(blank=True)

    class Meta:
        ordering = ["-timestamp"]
        verbose_name = "HIPAA Audit Log"
        verbose_name_plural = "HIPAA Audit Logs"

    def __str__(self):
        return (
            f"{self.timestamp:%Y-%m-%d %H:%M:%S} | {self.action} | "
            f"{self.username_snapshot} | {self.model_name} {self.object_id}"
        )

    def save(self, *args, **kwargs):
        if self.pk:
            raise PermissionError(
                "HIPAA audit logs are immutable and cannot be modified."
            )
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise PermissionError(
            "HIPAA audit logs are immutable and cannot be deleted."
        )


class LoginAttempt(models.Model):
    """
    Tracks failed login attempts for brute-force protection.
    """
    ip_address = models.GenericIPAddressField(db_index=True)
    username   = models.CharField(max_length=150, blank=True, db_index=True)
    timestamp  = models.DateTimeField(auto_now_add=True)
    succeeded  = models.BooleanField(default=False)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        result = 'ok' if self.succeeded else 'fail'
        return f"{self.ip_address} {self.username} {result} {self.timestamp:%Y-%m-%d %H:%M}"
