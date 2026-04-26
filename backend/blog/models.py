from django.conf import settings
from django.contrib.contenttypes.fields import GenericRelation
from django.db import models
from django.utils import timezone
from django.utils.text import slugify

from comics.models import ComicAgeRating


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class BlogTag(TimeStampedModel):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    description = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ('name',)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Post(TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        UNDER_REVIEW = 'under_review', 'Under review'
        PUBLISHED = 'published', 'Published'
        BLOCKED = 'blocked', 'Blocked'
        REVISION = 'revision', 'Revision'

    title = models.CharField(max_length=255)
    content = models.JSONField(default=dict)
    cover = models.CharField(max_length=500, blank=True)
    age_rating = models.CharField(max_length=4, choices=ComicAgeRating.choices, default=ComicAgeRating.AGE_16)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posts')
    tags = models.ManyToManyField(BlogTag, related_name='posts', blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    published_at = models.DateTimeField(null=True, blank=True)
    comments = GenericRelation('interactions.Comment', related_query_name='post')

    class Meta:
        ordering = ('-updated_at', '-created_at')

    def save(self, *args, **kwargs):
        if self.status == self.Status.PUBLISHED and self.published_at is None:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class PostUploadDraft(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        COMPLETED = 'completed', 'Completed'
        EXPIRED = 'expired', 'Expired'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='post_upload_drafts')
    cover = models.CharField(max_length=500, blank=True)
    inline_images = models.JSONField(default=list, blank=True)
    expires_at = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'Post upload draft #{self.id}'
