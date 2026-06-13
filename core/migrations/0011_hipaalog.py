from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0010_alter_userprofile_role'),
    ]

    operations = [
        migrations.CreateModel(
            name='HIPAALog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True)),
                ('username_snapshot', models.CharField(blank=True, max_length=150)),
                ('timestamp', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('action', models.CharField(
                    choices=[
                        ('login_success', 'Login Success'),
                        ('login_failure', 'Login Failure'),
                        ('logout',        'Logout'),
                        ('view',          'View'),
                        ('create',        'Create'),
                        ('update',        'Update'),
                        ('delete',        'Delete'),
                    ],
                    max_length=20,
                    db_index=True,
                )),
                ('model_name',  models.CharField(blank=True, max_length=100)),
                ('object_id',   models.CharField(blank=True, max_length=100)),
                ('object_repr', models.CharField(blank=True, max_length=255)),
                ('ip_address',  models.GenericIPAddressField(blank=True, null=True)),
                ('extra',       models.TextField(blank=True)),
                ('user', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='hipaa_logs',
                    to='auth.user',
                )),
                ('patient', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='hipaa_logs',
                    to='core.patient',
                )),
            ],
            options={
                'verbose_name': 'HIPAA Audit Log',
                'verbose_name_plural': 'HIPAA Audit Logs',
                'ordering': ['-timestamp'],
            },
        ),
    ]
