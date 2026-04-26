from datetime import timedelta

from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from blog.models import BlogTag, Post, PostUploadDraft
from blog.serializers import (
    BlogCommentCreateSerializer,
    BlogCommentSerializer,
    BlogPostCreateResponseSerializer,
    BlogPostDetailSerializer,
    BlogPostEditorSerializer,
    BlogPostListItemSerializer,
    BlogTagSerializer,
    PostConfirmRequestSerializer,
    PostUploadConfigRequestSerializer,
    PostUploadConfigResponseSerializer,
    build_post_author_payload,
    build_post_detail_payload,
    build_post_editor_payload,
    build_post_list_payload,
)
from blog.services import (
    S3UploadService,
    build_plain_text_excerpt,
    build_post_cover_key,
    build_post_inline_image_key,
    collect_post_image_sources,
    resolve_post_content_media,
)
from comics.services import build_public_media_url
from core.api import error_response, success_response
from interactions.models import Comment, Notification, PostReadingHistory
from interactions.services import create_notification


class BlogAccessMixin:
    def ensure_authenticated(self, user):
        if not getattr(user, 'is_authenticated', False):
            return error_response('Authentication credentials were not provided.', status.HTTP_401_UNAUTHORIZED)
        return None


class BlogTagListView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(tags=['Blog'], responses={200: BlogTagSerializer(many=True)}, summary='Get blog tags list')
    def get(self, request):
        tags = BlogTag.objects.order_by('name')
        return success_response(BlogTagSerializer(tags, many=True).data, status.HTTP_200_OK)


class BlogPostListView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(tags=['Blog'], responses={200: BlogPostListItemSerializer(many=True)}, summary='Get public blog posts list')
    def get(self, request):
        posts = (
            Post.objects.filter(status=Post.Status.PUBLISHED)
            .select_related('author')
            .prefetch_related('tags')
            .annotate(comments_total=Count('comments', distinct=True))
            .order_by('-published_at', '-updated_at', '-created_at')
        )
        payload = [build_post_list_payload(post, build_plain_text_excerpt(post.content)) for post in posts]
        return success_response(BlogPostListItemSerializer(payload, many=True).data, status.HTTP_200_OK)


class BlogPostDetailView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(tags=['Blog'], responses={200: BlogPostDetailSerializer, 404: OpenApiResponse(description='Post not found')}, summary='Get public blog post detail')
    def get(self, request, post_id):
        is_preview = str(request.query_params.get('preview', '')).lower() in {'1', 'true', 'yes'}
        queryset = Post.objects.select_related('author').prefetch_related('tags', 'comments__user')

        if is_preview:
            post = get_object_or_404(queryset, id=post_id)
        else:
            post = get_object_or_404(queryset, id=post_id, status=Post.Status.PUBLISHED)

        if request.user.is_authenticated and not is_preview:
            PostReadingHistory.objects.update_or_create(
                user=request.user,
                post=post,
                defaults={},
            )

        payload = build_post_detail_payload(post, resolve_post_content_media(post.content))
        return success_response(BlogPostDetailSerializer(payload).data, status.HTTP_200_OK)


class BlogPostEditorView(BlogAccessMixin, APIView):
    @extend_schema(tags=['Blog'], responses={200: BlogPostEditorSerializer, 404: OpenApiResponse(description='Editable post not found')}, summary='Get editable blog post payload for author')
    def get(self, request, post_id):
        access_error = self.ensure_authenticated(request.user)
        if access_error:
            return access_error

        post = get_object_or_404(
            Post.objects.prefetch_related('tags'),
            id=post_id,
            author=request.user,
            status__in=[Post.Status.DRAFT, Post.Status.REVISION],
        )
        payload = build_post_editor_payload(post, resolve_post_content_media(post.content))
        return success_response(BlogPostEditorSerializer(payload).data, status.HTTP_200_OK)


class BlogPostUploadConfigView(BlogAccessMixin, APIView):
    @extend_schema(tags=['Blog'], request=PostUploadConfigRequestSerializer, responses={201: PostUploadConfigResponseSerializer}, summary='Create S3 upload config for a blog post cover and inline images')
    def post(self, request):
        access_error = self.ensure_authenticated(request.user)
        if access_error:
            return access_error

        serializer = PostUploadConfigRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        draft = PostUploadDraft.objects.create(
            user=request.user,
            expires_at=timezone.now() + timedelta(seconds=settings.S3_PRESIGNED_EXPIRATION),
        )
        cover_payload = validated.get('cover')
        cover_key = build_post_cover_key(request.user.id, draft.id, cover_payload['filename']) if cover_payload else ''

        inline_images = []
        upload_service = S3UploadService()
        for image in validated.get('inlineImages', []):
            key = build_post_inline_image_key(request.user.id, draft.id, image['uploadId'], image['filename'])
            inline_images.append(
                {
                    'uploadId': image['uploadId'],
                    'key': key,
                    'content_type': image['content_type'],
                }
            )

        draft.cover = cover_key
        draft.inline_images = inline_images
        draft.save(update_fields=['cover', 'inline_images', 'updated_at'])

        response_data = {
            'postDraftId': draft.id,
            'expiresAt': draft.expires_at,
            'cover': upload_service.generate_upload(cover_key, cover_payload['content_type']) if cover_payload else None,
            'inlineImages': [
                {
                    'uploadId': image['uploadId'],
                    **upload_service.generate_upload(image['key'], image['content_type']),
                }
                for image in inline_images
            ],
        }
        return success_response(response_data, status.HTTP_201_CREATED)


