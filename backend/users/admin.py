from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from users.achievements import award_achievements_for_user
from users.models import AvatarUploadDraft, User, UserAchievement, UserFollow, UserStats


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ('id', 'username', 'email', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active', 'is_superuser')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    fieldsets = DjangoUserAdmin.fieldsets + (
        ('Custom fields', {'fields': ('role', 'avatar', 'updated_at')}),
    )
    readonly_fields = ('updated_at',)


@admin.register(UserFollow)
class UserFollowAdmin(admin.ModelAdmin):
    list_display = ('id', 'follower', 'following', 'created_at')
    search_fields = ('follower__username', 'following__username')
    list_filter = ('created_at',)
    readonly_fields = ('created_at',)


@admin.register(UserAchievement)
class UserAchievementAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'code', 'title', 'awarded_at')
    search_fields = ('user__username', 'user__email', 'code', 'title')
    list_filter = ('code', 'awarded_at')
    readonly_fields = ('awarded_at',)
    autocomplete_fields = ('user',)


@admin.register(UserStats)
class UserStatsAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'chapters_read_count',
        'comics_started_count',
        'comics_finished_count',
        'favorite_comics_count',
        'comments_count',
        'reading_streak_days',
        'published_comics_count',
        'published_chapters_count',
    )
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('updated_at',)
    autocomplete_fields = ('user',)
    actions = ('award_achievements',)

    @admin.action(description='Выдать достижения по текущей статистике')
    def award_achievements(self, request, queryset):
        created_count = 0
        for stats in queryset.select_related('user'):
            created_count += len(award_achievements_for_user(stats.user))

        self.message_user(request, f'Выдано новых достижений: {created_count}.')


@admin.register(AvatarUploadDraft)
class AvatarUploadDraftAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'expires_at', 'created_at')
    search_fields = ('user__username', 'file_key')
    list_filter = ('status', 'created_at')
    readonly_fields = ('created_at', 'updated_at')
