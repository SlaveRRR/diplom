from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('comics', '0005_genre_comic_genres_and_comicuploaddraft_genre_ids'),
    ]

    operations = [
        migrations.AddField(
            model_name='genre',
            name='description',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='tag',
            name='description',
            field=models.TextField(blank=True),
        ),
    ]
