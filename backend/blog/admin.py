from django.conf import settings
from django.contrib import admin
from django import forms
from django.utils.html import format_html

from blog.models import BlogTag, Post, PostUploadDraft
from core.admin_utils import MODERATION_STATUS_LABELS, ModerationAdminMixin


@admin.register(BlogTag)
class BlogTagAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug')
    search_fields = ('name', 'slug')


class PostAdminForm(forms.ModelForm):
    class Meta:
        model = Post
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


@admin.register(Post)
class PostAdmin(ModerationAdminMixin):
    form = PostAdminForm
    moderation_item_label = 'пост'
    moderation_status_labels = MODERATION_STATUS_LABELS
    list_display = ('id', 'title', 'author', 'status_display', 'is_hidden', 'preview_link', 'published_at', 'updated_at')
    list_filter = ('status', 'is_hidden', 'tags')
    search_fields = ('title', 'author__username')
    list_select_related = ('author',)
    autocomplete_fields = ('author',)
    readonly_fields = ('preview_link',)
    filter_horizontal = ('tags',)

    @admin.display(description='Статус')
    def status_display(self, obj: Post):
        return MODERATION_STATUS_LABELS.get(obj.status, obj.status)

    @admin.display(description='Preview')
    def preview_link(self, obj: Post):
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173').rstrip('/')
        preview_url = f'{frontend_url}/blog/{obj.id}?preview=true'

        return format_html(
            '<a href="{}" target="_blank" rel="noopener noreferrer">Открыть preview</a>',
            preview_url,
        )

    def get_moderation_link_path(self, obj):
        if obj.status == Post.Status.PUBLISHED:
            return f'/blog/{obj.id}'
        return f'/blog/{obj.id}/edit'


@admin.register(PostUploadDraft)
class PostUploadDraftAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'expires_at', 'created_at')
    list_filter = ('status',)
    search_fields = ('user__username', 'cover')
    list_select_related = ('user',)
