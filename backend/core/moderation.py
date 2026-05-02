import os

from django.conf import settings
from django.core.mail import send_mail

from analytics.models import AnalyticsEvent
from analytics.services import record_content_event
from interactions.models import Notification
from interactions.services import create_notification


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

    create_notification(
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

    send_mail(
        payload['subject'],
        email_message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )


def record_publication_event(*, user, item_label: str, object_id: int, title: str):
    content_kind = AnalyticsEvent.ContentKind.COMIC if item_label == 'комикс' else AnalyticsEvent.ContentKind.POST
    record_content_event(
        owner=user,
        actor=user,
        content_kind=content_kind,
        object_id=object_id,
        title_snapshot=title,
        event_type=AnalyticsEvent.EventType.PUBLICATION,
    )
