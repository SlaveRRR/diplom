from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('users', '0004_userstats_userachievement_userfinishedcomic_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='MonthlyRecap',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year', models.PositiveIntegerField()),
                ('month', models.PositiveSmallIntegerField()),
                ('payload', models.JSONField(default=dict)),
                ('is_finalized', models.BooleanField(default=False)),
                ('generated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='monthly_recaps', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ('-year', '-month', '-generated_at'),
                'constraints': [models.UniqueConstraint(fields=('user', 'year', 'month'), name='unique_monthly_recap_per_user')],
            },
        ),
    ]
