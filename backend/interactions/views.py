from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.views import APIView

from blog.models import Post
from blog.services import build_plain_text_excerpt
from comics.models import Comic, ComicReadingProgress
from comics.services import build_public_media_url
from core.api import error_response, success_response
from interactions.models import Notification, PostReadingHistory
from interactions.serializers import (
    NotificationListSerializer,
    NotificationMarkReadRequestSerializer,
    NotificationMarkReadResponseSerializer,
    NotificationSerializer,
    ReadingHistoryResponseSerializer,
)
from interactions.services import mark_notifications_as_read


class InteractionsAccessMixin:
    def ensure_authenticated(self, user):
        if not getattr(user, 'is_authenticated', False):
            return error_response('Authentication credentials were not provided.', status.HTTP_401_UNAUTHORIZED)
        return None


class NotificationListView(InteractionsAccessMixin, APIView):
    @extend_schema(
        tags=['Interactions'],
        responses={200: NotificationListSerializer},
        summary='Get current user notifications list',
    )
    def get(self, request):
        access_error = self.ensure_authenticated(request.user)
        if access_error:
            return access_error

        notifications = list(request.user.notifications.all()[:50])
        payload = {
            'unreadCount': request.user.notifications.filter(read_at__isnull=True).count(),
            'items': [
                {
                    'id': item.id,
                    'message': item.message,
                    'type': item.type,
                    'isRead': bool(item.read_at),
                    'created_at': item.created_at,
                    'read_at': item.read_at,
                }
                for item in notifications
            ],
        }
        return success_response(NotificationListSerializer(payload).data, status.HTTP_200_OK)


class NotificationMarkReadView(InteractionsAccessMixin, APIView):
    @extend_schema(
        tags=['Interactions'],
        request=NotificationMarkReadRequestSerializer,
        responses={200: NotificationMarkReadResponseSerializer},
        summary='Mark one or multiple notifications as read',
    )
    def post(self, request):
        access_error = self.ensure_authenticated(request.user)
        if access_error:
            return access_error

        serializer = NotificationMarkReadRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        timestamp = timezone.now()
        notifications = Notification.objects.filter(user=request.user, id__in=serializer.validated_data['ids'])
        updated_count = mark_notifications_as_read(notifications=notifications, timestamp=timestamp)
        unread_count = request.user.notifications.filter(read_at__isnull=True).count()

        return success_response(
            NotificationMarkReadResponseSerializer(
                {
                    'updatedCount': updated_count,
                    'unreadCount': unread_count,
                }
            ).data,
            status.HTTP_200_OK,
        )


class ReadingHistoryView(InteractionsAccessMixin, APIView):
    @extend_schema(
        tags=['Interactions'],
        responses={200: ReadingHistoryResponseSerializer},
        summary='Get current user reading history for comics and posts',
    )
    def get(self, request):
        access_error = self.ensure_authenticated(request.user)
        if access_error:
            return access_error

        comic_history = (
            ComicReadingProgress.objects.filter(user=request.user, comic__status=Comic.Status.PUBLISHED)
            .select_related('comic', 'chapter')
            .order_by('-updated_at', '-created_at')
        )
        post_history = (
            PostReadingHistory.objects.filter(user=request.user, post__status=Post.Status.PUBLISHED)
            .select_related('post')
            .order_by('-updated_at', '-created_at')
        )

        payload = {
            'comics': [
                {
                    'comicId': item.comic_id,
                    'title': item.comic.title,
                    'cover': item.comic.cover,
                    'coverUrl': build_public_media_url(item.comic.cover),
                    'ageRating': item.comic.age_rating,
                    'chapterId': item.chapter_id,
                    'chapterTitle': item.chapter.title if item.chapter_id else None,
                    'lastPage': item.last_page,
                    'lastReadAt': item.updated_at,
                    'path': (
                        f'/comics/{item.comic_id}/chapters/{item.chapter_id}'
                        if item.chapter_id
                        else f'/comics/{item.comic_id}'
                    ),
                }
                for item in comic_history
            ],
            'posts': [
                {
                    'postId': item.post_id,
                    'title': item.post.title,
                    'cover': item.post.cover,
                    'coverUrl': build_public_media_url(item.post.cover),
                    'excerpt': build_plain_text_excerpt(item.post.content),
                    'lastReadAt': item.updated_at,
                    'path': f'/blog/{item.post_id}',
                }
                for item in post_history
            ],
        }

        return success_response(ReadingHistoryResponseSerializer(payload).data, status.HTTP_200_OK)
