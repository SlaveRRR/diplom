from rest_framework import serializers

from blog.serializers import BlogPostListItemSerializer
from comics.models import Chapter, Comic, ComicAgeRating


class UploadFileConfigRequestSerializer(serializers.Serializer):
    filename = serializers.CharField(max_length=255)
    content_type = serializers.CharField(max_length=255)


class UploadAssetRequestSerializer(serializers.Serializer):
    existingKey = serializers.CharField(required=False, allow_blank=False)
    filename = serializers.CharField(required=False, max_length=255)
    content_type = serializers.CharField(required=False, max_length=255)

    def validate(self, attrs):
        has_existing = bool(attrs.get('existingKey'))
        has_new_upload = bool(attrs.get('filename')) and bool(attrs.get('content_type'))

        if has_existing == has_new_upload:
            raise serializers.ValidationError('Exactly one upload source must be provided.')

        return attrs


class ChapterUploadConfigRequestSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, default='')
    chapter_number = serializers.IntegerField(min_value=1)
    pages = UploadAssetRequestSerializer(many=True, allow_empty=False)


class ComicUploadConfigRequestSerializer(serializers.Serializer):
    comicId = serializers.IntegerField(required=False, allow_null=True, min_value=1)
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, default='')
    ageRating = serializers.ChoiceField(choices=ComicAgeRating.choices)
    genreId = serializers.IntegerField(min_value=1)
    tagIds = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=True,
        default=list,
    )
    cover = UploadAssetRequestSerializer()
    banner = UploadAssetRequestSerializer()
    chapters = ChapterUploadConfigRequestSerializer(many=True, allow_empty=True, default=list)

    def validate_tagIds(self, value):
        if len(value) != len(set(value)):
            raise serializers.ValidationError('Tag ids must be unique.')
        return value

    def validate_chapters(self, value):
        chapter_numbers = [chapter['chapter_number'] for chapter in value]
        if len(chapter_numbers) != len(set(chapter_numbers)):
            raise serializers.ValidationError('Chapter numbers must be unique inside one upload config.')
        return value


class UploadTargetSerializer(serializers.Serializer):
    method = serializers.CharField()
    key = serializers.CharField()
    upload_url = serializers.CharField()


class ChapterPageUploadTargetSerializer(UploadTargetSerializer):
    page_index = serializers.IntegerField()


class ChapterUploadConfigResponseSerializer(serializers.Serializer):
    chapter_draft_id = serializers.UUIDField()
    title = serializers.CharField()
    chapter_number = serializers.IntegerField()
    pages = ChapterPageUploadTargetSerializer(many=True)


class ComicUploadConfigResponseSerializer(serializers.Serializer):
    comic_draft_id = serializers.UUIDField()
    expires_at = serializers.DateTimeField()
    cover = UploadTargetSerializer(allow_null=True)
    banner = UploadTargetSerializer(allow_null=True)
    chapters = ChapterUploadConfigResponseSerializer(many=True)


class ComicConfirmRequestSerializer(serializers.Serializer):
    comic_draft_id = serializers.UUIDField()
    comic_id = serializers.IntegerField(required=False, allow_null=True, min_value=1)
    submission_mode = serializers.ChoiceField(
        choices=(Comic.Status.DRAFT, Comic.Status.UNDER_REVIEW, Comic.Status.PUBLISHED),
        default=Comic.Status.UNDER_REVIEW,
    )


class ComicConfirmResponseSerializer(serializers.Serializer):
    comic_id = serializers.IntegerField(required=False)
    id = serializers.IntegerField()
    title = serializers.CharField()
    status = serializers.CharField()
    chapter_ids = serializers.ListField(child=serializers.IntegerField())


class ComicInteractionResponseSerializer(serializers.Serializer):
    isActive = serializers.BooleanField()
    count = serializers.IntegerField()


class ComicRatingRequestSerializer(serializers.Serializer):
    value = serializers.IntegerField(min_value=1, max_value=5)


class ComicRatingResponseSerializer(serializers.Serializer):
    value = serializers.IntegerField()
    averageRating = serializers.FloatField()
    ratingsCount = serializers.IntegerField()


class TaxonomyItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    slug = serializers.CharField()
    description = serializers.CharField()


class AgeRatingItemSerializer(serializers.Serializer):
    value = serializers.CharField()
    label = serializers.CharField()
    description = serializers.CharField()


