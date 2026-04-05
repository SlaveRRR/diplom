from datetime import timedelta
import uuid

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


def default_draft_expiration():
    return timezone.now() + timedelta(minutes=30)


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Tag(TimeStampedModel):
    name = models.CharField(max_length=64, unique=True)
    slug = models.SlugField(max_length=72, unique=True, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ('name',)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Genre(TimeStampedModel):
    name = models.CharField(max_length=64, unique=True)
    slug = models.SlugField(max_length=72, unique=True, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ('name',)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class UploadDraftStatus(models.TextChoices):
    PENDING = 'pending', 'Ожидает завершения'
    COMPLETED = 'completed', 'Завершён'
    EXPIRED = 'expired', 'Истёк'
    CANCELLED = 'cancelled', 'Отменён'


class Comic(TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Черновик'
        UNDER_REVIEW = 'under_review', 'На модерации'
        PUBLISHED = 'published', 'Опубликован'

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    cover = models.CharField(max_length=500, blank=True)
    banner = models.CharField(max_length=500, blank=True)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comics',
    )
    status = models.CharField(
        max_length=32,
        choices=Status.choices,
        default=Status.DRAFT,
    )
    genre = models.ForeignKey(
        Genre,
        on_delete=models.PROTECT,
        related_name='comics',
        null=True,
        blank=True,
    )
    tags = models.ManyToManyField(Tag, related_name='comics', blank=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return self.title


class ComicUploadDraft(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comic_upload_drafts',
    )
    title = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    genre_id = models.PositiveIntegerField(null=True, blank=True)
    tag_ids = models.JSONField(default=list, blank=True)
    scope_prefix = models.CharField(max_length=500, unique=True)
    cover = models.CharField(max_length=500, blank=True)
    banner = models.CharField(max_length=500, blank=True)
    status = models.CharField(
        max_length=20,
        choices=UploadDraftStatus.choices,
        default=UploadDraftStatus.PENDING,
    )
    expires_at = models.DateTimeField(default=default_draft_expiration)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'Comic draft {self.id}'


class Chapter(TimeStampedModel):
    comic = models.ForeignKey(Comic, on_delete=models.CASCADE, related_name='chapters')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    chapter_number = models.PositiveIntegerField()
    page_count = models.PositiveIntegerField(default=0)
    page_keys = models.JSONField(
        default=list,
        blank=True,
        help_text='Ordered list of S3 object keys for chapter pages.',
    )
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ('chapter_number', 'id')
        constraints = [
            models.UniqueConstraint(
                fields=('comic', 'chapter_number'),
                name='unique_chapter_number_per_comic',
            ),
        ]

    def __str__(self):
        return f'{self.comic.title} - Chapter {self.chapter_number}'


class ChapterUploadDraft(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chapter_upload_drafts',
    )
    comic = models.ForeignKey(
        Comic,
        on_delete=models.CASCADE,
        related_name='chapter_upload_drafts',
        null=True,
        blank=True,
    )
    comic_draft = models.ForeignKey(
        ComicUploadDraft,
        on_delete=models.CASCADE,
        related_name='chapter_upload_drafts',
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    chapter_number = models.PositiveIntegerField(null=True, blank=True)
    expected_page_count = models.PositiveIntegerField(default=0)
    scope_prefix = models.CharField(max_length=500, unique=True)
    page_keys = models.JSONField(
        default=list,
        blank=True,
        help_text='Ordered list of S3 object keys uploaded for chapter draft pages.',
    )
    status = models.CharField(
        max_length=20,
        choices=UploadDraftStatus.choices,
        default=UploadDraftStatus.PENDING,
    )
    expires_at = models.DateTimeField(default=default_draft_expiration)

    class Meta:
        ordering = ('-created_at',)
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(comic__isnull=False, comic_draft__isnull=True)
                    | models.Q(comic__isnull=True, comic_draft__isnull=False)
                ),
                name='chapter_upload_draft_has_single_parent',
            ),
        ]

    def __str__(self):
        return f'Chapter draft {self.id}'


class ComicComment(TimeStampedModel):
    comic = models.ForeignKey(Comic, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comic_comments',
    )
    text = models.TextField()
    reply_to = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        related_name='replies',
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ('created_at',)

    def __str__(self):
        return f'Comment #{self.pk} for {self.comic.title}'


class ComicRating(TimeStampedModel):
    comic = models.ForeignKey(Comic, on_delete=models.CASCADE, related_name='ratings')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comic_ratings',
    )
    value = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=('comic', 'user'),
                name='unique_comic_rating_per_user',
            ),
        ]

    def __str__(self):
        return f'{self.comic.title} - {self.value}/5'


class ComicStats(models.Model):
    comic = models.OneToOneField(Comic, on_delete=models.CASCADE, related_name='stats')
    views = models.PositiveIntegerField(default=0)
    unique_readers = models.PositiveIntegerField(default=0)
    favorites_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    avg_read_time = models.FloatField(default=0)

    def __str__(self):
        return f'Stats for {self.comic.title}'
