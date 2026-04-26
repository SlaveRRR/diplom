from datetime import timedelta

from django.db import transaction
from django.db.models import Avg, Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from comics import services
from comics.models import Chapter, ChapterUploadDraft, Comic, ComicAgeRating, ComicUploadDraft, Genre, Tag, UploadDraftStatus
from comics.models import ComicReadingProgress, ComicStats
from comics.serializers import (
    ComicCommentCreateSerializer,
    ComicCommentSerializer,
    ComicConfirmRequestSerializer,
    ComicConfirmResponseSerializer,
    ComicCatalogItemSerializer,
    ComicContinueReadingSerializer,
    ComicDetailSerializer,
    ComicInteractionResponseSerializer,
    ComicReaderSerializer,
    ComicReadingProgressUpdateSerializer,
    ComicUploadConfigRequestSerializer,
    ComicUploadConfigResponseSerializer,
    TaxonomyResponseSerializer,
)
from core.api import error_response, success_response
from interactions.models import Comment, ComicFavorite, ComicLike, Notification
from interactions.services import create_notification

AGE_RATING_DESCRIPTIONS = {
    ComicAgeRating.AGE_0: 'Подходит для самого широкого возраста без чувствительных сцен.',
    ComicAgeRating.AGE_6: 'Допускает умеренно напряжённые сцены, понятные младшей аудитории.',
    ComicAgeRating.AGE_12: 'Подростковый рейтинг для приключенческих и драматических историй.',
    ComicAgeRating.AGE_16: 'Материал с более тяжёлыми темами, насилием или мрачной атмосферой.',
    ComicAgeRating.AGE_18: 'Контент только для взрослой аудитории.',
}


class ComicsAccessMixin:
    def ensure_authenticated(self, user):
        if not getattr(user, 'is_authenticated', False):
            return error_response('Authentication credentials were not provided.', status.HTTP_401_UNAUTHORIZED)
        return None


def build_catalog_item_payload(comic, recent_boundary):
    readers_count = comic.stats.unique_readers if hasattr(comic, 'stats') else 0
    is_new = bool((comic.published_at and comic.published_at >= recent_boundary) or comic.created_at >= recent_boundary)
    is_trending = comic.likes_total >= 3 or readers_count >= 50 or comic.comments_total >= 3

    return {
        'id': comic.id,
        'title': comic.title,
        'description': comic.description,
        'cover': comic.cover,
        'coverUrl': services.build_public_media_url(comic.cover),
        'age_rating': comic.age_rating,
        'author': comic.author.username,
        'genreId': comic.genre.id if comic.genre else None,
        'genre': comic.genre.name if comic.genre else None,
        'tagIds': [tag.id for tag in comic.tags.all()],
        'tags': [tag.name for tag in comic.tags.all()],
        'rating': float(comic.average_rating or 0),
        'reviews': comic.comments_total,
        'likesCount': comic.likes_total,
        'readersCount': readers_count,
        'status': comic.status,
        'isNew': is_new,
        'isTrending': is_trending,
    }


class TaxonomyView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=['Platform'],
        responses={200: TaxonomyResponseSerializer},
        summary='Get platform taxonomy for age ratings, genres and tags',
    )
    def get(self, request):
        age_ratings = [
            {
                'value': value,
                'label': label,
                'description': AGE_RATING_DESCRIPTIONS[value],
            }
            for value, label in ComicAgeRating.choices
        ]
        genres = list(Genre.objects.order_by('name').values('id', 'name', 'slug', 'description'))
        tags = list(Tag.objects.order_by('name').values('id', 'name', 'slug', 'description'))

        return success_response(
            {
                'ageRatings': age_ratings,
                'genres': genres,
                'tags': tags,
            },
            status.HTTP_200_OK,
        )


