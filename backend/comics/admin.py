from django.conf import settings
from django.contrib import admin
from django import forms
from django.utils.html import format_html

from comics.models import (
    Chapter,
    ChapterUploadDraft,
    Comic,
    ComicRating,
    ComicStats,
    ComicUploadDraft,
    Genre,
    Tag,
)
from core.admin_utils import ModerationAdminMixin


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


class ComicAdminForm(forms.ModelForm):
    class Meta:
        model = Comic
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._initial_status = getattr(self.instance, 'status', None)

    def clean(self):
        cleaned_data = super().clean()
        next_status = cleaned_data.get('status')
        moderation_message = (cleaned_data.get('moderation_message') or '').strip()

        if self.instance.pk and next_status != self._initial_status and next_status in {'revision', 'blocked'} and not moderation_message:
            self.add_error('moderation_message', 'Для этого статуса нужен комментарий модератора.')

        return cleaned_data


@admin.register(Comic)
class ComicAdmin(ModerationAdminMixin):
    form = ComicAdminForm
    moderation_item_label = 'комикс'
    list_display = ('id', 'title', 'author', 'status', 'is_hidden', 'preview_link', 'published_at', 'created_at')
    list_filter = ('status', 'is_hidden', 'genre', 'tags')
    search_fields = ('title', 'description', 'author__username')
    autocomplete_fields = ('author',)
    readonly_fields = ('preview_link',)
    inlines = [ChapterInline]

    @admin.display(description='Preview')
    def preview_link(self, obj: Comic):
        first_chapter = obj.chapters.order_by('chapter_number', 'id').first()

        if not first_chapter:
            return 'Нет глав для preview'

        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173').rstrip('/')
        preview_url = f'{frontend_url}/comics/{obj.id}/chapters/{first_chapter.id}?preview=true'

        return format_html(
            '<a href="{}" target="_blank" rel="noopener noreferrer">Открыть preview</a>',
            preview_url,
        )

    def get_moderation_link_path(self, obj):
        first_chapter = obj.chapters.order_by('chapter_number', 'id').first()
        if obj.status == Comic.Status.PUBLISHED:
            return f'/comics/{obj.id}'
        if first_chapter:
            return f'/comics/{obj.id}/chapters/{first_chapter.id}?preview=true'
        return f'/comics/{obj.id}'

    def after_publish(self, obj):
        obj.chapters.filter(published_at__isnull=True).update(published_at=obj.published_at)


@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'comic', 'chapter_number', 'page_count', 'published_at')
    list_filter = ('published_at',)
    search_fields = ('title', 'comic__title')
    autocomplete_fields = ('comic',)


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
