from datetime import datetime, timedelta

from django.db import transaction
from django.db.models import Avg, Count, Q
from django.core.paginator import Paginator
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from comics import services
from comics.models import Chapter, ChapterUploadDraft, Comic, ComicAgeRating, ComicRating, ComicUploadDraft, Genre, Tag, UploadDraftStatus
from comics.models import ComicReadingProgress, ComicStats
from analytics.models import AnalyticsEvent
from analytics.services import record_content_event, register_unique_content_view
from blog.services import build_plain_text_excerpt
from blog.serializers import build_post_list_payload
from blog.models import Post
from comics.serializers import (
    ComicCommentCreateSerializer,
    ComicCommentSerializer,
    ComicConfirmRequestSerializer,
    ComicConfirmResponseSerializer,
    ComicCatalogItemSerializer,
    ComicCatalogPageSerializer,
    ContentReactionResponseSerializer,
    ContentReactionToggleSerializer,
    ComicContinueReadingSerializer,
    ComicDetailSerializer,
    ComicEditorSerializer,
    HomeSelectionsSerializer,
    ComicInteractionResponseSerializer,
    ComicReaderSerializer,
    ComicReadingProgressUpdateSerializer,
    ComicRatingRequestSerializer,
    ComicRatingResponseSerializer,
    ComicVisibilityResponseSerializer,
    DraftDeleteResponseSerializer,
    ComicUploadConfigRequestSerializer,
    ComicUploadConfigResponseSerializer,
    TaxonomyResponseSerializer,
)
from core.api import error_response, success_response
from core.moderation import notify_admins_about_moderation_submission
from interactions.models import Comment, ComicFavorite, ComicLike, Notification
from interactions.services import (
    broadcast_comic_comment,
    build_reactions_payload,
    enqueue_followers_notification,
    enqueue_notification,
    toggle_reaction,
)
from users.achievements import register_chapter_read, sync_creator_stats

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


def can_access_comic(user, comic):
    if comic.status == Comic.Status.PUBLISHED and not comic.is_hidden:
        return True

    if not getattr(user, 'is_authenticated', False):
        return False

    return user.is_staff or comic.author_id == user.id


def ensure_comic_access(request, comic):
    if not can_access_comic(request.user, comic):
        raise Http404('Comic not found')


def get_positive_int(value, default, minimum=1, maximum=100):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default
    return min(max(parsed, minimum), maximum)


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


def build_comic_editor_payload(comic):
    return {
        'id': comic.id,
        'title': comic.title,
        'description': comic.description,
        'cover': comic.cover,
        'coverUrl': services.build_public_media_url(comic.cover),
        'banner': comic.banner,
        'bannerUrl': services.build_public_media_url(comic.banner),
        'age_rating': comic.age_rating,
        'genreId': comic.genre_id,
        'tagIds': [tag.id for tag in comic.tags.all()],
        'status': comic.status,
        'chapters': [
            {
                'id': chapter.id,
                'title': chapter.title,
                'description': chapter.description,
                'chapter_number': chapter.chapter_number,
                'pages': [
                    {
                        'key': key,
                        'url': services.build_public_media_url(key),
                    }
                    for key in chapter.page_keys
                ],
            }
            for chapter in comic.chapters.order_by('chapter_number', 'id')
        ],
    }


def get_public_catalog_queryset():
    return (
        Comic.objects.filter(status=Comic.Status.PUBLISHED, is_hidden=False)
        .select_related('author', 'genre', 'stats')
        .prefetch_related('tags')
        .annotate(
            average_rating=Avg('ratings__value'),
            comments_total=Count('comments', distinct=True),
            likes_total=Count('likes', distinct=True),
            favorites_total=Count('favorites', distinct=True),
        )
    )


