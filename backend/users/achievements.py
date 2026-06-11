from dataclasses import dataclass
from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from comics.models import Chapter, Comic
from interactions.models import ComicFavorite, Comment, Notification
from interactions.services import enqueue_notification
from users.models import UserAchievement, UserFinishedComic, UserReadChapter, UserReadingActivityDay, UserStats


@dataclass(frozen=True)
class AchievementDefinition:
    code: str
    title: str
    description: str
    stat_field: str
    target: int


ACHIEVEMENT_DEFINITIONS: tuple[AchievementDefinition, ...] = (
    AchievementDefinition('read_1_chapter', 'Первая глава', 'Прочитайте первую главу', 'chapters_read_count', 1),
    AchievementDefinition('read_10_chapters', 'Читатель', 'Прочитайте 10 глав', 'chapters_read_count', 10),
    AchievementDefinition(
        'read_100_chapters',
        'Постоянный читатель',
        'Прочитайте 100 глав',
        'chapters_read_count',
        100,
    ),
    AchievementDefinition(
        'read_500_chapters',
        'Коллекционер историй',
        'Прочитайте 500 глав',
        'chapters_read_count',
        500,
    ),
    AchievementDefinition(
        'start_10_comics',
        'Исследователь',
        'Начните читать 10 разных комиксов',
        'comics_started_count',
        10,
    ),
    AchievementDefinition(
        'finish_1_comic',
        'Первый финиш',
        'Полностью прочитайте один комикс',
        'comics_finished_count',
        1,
    ),
    AchievementDefinition(
        'finish_10_comics',
        'До последней главы',
        'Полностью прочитайте 10 комиксов',
        'comics_finished_count',
        10,
    ),
    AchievementDefinition(
        'favorite_10',
        'Своя коллекция',
        'Добавьте 10 комиксов в избранное',
        'favorite_comics_count',
        10,
    ),
    AchievementDefinition(
        'favorite_50',
        'Большая коллекция',
        'Добавьте 50 комиксов в избранное',
        'favorite_comics_count',
        50,
    ),
    AchievementDefinition(
        'comment_1',
        'Первый комментарий',
        'Оставьте первый комментарий',
        'comments_count',
        1,
    ),
    AchievementDefinition(
        'comment_50',
        'Участник сообщества',
        'Оставьте 50 комментариев',
        'comments_count',
        50,
    ),
    AchievementDefinition(
        'streak_7',
        '7 дней подряд',
        'Заходите и читайте 7 дней подряд',
        'reading_streak_days',
        7,
    ),
    AchievementDefinition(
        'streak_30',
        '30 дней подряд',
        'Заходите и читайте 30 дней подряд',
        'reading_streak_days',
        30,
    ),
    AchievementDefinition(
        'creator_first_comic',
        'Первая публикация',
        'Опубликуйте свой первый комикс',
        'published_comics_count',
        1,
    ),
    AchievementDefinition(
        'creator_10_chapters',
        'Автор',
        'Опубликуйте 10 глав',
        'published_chapters_count',
        10,
    ),
)

ACHIEVEMENT_DEFINITIONS_BY_CODE = {item.code: item for item in ACHIEVEMENT_DEFINITIONS}


def ensure_user_stats(user):
    stats, _ = UserStats.objects.get_or_create(user=user)
    return stats


def _schedule_achievement_notification(*, user, definition: AchievementDefinition):
    transaction.on_commit(
        lambda: enqueue_notification(
            user=user,
            message=f'Открыто достижение «{definition.title}».',
            notification_type=Notification.Type.SUCCESS,
            link='/achievements',
        )
    )


def award_achievements_for_user(user):
    stats = ensure_user_stats(user)
    new_achievements: list[UserAchievement] = []

    for definition in ACHIEVEMENT_DEFINITIONS:
        if getattr(stats, definition.stat_field, 0) < definition.target:
            continue

        achievement, created = UserAchievement.objects.get_or_create(
            user=user,
            code=definition.code,
            defaults={
                'title': definition.title,
                'description': definition.description,
            },
        )

        if not created:
            continue

        new_achievements.append(achievement)
        _schedule_achievement_notification(user=user, definition=definition)

    return new_achievements


def sync_favorite_stats(user):
    stats = ensure_user_stats(user)
    stats.favorite_comics_count = ComicFavorite.objects.filter(user=user).count()
    stats.save(update_fields=['favorite_comics_count', 'updated_at'])
    award_achievements_for_user(user)
    return stats


