from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        # Update to your latest migration
        ('core', '0007_appointment_status_choices'),
    ]

    operations = [
        migrations.CreateModel(
            name='SocialHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tobacco_status', models.CharField(
                    max_length=50,
                    blank=True,
                    choices=[
                        ('never',   'Never'),
                        ('former',  'Former'),
                        ('current', 'Current'),
                    ],
                    default='',
                )),
                ('tobacco_note', models.CharField(max_length=255, blank=True)),
                ('alcohol_status', models.CharField(
                    max_length=50,
                    blank=True,
                    choices=[
                        ('never',      'Never'),
                        ('occasional', 'Occasional'),
                        ('moderate',   'Moderate'),
                        ('heavy',      'Heavy'),
                    ],
                    default='',
                )),
                ('alcohol_note', models.CharField(max_length=255, blank=True)),
                ('drug_status', models.CharField(
                    max_length=50,
                    blank=True,
                    choices=[
                        ('never',   'Never'),
                        ('former',  'Former'),
                        ('current', 'Current'),
                    ],
                    default='',
                )),
                ('drug_note', models.CharField(max_length=255, blank=True)),
                ('occupation', models.CharField(max_length=255, blank=True)),
                ('exercise', models.CharField(max_length=255, blank=True)),
                ('diet', models.CharField(max_length=255, blank=True)),
                ('notes', models.TextField(blank=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('patient', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='social_history',
                    to='core.patient',
                )),
            ],
        ),
    ]
