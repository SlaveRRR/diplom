from django.contrib.auth import get_user_model
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from interactions.models import Comment, ComicFavorite
from users.achievements import ensure_user_stats, sync_comment_stats, sync_favorite_stats

User = get_user_model()


@receiver(post_save, sender=User)
def create_user_stats(sender, instance, created, **kwargs):
    if created:
        ensure_user_stats(instance)


@receiver(post_save, sender=ComicFavorite)
def sync_favorite_stats_on_create(sender, instance, created, **kwargs):
    if created:
        sync_favorite_stats(instance.user)


@receiver(post_delete, sender=ComicFavorite)
def sync_favorite_stats_on_delete(sender, instance, **kwargs):
    sync_favorite_stats(instance.user)


@receiver(post_save, sender=Comment)
def sync_comment_stats_on_create(sender, instance, created, **kwargs):
    if created:
        sync_comment_stats(instance.user)


@receiver(post_delete, sender=Comment)
def sync_comment_stats_on_delete(sender, instance, **kwargs):
    sync_comment_stats(instance.user)
