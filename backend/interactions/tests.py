from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.test import TestCase, override_settings
from rest_framework.test import APITestCase
from unittest.mock import patch

from comics.models import Comic
from interactions.models import Comment, Notification
from interactions.services import create_notification, notify_followers
from users.models import UserFollow

User = get_user_model()


class CommentModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='interaction-user',
            email='interaction-user@example.com',
            password='strongpass123',
        )
        self.comic = Comic.objects.create(title='Тестовый комикс', author=self.user)
        self.content_type = ContentType.objects.get_for_model(Comic)

    def test_comment_can_target_comic_via_generic_relation(self):
        comment = Comment.objects.create(
            user=self.user,
            content_type=self.content_type,
            object_id=self.comic.id,
            text='Работает как универсальный комментарий.',
        )

        self.assertEqual(comment.content_object, self.comic)

    def test_reply_must_belong_to_same_target(self):
        parent = Comment.objects.create(
            user=self.user,
            content_type=self.content_type,
            object_id=self.comic.id,
            text='Родительский комментарий.',
        )
        other_comic = Comic.objects.create(title='Другой комикс', author=self.user)
        invalid_reply = Comment(
            user=self.user,
            content_type=self.content_type,
            object_id=other_comic.id,
            text='Невалидный ответ.',
            reply_to=parent,
        )

        with self.assertRaises(ValidationError):
            invalid_reply.clean()


class NotificationApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='notification-user',
            email='notification-user@example.com',
            password='strongpass123',
        )
        self.client.force_authenticate(user=self.user)

    def test_mark_read_updates_only_unread_notifications(self):
        unread_notification = Notification.objects.create(user=self.user, message='Новое уведомление')
        read_notification = Notification.objects.create(
            user=self.user,
            message='Уже прочитано',
            read_at=unread_notification.created_at,
        )

        response = self.client.post(
            '/api/v1/notifications/read/',
            {'ids': [unread_notification.id, read_notification.id]},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['data']['updatedCount'], 1)

    def test_delete_removes_selected_notifications(self):
        unread_notification = Notification.objects.create(user=self.user, message='Удалить меня')
        read_notification = Notification.objects.create(user=self.user, message='И меня тоже')

        response = self.client.post(
            '/api/v1/notifications/delete/',
            {'ids': [unread_notification.id, read_notification.id]},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['data']['deletedCount'], 2)
        self.assertEqual(Notification.objects.filter(user=self.user).count(), 0)


class NotificationServiceTests(TestCase):
    def setUp(self):
        self.author = User.objects.create_user(
            username='author-user',
            email='author@example.com',
            password='strongpass123',
        )
        self.follower = User.objects.create_user(
            username='follower-user',
            email='follower@example.com',
            password='strongpass123',
        )

    @patch('interactions.services.safe_group_send', return_value=False)
    def test_create_notification_ignores_realtime_broadcast_timeout(self, mocked_safe_group_send):
        notification = create_notification(user=self.author, message='Тестовое уведомление')

        self.assertIsNotNone(notification)
        self.assertEqual(Notification.objects.filter(user=self.author).count(), 1)
        mocked_safe_group_send.assert_called_once()

    @override_settings(NOTIFICATION_REALTIME_FANOUT_LIMIT=0)
    @patch('interactions.services.broadcast_notification')
    def test_notify_followers_skips_realtime_fanout_when_limit_exceeded(self, mocked_broadcast_notification):
        UserFollow.objects.create(follower=self.follower, following=self.author)

        created_count = notify_followers(author=self.author, message='Новый пост опубликован')

        self.assertEqual(created_count, 1)
        self.assertEqual(Notification.objects.filter(user=self.follower).count(), 1)
        mocked_broadcast_notification.assert_not_called()