def build_home_taxonomy_tiles_payload():
    accents = [
        {'accent': '#6941C6', 'surface': '#F4EBFF'},
        {'accent': '#175CD3', 'surface': '#EFF8FF'},
        {'accent': '#EE46BC', 'surface': '#FDF2FA'},
    ]
    heights = [260, 210, 240, 200, 230, 190, 220, 210]

    genres = list(Genre.objects.order_by('name')[:4].values('id', 'name', 'slug', 'description'))
    tags = list(Tag.objects.order_by('name')[:4].values('id', 'name', 'slug', 'description'))

    genre_tiles = [
        {
            'key': f"genre-{item['id']}",
            'kind': 'genre',
            'item': item,
            'href': f"/catalog?genre={item['id']}",
            'height': heights[index],
            'accent': accents[index % len(accents)]['accent'],
            'surface': accents[index % len(accents)]['surface'],
        }
        for index, item in enumerate(genres)
    ]
    tag_tiles = [
        {
            'key': f"tag-{item['id']}",
            'kind': 'tag',
            'item': item,
            'href': f"/catalog?tag={item['id']}",
            'height': heights[index + len(genre_tiles)],
            'accent': accents[(index + 1) % len(accents)]['accent'],
            'surface': accents[(index + 1) % len(accents)]['surface'],
        }
        for index, item in enumerate(tags)
    ]

    ordered_tiles = [
        genre_tiles[0] if len(genre_tiles) > 0 else None,
        tag_tiles[0] if len(tag_tiles) > 0 else None,
        genre_tiles[1] if len(genre_tiles) > 1 else None,
        tag_tiles[1] if len(tag_tiles) > 1 else None,
        genre_tiles[2] if len(genre_tiles) > 2 else None,
        tag_tiles[2] if len(tag_tiles) > 2 else None,
        genre_tiles[3] if len(genre_tiles) > 3 else None,
        tag_tiles[3] if len(tag_tiles) > 3 else None,
    ]
    return [tile for tile in ordered_tiles if tile]


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


class HomeSelectionsView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=['Platform'],
        responses={200: HomeSelectionsSerializer},
        summary='Get precomputed home page selections',
    )
    def get(self, request):
        recent_boundary = timezone.now() - timedelta(days=14)

        comics = list(get_public_catalog_queryset()[:48])
        comic_payload = [build_catalog_item_payload(comic, recent_boundary) for comic in comics]

        hero_comics = sorted(
            comic_payload,
            key=lambda item: (
                int(item['isTrending']),
                item['likesCount'],
                item['rating'],
                item['reviews'],
            ),
            reverse=True,
        )[:5]
        popular_comics = sorted(
            comic_payload,
            key=lambda item: (
                int(item['isTrending']),
                item['likesCount'],
                item['rating'],
                item['reviews'],
            ),
            reverse=True,
        )[:4]
        fresh_comics = sorted(
            comic_payload,
            key=lambda item: (int(item['isNew']), item['id']),
            reverse=True,
        )[:4]

        posts = list(
            Post.objects.filter(status=Post.Status.PUBLISHED, is_hidden=False)
            .select_related('author')
            .prefetch_related('tags')
            .annotate(comments_total=Count('comments', distinct=True))
            .order_by('-published_at', '-updated_at', '-created_at')[:24]
        )
        post_payload = [build_post_list_payload(post, build_plain_text_excerpt(post.content)) for post in posts]
        popular_posts = sorted(
            post_payload,
            key=lambda item: (item['commentsCount'], item['id']),
            reverse=True,
        )[:3]
        fresh_posts = sorted(
            post_payload,
            key=lambda item: item['published_at'] or timezone.make_aware(datetime.min),
            reverse=True,
        )[:3]

        payload = {
            'heroComics': hero_comics,
            'popularComics': popular_comics,
            'freshComics': fresh_comics,
            'popularPosts': popular_posts,
            'freshPosts': fresh_posts,
            'taxonomyTiles': build_home_taxonomy_tiles_payload(),
        }
        return success_response(HomeSelectionsSerializer(payload).data, status.HTTP_200_OK)