class ComicUploadConfigView(ComicsAccessMixin, APIView):
    @extend_schema(
        tags=['Comics'],
        request=ComicUploadConfigRequestSerializer,
        responses={201: ComicUploadConfigResponseSerializer},
        summary='Create unified upload config for comic media and chapter pages',
    )
    def post(self, request):
        access_error = self.ensure_authenticated(request.user)
        if access_error:
            return access_error

        serializer = ComicUploadConfigRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data

        upload_service = services.S3UploadService()
        comic_draft = ComicUploadDraft.objects.create(
            user=request.user,
            title=validated_data['title'],
            description=validated_data.get('description', ''),
            age_rating=validated_data['ageRating'],
            genre_id=validated_data['genreId'],
            tag_ids=validated_data.get('tagIds', []),
            scope_prefix=f'drafts/{request.user.id}/comics/',
        )

        cover_key = services.build_comic_media_key(request.user.id, comic_draft.id, 'cover', validated_data['cover']['filename'])
        banner_key = services.build_comic_media_key(request.user.id, comic_draft.id, 'banner', validated_data['banner']['filename'])
        comic_draft.scope_prefix = f'drafts/{request.user.id}/comics/{comic_draft.id}/'
        comic_draft.cover = cover_key
        comic_draft.banner = banner_key
        comic_draft.save(update_fields=['scope_prefix', 'cover', 'banner', 'updated_at'])

        chapters_payload = []
        for chapter_data in validated_data.get('chapters', []):
            chapter_draft = ChapterUploadDraft.objects.create(
                user=request.user,
                comic_draft=comic_draft,
                title=chapter_data['title'],
                description=chapter_data.get('description', ''),
                chapter_number=chapter_data['chapter_number'],
                expected_page_count=len(chapter_data['pages']),
                scope_prefix=f'drafts/{request.user.id}/comics/{comic_draft.id}/chapters/',
            )

            page_uploads = []
            page_keys = []
            for order, page_data in enumerate(chapter_data['pages'], start=1):
                page_key = services.build_chapter_page_key(
                    request.user.id,
                    comic_draft.id,
                    chapter_draft.id,
                    order,
                    page_data['filename'],
                )
                page_keys.append(page_key)
                page_uploads.append(upload_service.generate_upload(page_key, page_data['content_type']))

            chapter_draft.scope_prefix = f'drafts/{request.user.id}/comics/{comic_draft.id}/chapters/{chapter_draft.id}/'
            chapter_draft.page_keys = page_keys
            chapter_draft.save(update_fields=['scope_prefix', 'page_keys', 'updated_at'])

            chapters_payload.append(
                {
                    'chapter_draft_id': chapter_draft.id,
                    'title': chapter_draft.title,
                    'chapter_number': chapter_draft.chapter_number,
                    'pages': page_uploads,
                }
            )

        response_data = {
            'comic_draft_id': comic_draft.id,
            'expires_at': comic_draft.expires_at,
            'cover': upload_service.generate_upload(cover_key, validated_data['cover']['content_type']),
            'banner': upload_service.generate_upload(banner_key, validated_data['banner']['content_type']),
            'chapters': chapters_payload,
        }
        return success_response(response_data, status.HTTP_201_CREATED)


