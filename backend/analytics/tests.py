from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APITestCase

from analytics.models import AnalyticsEvent, UniqueContentView
from analytics.services import register_unique_content_view

User = get_user_model()


class AnalyticsEventModelTests(TestCase):
    def test_event_can_be_created(self):
        user = User.objects.create_user(username='analytics-owner', email='analytics-owner@example.com', password='pass123456')
        event = AnalyticsEvent.objects.create(
            owner=user,
            content_kind=AnalyticsEvent.ContentKind.COMIC,
            object_id=1,
            title_snapshot='Test comic',
            event_type=AnalyticsEvent.EventType.VIEW,
        )

        self.assertEqual(event.content_kind, AnalyticsEvent.ContentKind.COMIC)

    def test_unique_content_view_can_be_created(self):
        user = User.objects.create_user(username='unique-owner', email='unique-owner@example.com', password='pass123456')
        unique_view = UniqueContentView.objects.create(
            owner=user,
            content_kind=AnalyticsEvent.ContentKind.POST,
            object_id=7,
            viewer_key='user:1',
            title_snapshot='Test post',
        )

        self.assertEqual(unique_view.content_kind, AnalyticsEvent.ContentKind.POST)


class AnalyticsUniqueViewServiceTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username='service-owner', email='service-owner@example.com', password='pass123456')

    def test_register_unique_content_view_records_only_first_view(self):
        request = self.client.get('/api/v1/analytics/').wsgi_request
        request.user = self.owner

        is_created_first = register_unique_content_view(
            request=request,
            owner=self.owner,
            content_kind=AnalyticsEvent.ContentKind.COMIC,
            object_id=1,
            title_snapshot='Comic',
        )
        is_created_second = register_unique_content_view(
            request=request,
            owner=self.owner,
            content_kind=AnalyticsEvent.ContentKind.COMIC,
            object_id=1,
            title_snapshot='Comic',
        )

        self.assertTrue(is_created_first)
        self.assertFalse(is_created_second)
        self.assertEqual(UniqueContentView.objects.count(), 1)
        self.assertEqual(
            AnalyticsEvent.objects.filter(content_kind=AnalyticsEvent.ContentKind.COMIC, object_id=1, event_type=AnalyticsEvent.EventType.VIEW).count(),
            1,
        )


class AnalyticsApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='analytics-user', email='analytics-user@example.com', password='pass123456')
        self.client.force_authenticate(user=self.user)

    def test_dashboard_returns_payload(self):
        AnalyticsEvent.objects.create(
            owner=self.user,
            content_kind=AnalyticsEvent.ContentKind.POST,
            object_id=1,
            title_snapshot='Post analytics',
            event_type=AnalyticsEvent.EventType.VIEW,
        )

        response = self.client.get('/api/v1/analytics/')

        self.assertEqual(response.status_code, 200)
        self.assertIn('summary', response.data['data'])

    def test_export_returns_excel_file(self):
        response = self.client.get('/api/v1/analytics/export/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response['Content-Type'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
