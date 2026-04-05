from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework.views import APIView

from comics import services
from comics.models import Chapter, ChapterUploadDraft, Comic, ComicUploadDraft, Genre, Tag, UploadDraftStatus
from comics.serializers import (
    ComicConfirmRequestSerializer,
    ComicConfirmResponseSerializer,
    ComicUploadConfigRequestSerializer,
    ComicUploadConfigResponseSerializer,
    TaxonomyResponseSerializer,
)
from core.api import error_response, success_response


class ComicsAccessMixin:
    def ensure_authenticated(self, user):
        if not getattr(user, 'is_authenticated', False):
            return error_response('Authentication credentials were not provided.', status.HTTP_401_UNAUTHORIZED)
        return None


class TaxonomyView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=['Platform'],
        responses={
            200: TaxonomyResponseSerializer,
        },
        summary='Get platform taxonomy for genres and tags',
    )
    def get(self, request):
        genres = list(Genre.objects.order_by('name').values('id', 'name', 'slug', 'description'))
        tags = list(Tag.objects.order_by('name').values('id', 'name', 'slug', 'description'))
    
        return success_response(
            {
                'genres': genres,
                'tags': tags,
            },
            status.HTTP_200_OK,
        )


class ComicUploadConfigView(ComicsAccessMixin, APIView):
    @extend_schema(
        tags=['Comics'],
        request=ComicUploadConfigRequestSerializer,
        responses={
            201: ComicUploadConfigResponseSerializer,
        },
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