class ComicUploadConfigView(ComicsAccessMixin, APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'upload_config'

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

        editable_comic = None
        comic_id = validated_data.get('comicId')
        if comic_id:
            editable_comic = get_object_or_404(
                Comic.objects.filter(
                    author=request.user,
                    status__in=[Comic.Status.DRAFT, Comic.Status.REVISION, Comic.Status.PUBLISHED],
                ),
                id=comic_id,
            )

        upload_service = services.S3UploadService()
        stale_drafts = list(
            ComicUploadDraft.objects.filter(
                user=request.user,
                status__in=[
                    UploadDraftStatus.PENDING,
                    UploadDraftStatus.EXPIRED,
                    UploadDraftStatus.CANCELLED,
                ],
            ).prefetch_related('chapter_upload_drafts')
        )
        stale_keys = []
        for stale_draft in stale_drafts:
            stale_keys.extend([stale_draft.cover, stale_draft.banner])
            for stale_chapter in stale_draft.chapter_upload_drafts.all():
                stale_keys.extend(stale_chapter.page_keys)
        upload_service.delete_objects(stale_keys)
        if stale_drafts:
            ComicUploadDraft.objects.filter(id__in=[stale_draft.id for stale_draft in stale_drafts]).delete()
        comic_draft = ComicUploadDraft.objects.create(
            user=request.user,
            title=validated_data['title'].strip() or 'Новый комикс',
            description=validated_data.get('description', ''),
            age_rating=validated_data['ageRating'],
            genre_id=validated_data.get('genreId'),
            tag_ids=validated_data.get('tagIds', []),
            scope_prefix=f'drafts/{request.user.id}/comics/',
        )

        cover_payload = validated_data.get('cover') or {}
        banner_payload = validated_data.get('banner') or {}

        cover_key = cover_payload.get('existingKey', '')
        if cover_payload.get('filename'):
            cover_key = services.build_comic_media_key(
                request.user.id,
                comic_draft.id,
                'cover',
                cover_payload['filename'],
            )

        banner_key = banner_payload.get('existingKey', '')
        if banner_payload.get('filename'):
            banner_key = services.build_comic_media_key(
                request.user.id,
                comic_draft.id,
                'banner',
                banner_payload['filename'],
            )

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
                if page_data.get('existingKey'):
                    page_key = page_data['existingKey']
                else:
                    page_key = services.build_chapter_page_key(
                        request.user.id,
                        comic_draft.id,
                        chapter_draft.id,
                        order,
                        page_data['filename'],
                    )
                page_keys.append(page_key)
                if page_data.get('filename'):
                    upload_target = upload_service.generate_upload(page_key, page_data['content_type'])
                    page_uploads.append(
                        {
                            **upload_target,
                            'page_index': order - 1,
                        }
                    )

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
            'cover': (
                upload_service.generate_upload(cover_key, cover_payload['content_type'])
                if cover_payload.get('filename')
                else None
            ),
            'banner': (
                upload_service.generate_upload(banner_key, banner_payload['content_type'])
                if banner_payload.get('filename')
                else None
            ),
            'chapters': chapters_payload,
        }
        return success_response(response_data, status.HTTP_201_CREATED)


