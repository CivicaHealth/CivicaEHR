from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0014_loginattempt'),
    ]

    operations = [

        # 1. Create Clinic table
        migrations.CreateModel(
            name='Clinic',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True)),
                ('name',       models.CharField(max_length=255)),
                ('address',    models.TextField(blank=True)),
                ('phone',      models.CharField(max_length=20, blank=True)),
                ('email',      models.EmailField(blank=True)),
                ('is_active',  models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),

        # 2. Add clinic FK to Patient (nullable during migration)
        migrations.AddField(
            model_name='patient',
            name='clinic',
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='patients',
                to='core.clinic',
            ),
        ),

        # 3. Add clinic FK to Appointment (nullable during migration)
        migrations.AddField(
            model_name='appointment',
            name='clinic',
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='appointments',
                to='core.clinic',
            ),
        ),

        # 4. Add clinic FK to UserProfile
        migrations.AddField(
            model_name='userprofile',
            name='clinic',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='staff',
                to='core.clinic',
            ),
        ),
    ]