class ComicConfirmView(ComicsAccessMixin, APIView):
    @extend_schema(
        tags=['Comics'],
        request=ComicConfirmRequestSerializer,
        responses={
            201: ComicConfirmResponseSerializer,
            404: OpenApiResponse(description='Comic draft not found'),
            410: OpenApiResponse(description='Comic draft expired'),
            422: OpenApiResponse(description='Uploaded files not found in storage'),
        },
        summary='Confirm comic creation from uploaded draft files',
    )
    @transaction.atomic
    def post(self, request):
        access_error = self.ensure_authenticated(request.user)
        if access_error:
            return access_error

        serializer = ComicConfirmRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        comic_draft = get_object_or_404(ComicUploadDraft, id=serializer.validated_data['comic_draft_id'], user=request.user)

        if comic_draft.status != UploadDraftStatus.PENDING:
            return error_response('Comic draft is not pending.', status.HTTP_409_CONFLICT)
        if comic_draft.expires_at <= timezone.now():
            comic_draft.status = UploadDraftStatus.EXPIRED
            comic_draft.save(update_fields=['status', 'updated_at'])
            return error_response('Comic draft is expired.', status.HTTP_410_GONE)

        genre = None
        if comic_draft.genre_id:
            genre = Genre.objects.filter(id=comic_draft.genre_id).first()
            if not genre:
                return error_response('Genre from draft does not exist anymore.', status.HTTP_400_BAD_REQUEST)

        tags = list(Tag.objects.filter(id__in=comic_draft.tag_ids))
        if len(tags) != len(set(comic_draft.tag_ids)):
            return error_response('Some tags from draft do not exist anymore.', status.HTTP_400_BAD_REQUEST)

        upload_service = services.S3UploadService()
        missing_keys = []
        for object_key in [comic_draft.cover, comic_draft.banner]:
            if object_key and not upload_service.object_exists(object_key):
                missing_keys.append(object_key)

        chapter_drafts = list(comic_draft.chapter_upload_drafts.order_by('chapter_number', 'created_at'))
        for chapter_draft in chapter_drafts:
            for page_key in chapter_draft.page_keys:
                if not upload_service.object_exists(page_key):
                    missing_keys.append(page_key)

        if missing_keys:
            return error_response(
                'Some uploaded files were not found in storage.',
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                {'missing_keys': missing_keys},
            )

        comic = Comic.objects.create(
            title=comic_draft.title,
            description=comic_draft.description,
            cover=comic_draft.cover,
            banner=comic_draft.banner,
            age_rating=comic_draft.age_rating,
            author=request.user,
            genre=genre,
            status=Comic.Status.DRAFT,
        )
        comic.tags.set(tags)

        chapter_ids = []
        for chapter_draft in chapter_drafts:
            chapter = Chapter.objects.create(
                comic=comic,
                title=chapter_draft.title,
                description=chapter_draft.description,
                chapter_number=chapter_draft.chapter_number,
                page_count=len(chapter_draft.page_keys),
                page_keys=chapter_draft.page_keys,
            )
            chapter_ids.append(chapter.id)
            chapter_draft.status = UploadDraftStatus.COMPLETED
            chapter_draft.save(update_fields=['status', 'updated_at'])

        comic_draft.status = UploadDraftStatus.COMPLETED
        comic_draft.save(update_fields=['status', 'updated_at'])

        if request.user.role == request.user.Role.READER:
            request.user.role = request.user.Role.AUTHOR
            request.user.save()

        return success_response(
            {
                'id': comic.id,
                'title': comic.title,
                'status': comic.status,
                'chapter_ids': chapter_ids,
            },
            status.HTTP_201_CREATED,
        )


class ComicDetailView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=['Comics'],
        responses={200: ComicDetailSerializer, 404: OpenApiResponse(description='Comic not found')},
        summary='Get public comic details page data',
    )
    def get(self, request, comic_id):
        comic = get_object_or_404(
            Comic.objects.select_related('author', 'genre', 'stats').prefetch_related(
                'tags',
                'ratings',
                'likes',
                'favorites',
                'comments__user',
                'chapters',
            ),
            id=comic_id,
        )

        comments = list(comic.comments.order_by('-created_at'))
        like_count = comic.likes.count()
        favorite_count = comic.favorites.count()
        comment_count = len(comments)
        is_liked = request.user.is_authenticated and comic.likes.filter(user=request.user).exists()
        is_favorite = request.user.is_authenticated and comic.favorites.filter(user=request.user).exists()
        continue_reading = None

        if request.user.is_authenticated:
            continue_reading = ComicReadingProgress.objects.filter(user=request.user, comic=comic).first()

        chapters = [
            {
                'id': chapter.id,
                'title': chapter.title,
                'description': chapter.description,
                'chapter_number': chapter.chapter_number,
                'page_count': chapter.page_count,
                'page_keys': chapter.page_keys,
                'previewUrl': services.build_public_media_url(chapter.page_keys[0]) if chapter.page_keys else '',
                'likesCount': like_count,
                'commentsCount': comment_count,
                'viewsCount': 0,
                'published_at': chapter.published_at,
            }
            for chapter in comic.chapters.order_by('chapter_number')
        ]

        payload = {
            'id': comic.id,
            'title': comic.title,
            'description': comic.description,
            'cover': comic.cover,
            'coverUrl': services.build_public_media_url(comic.cover),
            'banner': comic.banner,
            'bannerUrl': services.build_public_media_url(comic.banner),
            'status': comic.status,
            'age_rating': comic.age_rating,
            'genre': (
                {
                    'id': comic.genre.id,
                    'name': comic.genre.name,
                    'slug': comic.genre.slug,
                    'description': comic.genre.description,
                }
                if comic.genre
                else None
            ),
            'tags': [
                {
                    'id': tag.id,
                    'name': tag.name,
                    'slug': tag.slug,
                    'description': tag.description,
                }
                for tag in comic.tags.all()
            ],
            'author': {
                'id': comic.author.id,
                'username': comic.author.username,
                'avatar': comic.author.avatar,
                'role': comic.author.role,
            },
            'likesCount': like_count,
            'isLiked': is_liked,
            'favoritesCount': favorite_count,
            'isFavorite': is_favorite,
            'commentsCount': comment_count,
            'readersCount': comic.stats.unique_readers if hasattr(comic, 'stats') else 0,
            'chaptersCount': len(chapters),
            'chapters': chapters,
            'comments': comments,
            'continueReading': continue_reading,
        }

        return success_response(ComicDetailSerializer(payload).data, status.HTTP_200_OK)


