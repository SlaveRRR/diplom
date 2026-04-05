from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('comics', '0004_comicuploaddraft_tag_ids'),
    ]

    operations = [
        migrations.CreateModel(
            name='Genre',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=64, unique=True)),
                ('slug', models.SlugField(blank=True, max_length=72, unique=True)),
            ],
            options={
                'ordering': ('name',),
            },
        ),
        migrations.AddField(
            model_name='comic',
            name='genres',
            field=models.ManyToManyField(blank=True, related_name='comics', to='comics.genre'),
        ),
        migrations.AddField(
            model_name='comicuploaddraft',
            name='genre_ids',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
