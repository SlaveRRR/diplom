from rest_framework import serializers


class AnalyticsMetricSerializer(serializers.Serializer):
    value = serializers.FloatField()
    delta = serializers.FloatField()


class AnalyticsSummarySerializer(serializers.Serializer):
    views = AnalyticsMetricSerializer()
    reach = AnalyticsMetricSerializer()
    comments = AnalyticsMetricSerializer()
    likes = AnalyticsMetricSerializer()
    favorites = AnalyticsMetricSerializer()
    publications = AnalyticsMetricSerializer()
    engagement = AnalyticsMetricSerializer()
    engagementRate = AnalyticsMetricSerializer()


class AnalyticsTimelinePointSerializer(serializers.Serializer):
    period = serializers.CharField()
    views = serializers.IntegerField()
    reach = serializers.IntegerField()
    comments = serializers.IntegerField()
    likes = serializers.IntegerField()
    favorites = serializers.IntegerField()
    publications = serializers.IntegerField()
    engagement = serializers.IntegerField()


class AnalyticsTopItemSerializer(serializers.Serializer):
    contentType = serializers.CharField()
    objectId = serializers.IntegerField()
    title = serializers.CharField()
    views = serializers.IntegerField()
    reach = serializers.IntegerField()
    comments = serializers.IntegerField()
    likes = serializers.IntegerField()
    favorites = serializers.IntegerField()
    publications = serializers.IntegerField()
    engagement = serializers.IntegerField()


class AnalyticsFilterItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    contentType = serializers.CharField()
    status = serializers.CharField()


class AnalyticsResponseSerializer(serializers.Serializer):
    filters = serializers.DictField()
    summary = AnalyticsSummarySerializer()
    totalsByContentType = serializers.DictField()
    timeline = AnalyticsTimelinePointSerializer(many=True)
    topItems = AnalyticsTopItemSerializer(many=True)
    availableItems = AnalyticsFilterItemSerializer(many=True)
