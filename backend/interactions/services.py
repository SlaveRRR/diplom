from django.db.models import QuerySet

from interactions.models import Notification


def create_notification(*, user, message: str, notification_type: str = Notification.Type.INFO):
    if not getattr(user, 'pk', None):
        return None

    return Notification.objects.create(
        user=user,
        message=message[:255],
        type=notification_type,
    )


def mark_notifications_as_read(*, notifications: QuerySet, timestamp):
    return notifications.filter(read_at__isnull=True).update(read_at=timestamp)
