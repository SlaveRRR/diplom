from django.contrib.auth import get_user_model
from rest_framework import serializers

from blog.models import Post
from blog.services import build_plain_text_excerpt
from comics import services
from comics.models import Comic

User = get_user_model()


class UserUpdateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False)
    name = serializers.CharField(source='first_name', required=False, allow_blank=True)
    surname = serializers.CharField(source='last_name', required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'name', 'surname', 'role')
        read_only_fields = ('role',)


class CurrentUserSerializer(serializers.ModelSerializer):
    active = serializers.BooleanField(source='is_active', read_only=True)
    name = serializers.SerializerMethodField()
    surname = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    followersCount = serializers.SerializerMethodField()
    followingCount = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'is_staff',
            'is_active',
            'is_superuser',
            'active',
            'name',
            'surname',
            'avatar',
            'role',
            'followersCount',
            'followingCount',
        )

    def get_name(self, obj):
        return obj.first_name

    def get_surname(self, obj):
        return obj.last_name

    def get_avatar(self, obj):
        return services.build_public_media_url(obj.avatar)

    def get_followersCount(self, obj):
        return obj.follower_relationships.count()

    def get_followingCount(self, obj):
        return obj.following_relationships.count()


class ProfileComicSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    description = serializers.CharField(allow_blank=True)
    cover = serializers.CharField(allow_blank=True)
    coverUrl = serializers.CharField(allow_blank=True)
    ageRating = serializers.CharField()
    status = serializers.CharField()
    genre = serializers.CharField(allow_null=True)
    tags = serializers.ListField(child=serializers.CharField(), default=list)
    likesCount = serializers.IntegerField()
    commentsCount = serializers.IntegerField()
    readersCount = serializers.IntegerField()
    chaptersCount = serializers.IntegerField()
    updatedAt = serializers.DateTimeField()
    publishedAt = serializers.DateTimeField(allow_null=True)


class ProfilePostSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    excerpt = serializers.CharField(allow_blank=True)
    cover = serializers.CharField(allow_blank=True)
    coverUrl = serializers.CharField(allow_blank=True)
    ageRating = serializers.CharField()
    status = serializers.CharField()
    tags = serializers.ListField(child=serializers.CharField(), default=list)
    commentsCount = serializers.IntegerField()
    updatedAt = serializers.DateTimeField()
    publishedAt = serializers.DateTimeField(allow_null=True)


class UserProfileSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    avatar = serializers.CharField(allow_blank=True, allow_null=True)
    role = serializers.CharField()
    name = serializers.CharField(allow_blank=True)
    surname = serializers.CharField(allow_blank=True)
    followersCount = serializers.IntegerField()
    followingCount = serializers.IntegerField()
    isFollowing = serializers.BooleanField()
    isCurrentUser = serializers.BooleanField()
    comics = ProfileComicSerializer(many=True)


class UserAccountSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.EmailField()
    avatar = serializers.CharField(allow_blank=True, allow_null=True)
    role = serializers.CharField()
    name = serializers.CharField(allow_blank=True)
    surname = serializers.CharField(allow_blank=True)
    followersCount = serializers.IntegerField()
    followingCount = serializers.IntegerField()
    publicProfilePath = serializers.CharField()
    comics = ProfileComicSerializer(many=True)
    posts = ProfilePostSerializer(many=True)


class UserFollowToggleSerializer(serializers.Serializer):
    isActive = serializers.BooleanField()
    followersCount = serializers.IntegerField()


class AvatarUploadConfigRequestSerializer(serializers.Serializer):
    filename = serializers.CharField(max_length=255)
    content_type = serializers.CharField(max_length=255)


class AvatarUploadTargetSerializer(serializers.Serializer):
    method = serializers.CharField()
    key = serializers.CharField()
    upload_url = serializers.CharField()


class AvatarUploadConfigResponseSerializer(serializers.Serializer):
    avatarDraftId = serializers.IntegerField()
    expiresAt = serializers.DateTimeField()
    file = AvatarUploadTargetSerializer()


class AvatarUploadConfirmRequestSerializer(serializers.Serializer):
    avatarDraftId = serializers.IntegerField()


class AvatarUploadConfirmResponseSerializer(serializers.Serializer):
    avatar = serializers.CharField(allow_blank=True)


class UserProfileComicBuilder:
    @staticmethod
    def build(comic: Comic):
        readers_count = comic.stats.unique_readers if hasattr(comic, 'stats') else 0

        return {
            'id': comic.id,
            'title': comic.title,
            'description': comic.description,
            'cover': comic.cover,
            'coverUrl': services.build_public_media_url(comic.cover),
            'ageRating': comic.age_rating,
            'status': comic.status,
            'genre': comic.genre.name if comic.genre else None,
            'tags': [tag.name for tag in comic.tags.all()],
            'likesCount': getattr(comic, 'likes_total', 0),
            'commentsCount': getattr(comic, 'comments_total', 0),
            'readersCount': readers_count,
            'chaptersCount': getattr(comic, 'chapters_total', 0),
            'updatedAt': comic.updated_at,
            'publishedAt': comic.published_at,
        }


class UserProfilePostBuilder:
    @staticmethod
    def build(post: Post):
        return {
            'id': post.id,
            'title': post.title,
            'excerpt': build_plain_text_excerpt(post.content),
            'cover': post.cover,
            'coverUrl': services.build_public_media_url(post.cover),
            'ageRating': post.age_rating,
            'status': post.status,
            'tags': [tag.name for tag in post.tags.all()],
            'commentsCount': getattr(post, 'comments_total', 0),
            'updatedAt': post.updated_at,
            'publishedAt': post.published_at,
        }
