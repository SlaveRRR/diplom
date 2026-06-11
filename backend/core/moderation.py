import os
import logging

from django.conf import settings

from analytics.models import AnalyticsEvent
from analytics.services import record_content_event
from interactions.models import Notification
from interactions.services import enqueue_followers_notification, enqueue_notification
from core.tasks import send_email_task
from users.achievements import sync_creator_stats

logger = logging.getLogger('core')


MODERATION_STATUS_LABELS = {
    'draft': 'Черновик',
    'under_review': 'На модерации',
    'published': 'Опубликован',
    'blocked': 'Заблокирован',
    'revision': 'На доработке',
}


def build_frontend_absolute_url(path: str) -> str:
    frontend_url = getattr(settings, 'FRONTEND_URL', None) or os.getenv('FRONTEND_URL', 'http://localhost:5173')
    return f"{frontend_url.rstrip('/')}/{path.lstrip('/')}"


def build_backend_absolute_url(path: str) -> str:
    backend_url = getattr(settings, 'BACKEND_PUBLIC_URL', None) or os.getenv('BACKEND_PUBLIC_URL', 'http://localhost:8000')
    return f"{backend_url.rstrip('/')}/{path.lstrip('/')}"


def build_moderation_copy(*, item_label: str, title: str, status: str, moderation_message: str = ''):
    if status == 'published':
        subject = f'{item_label.capitalize()} опубликован'
        notification_type = Notification.Type.SUCCESS
        message = f'Ваш {item_label} «{title}» опубликован.'
    elif status == 'revision':
        subject = f'{item_label.capitalize()} отправлен на доработку'
        notification_type = Notification.Type.WARNING
        message = f'Ваш {item_label} «{title}» отправлен на доработку.'
    elif status == 'blocked':
        subject = f'{item_label.capitalize()} заблокирован'
        notification_type = Notification.Type.ERROR
        message = f'Ваш {item_label} «{title}» заблокирован.'
    else:
        return None

    note = moderation_message.strip()
    if note:
        message = f'{message} Комментарий модератора: {note}'

    return {
        'subject': subject,
        'notification_type': notification_type,
        'message': message,
    }


def notify_moderation_result(*, user, item_label: str, title: str, status: str, link_path: str, moderation_message: str = ''):
    payload = build_moderation_copy(
        item_label=item_label,
        title=title,
        status=status,
        moderation_message=moderation_message,
    )
    if not payload:
        return

    absolute_url = build_frontend_absolute_url(link_path)

    enqueue_notification(
        user=user,
        message=payload['message'],
        notification_type=payload['notification_type'],
        link=link_path,
    )

    if not getattr(user, 'email', ''):
        return

    status_label = MODERATION_STATUS_LABELS.get(status, status)
    email_message = (
        f'Здравствуйте, {user.username}!\n\n'
        f'Статус материала «{title}» изменён на «{status_label}».\n'
    )

    if moderation_message.strip():
        email_message += f'\nКомментарий модератора:\n{moderation_message.strip()}\n'

    email_message += f'\nСсылка: {absolute_url}\n'

    send_email_task.delay(
        subject=payload['subject'],
        message=email_message,
        recipient_list=[user.email],
    )


def notify_admins_about_moderation_submission(*, item_label: str, title: str, author_username: str, admin_link_path: str):
    admin_emails = getattr(settings, 'ADMINS_EMAILS', [])
    if not admin_emails:
        return

    admin_url = build_backend_absolute_url(admin_link_path)
    subject = f'Новый материал на модерации: {title}'
    message = (
        f'Автор {author_username} отправил {item_label} «{title}» на модерацию.\n\n'
        f'Ссылка в админку: {admin_url}\n'
    )

    try:
        send_email_task.delay(
            subject=subject,
            message=message,
            recipient_list=admin_emails,
        )
    except Exception as error:
        logger.warning(
            'Failed to enqueue moderation submission email for admins: %s',
            error,
        )


def record_publication_event(*, user, item_label: str, object_id: int, title: str, content_kind: str):
    record_content_event(
        owner=user,
        actor=user,
        content_kind=content_kind,
        object_id=object_id,
        title_snapshot=title,
        event_type=AnalyticsEvent.EventType.PUBLICATION,
    )

    is_comic = content_kind == AnalyticsEvent.ContentKind.COMIC
    link_path = f'/comics/{object_id}' if is_comic else f'/blog/{object_id}'
    follower_message = (
        f'{user.username} опубликовал новый комикс «{title}».'
        if is_comic
        else f'{user.username} опубликовал новый пост «{title}».'
    )
    enqueue_followers_notification(
        author=user,
        message=follower_message,
        link=link_path,
        notification_type=Notification.Type.INFO,
    )

    if content_kind == AnalyticsEvent.ContentKind.COMIC:
        sync_creator_stats(user)
