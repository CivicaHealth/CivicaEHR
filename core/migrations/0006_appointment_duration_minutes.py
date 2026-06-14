from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        # Replace 'XXXX_previous' with the name of your latest migration
        ('core', '0005_auditlog_imagingorder_laborder_portalmessage_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='appointment',
            name='duration_minutes',
            field=models.PositiveIntegerField(default=30),
        ),
    ]
