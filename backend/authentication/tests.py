from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase


class AuthenticationApiTests(APITestCase):
    def test_signup_returns_access_token_and_sets_refresh_cookie(self):
        response = self.client.post(
            '/api/v1/signup/',
            {
                'username': 'reader1',
                'email': 'reader1@example.com',
                'password': 'strongpass123',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access_token', response.data)
        self.assertIn('refresh_token', response.cookies)

    def test_signin_returns_access_token_for_valid_user(self):
        User.objects.create_user(username='reader2', email='reader2@example.com', password='strongpass123')

        response = self.client.post(
            '/api/v1/signin/',
            {
                'username': 'reader2',
                'password': 'strongpass123',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.data)
        self.assertIn('refresh_token', response.cookies)