def sync_comment_stats(user):
    stats = ensure_user_stats(user)
    stats.comments_count = Comment.objects.filter(user=user).count()
    stats.save(update_fields=['comments_count', 'updated_at'])
    award_achievements_for_user(user)
    return stats


def sync_creator_stats(user):
    stats = ensure_user_stats(user)
    published_comics = Comic.objects.filter(author=user, status=Comic.Status.PUBLISHED)
    stats.published_comics_count = published_comics.count()
    stats.published_chapters_count = Chapter.objects.filter(
        comic__author=user,
        comic__status=Comic.Status.PUBLISHED,
    ).count()
    stats.save(update_fields=['published_comics_count', 'published_chapters_count', 'updated_at'])
    award_achievements_for_user(user)
    return stats


def register_reading_activity_day(user, *, activity_date=None):
    stats = ensure_user_stats(user)
    current_date = activity_date or timezone.localdate()
    _, created = UserReadingActivityDay.objects.get_or_create(
        user=user,
        activity_date=current_date,
    )

    if not created:
        return stats, False

    previous_date = current_date - timedelta(days=1)
    has_previous_day = UserReadingActivityDay.objects.filter(user=user, activity_date=previous_date).exists()
    if stats.last_reading_activity_date == current_date:
        return stats, True

    if has_previous_day:
        stats.reading_streak_days += 1
    else:
        stats.reading_streak_days = 1

    stats.longest_reading_streak_days = max(stats.longest_reading_streak_days, stats.reading_streak_days)
    stats.last_reading_activity_date = current_date
    stats.save(
        update_fields=[
            'reading_streak_days',
            'longest_reading_streak_days',
            'last_reading_activity_date',
            'updated_at',
        ]
    )
    return stats, True


@transaction.atomic
def register_chapter_read(user, chapter):
    comic = chapter.comic
    if comic.status != Comic.Status.PUBLISHED:
        return {
            'created': False,
            'finished_comic': False,
            'stats': ensure_user_stats(user),
        }

    stats = ensure_user_stats(user)
    had_started_comic = UserReadChapter.objects.filter(user=user, chapter__comic=comic).exists()
    read_link, created = UserReadChapter.objects.get_or_create(user=user, chapter=chapter)

    stats, _ = register_reading_activity_day(user)
    finished_comic = False

    if created:
        stats.chapters_read_count += 1
        if not had_started_comic:
            stats.comics_started_count += 1

        total_chapters = comic.chapters.count()
        read_chapters_for_comic = UserReadChapter.objects.filter(user=user, chapter__comic=comic).count()
        if total_chapters and read_chapters_for_comic >= total_chapters:
            _, finished_created = UserFinishedComic.objects.get_or_create(user=user, comic=comic)
            if finished_created:
                stats.comics_finished_count += 1
                finished_comic = True

        stats.save(
            update_fields=[
                'chapters_read_count',
                'comics_started_count',
                'comics_finished_count',
                'updated_at',
            ]
        )

    award_achievements_for_user(user)
    return {
        'created': created,
        'finished_comic': finished_comic,
        'stats': stats,
        'read_link': read_link,
    }


def build_achievement_progress_payload(user):
    stats = ensure_user_stats(user)
    awarded_map = {
        achievement.code: achievement
        for achievement in UserAchievement.objects.filter(user=user).order_by('-awarded_at', '-id')
    }

    return {
        'stats': {
            'chaptersReadCount': stats.chapters_read_count,
            'comicsStartedCount': stats.comics_started_count,
            'comicsFinishedCount': stats.comics_finished_count,
            'favoriteComicsCount': stats.favorite_comics_count,
            'commentsCount': stats.comments_count,
            'readingStreakDays': stats.reading_streak_days,
            'longestReadingStreakDays': stats.longest_reading_streak_days,
            'publishedComicsCount': stats.published_comics_count,
            'publishedChaptersCount': stats.published_chapters_count,
        },
        'achievements': [
            {
                'code': definition.code,
                'title': definition.title,
                'description': definition.description,
                'target': definition.target,
                'currentValue': getattr(stats, definition.stat_field, 0),
                'achieved': definition.code in awarded_map,
                'awardedAt': awarded_map[definition.code].awarded_at if definition.code in awarded_map else None,
            }
            for definition in ACHIEVEMENT_DEFINITIONS
        ],
    }
