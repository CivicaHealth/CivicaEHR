from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0016_alter_clinic_id_alter_loginattempt_id'),
    ]

    operations = [

        migrations.RemoveField(
            model_name='patient',
            name='clinic',
        ),

        migrations.RemoveField(
            model_name='appointment',
            name='clinic',
        ),

        migrations.RemoveField(
            model_name='userprofile',
            name='clinic',
        ),

        migrations.DeleteModel(
            name='Clinic',
        ),
    ]
