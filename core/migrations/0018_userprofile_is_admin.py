from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0017_remove_clinic'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='is_admin',
            field=models.BooleanField(
                default=False,
                help_text='Grants access to Users tab and full audit log view.',
            ),
        ),
    ]