class ComicListView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=['Comics'],
        responses={200: ComicCatalogItemSerializer(many=True)},
        summary='Get public comics catalog list',
    )
    def get(self, request):
        now = timezone.now()
        recent_boundary = now - timedelta(days=14)

        comics = (
            Comic.objects.filter(status=Comic.Status.PUBLISHED)
            .select_related('author', 'genre', 'stats')
            .prefetch_related('tags')
            .annotate(
                average_rating=Avg('ratings__value'),
                comments_total=Count('comments', distinct=True),
                likes_total=Count('likes', distinct=True),
                favorites_total=Count('favorites', distinct=True),
            )
            .order_by('-published_at', '-created_at')
        )

        payload = [build_catalog_item_payload(comic, recent_boundary) for comic in comics]

        return success_response(ComicCatalogItemSerializer(payload, many=True).data, status.HTTP_200_OK)


class FavoriteComicListView(ComicsAccessMixin, APIView):
    @extend_schema(
        tags=['Interactions'],
        responses={200: ComicCatalogItemSerializer(many=True)},
        summary='Get current user favorite comics list',
    )
    def get(self, request):
        access_error = self.ensure_authenticated(request.user)
        if access_error:
            return access_error

        now = timezone.now()
        recent_boundary = now - timedelta(days=14)

        comics = (
            Comic.objects.filter(favorites__user=request.user, status=Comic.Status.PUBLISHED)
            .select_related('author', 'genre', 'stats')
            .prefetch_related('tags')
            .annotate(
                average_rating=Avg('ratings__value'),
                comments_total=Count('comments', distinct=True),
                likes_total=Count('likes', distinct=True),
                favorites_total=Count('favorites', distinct=True),
            )
            .order_by('-favorites__created_at', '-published_at', '-created_at')
            .distinct()
        )

        payload = [build_catalog_item_payload(comic, recent_boundary) for comic in comics]
        return success_response(ComicCatalogItemSerializer(payload, many=True).data, status.HTTP_200_OK)


class ComicCommentCreateView(ComicsAccessMixin, APIView):
    @extend_schema(
        tags=['Interactions'],
        request=ComicCommentCreateSerializer,
        responses={201: ComicCommentSerializer},
        summary='Create comment for comic',
    )
    def post(self, request, comic_id):
        access_error = self.ensure_authenticated(request.user)
        if access_error:
            return access_error

        comic = get_object_or_404(Comic, id=comic_id)
        serializer = ComicCommentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reply_to = None
        if serializer.validated_data.get('replyToId'):
            reply_to = get_object_or_404(Comment, id=serializer.validated_data['replyToId'])
            if reply_to.content_object != comic:
                return error_response('Reply target does not belong to this comic.', status.HTTP_400_BAD_REQUEST)

        comment = Comment.objects.create(
            user=request.user,
            content_object=comic,
            text=serializer.validated_data['text'],
            reply_to=reply_to,
        )

        if comic.author_id != request.user.id:
            create_notification(
                user=comic.author,
                message=f'{request.user.username} оставил комментарий к вашему комиксу «{comic.title}».',
                notification_type=Notification.Type.INFO,
            )

        if reply_to and reply_to.user_id not in {request.user.id, comic.author_id}:
            create_notification(
                user=reply_to.user,
                message=f'{request.user.username} ответил на ваш комментарий под комиксом «{comic.title}».',
                notification_type=Notification.Type.INFO,
            )

        return success_response(ComicCommentSerializer(comment).data, status.HTTP_201_CREATED)


class ComicFavoriteToggleView(ComicsAccessMixin, APIView):
    @extend_schema(
        tags=['Interactions'],
        responses={200: ComicInteractionResponseSerializer},
        summary='Toggle favorite state for comic',
    )
    def post(self, request, comic_id):
        access_error = self.ensure_authenticated(request.user)
        if access_error:
            return access_error

        comic = get_object_or_404(Comic, id=comic_id)
        favorite, created = ComicFavorite.objects.get_or_create(user=request.user, comic=comic)

        if not created:
            favorite.delete()
            is_active = False
        else:
            is_active = True

        return success_response(
            {
                'isActive': is_active,
                'count': comic.favorites.count(),
            },
            status.HTTP_200_OK,
        )


