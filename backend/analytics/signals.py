from django.db.models.signals import pre_delete
from django.dispatch import receiver

from analytics.models import AnalyticsEvent
from analytics.services import delete_content_analytics
from blog.models import Post
from comics.models import Comic


@receiver(pre_delete, sender=Comic)
def cleanup_deleted_comic_analytics(sender, instance: Comic, **kwargs):
    delete_content_analytics(content_kind=AnalyticsEvent.ContentKind.COMIC, object_id=instance.id)


@receiver(pre_delete, sender=Post)
def cleanup_deleted_post_analytics(sender, instance: Post, **kwargs):
    delete_content_analytics(content_kind=AnalyticsEvent.ContentKind.POST, object_id=instance.id)
