from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0013_alter_hipaalog_id_alter_imagingorder_result_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='LoginAttempt',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True)),
                ('ip_address', models.GenericIPAddressField(db_index=True)),
                ('username', models.CharField(blank=True, max_length=150, db_index=True)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('succeeded', models.BooleanField(default=False)),
            ],
            options={'ordering': ['-timestamp']},
        ),
    ]
