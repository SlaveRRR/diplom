from django.conf import settings
from django.db import models


class AnalyticsEvent(models.Model):
    class ContentKind(models.TextChoices):
        COMIC = 'comic', 'Комикс'
        POST = 'post', 'Пост'

    class EventType(models.TextChoices):
        VIEW = 'view', 'Просмотр'
        COMMENT = 'comment', 'Комментарий'
        LIKE = 'like', 'Лайк'
        FAVORITE = 'favorite', 'Избранное'
        PUBLICATION = 'publication', 'Публикация'

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='analytics_events',
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='performed_analytics_events',
        null=True,
        blank=True,
    )
    content_kind = models.CharField(max_length=16, choices=ContentKind.choices)
    object_id = models.PositiveIntegerField()
    title_snapshot = models.CharField(max_length=255, blank=True)
    event_type = models.CharField(max_length=16, choices=EventType.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'событие аналитики'
        verbose_name_plural = 'события аналитики'
        ordering = ('-created_at',)
        indexes = [
            models.Index(fields=('owner', 'created_at')),
            models.Index(fields=('owner', 'content_kind', 'object_id')),
            models.Index(fields=('owner', 'event_type', 'created_at')),
            models.Index(fields=('content_kind', 'object_id', 'event_type')),
        ]

    def __str__(self):
        return f'{self.content_kind}:{self.object_id} {self.event_type}'


class UniqueContentView(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='unique_content_views',
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='performed_unique_content_views',
        null=True,
        blank=True,
    )
    content_kind = models.CharField(max_length=16, choices=AnalyticsEvent.ContentKind.choices)
    object_id = models.PositiveIntegerField()
    viewer_key = models.CharField(max_length=128)
    title_snapshot = models.CharField(max_length=255, blank=True)
    first_viewed_at = models.DateTimeField(auto_now_add=True)
    last_viewed_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'уникальный просмотр контента'
        verbose_name_plural = 'уникальные просмотры контента'
        ordering = ('-last_viewed_at', '-first_viewed_at')
        constraints = [
            models.UniqueConstraint(
                fields=('content_kind', 'object_id', 'viewer_key'),
                name='unique_content_view_per_viewer',
            ),
        ]
        indexes = [
            models.Index(fields=('owner', 'content_kind', 'object_id'), name='uniq_view_owner_item_idx'),
            models.Index(fields=('owner', 'last_viewed_at'), name='uniq_view_owner_last_idx'),
            models.Index(fields=('content_kind', 'object_id', 'last_viewed_at'), name='uniq_view_item_last_idx'),
        ]

    def __str__(self):
        return f'{self.content_kind}:{self.object_id} {self.viewer_key}'
