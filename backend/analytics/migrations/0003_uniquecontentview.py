from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('analytics', '0002_rename_analytics_o_created_b8cb92_idx_analytics_a_owner_i_3ce1e3_idx_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='UniqueContentView',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content_kind', models.CharField(choices=[('comic', 'Комикс'), ('post', 'Пост')], max_length=16)),
                ('object_id', models.PositiveIntegerField()),
                ('viewer_key', models.CharField(max_length=128)),
                ('title_snapshot', models.CharField(blank=True, max_length=255)),
                ('first_viewed_at', models.DateTimeField(auto_now_add=True)),
                ('last_viewed_at', models.DateTimeField(auto_now=True)),
                ('actor', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='performed_unique_content_views', to=settings.AUTH_USER_MODEL)),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='unique_content_views', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ('-last_viewed_at', '-first_viewed_at'),
            },
        ),
        migrations.AddConstraint(
            model_name='uniquecontentview',
            constraint=models.UniqueConstraint(fields=('content_kind', 'object_id', 'viewer_key'), name='unique_content_view_per_viewer'),
        ),
        migrations.AddIndex(
            model_name='uniquecontentview',
            index=models.Index(fields=['owner', 'content_kind', 'object_id'], name='uniq_view_owner_item_idx'),
        ),
        migrations.AddIndex(
            model_name='uniquecontentview',
            index=models.Index(fields=['owner', 'last_viewed_at'], name='uniq_view_owner_last_idx'),
        ),
        migrations.AddIndex(
            model_name='uniquecontentview',
            index=models.Index(fields=['content_kind', 'object_id', 'last_viewed_at'], name='uniq_view_item_last_idx'),
        ),
    ]