class TaxonomyResponseSerializer(serializers.Serializer):
    ageRatings = AgeRatingItemSerializer(many=True)
    genres = TaxonomyItemSerializer(many=True)
    tags = TaxonomyItemSerializer(many=True)


class ChapterSerializer(serializers.ModelSerializer):
    likesCount = serializers.IntegerField(read_only=True)
    commentsCount = serializers.IntegerField(read_only=True)
    viewsCount = serializers.IntegerField(read_only=True)

    class Meta:
        model = Chapter
        fields = (
            'id',
            'title',
            'description',
            'chapter_number',
            'page_count',
            'page_keys',
            'likesCount',
            'commentsCount',
            'viewsCount',
        )


class ComicSerializer(serializers.ModelSerializer):
    chapters = ChapterSerializer(many=True, read_only=True)
    genreId = serializers.PrimaryKeyRelatedField(source='genre', read_only=True)
    tagIds = serializers.PrimaryKeyRelatedField(source='tags', many=True, read_only=True)
    ageRating = serializers.CharField(source='age_rating', read_only=True)

    class Meta:
        model = Comic
        fields = (
            'id',
            'title',
            'description',
            'cover',
            'banner',
            'status',
            'ageRating',
            'genreId',
            'tagIds',
            'chapters',
        )


class ComicAuthorSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    avatar = serializers.CharField(allow_null=True)
    role = serializers.CharField()


class ComicCommentSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    text = serializers.CharField()
    createdAt = serializers.DateTimeField(source='created_at')
    replyToId = serializers.IntegerField(source='reply_to_id', allow_null=True)
    author = ComicAuthorSerializer(source='user')


class ComicCommentCreateSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=5000)
    replyToId = serializers.IntegerField(required=False, allow_null=True)

    def validate_text(self, value):
        normalized = value.strip()
        if not normalized:
            raise serializers.ValidationError('Comment text must not be empty.')
        return normalized


class ContentReactionSummarySerializer(serializers.Serializer):
    emoji = serializers.CharField()
    count = serializers.IntegerField()
    isSelected = serializers.BooleanField()


class ContentReactionToggleSerializer(serializers.Serializer):
    emoji = serializers.CharField(max_length=32)


class ContentReactionResponseSerializer(serializers.Serializer):
    reactions = ContentReactionSummarySerializer(many=True)
    currentEmoji = serializers.CharField(allow_null=True, allow_blank=True, required=False)


class ComicContinueReadingSerializer(serializers.Serializer):
    chapterId = serializers.IntegerField(source='chapter_id')
    lastPage = serializers.IntegerField(source='last_page')


class ComicDetailChapterSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    description = serializers.CharField()
    chapterNumber = serializers.IntegerField(source='chapter_number')
    pageCount = serializers.IntegerField(source='page_count')
    pageKeys = serializers.ListField(source='page_keys', child=serializers.CharField())
    previewUrl = serializers.CharField()
    likesCount = serializers.IntegerField()
    commentsCount = serializers.IntegerField()
    viewsCount = serializers.IntegerField()
    publishedAt = serializers.DateTimeField(source='published_at', allow_null=True)


class ComicEditorPageSerializer(serializers.Serializer):
    key = serializers.CharField()
    url = serializers.CharField()


class ComicEditorChapterSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    description = serializers.CharField()
    chapterNumber = serializers.IntegerField(source='chapter_number')
    pages = ComicEditorPageSerializer(many=True)


class ComicEditorSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    description = serializers.CharField()
    cover = serializers.CharField(allow_blank=True)
    coverUrl = serializers.CharField(allow_blank=True)
    banner = serializers.CharField(allow_blank=True)
    bannerUrl = serializers.CharField(allow_blank=True)
    ageRating = serializers.CharField(source='age_rating')
    genreId = serializers.IntegerField(allow_null=True)
    tagIds = serializers.ListField(child=serializers.IntegerField(), default=list)
    status = serializers.CharField()
    chapters = ComicEditorChapterSerializer(many=True)


class ComicDetailSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    description = serializers.CharField()
    cover = serializers.CharField()
    coverUrl = serializers.CharField()
    banner = serializers.CharField()
    bannerUrl = serializers.CharField()
    status = serializers.CharField()
    ageRating = serializers.CharField(source='age_rating')
    genre = TaxonomyItemSerializer(allow_null=True)
    tags = TaxonomyItemSerializer(many=True)
    author = ComicAuthorSerializer()
    likesCount = serializers.IntegerField()
    isLiked = serializers.BooleanField()
    favoritesCount = serializers.IntegerField()
    isFavorite = serializers.BooleanField()
    averageRating = serializers.FloatField()
    ratingsCount = serializers.IntegerField()
    userRating = serializers.IntegerField(allow_null=True)
    commentsCount = serializers.IntegerField()
    reactions = ContentReactionSummarySerializer(many=True)
    currentEmoji = serializers.CharField(allow_null=True)
    readersCount = serializers.IntegerField()
    chaptersCount = serializers.IntegerField()
    chapters = ComicDetailChapterSerializer(many=True)
    comments = ComicCommentSerializer(many=True)
    continueReading = ComicContinueReadingSerializer(allow_null=True)


class ComicCatalogItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    description = serializers.CharField()
    cover = serializers.CharField()
    coverUrl = serializers.CharField()
    ageRating = serializers.CharField(source='age_rating')
    author = serializers.CharField()
    genreId = serializers.IntegerField(allow_null=True)
    genre = serializers.CharField(allow_null=True)
    tagIds = serializers.ListField(child=serializers.IntegerField())
    tags = serializers.ListField(child=serializers.CharField())
    rating = serializers.FloatField()
    reviews = serializers.IntegerField()
    likesCount = serializers.IntegerField()
    readersCount = serializers.IntegerField()
    status = serializers.CharField()
    isNew = serializers.BooleanField()
    isTrending = serializers.BooleanField()


class PaginationMetaSerializer(serializers.Serializer):
    page = serializers.IntegerField()
    pageSize = serializers.IntegerField()
    total = serializers.IntegerField()
    totalPages = serializers.IntegerField()


class ComicCatalogPageSerializer(serializers.Serializer):
    items = ComicCatalogItemSerializer(many=True)
    pagination = PaginationMetaSerializer()


class HomeTaxonomyTileItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    slug = serializers.CharField()
    description = serializers.CharField()


class HomeTaxonomyTileSerializer(serializers.Serializer):
    key = serializers.CharField()
    kind = serializers.ChoiceField(choices=('genre', 'tag'))
    href = serializers.CharField()
    height = serializers.IntegerField()
    accent = serializers.CharField()
    surface = serializers.CharField()
    item = HomeTaxonomyTileItemSerializer()


class HomeSelectionsSerializer(serializers.Serializer):
    heroComics = ComicCatalogItemSerializer(many=True)
    popularComics = ComicCatalogItemSerializer(many=True)
    freshComics = ComicCatalogItemSerializer(many=True)
    popularPosts = BlogPostListItemSerializer(many=True)
    freshPosts = BlogPostListItemSerializer(many=True)
    taxonomyTiles = HomeTaxonomyTileSerializer(many=True)


class ComicReaderPageSerializer(serializers.Serializer):
    index = serializers.IntegerField()
    key = serializers.CharField()
    url = serializers.CharField()


class ComicReaderChapterListItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    chapterNumber = serializers.IntegerField(source='chapter_number')


class ComicReaderChapterSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    chapterNumber = serializers.IntegerField(source='chapter_number')
    pageCount = serializers.IntegerField(source='page_count')
    pages = ComicReaderPageSerializer(many=True)


class ComicReaderNavigationSerializer(serializers.Serializer):
    previousChapterId = serializers.IntegerField(allow_null=True)
    nextChapterId = serializers.IntegerField(allow_null=True)


class ComicReaderSerializer(serializers.Serializer):
    comicId = serializers.IntegerField()
    comicTitle = serializers.CharField()
    chapter = ComicReaderChapterSerializer()
    chapters = ComicReaderChapterListItemSerializer(many=True)
    navigation = ComicReaderNavigationSerializer()
    likesCount = serializers.IntegerField()
    commentsCount = serializers.IntegerField()
    reactions = ContentReactionSummarySerializer(many=True)
    currentEmoji = serializers.CharField(allow_null=True)
    isLiked = serializers.BooleanField()
    favoritesCount = serializers.IntegerField()
    isFavorite = serializers.BooleanField()
    progress = ComicContinueReadingSerializer(allow_null=True)


class ComicReadingProgressUpdateSerializer(serializers.Serializer):
    lastPage = serializers.IntegerField(min_value=1)
