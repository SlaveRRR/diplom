from django.contrib import admin

from analytics.models import AnalyticsEvent, UniqueContentView


class ReadOnlyAnalyticsAdminMixin:
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(AnalyticsEvent)
class AnalyticsEventAdmin(ReadOnlyAnalyticsAdminMixin, admin.ModelAdmin):
    list_display = (
        'id',
        'owner',
        'actor',
        'content_kind',
        'object_id',
        'event_type',
        'title_snapshot',
        'created_at',
    )
    list_filter = ('content_kind', 'event_type', 'created_at')
    search_fields = ('title_snapshot', 'owner__username', 'owner__email', 'actor__username', 'actor__email', 'object_id')
    list_select_related = ('owner', 'actor')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    readonly_fields = (
        'owner',
        'actor',
        'content_kind',
        'object_id',
        'title_snapshot',
        'event_type',
        'created_at',
    )


@admin.register(UniqueContentView)
class UniqueContentViewAdmin(ReadOnlyAnalyticsAdminMixin, admin.ModelAdmin):
    list_display = (
        'id',
        'owner',
        'actor',
        'content_kind',
        'object_id',
        'viewer_key',
        'title_snapshot',
        'first_viewed_at',
        'last_viewed_at',
    )
    list_filter = ('content_kind', 'first_viewed_at', 'last_viewed_at')
    search_fields = ('title_snapshot', 'viewer_key', 'owner__username', 'owner__email', 'actor__username', 'actor__email', 'object_id')
    list_select_related = ('owner', 'actor')
    date_hierarchy = 'last_viewed_at'
    ordering = ('-last_viewed_at', '-first_viewed_at')
    readonly_fields = (
        'owner',
        'actor',
        'content_kind',
        'object_id',
        'viewer_key',
        'title_snapshot',
        'first_viewed_at',
        'last_viewed_at',
    )
