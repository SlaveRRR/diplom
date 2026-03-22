from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase


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
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'updated@example.com')
        self.assertEqual(response.data['name'], 'Ivan')
        self.assertEqual(response.data['surname'], 'Petrov')
