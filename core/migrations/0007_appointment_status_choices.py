from django.db import migrations


class Migration(migrations.Migration):
    """
    Adds 'arrived' and 'in_progress' to Appointment.status choices.
    CharField choices are metadata only — no schema change needed,
    so this migration is a no-op state update.
    """

    dependencies = [
        ('core', '0006_appointment_duration_minutes'),
    ]

    operations = [
        migrations.AlterField(
            model_name='appointment',
            name='status',
            field=__import__('django.db.models', fromlist=['CharField']).CharField(
                choices=[
                    ('scheduled',   'Scheduled'),
                    ('arrived',     'Arrived'),
                    ('in_progress', 'In Progress'),
                    ('completed',   'Completed'),
                    ('cancelled',   'Cancelled'),
                    ('no_show',     'No Show'),
                ],
                default='scheduled',
                max_length=20,
            ),
        ),
    ]
