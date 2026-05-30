import os
from copy import copy
from urllib.parse import urlparse

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, logout as django_logout
from django.core.cache import cache
from allauth.socialaccount.adapter import get_adapter as get_socialaccount_adapter
from allauth.socialaccount.providers.base.constants import AuthProcess
from drf_spectacular.utils import OpenApiParameter, OpenApiTypes, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from verify_email.email_handler import ActivationMailManager

from authentication.serializers import (
    AccessTokenResponseSerializer,
    ResendVerificationEmailSerializer,
    SignInSerializer,
    SignUpSerializer,
    VerificationEmailResponseSerializer,
)

User = get_user_model()
VERIFICATION_EMAIL_COOLDOWN = int(os.getenv('VERIFY_EMAIL_COOLDOWN', '60'))


def build_public_request(request):
    parsed_base_url = urlparse(settings.BACKEND_PUBLIC_URL)
    base_url = settings.BACKEND_PUBLIC_URL
    public_request = copy(request)
    public_request.META = request.META.copy()

    host = parsed_base_url.netloc
    public_request.META['HTTP_HOST'] = host
    public_request.META['SERVER_NAME'] = parsed_base_url.hostname or host
    public_request.META['SERVER_PORT'] = str(
        parsed_base_url.port or (443 if parsed_base_url.scheme == 'https' else 80)
    )
    public_request.META['wsgi.url_scheme'] = parsed_base_url.scheme
    public_request.get_host = lambda: parsed_base_url.netloc
    public_request.is_secure = lambda: parsed_base_url.scheme == 'https'
    public_request.build_absolute_uri = lambda location=None: (
        location
        if isinstance(location, str) and location.startswith(('http://', 'https://'))
        else f'{base_url}{location or request.get_full_path()}'
        if str(location or '').startswith('/')
        else f'{base_url}/{location or request.get_full_path()}'
    )

    return public_request


def set_refresh_cookie(response, refresh_token):
    response.set_cookie(
        key=settings.REFRESH_TOKEN_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=not settings.DEBUG,
        samesite='Lax' if settings.DEBUG else 'None',
        path='/',
    )


def delete_refresh_cookie(response):
    response.delete_cookie(
        key=settings.REFRESH_TOKEN_COOKIE_NAME,
        path='/',
        samesite='Lax' if settings.DEBUG else 'None',
    )


