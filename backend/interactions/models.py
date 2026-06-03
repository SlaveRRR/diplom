from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db import models


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Comment(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comments',
    )
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        related_name='comments',
    )
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    text = models.TextField()
    reply_to = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        related_name='replies',
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ('-created_at',)
        indexes = [
            models.Index(fields=('content_type', 'object_id', 'created_at'), name='comment_target_created_idx'),
        ]

    def clean(self):
        if self.reply_to and (
            self.reply_to.content_type_id != self.content_type_id or self.reply_to.object_id != self.object_id
        ):
            raise ValidationError('Reply comment must belong to the same object.')

    def __str__(self):
        return f'Comment #{self.pk}'


class ContentReaction(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='content_reactions',
    )
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        related_name='reactions',
    )
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    emoji = models.CharField(max_length=32)

    class Meta:
        indexes = [
            models.Index(fields=('content_type', 'object_id', 'emoji'), name='reaction_target_emoji_idx'),
            models.Index(fields=('user', 'created_at'), name='reaction_user_created_idx'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=('user', 'content_type', 'object_id'),
                name='unique_reaction_per_user_and_object',
            ),
        ]

    def __str__(self):
        return f'{self.user} reacted {self.emoji}'


class ComicFavorite(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='favorite_comics',
    )
    comic = models.ForeignKey(
        'comics.Comic',
        on_delete=models.CASCADE,
        related_name='favorites',
    )

    class Meta:
        indexes = [
            models.Index(fields=('user', 'created_at'), name='fav_user_created_idx'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=('user', 'comic'),
                name='unique_favorite_comic_per_user',
            ),
        ]

    def __str__(self):
        return f'{self.user} favorites {self.comic}'


class ComicLike(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='liked_comics',
    )
    comic = models.ForeignKey(
        'comics.Comic',
        on_delete=models.CASCADE,
        related_name='likes',
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=('user', 'comic'),
                name='unique_like_comic_per_user',
            ),
        ]

    def __str__(self):
        return f'{self.user} likes {self.comic}'


class Notification(TimeStampedModel):
    class Type(models.TextChoices):
        INFO = 'info', 'Info'
        SUCCESS = 'success', 'Success'
        WARNING = 'warning', 'Warning'
        ERROR = 'error', 'Error'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    message = models.CharField(max_length=255)
    link = models.CharField(max_length=500, blank=True)
    type = models.CharField(max_length=16, choices=Type.choices, default=Type.INFO)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ('read_at', '-created_at')
        indexes = [
            models.Index(fields=('user', 'read_at', 'created_at'), name='notif_user_read_idx'),
        ]

    def __str__(self):
        return f'Notification #{self.pk} for {self.user}'


class PostReadingHistory(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='post_reading_history',
    )
    post = models.ForeignKey(
        'blog.Post',
        on_delete=models.CASCADE,
        related_name='reading_history',
    )

    class Meta:
        ordering = ('-updated_at', '-created_at')
        indexes = [
            models.Index(fields=('user', 'updated_at', 'created_at'), name='post_hist_user_idx'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=('user', 'post'),
                name='unique_post_reading_history_per_user',
            ),
        ]

    def __str__(self):
        return f'{self.user} read {self.post}'
