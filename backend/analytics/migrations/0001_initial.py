from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='AnalyticsEvent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content_kind', models.CharField(choices=[('comic', 'Комикс'), ('post', 'Пост')], max_length=16)),
                ('object_id', models.PositiveIntegerField()),
                ('title_snapshot', models.CharField(blank=True, max_length=255)),
                ('event_type', models.CharField(choices=[('view', 'Просмотр'), ('comment', 'Комментарий'), ('like', 'Лайк'), ('favorite', 'Избранное'), ('publication', 'Публикация')], max_length=16)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('actor', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='performed_analytics_events', to=settings.AUTH_USER_MODEL)),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='analytics_events', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ('-created_at',),
            },
        ),
        migrations.AddIndex(
            model_name='analyticsevent',
            index=models.Index(fields=['owner', 'created_at'], name='analytics_o_created_b8cb92_idx'),
        ),
        migrations.AddIndex(
            model_name='analyticsevent',
            index=models.Index(fields=['owner', 'content_kind', 'object_id'], name='analytics_o_content_3af68e_idx'),
        ),
        migrations.AddIndex(
            model_name='analyticsevent',
            index=models.Index(fields=['owner', 'event_type', 'created_at'], name='analytics_o_event_t_6501b2_idx'),
        ),
        migrations.AddIndex(
            model_name='analyticsevent',
            index=models.Index(fields=['content_kind', 'object_id', 'event_type'], name='analytics_c_object__e9e521_idx'),
        ),
    ]
