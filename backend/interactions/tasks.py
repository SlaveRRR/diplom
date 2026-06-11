from celery import shared_task
from django.contrib.auth import get_user_model

from interactions.models import Notification
from interactions.services import create_notification, notify_followers

User = get_user_model()


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={'max_retries': 3})
def create_notification_task(self, *, user_id: int, message: str, notification_type: str = Notification.Type.INFO, link: str = ''):
    user = User.objects.filter(pk=user_id).first()
    if not user:
        return None

    notification = create_notification(
        user=user,
        message=message,
        notification_type=notification_type,
        link=link,
    )
    return notification.id if notification else None


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={'max_retries': 3})
def notify_followers_task(self, *, author_id: int, message: str, link: str = '', notification_type: str = Notification.Type.INFO):
    author = User.objects.filter(pk=author_id).first()
    if not author:
        return 0

    return notify_followers(
        author=author,
        message=message,
        link=link,
        notification_type=notification_type,
    )