class BlogPostConfirmView(BlogAccessMixin, APIView):
    @extend_schema(tags=['Blog'], request=PostConfirmRequestSerializer, responses={201: BlogPostCreateResponseSerializer}, summary='Create or update blog post from uploaded media')
    def post(self, request):
        access_error = self.ensure_authenticated(request.user)
        if access_error:
            return access_error

        serializer = PostConfirmRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        draft = get_object_or_404(PostUploadDraft, id=validated['postDraftId'], user=request.user)
        if draft.status != PostUploadDraft.Status.PENDING:
            return error_response('Post draft is not pending.', status.HTTP_409_CONFLICT)
        if draft.expires_at <= timezone.now():
            draft.status = PostUploadDraft.Status.EXPIRED
            draft.save(update_fields=['status', 'updated_at'])
            return error_response('Post draft is expired.', status.HTTP_410_GONE)

        upload_service = S3UploadService()
        missing_keys = []
        if draft.cover and not upload_service.object_exists(draft.cover):
            missing_keys.append(draft.cover)

        available_inline_keys = {item['key'] for item in draft.inline_images}
        for inline_key in available_inline_keys:
            if not upload_service.object_exists(inline_key):
                missing_keys.append(inline_key)

        if missing_keys:
            return error_response(
                'Some uploaded files were not found in storage.',
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                {'missingKeys': missing_keys},
            )

        editable_post = None
        existing_image_keys = set()
        if validated.get('postId'):
            editable_post = get_object_or_404(
                Post.objects.prefetch_related('tags'),
                id=validated['postId'],
                author=request.user,
                status__in=[Post.Status.DRAFT, Post.Status.REVISION],
            )
            existing_image_keys = {
                src for src in collect_post_image_sources(editable_post.content) if not src.startswith(('http://', 'https://', 'blob:'))
            }

        image_sources = set(collect_post_image_sources(validated['content']))
        known_sources = available_inline_keys | existing_image_keys
        unexpected_sources = [src for src in image_sources if src not in known_sources and not src.startswith(('http://', 'https://'))]
        if unexpected_sources:
            return error_response(
                'Post content contains unknown image keys.',
                status.HTTP_400_BAD_REQUEST,
                {'unknownImageKeys': unexpected_sources},
            )

        tags = list(BlogTag.objects.filter(id__in=validated.get('tagIds', [])))
        if len(tags) != len(set(validated.get('tagIds', []))):
            return error_response('Some blog tags do not exist anymore.', status.HTTP_400_BAD_REQUEST)

        target_status = validated['status']

        if editable_post:
            editable_post.title = validated['title']
            editable_post.content = validated['content']
            editable_post.age_rating = validated['ageRating']
            editable_post.status = target_status
            if draft.cover:
                editable_post.cover = draft.cover
            if target_status != Post.Status.PUBLISHED:
                editable_post.published_at = None
            editable_post.save(update_fields=['title', 'content', 'age_rating', 'status', 'cover', 'published_at', 'updated_at'])
            editable_post.tags.set(tags)
            post = editable_post
        else:
            post = Post.objects.create(
                title=validated['title'],
                content=validated['content'],
                cover=draft.cover,
                age_rating=validated['ageRating'],
                author=request.user,
                status=target_status,
                published_at=None,
            )
            post.tags.set(tags)

        draft.status = PostUploadDraft.Status.COMPLETED
        draft.save(update_fields=['status', 'updated_at'])

        return success_response(
            BlogPostCreateResponseSerializer(
                {
                    'id': post.id,
                    'title': post.title,
                    'coverUrl': build_public_media_url(post.cover),
                    'age_rating': post.age_rating,
                    'status': post.status,
                }
            ).data,
            status.HTTP_201_CREATED,
        )


class BlogCommentCreateView(BlogAccessMixin, APIView):
    @extend_schema(tags=['Blog'], request=BlogCommentCreateSerializer, responses={201: BlogCommentSerializer}, summary='Create comment for blog post')
    def post(self, request, post_id):
        access_error = self.ensure_authenticated(request.user)
        if access_error:
            return access_error

        post = get_object_or_404(Post, id=post_id, status=Post.Status.PUBLISHED)
        serializer = BlogCommentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reply_to = None
        if serializer.validated_data.get('replyToId'):
            reply_to = get_object_or_404(Comment, id=serializer.validated_data['replyToId'])
            post_content_type = ContentType.objects.get_for_model(Post)
            if reply_to.content_type_id != post_content_type.id or reply_to.object_id != post.id:
                return error_response('Reply target does not belong to this post.', status.HTTP_400_BAD_REQUEST)

        comment = Comment.objects.create(
            user=request.user,
            content_object=post,
            text=serializer.validated_data['text'],
            reply_to=reply_to,
        )

        if post.author_id != request.user.id:
            create_notification(
                user=post.author,
                message=f'{request.user.username} оставил комментарий к вашей статье «{post.title}».',
                notification_type=Notification.Type.INFO,
            )

        if reply_to and reply_to.user_id not in {request.user.id, post.author_id}:
            create_notification(
                user=reply_to.user,
                message=f'{request.user.username} ответил на ваш комментарий под статьёй «{post.title}».',
                notification_type=Notification.Type.INFO,
            )

        payload = {
            'id': comment.id,
            'text': comment.text,
            'created_at': comment.created_at,
            'reply_to_id': comment.reply_to_id,
            'user': build_post_author_payload(request.user),
        }
        return success_response(BlogCommentSerializer(payload).data, status.HTTP_201_CREATED)


