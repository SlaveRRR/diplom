from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from blog.models import Post
from comics import services
from comics.models import Comic
from core.api import error_response, success_response
from interactions.models import Notification
from interactions.services import create_notification
from users.models import AvatarUploadDraft, UserFollow
from users.serializers import (
    AvatarUploadConfigRequestSerializer,
    AvatarUploadConfigResponseSerializer,
    AvatarUploadConfirmRequestSerializer,
    AvatarUploadConfirmResponseSerializer,
    CurrentUserSerializer,
    UserAccountSerializer,
    UserFollowToggleSerializer,
    UserProfileComicBuilder,
    UserProfilePostBuilder,
    UserProfileSerializer,
    UserUpdateSerializer,
)

User = get_user_model()


def get_user_comics_queryset(user, include_unpublished=False):
    comics = (
        user.comics.select_related('genre', 'stats')
        .prefetch_related('tags')
        .annotate(
            likes_total=Count('likes', distinct=True),
            comments_total=Count('comments', distinct=True),
            chapters_total=Count('chapters', distinct=True),
        )
        .order_by('-updated_at', '-created_at')
    )

    if not include_unpublished:
        comics = comics.filter(status=Comic.Status.PUBLISHED)

    return comics


def get_user_posts_queryset(user, include_unpublished=False):
    posts = (
        user.posts.prefetch_related('tags')
        .annotate(comments_total=Count('comments', distinct=True))
        .order_by('-updated_at', '-created_at')
    )

    if not include_unpublished:
        posts = posts.filter(status=Post.Status.PUBLISHED)

    return posts


def build_account_payload(user):
    comics = [UserProfileComicBuilder.build(comic) for comic in get_user_comics_queryset(user, include_unpublished=True)]
    posts = [UserProfilePostBuilder.build(post) for post in get_user_posts_queryset(user, include_unpublished=True)]

    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'avatar': services.build_public_media_url(user.avatar),
        'role': user.role,
        'name': user.first_name,
        'surname': user.last_name,
        'followersCount': user.follower_relationships.count(),
        'followingCount': user.following_relationships.count(),
        'publicProfilePath': f'/profile/{user.id}',
        'comics': comics,
        'posts': posts,
    }


