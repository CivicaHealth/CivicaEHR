from django.db import migrations, models


class Migration(migrations.Migration):
    """Update UserProfile.role choices to match the new access levels."""

    dependencies = [
        ('core', '0008_socialhistory'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='role',
            field=models.CharField(
                max_length=50,
                choices=[
                    ('front_desk_volunteer', 'Front Desk Volunteer'),
                    ('undergrad_staff',      'Undergrad Staff (Vitals/Lab)'),
                    ('student_practitioner', 'Student Practitioner / Scribe'),
                    ('attending_faculty',    'Attending Faculty (Preceptor)'),
                ],
                blank=True,
                default='',
            ),
        ),
    ]
