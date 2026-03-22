from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

from authentication.serializers import AccessTokenResponseSerializer, SignInSerializer, SignUpSerializer

User = get_user_model()


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
            201: AccessTokenResponseSerializer,
            400: OpenApiResponse(description='Invalid sign up payload'),
        },
        summary='Register a new user',
    )
    def post(self, request):
        serializer = SignUpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        response = Response({'access_token': str(refresh.access_token)}, status=status.HTTP_201_CREATED)
        set_refresh_cookie(response, str(refresh))
        return response


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

        user = authenticate(
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password'],
        )

        if user is None:
            return Response({'detail': 'Invalid username or password'}, status=status.HTTP_401_UNAUTHORIZED)

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

        delete_refresh_cookie(response)
        return response
