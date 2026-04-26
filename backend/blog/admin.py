from django.conf import settings
from django.contrib import admin
from django.utils.html import format_html

from blog.models import BlogTag, Post, PostUploadDraft


POST_STATUS_LABELS = {
    Post.Status.DRAFT: 'Черновик',
    Post.Status.UNDER_REVIEW: 'На модерации',
    Post.Status.PUBLISHED: 'Опубликован',
    Post.Status.BLOCKED: 'Заблокирован',
    Post.Status.REVISION: 'На доработке',
}


@admin.register(BlogTag)
class BlogTagAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug')
    search_fields = ('name', 'slug')


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'author', 'status_display', 'preview_link', 'published_at', 'updated_at')
    list_filter = ('status', 'tags')
    search_fields = ('title', 'author__username')
    list_select_related = ('author',)
    autocomplete_fields = ('author',)
    readonly_fields = ('preview_link',)
    filter_horizontal = ('tags',)

    @admin.display(description='Статус')
    def status_display(self, obj: Post):
        return POST_STATUS_LABELS.get(obj.status, obj.status)

    @admin.display(description='Preview')
    def preview_link(self, obj: Post):
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173').rstrip('/')
        preview_url = f'{frontend_url}/blog/{obj.id}?preview=true'

        return format_html(
            '<a href="{}" target="_blank" rel="noopener noreferrer">Открыть preview</a>',
            preview_url,
        )

    def formfield_for_choice_field(self, db_field, request, **kwargs):
        if db_field.name == 'status':
            kwargs['choices'] = [(value, label) for value, label in POST_STATUS_LABELS.items()]
        return super().formfield_for_choice_field(db_field, request, **kwargs)


@admin.register(PostUploadDraft)
class PostUploadDraftAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'expires_at', 'created_at')
    list_filter = ('status',)
    search_fields = ('user__username', 'cover')
    list_select_related = ('user',)
