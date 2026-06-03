from datetime import timedelta

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


def default_avatar_upload_expiration():
    return timezone.now() + timedelta(minutes=30)


class User(AbstractUser):
    class Role(models.TextChoices):
        READER = 'reader', 'Читатель'
        AUTHOR = 'author', 'Автор'
        ADMIN = 'admin', 'Администратор'

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.READER)
    avatar = models.CharField(max_length=512, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    REQUIRED_FIELDS = ['email']

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = self.Role.ADMIN
        self.is_staff = self.role == self.Role.ADMIN or self.is_superuser
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username


class UserFollow(models.Model):
    follower = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='following_relationships',
    )
    following = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='follower_relationships',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at',)
        constraints = [
            models.UniqueConstraint(
                fields=('follower', 'following'),
                name='unique_user_follow_relationship',
            ),
            models.CheckConstraint(
                check=~models.Q(follower=models.F('following')),
                name='prevent_self_follow',
            ),
        ]

    def __str__(self):
        return f'{self.follower.username} follows {self.following.username}'


class UserStats(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='stats',
    )
    chapters_read_count = models.PositiveIntegerField(default=0)
    comics_started_count = models.PositiveIntegerField(default=0)
    comics_finished_count = models.PositiveIntegerField(default=0)
    favorite_comics_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    reading_streak_days = models.PositiveIntegerField(default=0)
    longest_reading_streak_days = models.PositiveIntegerField(default=0)
    published_comics_count = models.PositiveIntegerField(default=0)
    published_chapters_count = models.PositiveIntegerField(default=0)
    last_reading_activity_date = models.DateField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Stats for {self.user.username}'


class UserAchievement(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='achievements',
    )
    code = models.CharField(max_length=64)
    title = models.CharField(max_length=255)
    description = models.CharField(max_length=255)
    awarded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-awarded_at', '-id')
        constraints = [
            models.UniqueConstraint(
                fields=('user', 'code'),
                name='unique_achievement_per_user',
            ),
        ]

    def __str__(self):
        return f'{self.user.username}: {self.code}'


class UserReadChapter(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='read_chapters',
    )
    chapter = models.ForeignKey(
        'comics.Chapter',
        on_delete=models.CASCADE,
        related_name='reader_links',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at',)
        constraints = [
            models.UniqueConstraint(
                fields=('user', 'chapter'),
                name='unique_read_chapter_per_user',
            ),
        ]

    def __str__(self):
        return f'{self.user.username} read chapter {self.chapter_id}'


class UserFinishedComic(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='finished_comics',
    )
    comic = models.ForeignKey(
        'comics.Comic',
        on_delete=models.CASCADE,
        related_name='finished_by_users',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at',)
        constraints = [
            models.UniqueConstraint(
                fields=('user', 'comic'),
                name='unique_finished_comic_per_user',
            ),
        ]

    def __str__(self):
        return f'{self.user.username} finished {self.comic_id}'


class UserReadingActivityDay(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reading_activity_days',
    )
    activity_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-activity_date', '-id')
        constraints = [
            models.UniqueConstraint(
                fields=('user', 'activity_date'),
                name='unique_reading_activity_day_per_user',
            ),
        ]

    def __str__(self):
        return f'{self.user.username} active on {self.activity_date}'


class MonthlyRecap(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='monthly_recaps',
    )
    year = models.PositiveIntegerField()
    month = models.PositiveSmallIntegerField()
    payload = models.JSONField(default=dict)
    is_finalized = models.BooleanField(default=False)
    generated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('-year', '-month', '-generated_at')
        constraints = [
            models.UniqueConstraint(
                fields=('user', 'year', 'month'),
                name='unique_monthly_recap_per_user',
            ),
        ]

    def __str__(self):
        return f'Recap {self.year}-{self.month:02d} for {self.user.username}'


class AvatarUploadDraft(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        CONFIRMED = 'confirmed', 'Confirmed'
        EXPIRED = 'expired', 'Expired'

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='avatar_upload_drafts',
    )
    file_key = models.CharField(max_length=512, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    expires_at = models.DateTimeField(default=default_avatar_upload_expiration)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'Avatar draft #{self.id} for {self.user.username}'
