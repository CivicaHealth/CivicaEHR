from django.db import migrations
from encrypted_model_fields.fields import (
    EncryptedCharField,
    EncryptedTextField,
    EncryptedEmailField,
    EncryptedDateField,
    EncryptedIntegerField,
)


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0011_hipaalog'),
    ]

    operations = [

        # ── Patient ──────────────────────────────────────────────────────────
        migrations.AlterField('patient', 'first_name',
            EncryptedCharField(max_length=100)),
        migrations.AlterField('patient', 'last_name',
            EncryptedCharField(max_length=100)),
        migrations.AlterField('patient', 'date_of_birth',
            EncryptedDateField()),
        migrations.AlterField('patient', 'phone',
            EncryptedCharField(max_length=20, blank=True)),
        migrations.AlterField('patient', 'email',
            EncryptedEmailField(blank=True)),
        migrations.AlterField('patient', 'address',
            EncryptedTextField(blank=True)),

        # ── Encounter ─────────────────────────────────────────────────────────
        migrations.AlterField('encounter', 'reason_for_visit',
            EncryptedCharField(max_length=255)),
        migrations.AlterField('encounter', 'notes',
            EncryptedTextField(blank=True)),

        # ── SOAPNote ──────────────────────────────────────────────────────────
        migrations.AlterField('soapnote', 'subjective',
            EncryptedTextField(blank=True)),
        migrations.AlterField('soapnote', 'objective',
            EncryptedTextField(blank=True)),
        migrations.AlterField('soapnote', 'assessment',
            EncryptedTextField(blank=True)),
        migrations.AlterField('soapnote', 'plan',
            EncryptedTextField(blank=True)),

        # ── Vital ─────────────────────────────────────────────────────────────
        migrations.AlterField('vital', 'blood_pressure',
            EncryptedCharField(max_length=20, blank=True)),
        migrations.AlterField('vital', 'heart_rate',
            EncryptedIntegerField(null=True, blank=True)),
        migrations.AlterField('vital', 'temperature',
            EncryptedCharField(max_length=20, blank=True)),
        migrations.AlterField('vital', 'respiratory_rate',
            EncryptedIntegerField(null=True, blank=True)),
        migrations.AlterField('vital', 'oxygen_saturation',
            EncryptedIntegerField(null=True, blank=True)),
        migrations.AlterField('vital', 'weight_kg',
            EncryptedCharField(max_length=20, blank=True)),
        migrations.AlterField('vital', 'height_cm',
            EncryptedCharField(max_length=20, blank=True)),

        # ── Diagnosis ─────────────────────────────────────────────────────────
        migrations.AlterField('diagnosis', 'description',
            EncryptedCharField(max_length=255)),

        # ── Medication ────────────────────────────────────────────────────────
        migrations.AlterField('medication', 'name',
            EncryptedCharField(max_length=255)),
        migrations.AlterField('medication', 'dosage',
            EncryptedCharField(max_length=100, blank=True)),
        migrations.AlterField('medication', 'instructions',
            EncryptedTextField(blank=True)),

        # ── Allergy ───────────────────────────────────────────────────────────
        migrations.AlterField('allergy', 'allergen',
            EncryptedCharField(max_length=255)),
        migrations.AlterField('allergy', 'reaction',
            EncryptedCharField(max_length=255, blank=True)),

        # ── Appointment ───────────────────────────────────────────────────────
        migrations.AlterField('appointment', 'reason',
            EncryptedCharField(max_length=255)),
        migrations.AlterField('appointment', 'notes',
            EncryptedTextField(blank=True)),

        # ── Prescription ──────────────────────────────────────────────────────
        migrations.AlterField('prescription', 'medication_name',
            EncryptedCharField(max_length=255)),
        migrations.AlterField('prescription', 'dosage',
            EncryptedCharField(max_length=100)),
        migrations.AlterField('prescription', 'frequency',
            EncryptedCharField(max_length=100)),
        migrations.AlterField('prescription', 'duration',
            EncryptedCharField(max_length=100)),
        migrations.AlterField('prescription', 'pharmacy',
            EncryptedCharField(max_length=255, blank=True)),

        # ── Problem ───────────────────────────────────────────────────────────
        migrations.AlterField('problem', 'description',
            EncryptedCharField(max_length=255)),

        # ── LabOrder ──────────────────────────────────────────────────────────
        migrations.AlterField('laborder', 'test_name',
            EncryptedCharField(max_length=255)),
        migrations.AlterField('laborder', 'result',
            EncryptedTextField(blank=True)),

        # ── Document ──────────────────────────────────────────────────────────
        migrations.AlterField('document', 'title',
            EncryptedCharField(max_length=255)),

        # ── PortalMessage ─────────────────────────────────────────────────────
        migrations.AlterField('portalmessage', 'subject',
            EncryptedCharField(max_length=255)),
        migrations.AlterField('portalmessage', 'message',
            EncryptedTextField()),

        # ── SocialHistory ─────────────────────────────────────────────────────
        migrations.AlterField('socialhistory', 'tobacco_note',
            EncryptedCharField(max_length=255, blank=True)),
        migrations.AlterField('socialhistory', 'alcohol_note',
            EncryptedCharField(max_length=255, blank=True)),
        migrations.AlterField('socialhistory', 'drug_note',
            EncryptedCharField(max_length=255, blank=True)),
        migrations.AlterField('socialhistory', 'occupation',
            EncryptedCharField(max_length=255, blank=True)),
        migrations.AlterField('socialhistory', 'exercise',
            EncryptedCharField(max_length=255, blank=True)),
        migrations.AlterField('socialhistory', 'diet',
            EncryptedCharField(max_length=255, blank=True)),
        migrations.AlterField('socialhistory', 'notes',
            EncryptedTextField(blank=True)),
    ]
