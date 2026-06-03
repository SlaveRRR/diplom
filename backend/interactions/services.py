from asgiref.sync import async_to_sync
from django.contrib.contenttypes.models import ContentType
from django.db.models import Count, QuerySet
from channels.layers import get_channel_layer

from interactions.models import ContentReaction, Notification
from interactions.serializers import build_notification_payload


def broadcast_notification(notification: Notification):
    if not getattr(notification, 'pk', None):
        return

    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    unread_count = Notification.objects.filter(user=notification.user, read_at__isnull=True).count()

    async_to_sync(channel_layer.group_send)(
        f'notifications_user_{notification.user_id}',
        {
            'type': 'notification.message',
            'event': 'notification.created',
            'notification': build_notification_payload(notification),
            'unreadCount': unread_count,
        },
    )


def broadcast_comic_comment(*, comic_id: int, comment_payload: dict, comments_count: int):
    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    async_to_sync(channel_layer.group_send)(
        f'comic_comments_{comic_id}',
        {
            'type': 'comic.comment.message',
            'event': 'comic.comment.created',
            'comicId': comic_id,
            'comment': comment_payload,
            'commentsCount': comments_count,
        },
    )


def create_notification(*, user, message: str, notification_type: str = Notification.Type.INFO, link: str = ''):
    if not getattr(user, 'pk', None):
        return None

    notification = Notification.objects.create(
        user=user,
        message=message[:255],
        link=link[:500],
        type=notification_type,
    )
    broadcast_notification(notification)
    return notification


def notify_followers(*, author, message: str, link: str = '', notification_type: str = Notification.Type.INFO):
    if not getattr(author, 'pk', None):
        return 0

    from users.models import UserFollow

    follower_ids = list(
        UserFollow.objects.filter(following=author).values_list('follower_id', flat=True)
    )
    if not follower_ids:
        return 0

    notifications = Notification.objects.bulk_create(
        [
            Notification(
                user_id=follower_id,
                message=message[:255],
                link=link[:500],
                type=notification_type,
            )
            for follower_id in follower_ids
        ]
    )

    for notification in notifications:
        broadcast_notification(notification)

    return len(notifications)


def mark_notifications_as_read(*, notifications: QuerySet, timestamp):
    return notifications.filter(read_at__isnull=True).update(read_at=timestamp)


def delete_notifications(*, notifications: QuerySet):
    deleted_count, _ = notifications.delete()
    return deleted_count


def build_reactions_payload(*, content_object, user=None):
    content_type = ContentType.objects.get_for_model(content_object.__class__)
    reactions = list(
        ContentReaction.objects.filter(content_type=content_type, object_id=content_object.id)
        .values('emoji')
        .annotate(count=Count('id'))
        .order_by('-count', 'emoji')
    )

    current_emoji = None
    if getattr(user, 'is_authenticated', False):
        current_emoji = (
            ContentReaction.objects.filter(content_type=content_type, object_id=content_object.id, user=user)
            .values_list('emoji', flat=True)
            .first()
        )

    return {
        'reactions': [
            {
                'emoji': item['emoji'],
                'count': item['count'],
                'isSelected': item['emoji'] == current_emoji,
            }
            for item in reactions
        ],
        'currentEmoji': current_emoji,
    }


def toggle_reaction(*, content_object, user, emoji: str):
    content_type = ContentType.objects.get_for_model(content_object.__class__)
    reaction, created = ContentReaction.objects.get_or_create(
        user=user,
        content_type=content_type,
        object_id=content_object.id,
        defaults={'emoji': emoji},
    )

    if not created and reaction.emoji == emoji:
        reaction.delete()
    elif not created:
        reaction.emoji = emoji
        reaction.save(update_fields=['emoji', 'updated_at'])

    return build_reactions_payload(content_object=content_object, user=user)
