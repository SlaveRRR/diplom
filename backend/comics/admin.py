from django.contrib import admin

from comics.models import (
    Chapter,
    ChapterUploadDraft,
    Comic,
    ComicComment,
    ComicRating,
    ComicStats,
    ComicUploadDraft,
    Genre,
    Tag,
)


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug', 'created_at')
    search_fields = ('name', 'slug')


@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug', 'created_at')
    search_fields = ('name', 'slug')


class ChapterInline(admin.TabularInline):
    model = Chapter
    extra = 0


@admin.register(Comic)
class ComicAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'author', 'status', 'published_at', 'created_at')
    list_filter = ('status', 'genre', 'tags')
    search_fields = ('title', 'description', 'author__username')
    autocomplete_fields = ('author',)
    inlines = [ChapterInline]


@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'comic', 'chapter_number', 'page_count', 'published_at')
    list_filter = ('published_at',)
    search_fields = ('title', 'comic__title')
    autocomplete_fields = ('comic',)


@admin.register(ComicComment)
class ComicCommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'comic', 'user', 'reply_to', 'created_at')
    search_fields = ('comic__title', 'user__username', 'text')
    autocomplete_fields = ('comic', 'user', 'reply_to')


@admin.register(ComicRating)
class ComicRatingAdmin(admin.ModelAdmin):
    list_display = ('id', 'comic', 'user', 'value', 'created_at')
    list_filter = ('value',)
    search_fields = ('comic__title', 'user__username')
    autocomplete_fields = ('comic', 'user')


@admin.register(ComicStats)
class ComicStatsAdmin(admin.ModelAdmin):
    list_display = ('id', 'comic', 'views', 'unique_readers', 'favorites_count', 'comments_count')
    autocomplete_fields = ('comic',)


@admin.register(ComicUploadDraft)
class ComicUploadDraftAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'expires_at', 'created_at')
    list_filter = ('status',)
    search_fields = ('scope_prefix', 'user__username', 'title')
    autocomplete_fields = ('user',)


@admin.register(ChapterUploadDraft)
class ChapterUploadDraftAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'comic', 'comic_draft', 'status', 'expected_page_count', 'expires_at')
    list_filter = ('status',)
    search_fields = ('scope_prefix', 'title', 'user__username')
    autocomplete_fields = ('user', 'comic', 'comic_draft')