class ComicLikeToggleView(ComicsAccessMixin, APIView):
    @extend_schema(
        tags=['Interactions'],
        responses={200: ComicInteractionResponseSerializer},
        summary='Toggle like state for comic',
    )
    def post(self, request, comic_id):
        access_error = self.ensure_authenticated(request.user)
        if access_error:
            return access_error

        comic = get_object_or_404(Comic, id=comic_id)
        like, created = ComicLike.objects.get_or_create(user=request.user, comic=comic)

        if not created:
            like.delete()
            is_active = False
        else:
            is_active = True

        return success_response(
            {
                'isActive': is_active,
                'count': comic.likes.count(),
            },
            status.HTTP_200_OK,
        )


class ComicReaderView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=['Comics'],
        responses={200: ComicReaderSerializer, 404: OpenApiResponse(description='Chapter not found')},
        summary='Get comic reader payload for chapter reading',
    )
    def get(self, request, comic_id, chapter_id):
        comic = get_object_or_404(
            Comic.objects.select_related('stats').prefetch_related('chapters'),
            id=comic_id,
        )
        chapter = get_object_or_404(Chapter.objects.select_related('comic'), id=chapter_id, comic=comic)

        chapters = list(comic.chapters.order_by('chapter_number'))
        current_index = next((index for index, item in enumerate(chapters) if item.id == chapter.id), 0)
        previous_chapter_id = chapters[current_index - 1].id if current_index > 0 else None
        next_chapter_id = chapters[current_index + 1].id if current_index < len(chapters) - 1 else None

        progress = None
        is_liked = False
        is_favorite = False

        if request.user.is_authenticated:
            progress = ComicReadingProgress.objects.filter(user=request.user, comic=comic).first()
            is_liked = comic.likes.filter(user=request.user).exists()
            is_favorite = comic.favorites.filter(user=request.user).exists()

        payload = {
            'comicId': comic.id,
            'comicTitle': comic.title,
            'chapter': {
                'id': chapter.id,
                'title': chapter.title,
                'chapter_number': chapter.chapter_number,
                'page_count': chapter.page_count,
                'pages': [
                    {
                        'index': index,
                        'key': key,
                        'url': services.build_public_media_url(key),
                    }
                    for index, key in enumerate(chapter.page_keys, start=1)
                ],
            },
            'chapters': [
                {
                    'id': item.id,
                    'title': item.title,
                    'chapter_number': item.chapter_number,
                }
                for item in chapters
            ],
            'navigation': {
                'previousChapterId': previous_chapter_id,
                'nextChapterId': next_chapter_id,
            },
            'likesCount': comic.likes.count(),
            'commentsCount': comic.comments.count(),
            'isLiked': is_liked,
            'favoritesCount': comic.favorites.count(),
            'isFavorite': is_favorite,
            'progress': progress,
        }

        return success_response(ComicReaderSerializer(payload).data, status.HTTP_200_OK)


class ComicReadingProgressView(ComicsAccessMixin, APIView):
    @extend_schema(
        tags=['Comics'],
        request=ComicReadingProgressUpdateSerializer,
        responses={200: ComicContinueReadingSerializer},
        summary='Update comic reading progress for current user',
    )
    def post(self, request, comic_id, chapter_id):
        access_error = self.ensure_authenticated(request.user)
        if access_error:
            return access_error

        comic = get_object_or_404(Comic, id=comic_id)
        chapter = get_object_or_404(Chapter, id=chapter_id, comic=comic)

        serializer = ComicReadingProgressUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        last_page = min(serializer.validated_data['lastPage'], max(chapter.page_count, 1))

        progress, _ = ComicReadingProgress.objects.update_or_create(
            user=request.user,
            comic=comic,
            defaults={
                'chapter': chapter,
                'last_page': last_page,
            },
        )

        stats, _ = ComicStats.objects.get_or_create(comic=comic)
        stats.unique_readers = ComicReadingProgress.objects.filter(comic=comic).count()
        stats.save(update_fields=['unique_readers'])

        return success_response(ComicContinueReadingSerializer(progress).data, status.HTTP_200_OK)
