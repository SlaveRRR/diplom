import json

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class UsersApiTests(APITestCase):
    def test_current_user_can_be_updated(self):
        user = User.objects.create_user(
            username='reader3',
            email='reader3@example.com',
            password='strongpass123',
        )
        self.client.force_authenticate(user=user)

        response = self.client.put(
            '/api/v1/users/me/',
            {
                'email': 'updated@example.com',
                'name': 'Ivan',
                'surname': 'Petrov',
                'avatar': 'https://cdn.example.com/avatar.png',
            },
            format='json',
        )
        response.render()
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(payload['data']['email'], 'updated@example.com')
        self.assertEqual(payload['data']['name'], 'Ivan')
        self.assertEqual(payload['data']['surname'], 'Petrov')
        self.assertEqual(payload['data']['avatar'], 'https://cdn.example.com/avatar.png')
        self.assertIsNone(payload['error'])

    def test_admin_role_sets_staff_flag(self):
        admin_user = User.objects.create_user(
            username='admin1',
            email='admin1@example.com',
            password='strongpass123',
            role=User.Role.ADMIN,
        )

        self.assertTrue(admin_user.is_staff)
        self.assertEqual(admin_user.role, User.Role.ADMIN)
