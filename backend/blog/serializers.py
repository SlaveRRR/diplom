from rest_framework import serializers

from comics import services as comic_services

from blog.models import BlogTag, Post


class UploadFileConfigRequestSerializer(serializers.Serializer):
    filename = serializers.CharField(max_length=255)
    content_type = serializers.CharField(max_length=255)


class InlineImageUploadRequestSerializer(serializers.Serializer):
    uploadId = serializers.CharField(max_length=120)
    filename = serializers.CharField(max_length=255)
    content_type = serializers.CharField(max_length=255)


class PostUploadConfigRequestSerializer(serializers.Serializer):
    cover = UploadFileConfigRequestSerializer(required=False, allow_null=True)
    inlineImages = InlineImageUploadRequestSerializer(many=True, allow_empty=True, default=list)

    def validate_inlineImages(self, value):
        upload_ids = [item['uploadId'] for item in value]
        if len(upload_ids) != len(set(upload_ids)):
            raise serializers.ValidationError('Inline image upload ids must be unique.')
        return value


class UploadTargetSerializer(serializers.Serializer):
    method = serializers.CharField()
    key = serializers.CharField()
    upload_url = serializers.CharField()


class InlineImageUploadTargetSerializer(UploadTargetSerializer):
    uploadId = serializers.CharField()


class PostUploadConfigResponseSerializer(serializers.Serializer):
    postDraftId = serializers.IntegerField()
    expiresAt = serializers.DateTimeField()
    cover = UploadTargetSerializer(allow_null=True)
    inlineImages = InlineImageUploadTargetSerializer(many=True)


class PostConfirmRequestSerializer(serializers.Serializer):
    postId = serializers.IntegerField(required=False, allow_null=True)
    postDraftId = serializers.IntegerField()
    title = serializers.CharField(max_length=255)
    content = serializers.JSONField()
    status = serializers.ChoiceField(choices=[Post.Status.DRAFT, Post.Status.UNDER_REVIEW])
    tagIds = serializers.ListField(child=serializers.IntegerField(min_value=1), allow_empty=True, default=list)

    def validate_tagIds(self, value):
        if len(value) != len(set(value)):
            raise serializers.ValidationError('Tag ids must be unique.')
        return value


class BlogTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogTag
        fields = ('id', 'name', 'slug', 'description')


class BlogAuthorSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    avatar = serializers.CharField(allow_blank=True, allow_null=True)
    role = serializers.CharField()


class BlogCommentSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    text = serializers.CharField()
    createdAt = serializers.DateTimeField(source='created_at')
    replyToId = serializers.IntegerField(source='reply_to_id', allow_null=True)
    author = BlogAuthorSerializer(source='user')


class BlogCommentCreateSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=5000)
    replyToId = serializers.IntegerField(required=False, allow_null=True)

    def validate_text(self, value):
        normalized = value.strip()
        if not normalized:
            raise serializers.ValidationError('Comment text must not be empty.')
        return normalized


class BlogPostListItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    excerpt = serializers.CharField(allow_blank=True)
    cover = serializers.CharField(allow_blank=True)
    coverUrl = serializers.CharField(allow_blank=True)
    tags = BlogTagSerializer(many=True)
    author = BlogAuthorSerializer()
    commentsCount = serializers.IntegerField()
    publishedAt = serializers.DateTimeField(source='published_at', allow_null=True)


class BlogPostDetailSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    content = serializers.JSONField()
    cover = serializers.CharField(allow_blank=True)
    coverUrl = serializers.CharField(allow_blank=True)
    tags = BlogTagSerializer(many=True)
    author = BlogAuthorSerializer()
    comments = BlogCommentSerializer(many=True)
    commentsCount = serializers.IntegerField()
    publishedAt = serializers.DateTimeField(source='published_at', allow_null=True)


class BlogPostEditorSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    content = serializers.JSONField()
    cover = serializers.CharField(allow_blank=True)
    coverUrl = serializers.CharField(allow_blank=True)
    tagIds = serializers.ListField(child=serializers.IntegerField(), default=list)
    status = serializers.CharField()


class BlogPostCreateResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    coverUrl = serializers.CharField(allow_blank=True)
    status = serializers.CharField()


def build_post_author_payload(user):
    return {
        'id': user.id,
        'username': user.username,
        'avatar': comic_services.build_public_media_url(user.avatar),
        'role': user.role,
    }


def build_post_tags_payload(post):
    return [
        {
            'id': tag.id,
            'name': tag.name,
            'slug': tag.slug,
            'description': tag.description,
        }
        for tag in post.tags.all()
    ]


def build_post_comments_payload(post):
    return [
        {
            'id': comment.id,
            'text': comment.text,
            'created_at': comment.created_at,
            'reply_to_id': comment.reply_to_id,
            'user': build_post_author_payload(comment.user),
        }
        for comment in post.comments.select_related('user').order_by('-created_at')
    ]


def build_post_list_payload(post, excerpt):
    return {
        'id': post.id,
        'title': post.title,
        'excerpt': excerpt,
        'cover': post.cover,
        'coverUrl': comic_services.build_public_media_url(post.cover),
        'tags': build_post_tags_payload(post),
        'author': build_post_author_payload(post.author),
        'commentsCount': getattr(post, 'comments_total', 0),
        'published_at': post.published_at,
    }


def build_post_detail_payload(post, resolved_content):
    comments = build_post_comments_payload(post)
    return {
        'id': post.id,
        'title': post.title,
        'content': resolved_content,
        'cover': post.cover,
        'coverUrl': comic_services.build_public_media_url(post.cover),
        'tags': build_post_tags_payload(post),
        'author': build_post_author_payload(post.author),
        'comments': comments,
        'commentsCount': len(comments),
        'published_at': post.published_at,
    }


def build_post_editor_payload(post, resolved_content):
    return {
        'id': post.id,
        'title': post.title,
        'content': resolved_content,
        'cover': post.cover,
        'coverUrl': comic_services.build_public_media_url(post.cover),
        'tagIds': [tag.id for tag in post.tags.all()],
        'status': post.status,
    }
