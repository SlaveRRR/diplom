from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APITestCase

from analytics.models import AnalyticsEvent

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