class SignUpView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=['Authentication'],
        request=SignUpSerializer,
        responses={
            201: VerificationEmailResponseSerializer,
            400: OpenApiResponse(description='Invalid sign up payload'),
        },
        summary='Register a new user and send verification email',
    )
    def post(self, request):
        serializer = SignUpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        verification_request = build_public_request(request._request)
        try:
            ActivationMailManager.send_verification_link(inactive_user=user, request=verification_request)
        except Exception:
            return Response(
                {'detail': 'Failed to send verification email. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        set_verification_cooldown(user.email)

        return Response(
            {
                'detail': 'Verification email sent successfully.',
                'email': user.email,
                'retry_after': VERIFICATION_EMAIL_COOLDOWN,
            },
            status=status.HTTP_201_CREATED,
        )


class SignInView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=['Authentication'],
        request=SignInSerializer,
        responses={
            200: AccessTokenResponseSerializer,
            401: OpenApiResponse(description='Invalid credentials'),
        },
        summary='Sign in by username and password',
    )
    def post(self, request):
        serializer = SignInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']

        user = authenticate(
            username=username,
            password=password,
        )

        if user is None:
            pending_user = User.objects.filter(username=username, is_active=False).first()

            if pending_user and pending_user.check_password(password):
                return Response(
                    {'detail': 'Почта не подтверждена. Пожалуйста, подтвердите свою почту.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
            return Response({'detail': 'неправильный логин или пароль'}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        response = Response({'access_token': str(refresh.access_token)}, status=status.HTTP_200_OK)
        set_refresh_cookie(response, str(refresh))
        return response


class TokenRefreshCookieView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=['Authentication'],
        responses={
            200: AccessTokenResponseSerializer,
            401: OpenApiResponse(description='Refresh token is missing or invalid'),
        },
        summary='Refresh access token from httpOnly cookie',
    )
    def get(self, request):
        refresh_token = request.COOKIES.get(settings.REFRESH_TOKEN_COOKIE_NAME)

        if not refresh_token:
            return Response({'detail': 'Refresh token not found'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            refresh = RefreshToken(refresh_token)
            user_id = refresh.get('user_id')
            access_token = str(refresh.access_token)
            response = Response({'access_token': access_token}, status=status.HTTP_200_OK)

            if settings.SIMPLE_JWT.get('ROTATE_REFRESH_TOKENS'):
                if settings.SIMPLE_JWT.get('BLACKLIST_AFTER_ROTATION'):
                    try:
                        refresh.blacklist()
                    except AttributeError:
                        pass

                user = User.objects.filter(id=user_id).first()
                if user:
                    new_refresh = RefreshToken.for_user(user)
                    set_refresh_cookie(response, str(new_refresh))

            return response
        except TokenError:
            return Response({'detail': 'Refresh token is invalid'}, status=status.HTTP_401_UNAUTHORIZED)


def get_verification_cooldown_cache_key(email):
    return f'verification-email-cooldown:{email.lower()}'


def set_verification_cooldown(email):
    cache.set(get_verification_cooldown_cache_key(email), True, VERIFICATION_EMAIL_COOLDOWN)


class ResendVerificationEmailView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=['Authentication'],
        request=ResendVerificationEmailSerializer,
        responses={
            200: VerificationEmailResponseSerializer,
            404: OpenApiResponse(description='User with email not found'),
            409: OpenApiResponse(description='User is already active'),
            429: OpenApiResponse(description='Verification email was sent recently'),
        },
        summary='Resend verification email',
    )
    def post(self, request):
        serializer = ResendVerificationEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        user = User.objects.filter(email=email).first()

        if not user:
            return Response({'detail': 'Пользователь с такой почтой не найден.'}, status=status.HTTP_404_NOT_FOUND)

        if user.is_active:
            return Response({'detail': 'Почта уже подтверждена!.'}, status=status.HTTP_409_CONFLICT)

        if cache.get(get_verification_cooldown_cache_key(email)):
            return Response(
                {
                    'detail': 'Письмо с подтверждением уже было отправлено. Пожалуйста, попробуйте позже.',
                    'email': email,
                    'retry_after': VERIFICATION_EMAIL_COOLDOWN,
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        verification_request = build_public_request(request._request)
        try:
            ActivationMailManager.resend_verification_link(
                verification_request,
                email,
                user=user,
                encoded=False,
            )
        except Exception:
            return Response(
                {'detail': 'Failed to resend verification email. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        set_verification_cooldown(email)

        return Response(
            {
                'detail': 'Verification email sent successfully.',
                'email': email,
                'retry_after': VERIFICATION_EMAIL_COOLDOWN,
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    @extend_schema(
        tags=['Authentication'],
        responses={204: OpenApiResponse(description='Logged out successfully')},
        summary='Log out current user',
    )
    def post(self, request):
        refresh_token = request.COOKIES.get(settings.REFRESH_TOKEN_COOKIE_NAME)
        response = Response(status=status.HTTP_204_NO_CONTENT)

        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except TokenError:
                pass

        django_logout(request._request)
        delete_refresh_cookie(response)
        return response


def get_social_callback_url():
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173').rstrip('/')
    return f'{frontend_url}/signin?social=callback'


class SocialLoginStartView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=['Authentication'],
        parameters=[
            OpenApiParameter(
                name='provider',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH,
                enum=['google', 'yandex'],
            ),
        ],
        responses={
            302: OpenApiResponse(description='Redirect to social provider'),
            404: OpenApiResponse(description='Unknown social provider'),
        },
        summary='Start social authentication flow',
    )
    def get(self, request, provider):
        django_request = request._request

        try:
            social_provider = get_socialaccount_adapter().get_provider(django_request, provider)
        except Exception:
            return Response({'detail': 'Unknown social provider'}, status=status.HTTP_404_NOT_FOUND)

        return social_provider.redirect(
            django_request,
            AuthProcess.LOGIN,
            next_url=get_social_callback_url(),
            headless=True,
        )


class SocialSessionExchangeView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [AllowAny]

    @extend_schema(
        tags=['Authentication'],
        responses={
            200: AccessTokenResponseSerializer,
            401: OpenApiResponse(description='Authenticated social session not found'),
        },
        summary='Exchange authenticated social session for JWT tokens',
    )
    def get(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response({'detail': 'Authenticated social session not found'}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(request.user)
        response = Response({'access_token': str(refresh.access_token)}, status=status.HTTP_200_OK)
        set_refresh_cookie(response, str(refresh))
        return response
