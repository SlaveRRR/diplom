from calendar import month_name
from datetime import date

from django.db import transaction
from django.db.models import Count
from django.utils import timezone

from analytics.models import AnalyticsEvent
from blog.models import Post
from comics.models import Comic
from interactions.models import Comment, ComicFavorite, PostReadingHistory
from users.models import MonthlyRecap, UserAchievement, UserFinishedComic, UserReadChapter, UserReadingActivityDay


def resolve_recap_period(year: int | None = None, month: int | None = None):
    today = timezone.localdate()
    target_year = year or today.year
    target_month = month or today.month

    if target_month < 1 or target_month > 12:
        raise ValueError('Month must be between 1 and 12.')

    if target_year < 2000 or target_year > 3000:
        raise ValueError('Year is out of supported range.')

    period_start = date(target_year, target_month, 1)
    if target_month == 12:
        period_end = date(target_year + 1, 1, 1)
    else:
        period_end = date(target_year, target_month + 1, 1)

    return target_year, target_month, period_start, period_end


def _build_recap_title(year: int, month: int):
    return f'{month_name[month]} {year}'


def _build_top_comic(user, period_start, period_end):
    top_comic = (
        UserReadChapter.objects.filter(
            user=user,
            created_at__date__gte=period_start,
            created_at__date__lt=period_end,
            chapter__comic__status=Comic.Status.PUBLISHED,
        )
        .values('chapter__comic_id', 'chapter__comic__title', 'chapter__comic__genre__name')
        .annotate(chapters_read=Count('id'))
        .order_by('-chapters_read', 'chapter__comic__title')
        .first()
    )

    if not top_comic:
        return None

    return {
        'id': top_comic['chapter__comic_id'],
        'title': top_comic['chapter__comic__title'],
        'genre': top_comic['chapter__comic__genre__name'] or '',
        'chaptersRead': top_comic['chapters_read'],
    }


def _build_top_post(user, period_start, period_end):
    top_post = (
        PostReadingHistory.objects.filter(
            user=user,
            updated_at__date__gte=period_start,
            updated_at__date__lt=period_end,
            post__status=Post.Status.PUBLISHED,
        )
        .values('post_id', 'post__title')
        .annotate(reads=Count('id'))
        .order_by('-updated_at', '-reads')
        .first()
    )

    if not top_post:
        return None

    return {
        'id': top_post['post_id'],
        'title': top_post['post__title'],
        'reads': top_post['reads'],
    }


def _build_top_genres(user, period_start, period_end):
    rows = (
        UserReadChapter.objects.filter(
            user=user,
            created_at__date__gte=period_start,
            created_at__date__lt=period_end,
            chapter__comic__genre__isnull=False,
            chapter__comic__status=Comic.Status.PUBLISHED,
        )
        .values('chapter__comic__genre__name')
        .annotate(value=Count('id'))
        .order_by('-value', 'chapter__comic__genre__name')[:5]
    )

    return [{'name': row['chapter__comic__genre__name'], 'value': row['value']} for row in rows]


def _build_top_tags(user, period_start, period_end):
    rows = (
        UserReadChapter.objects.filter(
            user=user,
            created_at__date__gte=period_start,
            created_at__date__lt=period_end,
            chapter__comic__status=Comic.Status.PUBLISHED,
        )
        .values('chapter__comic__tags__name')
        .exclude(chapter__comic__tags__name__isnull=True)
        .annotate(value=Count('id'))
        .order_by('-value', 'chapter__comic__tags__name')[:6]
    )

    return [{'name': row['chapter__comic__tags__name'], 'value': row['value']} for row in rows]


def _build_achievements_unlocked(user, period_start, period_end):
    rows = (
        UserAchievement.objects.filter(
            user=user,
            awarded_at__date__gte=period_start,
            awarded_at__date__lt=period_end,
        )
        .order_by('-awarded_at')
        .values('code', 'title', 'awarded_at')
    )

    return [
        {
            'code': row['code'],
            'title': row['title'],
            'awardedAt': row['awarded_at'].isoformat(),
        }
        for row in rows
    ]


def _build_summary(user, period_start, period_end):
    chapters_read = UserReadChapter.objects.filter(
        user=user,
        created_at__date__gte=period_start,
        created_at__date__lt=period_end,
    )
    comments = Comment.objects.filter(
        user=user,
        created_at__date__gte=period_start,
        created_at__date__lt=period_end,
    )
    favorites = ComicFavorite.objects.filter(
        user=user,
        created_at__date__gte=period_start,
        created_at__date__lt=period_end,
    )
    finished = UserFinishedComic.objects.filter(
        user=user,
        created_at__date__gte=period_start,
        created_at__date__lt=period_end,
    )
    reading_days = UserReadingActivityDay.objects.filter(
        user=user,
        activity_date__gte=period_start,
        activity_date__lt=period_end,
    )
    publications = AnalyticsEvent.objects.filter(
        owner=user,
        event_type=AnalyticsEvent.EventType.PUBLICATION,
        created_at__date__gte=period_start,
        created_at__date__lt=period_end,
    )

    return {
        'chaptersRead': chapters_read.count(),
        'comicsStarted': chapters_read.values('chapter__comic_id').distinct().count(),
        'comicsFinished': finished.count(),
        'readingDays': reading_days.count(),
        'favoritesAdded': favorites.count(),
        'commentsWritten': comments.count(),
        'achievementsUnlocked': UserAchievement.objects.filter(
            user=user,
            awarded_at__date__gte=period_start,
            awarded_at__date__lt=period_end,
        ).count(),
        'publications': publications.count(),
    }


def build_monthly_recap_payload(user, year: int, month: int, period_start, period_end):
    return {
        'period': {
            'year': year,
            'month': month,
            'title': _build_recap_title(year, month),
            'isCurrentMonth': period_start.year == timezone.localdate().year and period_start.month == timezone.localdate().month,
        },
        'summary': _build_summary(user, period_start, period_end),
        'topComic': _build_top_comic(user, period_start, period_end),
        'topPost': _build_top_post(user, period_start, period_end),
        'topGenres': _build_top_genres(user, period_start, period_end),
        'topTags': _build_top_tags(user, period_start, period_end),
        'achievementsUnlocked': _build_achievements_unlocked(user, period_start, period_end),
    }


@transaction.atomic
def get_or_create_monthly_recap(user, year: int | None = None, month: int | None = None):
    target_year, target_month, period_start, period_end = resolve_recap_period(year, month)
    is_current_month = period_start.year == timezone.localdate().year and period_start.month == timezone.localdate().month

    recap = MonthlyRecap.objects.filter(user=user, year=target_year, month=target_month).first()

    if recap and recap.is_finalized and not is_current_month:
        return recap

    payload = build_monthly_recap_payload(user, target_year, target_month, period_start, period_end)

    if recap is None:
        recap = MonthlyRecap.objects.create(
            user=user,
            year=target_year,
            month=target_month,
            payload=payload,
            is_finalized=not is_current_month,
        )
        return recap

    recap.payload = payload
    recap.is_finalized = not is_current_month
    recap.save(update_fields=['payload', 'is_finalized', 'generated_at'])
    return recap