class ComicConfirmView(ComicsAccessMixin, APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'upload_confirm'

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
        submission_mode = serializer.validated_data['submission_mode']
        editable_comic = None
        if serializer.validated_data.get('comic_id'):
            editable_comic = get_object_or_404(
                Comic.objects.filter(
                    author=request.user,
                    status__in=[Comic.Status.DRAFT, Comic.Status.REVISION, Comic.Status.PUBLISHED],
                ),
                id=serializer.validated_data['comic_id'],
            )
            if editable_comic.status == Comic.Status.PUBLISHED and submission_mode != Comic.Status.PUBLISHED:
                return error_response(
                    'Published comic edits must be saved as published updates.',
                    status.HTTP_400_BAD_REQUEST,
                )

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

        chapter_drafts = list(comic_draft.chapter_upload_drafts.order_by('chapter_number', 'created_at'))
        if submission_mode != Comic.Status.DRAFT:
            if not comic_draft.title.strip():
                return error_response('Comic title is required for moderation.', status.HTTP_400_BAD_REQUEST)
            if not comic_draft.cover or not comic_draft.banner:
                return error_response('Comic cover and banner are required for moderation.', status.HTTP_400_BAD_REQUEST)
            if not genre:
                return error_response('Comic genre is required for moderation.', status.HTTP_400_BAD_REQUEST)
            if not chapter_drafts:
                return error_response('At least one chapter is required for moderation.', status.HTTP_400_BAD_REQUEST)

            invalid_chapter = next(
                (
                    chapter_draft
                    for chapter_draft in chapter_drafts
                    if not chapter_draft.title.strip() or not chapter_draft.page_keys
                ),
                None,
            )
            if invalid_chapter:
                return error_response(
                    'Every chapter must have a title and at least one page for moderation.',
                    status.HTTP_400_BAD_REQUEST,
                )

        upload_service = services.S3UploadService()
        missing_keys = []
        invalid_keys = []
        for object_key in [comic_draft.cover, comic_draft.banner]:
            if object_key and not upload_service.object_exists(object_key):
                missing_keys.append(object_key)
            elif object_key and not upload_service.validate_image_object(object_key):
                invalid_keys.append(object_key)

        for chapter_draft in chapter_drafts:
            for page_key in chapter_draft.page_keys:
                if not upload_service.object_exists(page_key):
                    missing_keys.append(page_key)
                elif not upload_service.validate_image_object(page_key):
                    invalid_keys.append(page_key)

        if missing_keys:
            return error_response(
                'Some uploaded files were not found in storage.',
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                {'missing_keys': missing_keys},
            )
        if invalid_keys:
            return error_response(
                'Some uploaded files are not valid images.',
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                {'invalid_keys': invalid_keys},
            )

        if editable_comic:
            was_published = editable_comic.status == Comic.Status.PUBLISHED
            preserve_publication = was_published and submission_mode == Comic.Status.PUBLISHED
            previous_tag_ids = set(editable_comic.tags.values_list('id', flat=True))
            previous_snapshot = {
                'title': editable_comic.title,
                'description': editable_comic.description,
                'cover': editable_comic.cover,
                'banner': editable_comic.banner,
                'age_rating': editable_comic.age_rating,
                'genre_id': editable_comic.genre_id,
                'chapters': {
                    chapter.chapter_number: {
                        'title': chapter.title,
                        'description': chapter.description,
                        'page_keys': list(chapter.page_keys),
                    }
                    for chapter in editable_comic.chapters.all()
                },
            }
            added_chapters_count = 0
            added_pages_count = 0

            editable_comic.title = comic_draft.title
            editable_comic.description = comic_draft.description
            editable_comic.cover = comic_draft.cover
            editable_comic.banner = comic_draft.banner
            editable_comic.age_rating = comic_draft.age_rating
            editable_comic.genre = genre
            editable_comic.status = Comic.Status.PUBLISHED if preserve_publication else submission_mode
            if editable_comic.status == Comic.Status.DRAFT:
                editable_comic.published_at = None
            elif preserve_publication and editable_comic.published_at is None:
                editable_comic.published_at = timezone.now()
            editable_comic.save(
                update_fields=[
                    'title',
                    'description',
                    'cover',
                    'banner',
                    'age_rating',
                    'genre',
                    'status',
                    'published_at',
                    'updated_at',
                ]
            )
            editable_comic.tags.set(tags)

            remaining_chapters = {
                chapter.chapter_number: chapter
                for chapter in editable_comic.chapters.all()
            }
            comic = editable_comic
        else:
            comic = Comic.objects.create(
                title=comic_draft.title,
                description=comic_draft.description,
                cover=comic_draft.cover,
                banner=comic_draft.banner,
                age_rating=comic_draft.age_rating,
                author=request.user,
                genre=genre,
                status=submission_mode,
            )
            comic.tags.set(tags)

        chapter_ids = []
        for chapter_draft in chapter_drafts:
            if editable_comic:
                chapter = remaining_chapters.pop(chapter_draft.chapter_number, None)
                if chapter:
                    previous_page_count = chapter.page_count
                    chapter.title = chapter_draft.title
                    chapter.description = chapter_draft.description
                    chapter.page_count = len(chapter_draft.page_keys)
                    chapter.page_keys = chapter_draft.page_keys
                    if preserve_publication and chapter.published_at is None:
                        chapter.published_at = comic.published_at
                    chapter.save(
                        update_fields=[
                            'title',
                            'description',
                            'page_count',
                            'page_keys',
                            'published_at',
                            'updated_at',
                        ]
                    )
                    if preserve_publication and chapter.page_count > previous_page_count:
                        added_pages_count += chapter.page_count - previous_page_count
                else:
                    chapter = Chapter.objects.create(
                        comic=comic,
                        title=chapter_draft.title,
                        description=chapter_draft.description,
                        chapter_number=chapter_draft.chapter_number,
                        page_count=len(chapter_draft.page_keys),
                        page_keys=chapter_draft.page_keys,
                        published_at=comic.published_at if preserve_publication else None,
                    )
                    if preserve_publication:
                        added_chapters_count += 1
                        added_pages_count += len(chapter_draft.page_keys)
            else:
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

        if editable_comic and remaining_chapters:
            Chapter.objects.filter(id__in=[chapter.id for chapter in remaining_chapters.values()]).delete()

        comic_draft.status = UploadDraftStatus.COMPLETED
        comic_draft.save(update_fields=['status', 'updated_at'])

        if comic.status == Comic.Status.UNDER_REVIEW:
            notify_admins_about_moderation_submission(
                item_label='комикс',
                title=comic.title,
                author_username=request.user.username,
                admin_link_path=f'/admin/comics/comic/{comic.id}/change/',
            )

        if editable_comic and preserve_publication:
            current_tag_ids = set(tag.id for tag in tags)
            chapter_snapshot = {
                chapter_draft.chapter_number: {
                    'title': chapter_draft.title,
                    'description': chapter_draft.description,
                    'page_keys': list(chapter_draft.page_keys),
                }
                for chapter_draft in chapter_drafts
            }
            has_published_updates = any(
                [
                    previous_snapshot['title'] != comic.title,
                    previous_snapshot['description'] != comic.description,
                    previous_snapshot['cover'] != comic.cover,
                    previous_snapshot['banner'] != comic.banner,
                    previous_snapshot['age_rating'] != comic.age_rating,
                    previous_snapshot['genre_id'] != comic.genre_id,
                    previous_tag_ids != current_tag_ids,
                    previous_snapshot['chapters'] != chapter_snapshot,
                ]
            )
            if has_published_updates != comic.has_published_updates:
                comic.has_published_updates = has_published_updates
                comic.save(update_fields=['has_published_updates', 'updated_at'])

            if added_chapters_count or added_pages_count:
                parts = []
                if added_chapters_count:
                    parts.append(f'новых глав: {added_chapters_count}')
                if added_pages_count:
                    parts.append(f'новых страниц: {added_pages_count}')
                enqueue_followers_notification(
                    author=comic.author,
                    message=(
                        f'{comic.author.username} обновил комикс «{comic.title}»: '
                        f'{", ".join(parts)}.'
                    ),
                    link=f'/comics/{comic.id}',
                    notification_type=Notification.Type.INFO,
                )

            sync_creator_stats(comic.author)

        if request.user.role == request.user.Role.READER:
            request.user.role = request.user.Role.AUTHOR
            request.user.save()

        return success_response(
            {
                'comic_id': comic.id,
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
        ensure_comic_access(request, comic)

        comments = list(comic.comments.order_by('-created_at'))
        like_count = comic.likes.count()
        favorite_count = comic.favorites.count()
        ratings_count = comic.ratings.count()
        average_rating = comic.ratings.aggregate(value=Avg('value'))['value'] or 0
        comment_count = len(comments)
        is_liked = request.user.is_authenticated and comic.likes.filter(user=request.user).exists()
        is_favorite = request.user.is_authenticated and comic.favorites.filter(user=request.user).exists()
        continue_reading = None
        user_rating = None

        if request.user.is_authenticated:
            continue_reading = ComicReadingProgress.objects.filter(user=request.user, comic=comic).first()
            user_rating = comic.ratings.filter(user=request.user).values_list('value', flat=True).first()

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

        reactions_payload = build_reactions_payload(content_object=comic, user=request.user)

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
            'averageRating': round(float(average_rating), 2),
            'ratingsCount': ratings_count,
            'userRating': user_rating,
            'commentsCount': comment_count,
            'reactions': reactions_payload['reactions'],
            'currentEmoji': reactions_payload['currentEmoji'],
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
        responses={200: ComicCatalogPageSerializer},
        summary='Get public comics catalog list',
    )
    def get(self, request):
        now = timezone.now()
        recent_boundary = now - timedelta(days=14)
        search = request.query_params.get('search', '').strip()
        genre_id = request.query_params.get('genre_id')
        tag_ids = [int(value) for value in request.query_params.get('tag_ids', '').split(',') if value.isdigit()]
        sort = request.query_params.get('sort', 'popular')
        page = get_positive_int(request.query_params.get('page'), 1)
        page_size = get_positive_int(request.query_params.get('page_size'), 12)

        comics = get_public_catalog_queryset()

        if search:
            comics = comics.filter(
                Q(title__icontains=search) | Q(description__icontains=search) | Q(author__username__icontains=search)
            )

        if genre_id and genre_id.isdigit():
            comics = comics.filter(genre_id=int(genre_id))

        if tag_ids:
            comics = comics.filter(tags__id__in=tag_ids).distinct()

        if sort == 'reviews':
            comics = comics.order_by('-comments_total', '-published_at', '-created_at')
        elif sort == 'new':
            comics = comics.order_by('-published_at', '-created_at')
        else:
            comics = comics.order_by('-likes_total', '-average_rating', '-comments_total', '-published_at', '-created_at')

        paginator = Paginator(comics, page_size)
        page_obj = paginator.get_page(page)
        payload_items = [build_catalog_item_payload(comic, recent_boundary) for comic in page_obj.object_list]
        payload = {
            'items': payload_items,
            'pagination': {
                'page': page_obj.number,
                'pageSize': page_size,
                'total': paginator.count,
                'totalPages': paginator.num_pages,
            },
        }

        return success_response(ComicCatalogPageSerializer(payload).data, status.HTTP_200_OK)


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
            Comic.objects.filter(favorites__user=request.user, status=Comic.Status.PUBLISHED, is_hidden=False)
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
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'comment'

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

        comic = get_object_or_404(Comic, id=comic_id, status=Comic.Status.PUBLISHED, is_hidden=False)
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

        record_content_event(
            owner=comic.author,
            actor=request.user,
            content_kind=AnalyticsEvent.ContentKind.COMIC,
            object_id=comic.id,
            title_snapshot=comic.title,
            event_type=AnalyticsEvent.EventType.COMMENT,
        )

        comic_stats, _ = ComicStats.objects.get_or_create(comic=comic)
        comic_stats.comments_count = comic.comments.count()
        comic_stats.save(update_fields=['comments_count'])

        if comic.author_id != request.user.id:
            enqueue_notification(
                user=comic.author,
                message=f'{request.user.username} оставил комментарий к вашему комиксу «{comic.title}».',
                notification_type=Notification.Type.INFO,
            )

        if reply_to and reply_to.user_id not in {request.user.id, comic.author_id}:
            enqueue_notification(
                user=reply_to.user,
                message=f'{request.user.username} ответил на ваш комментарий под комиксом «{comic.title}».',
                notification_type=Notification.Type.INFO,
            )

        serialized_comment = ComicCommentSerializer(comment).data
        broadcast_comic_comment(
            comic_id=comic.id,
            comment_payload=serialized_comment,
            comments_count=comic.comments.count(),
        )

        return success_response(serialized_comment, status.HTTP_201_CREATED)


class ComicFavoriteToggleView(ComicsAccessMixin, APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'interaction'

    @extend_schema(
        tags=['Interactions'],
        responses={200: ComicInteractionResponseSerializer},
        summary='Toggle favorite state for comic',
    )
    def post(self, request, comic_id):
        access_error = self.ensure_authenticated(request.user)
        if access_error:
            return access_error

        comic = get_object_or_404(Comic, id=comic_id, status=Comic.Status.PUBLISHED, is_hidden=False)
        favorite, created = ComicFavorite.objects.get_or_create(user=request.user, comic=comic)

        if not created:
            favorite.delete()
            is_active = False
        else:
            is_active = True
            record_content_event(
                owner=comic.author,
                actor=request.user,
                content_kind=AnalyticsEvent.ContentKind.COMIC,
                object_id=comic.id,
                title_snapshot=comic.title,
                event_type=AnalyticsEvent.EventType.FAVORITE,
            )

        comic_stats, _ = ComicStats.objects.get_or_create(comic=comic)
        comic_stats.favorites_count = comic.favorites.count()
        comic_stats.save(update_fields=['favorites_count'])

        return success_response(
            {
                'isActive': is_active,
                'count': comic.favorites.count(),
            },
            status.HTTP_200_OK,
        )


class ComicLikeToggleView(ComicsAccessMixin, APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'interaction'

    @extend_schema(
        tags=['Interactions'],
        responses={200: ComicInteractionResponseSerializer},
        summary='Toggle like state for comic',
    )
    def post(self, request, comic_id):
        access_error = self.ensure_authenticated(request.user)
        if access_error:
            return access_error

        comic = get_object_or_404(Comic, id=comic_id, status=Comic.Status.PUBLISHED, is_hidden=False)
        like, created = ComicLike.objects.get_or_create(user=request.user, comic=comic)

        if not created:
            like.delete()
            is_active = False
        else:
            is_active = True
            record_content_event(
                owner=comic.author,
                actor=request.user,
                content_kind=AnalyticsEvent.ContentKind.COMIC,
                object_id=comic.id,
                title_snapshot=comic.title,
                event_type=AnalyticsEvent.EventType.LIKE,
            )

        return success_response(
            {
                'isActive': is_active,
                'count': comic.likes.count(),
            },
            status.HTTP_200_OK,
        )


class ComicRatingView(ComicsAccessMixin, APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'rating'

    @extend_schema(
        tags=['Interactions'],
        request=ComicRatingRequestSerializer,
        responses={200: ComicRatingResponseSerializer},
        summary='Create or update rating for comic',
    )
    def put(self, request, comic_id):
        access_error = self.ensure_authenticated(request.user)
        if access_error:
            return access_error

        comic = get_object_or_404(Comic, id=comic_id, status=Comic.Status.PUBLISHED, is_hidden=False)
        serializer = ComicRatingRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        rating, _ = ComicRating.objects.update_or_create(
            comic=comic,
            user=request.user,
            defaults={'value': serializer.validated_data['value']},
        )

        average_rating = comic.ratings.aggregate(value=Avg('value'))['value'] or 0

        return success_response(
            {
                'value': rating.value,
                'averageRating': round(float(average_rating), 2),
                'ratingsCount': comic.ratings.count(),
            },
            status.HTTP_200_OK,
        )


class ComicReactionToggleView(ComicsAccessMixin, APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'interaction'

    @extend_schema(
        tags=['Interactions'],
        request=ContentReactionToggleSerializer,
        responses={200: ContentReactionResponseSerializer},
        summary='Set or remove emoji reaction for comic',
    )
    def post(self, request, comic_id):
        access_error = self.ensure_authenticated(request.user)
        if access_error:
            return access_error

        comic = get_object_or_404(Comic, id=comic_id, status=Comic.Status.PUBLISHED, is_hidden=False)
        serializer = ContentReactionToggleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payload = toggle_reaction(content_object=comic, user=request.user, emoji=serializer.validated_data['emoji'])
        return success_response(ContentReactionResponseSerializer(payload).data, status.HTTP_200_OK)


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
        ensure_comic_access(request, comic)
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

        comic_stats, _ = ComicStats.objects.get_or_create(comic=comic)
        is_new_unique_view = register_unique_content_view(
            request=request,
            owner=comic.author,
            content_kind=AnalyticsEvent.ContentKind.COMIC,
            object_id=comic.id,
            title_snapshot=comic.title,
        )

        if is_new_unique_view:
            comic_stats.views += 1
            comic_stats.unique_readers += 1
            comic_stats.save(update_fields=['views', 'unique_readers'])

        reactions_payload = build_reactions_payload(content_object=comic, user=request.user)

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
            'status': comic.status,
            'likesCount': comic.likes.count(),
            'commentsCount': comic.comments.count(),
            'reactions': reactions_payload['reactions'],
            'currentEmoji': reactions_payload['currentEmoji'],
            'isLiked': is_liked,
            'favoritesCount': comic.favorites.count(),
            'isFavorite': is_favorite,
            'progress': progress,
        }

        return success_response(ComicReaderSerializer(payload).data, status.HTTP_200_OK)


class ComicEditorView(ComicsAccessMixin, APIView):
    @extend_schema(
        tags=['Comics'],
        responses={200: ComicEditorSerializer, 404: OpenApiResponse(description='Editable comic not found')},
        summary='Get editable comic payload for author',
    )
    def get(self, request, comic_id):
        access_error = self.ensure_authenticated(request.user)
        if access_error:
            return access_error

        comic = get_object_or_404(
            Comic.objects.filter(
                author=request.user,
                status__in=[Comic.Status.DRAFT, Comic.Status.REVISION, Comic.Status.PUBLISHED],
            )
            .select_related('genre')
            .prefetch_related('tags', 'chapters'),
            id=comic_id,
        )

        payload = build_comic_editor_payload(comic)
        return success_response(ComicEditorSerializer(payload).data, status.HTTP_200_OK)


class ComicVisibilityToggleView(ComicsAccessMixin, APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'interaction'

    @extend_schema(
        tags=['Comics'],
        responses={200: ComicVisibilityResponseSerializer},
        summary='Toggle public visibility for an owned published comic',
    )
    def post(self, request, comic_id):
        access_error = self.ensure_authenticated(request.user)
        if access_error:
            return access_error

        comic = get_object_or_404(Comic, id=comic_id, author=request.user)
        if comic.status != Comic.Status.PUBLISHED:
            return error_response('Only published comics can be hidden or shown.', status.HTTP_400_BAD_REQUEST)

        comic.is_hidden = not comic.is_hidden
        comic.save(update_fields=['is_hidden', 'updated_at'])

        return success_response({'isHidden': comic.is_hidden}, status.HTTP_200_OK)


class ComicDraftDeleteView(ComicsAccessMixin, APIView):
    @extend_schema(
        tags=['Comics'],
        responses={200: DraftDeleteResponseSerializer},
        summary='Delete an owned draft comic and its uploaded media',
    )
    def delete(self, request, comic_id):
        access_error = self.ensure_authenticated(request.user)
        if access_error:
            return access_error

        comic = get_object_or_404(
            Comic.objects.prefetch_related('chapters'),
            id=comic_id,
            author=request.user,
        )
        if comic.status != Comic.Status.DRAFT:
            return error_response('Only draft comics can be deleted by the author.', status.HTTP_400_BAD_REQUEST)

        object_keys = [comic.cover, comic.banner]
        for chapter in comic.chapters.all():
            object_keys.extend(chapter.page_keys or [])

        deleted_media_count = services.S3UploadService().delete_objects(object_keys)
        deleted_id = comic.id
        comic.delete()

        return success_response(
            {
                'id': deleted_id,
                'deletedMediaCount': deleted_media_count,
            },
            status.HTTP_200_OK,
        )


class ComicReadingProgressView(ComicsAccessMixin, APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'reading_progress'

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
        ensure_comic_access(request, comic)
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
        is_new_unique_view = register_unique_content_view(
            request=request,
            owner=comic.author,
            content_kind=AnalyticsEvent.ContentKind.COMIC,
            object_id=comic.id,
            title_snapshot=comic.title,
        )
        if is_new_unique_view:
            stats.views += 1
            stats.unique_readers += 1
            stats.save(update_fields=['views', 'unique_readers'])

        if last_page >= max(chapter.page_count, 1):
            register_chapter_read(request.user, chapter)

        return success_response(ComicContinueReadingSerializer(progress).data, status.HTTP_200_OK)
