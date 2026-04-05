from rest_framework import serializers

from comics.models import Chapter, ChapterUploadDraft, Comic, ComicUploadDraft, Genre, Tag


class UploadFileConfigRequestSerializer(serializers.Serializer):
    filename = serializers.CharField(max_length=255)
    content_type = serializers.CharField(max_length=255)


class ChapterUploadConfigRequestSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, default='')
    chapter_number = serializers.IntegerField(min_value=1)
    pages = UploadFileConfigRequestSerializer(many=True, allow_empty=False)


class ComicUploadConfigRequestSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, default='')
    genreId = serializers.IntegerField(min_value=1)
    tagIds = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=True,
        default=list,
    )
    cover = UploadFileConfigRequestSerializer()
    banner = UploadFileConfigRequestSerializer()
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


class ChapterUploadConfigResponseSerializer(serializers.Serializer):
    chapter_draft_id = serializers.UUIDField()
    title = serializers.CharField()
    chapter_number = serializers.IntegerField()
    pages = UploadTargetSerializer(many=True)


class ComicUploadConfigResponseSerializer(serializers.Serializer):
    comic_draft_id = serializers.UUIDField()
    expires_at = serializers.DateTimeField()
    cover = UploadTargetSerializer()
    banner = UploadTargetSerializer()
    chapters = ChapterUploadConfigResponseSerializer(many=True)


class ComicConfirmRequestSerializer(serializers.Serializer):
    comic_draft_id = serializers.UUIDField()


class ComicConfirmResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    status = serializers.CharField()
    chapter_ids = serializers.ListField(child=serializers.IntegerField())


class TaxonomyItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    slug = serializers.CharField()
    description = serializers.CharField()


class TaxonomyResponseSerializer(serializers.Serializer):
    genres = TaxonomyItemSerializer(many=True)
    tags = TaxonomyItemSerializer(many=True)


class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = ('id', 'title', 'description', 'chapter_number', 'page_count', 'page_keys')


class ComicSerializer(serializers.ModelSerializer):
    chapters = ChapterSerializer(many=True, read_only=True)
    genreId = serializers.PrimaryKeyRelatedField(source='genre', read_only=True)
    tagIds = serializers.PrimaryKeyRelatedField(source='tags', many=True, read_only=True)

    class Meta:
        model = Comic
        fields = (
            'id',
            'title',
            'description',
            'cover',
            'banner',
            'status',
            'genreId',
            'tagIds',
            'chapters',
        )
