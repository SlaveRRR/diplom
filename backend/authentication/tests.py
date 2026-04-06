from allauth.socialaccount.models import SocialAccount, SocialLogin
from django.contrib.auth import get_user_model
from django.core import mail
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from authentication.adapters import SocialAccountAdapter

User = get_user_model()


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class AuthenticationApiTests(APITestCase):
    def test_signup_sends_verification_email_and_creates_inactive_user(self):
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
        self.assertEqual(response.data['email'], 'reader1@example.com')
        self.assertEqual(response.data['retry_after'], 60)
        self.assertEqual(len(mail.outbox), 1)

        user = User.objects.get(email='reader1@example.com')
        self.assertFalse(user.is_active)

    def test_signin_returns_access_token_for_valid_active_user(self):
        User.objects.create_user(
            username='reader2',
            email='reader2@example.com',
            password='strongpass123',
            is_active=True,
        )

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

    def test_signin_blocks_unverified_user(self):
        User.objects.create_user(
            username='reader3',
            email='reader3@example.com',
            password='strongpass123',
            is_active=False,
        )

        response = self.client.post(
            '/api/v1/signin/',
            {
                'username': 'reader3',
                'password': 'strongpass123',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['detail'], 'Email is not verified yet. Please confirm your email first.')

    def test_resend_verification_email_respects_cooldown(self):
        User.objects.create_user(
            username='reader4',
            email='reader4@example.com',
            password='strongpass123',
            is_active=False,
        )

        first_response = self.client.post(
            '/api/v1/signup/resend-verification/',
            {'email': 'reader4@example.com'},
            format='json',
        )
        second_response = self.client.post(
            '/api/v1/signup/resend-verification/',
            {'email': 'reader4@example.com'},
            format='json',
        )

        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(second_response.data['retry_after'], 60)

    def test_signup_cannot_assign_admin_role(self):
        response = self.client.post(
            '/api/v1/signup/',
            {
                'username': 'reader5',
                'email': 'reader5@example.com',
                'password': 'strongpass123',
                'role': 'admin',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('role', response.data)


class SocialAccountAdapterTests(APITestCase):
    def setUp(self):
        self.adapter = SocialAccountAdapter()

    def test_build_yandex_avatar_url_returns_url_from_default_avatar_id(self):
        avatar_url = self.adapter.build_yandex_avatar_url(
            {
                'default_avatar_id': '12345/abcdef',
                'is_avatar_empty': False,
            }
        )

        self.assertEqual(
            avatar_url,
            'https://avatars.yandex.net/get-yapic/12345/abcdef/islands-34',
        )

    def test_build_yandex_avatar_url_returns_none_when_avatar_is_empty(self):
        avatar_url = self.adapter.build_yandex_avatar_url(
            {
                'default_avatar_id': '12345/abcdef',
                'is_avatar_empty': True,
            }
        )

        self.assertIsNone(avatar_url)

    def test_populate_user_sets_avatar_for_new_yandex_user(self):
        sociallogin = SocialLogin(
            user=User(),
            account=SocialAccount(
                provider='yandex',
                uid='yandex-uid',
                extra_data={
                    'default_avatar_id': '777/avatar',
                    'is_avatar_empty': False,
                },
            ),
        )
        user = self.adapter.populate_user(
            None,
            sociallogin,
            {
                'email': 'social-user@example.com',
                'first_name': 'Ivan',
                'last_name': 'Petrov',
                'username': 'social-user',
            },
        )

        self.assertEqual(user.email, 'social-user@example.com')
        self.assertEqual(
            user.avatar,
            'https://avatars.yandex.net/get-yapic/777/avatar/islands-34',
        )
