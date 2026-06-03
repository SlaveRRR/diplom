from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        ('interactions', '0004_remove_comment_interaction_content_7ff8b8_idx_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ContentReaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('object_id', models.PositiveIntegerField()),
                ('emoji', models.CharField(max_length=32)),
                (
                    'content_type',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='reactions',
                        to='contenttypes.contenttype',
                    ),
                ),
                (
                    'user',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='content_reactions',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.AddIndex(
            model_name='contentreaction',
            index=models.Index(fields=('content_type', 'object_id', 'emoji'), name='reaction_target_emoji_idx'),
        ),
        migrations.AddIndex(
            model_name='contentreaction',
            index=models.Index(fields=('user', 'created_at'), name='reaction_user_created_idx'),
        ),
        migrations.AddConstraint(
            model_name='contentreaction',
            constraint=models.UniqueConstraint(
                fields=('user', 'content_type', 'object_id'),
                name='unique_reaction_per_user_and_object',
            ),
        ),
    ]
