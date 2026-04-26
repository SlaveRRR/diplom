from rest_framework import serializers


class NotificationSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    message = serializers.CharField()
    type = serializers.CharField()
    isRead = serializers.BooleanField()
    createdAt = serializers.DateTimeField(source='created_at')
    readAt = serializers.DateTimeField(source='read_at', allow_null=True)


class NotificationListSerializer(serializers.Serializer):
    unreadCount = serializers.IntegerField()
    items = NotificationSerializer(many=True)


class NotificationMarkReadRequestSerializer(serializers.Serializer):
    ids = serializers.ListField(child=serializers.IntegerField(min_value=1), allow_empty=False)


class NotificationMarkReadResponseSerializer(serializers.Serializer):
    updatedCount = serializers.IntegerField()
    unreadCount = serializers.IntegerField()


class ComicReadingHistoryItemSerializer(serializers.Serializer):
    comicId = serializers.IntegerField()
    title = serializers.CharField()
    cover = serializers.CharField(allow_blank=True)
    coverUrl = serializers.CharField(allow_blank=True)
    ageRating = serializers.CharField()
    chapterId = serializers.IntegerField(allow_null=True)
    chapterTitle = serializers.CharField(allow_blank=True, allow_null=True)
    lastPage = serializers.IntegerField()
    lastReadAt = serializers.DateTimeField()
    path = serializers.CharField()


class PostReadingHistoryItemSerializer(serializers.Serializer):
    postId = serializers.IntegerField()
    title = serializers.CharField()
    cover = serializers.CharField(allow_blank=True)
    coverUrl = serializers.CharField(allow_blank=True)
    excerpt = serializers.CharField(allow_blank=True)
    lastReadAt = serializers.DateTimeField()
    path = serializers.CharField()


class ReadingHistoryResponseSerializer(serializers.Serializer):
    comics = ComicReadingHistoryItemSerializer(many=True)
    posts = PostReadingHistoryItemSerializer(many=True)
