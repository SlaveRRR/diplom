from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('comics', '0013_comic_comic_status_pub_idx_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='comic',
            name='has_published_updates',
            field=models.BooleanField(default=False),
        ),
    ]