class CurrentUserView(APIView):
    @extend_schema(
        tags=['Users'],
        responses={200: CurrentUserSerializer},
        summary='Get current authenticated user payload for app bootstrap',
    )
    def get(self, request):
        serializer = CurrentUserSerializer(request.user)
        return success_response(serializer.data, status.HTTP_200_OK)

    @extend_schema(
        tags=['Users'],
        request=UserUpdateSerializer,
        responses={
            200: CurrentUserSerializer,
            400: OpenApiResponse(description='Invalid user payload'),
        },
        summary='Update current user personal information',
    )
    def put(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        response_serializer = CurrentUserSerializer(request.user)
        return success_response(response_serializer.data, status.HTTP_200_OK)


class AccountView(APIView):
    @extend_schema(
        tags=['Users'],
        responses={200: UserAccountSerializer},
        summary='Get private account dashboard data',
    )
    def get(self, request):
        payload = build_account_payload(request.user)
        return success_response(UserAccountSerializer(payload).data, status.HTTP_200_OK)


class AvatarUploadConfigView(APIView):
    @extend_schema(
        tags=['Users'],
        request=AvatarUploadConfigRequestSerializer,
        responses={201: AvatarUploadConfigResponseSerializer},
        summary='Create avatar upload config for S3 direct upload',
    )
    def post(self, request):
        serializer = AvatarUploadConfigRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        avatar_draft = AvatarUploadDraft.objects.create(
            user=request.user,
            expires_at=timezone.now() + timedelta(seconds=settings.S3_PRESIGNED_EXPIRATION),
        )
        avatar_key = services.build_user_avatar_key(request.user.id, avatar_draft.id, serializer.validated_data['filename'])
        avatar_draft.file_key = avatar_key
        avatar_draft.save(update_fields=['file_key', 'updated_at'])

        upload_service = services.S3UploadService()
        response_data = {
            'avatarDraftId': avatar_draft.id,
            'expiresAt': avatar_draft.expires_at,
            'file': upload_service.generate_upload(avatar_key, serializer.validated_data['content_type']),
        }
        return success_response(response_data, status.HTTP_201_CREATED)


class AvatarConfirmView(APIView):
    @extend_schema(
        tags=['Users'],
        request=AvatarUploadConfirmRequestSerializer,
        responses={200: AvatarUploadConfirmResponseSerializer},
        summary='Confirm avatar upload and attach it to current user account',
    )
    def post(self, request):
        serializer = AvatarUploadConfirmRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        avatar_draft = get_object_or_404(AvatarUploadDraft, id=serializer.validated_data['avatarDraftId'], user=request.user)

        if avatar_draft.status != AvatarUploadDraft.Status.PENDING:
            return error_response('Avatar draft is not pending.', status.HTTP_409_CONFLICT)

        if avatar_draft.expires_at <= timezone.now():
            avatar_draft.status = AvatarUploadDraft.Status.EXPIRED
            avatar_draft.save(update_fields=['status', 'updated_at'])
            return error_response('Avatar draft is expired.', status.HTTP_410_GONE)

        upload_service = services.S3UploadService()
        if not upload_service.object_exists(avatar_draft.file_key):
            return error_response(
                'Uploaded avatar file was not found in storage.',
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                {'missing_key': avatar_draft.file_key},
            )

        request.user.avatar = avatar_draft.file_key
        request.user.save(update_fields=['avatar', 'updated_at'])
        avatar_draft.status = AvatarUploadDraft.Status.CONFIRMED
        avatar_draft.save(update_fields=['status', 'updated_at'])

        return success_response(
            {'avatar': services.build_public_media_url(request.user.avatar)},
            status.HTTP_200_OK,
        )


class PublicProfileView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=['Users'],
        responses={200: UserProfileSerializer, 404: OpenApiResponse(description='User profile not found')},
        summary='Get public user profile with published comics only',
    )
    def get(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        is_current_user = request.user.is_authenticated and request.user.id == user.id
        comics = [UserProfileComicBuilder.build(comic) for comic in get_user_comics_queryset(user, include_unpublished=False)]

        is_following = False
        if request.user.is_authenticated and not is_current_user:
            is_following = UserFollow.objects.filter(follower=request.user, following=user).exists()

        payload = {
            'id': user.id,
            'username': user.username,
            'avatar': services.build_public_media_url(user.avatar),
            'role': user.role,
            'name': user.first_name,
            'surname': user.last_name,
            'followersCount': user.follower_relationships.count(),
            'followingCount': user.following_relationships.count(),
            'isFollowing': is_following,
            'isCurrentUser': is_current_user,
            'comics': comics,
        }

        return success_response(UserProfileSerializer(payload).data, status.HTTP_200_OK)


class UserFollowToggleView(APIView):
    @extend_schema(
        tags=['Users'],
        responses={200: UserFollowToggleSerializer},
        summary='Toggle follow state for public profile',
    )
    def post(self, request, user_id):
        if not request.user.is_authenticated:
            return error_response('Authentication credentials were not provided.', status.HTTP_401_UNAUTHORIZED)

        target_user = get_object_or_404(User, id=user_id)

        if request.user.id == target_user.id:
            return error_response('You cannot follow yourself.', status.HTTP_400_BAD_REQUEST)

        follow, created = UserFollow.objects.get_or_create(follower=request.user, following=target_user)

        if not created:
            follow.delete()
            is_active = False
        else:
            is_active = True
            create_notification(
                user=target_user,
                message=f'{request.user.username} подписался на вас.',
                notification_type=Notification.Type.SUCCESS,
            )

        return success_response(
            {
                'isActive': is_active,
                'followersCount': target_user.follower_relationships.count(),
            },
            status.HTTP_200_OK,
        )
