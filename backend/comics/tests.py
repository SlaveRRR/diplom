import json
from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from comics import services
from comics.models import (
    Chapter,
    ChapterUploadDraft,
    Comic,
    ComicAgeRating,
    ComicReadingProgress,
    ComicRating,
    ComicStats,
    ComicUploadDraft,
    Genre,
    Tag,
    UploadDraftStatus,
)
from interactions.models import Comment, ComicFavorite, ComicLike

User = get_user_model()


class ComicsModelsTests(TestCase):
    def setUp(self):
        self.author = User.objects.create_user(
            username='author1',
            email='author1@example.com',
            password='strongpass123',
            role=User.Role.AUTHOR,
        )
        self.reader = User.objects.create_user(
            username='reader1',
            email='reader1@example.com',
            password='strongpass123',
            role=User.Role.READER,
        )

    def test_comic_can_have_genre_tags_and_chapters(self):
        fantasy_genre = Genre.objects.create(name='Фэнтези')
        fantasy = Tag.objects.create(name='Фэнтези')
        drama = Tag.objects.create(name='Драма')
        comic = Comic.objects.create(
            title='Лунная Башня',
            description='История про магов и древние кланы.',
            author=self.author,
            status=Comic.Status.DRAFT,
            cover='comics/lunnaya-bashnya/cover.webp',
            banner='comics/lunnaya-bashnya/banner.webp',
            age_rating=ComicAgeRating.AGE_12,
        )
        comic.genre = fantasy_genre
        comic.save(update_fields=['genre'])
        comic.tags.set([fantasy, drama])

        first_chapter = Chapter.objects.create(
            comic=comic,
            title='Пролог',
            chapter_number=1,
            page_count=12,
            page_keys=[
                'comics/lunnaya-bashnya/chapter-1/page-1.webp',
                'comics/lunnaya-bashnya/chapter-1/page-2.webp',
            ],
        )
        second_chapter = Chapter.objects.create(
            comic=comic,
            title='Пробуждение',
            chapter_number=2,
            page_count=18,
            page_keys=['comics/lunnaya-bashnya/chapter-2/page-1.webp'],
        )

        self.assertEqual(comic.genre, fantasy_genre)
        self.assertEqual(comic.age_rating, ComicAgeRating.AGE_12)
        self.assertEqual(comic.tags.count(), 2)
        self.assertEqual(comic.chapters.count(), 2)
        self.assertEqual(comic.chapters.first(), first_chapter)
        self.assertEqual(comic.chapters.last(), second_chapter)

    def test_comic_rating_is_limited_from_one_to_five(self):
        comic = Comic.objects.create(title='Северный Свет', author=self.author)
        rating = ComicRating(comic=comic, user=self.reader, value=6)

        with self.assertRaises(ValidationError):
            rating.full_clean()

    def test_user_can_leave_only_one_rating_per_comic(self):
        comic = Comic.objects.create(title='Архив Штормов', author=self.author)
        ComicRating.objects.create(comic=comic, user=self.reader, value=5)

        with self.assertRaises(IntegrityError):
            ComicRating.objects.create(comic=comic, user=self.reader, value=4)

    def test_comments_support_replies(self):
        comic = Comic.objects.create(title='Черта Города', author=self.author)
        comment = Comment.objects.create(
            content_object=comic,
            user=self.reader,
            text='Очень сильная атмосфера.',
        )
        reply = Comment.objects.create(
            content_object=comic,
            user=self.author,
            text='Спасибо за отзыв!',
            reply_to=comment,
        )

        self.assertEqual(comment.replies.count(), 1)
        self.assertEqual(comment.replies.first(), reply)

    def test_comic_can_have_stats(self):
        comic = Comic.objects.create(title='Пыльный Берег', author=self.author)
        stats = ComicStats.objects.create(comic=comic, views=128, unique_readers=54)

        self.assertEqual(comic.stats, stats)
        self.assertEqual(stats.views, 128)

    def test_user_can_have_single_reading_progress_per_comic(self):
        comic = Comic.objects.create(title='Пыльный Берег', author=self.author)
        chapter = Chapter.objects.create(comic=comic, title='Пролог', chapter_number=1, page_count=3)
        ComicReadingProgress.objects.create(user=self.reader, comic=comic, chapter=chapter, last_page=2)

        with self.assertRaises(IntegrityError):
            ComicReadingProgress.objects.create(user=self.reader, comic=comic, chapter=chapter, last_page=3)

    def test_comic_upload_draft_keeps_scope_and_media_keys(self):
        draft = ComicUploadDraft.objects.create(
            user=self.author,
            title='Лунная Башня',
            scope_prefix='drafts/author1/comic-1/',
            cover='drafts/author1/comic-1/cover.webp',
            banner='drafts/author1/comic-1/banner.webp',
            expires_at=timezone.now() + timedelta(minutes=30),
        )

        self.assertEqual(draft.status, UploadDraftStatus.PENDING)
        self.assertEqual(draft.cover, 'drafts/author1/comic-1/cover.webp')
        self.assertEqual(draft.banner, 'drafts/author1/comic-1/banner.webp')

    def test_chapter_upload_draft_can_target_existing_comic(self):
        comic = Comic.objects.create(title='Пыльный Берег', author=self.author)
        chapter_draft = ChapterUploadDraft.objects.create(
            user=self.author,
            comic=comic,
            title='Глава 1',
            chapter_number=1,
            expected_page_count=2,
            scope_prefix='drafts/author1/chapter-1/',
            page_keys=[
                'drafts/author1/chapter-1/001.webp',
                'drafts/author1/chapter-1/002.webp',
            ],
            expires_at=timezone.now() + timedelta(minutes=30),
        )

        self.assertEqual(chapter_draft.comic, comic)
        self.assertIsNone(chapter_draft.comic_draft)

    def test_chapter_upload_draft_can_target_comic_draft(self):
        comic_draft = ComicUploadDraft.objects.create(
            user=self.author,
            title='Черновой комикс',
            scope_prefix='drafts/author1/comic-2/',
            expires_at=timezone.now() + timedelta(minutes=30),
        )
        chapter_draft = ChapterUploadDraft.objects.create(
            user=self.author,
            comic_draft=comic_draft,
            title='Черновая глава',
            chapter_number=1,
            expected_page_count=1,
            scope_prefix='drafts/author1/comic-2/chapter-1/',
            page_keys=['drafts/author1/comic-2/chapter-1/001.webp'],
            expires_at=timezone.now() + timedelta(minutes=30),
        )

        self.assertEqual(chapter_draft.comic_draft, comic_draft)
        self.assertIsNone(chapter_draft.comic)


class ComicsApiTests(APITestCase):
    def setUp(self):
        self.author = User.objects.create_user(
            username='author-api',
            email='author-api@example.com',
            password='strongpass123',
            role=User.Role.AUTHOR,
        )
        self.reader = User.objects.create_user(
            username='reader-api',
            email='reader-api@example.com',
            password='strongpass123',
            role=User.Role.READER,
        )
        self.genre = Genre.objects.create(name='Фэнтези', description='Большие миры, магия и эпические конфликты.')
        self.tag = Tag.objects.create(name='Фэнтези', description='Магия, героический путь и атмосферные миры.')

    def test_taxonomy_returns_public_genres_and_tags(self):
        response = self.client.get(reverse('taxonomy'))
        response.render()
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(payload['error'])
        self.assertEqual(payload['data']['ageRatings'][0]['value'], ComicAgeRating.AGE_0)
        self.assertEqual(payload['data']['genres'][0]['name'], self.genre.name)
        self.assertEqual(payload['data']['genres'][0]['description'], self.genre.description)
        self.assertEqual(payload['data']['tags'][0]['name'], self.tag.name)
        self.assertEqual(payload['data']['tags'][0]['description'], self.tag.description)

    @patch('comics.views.services.S3UploadService.generate_upload')
    def test_upload_config_creates_comic_and_chapter_drafts(self, mock_generate_upload):
        mock_generate_upload.side_effect = lambda key, content_type: {
            'method': 'PUT',
            'key': key,
            'upload_url': f'https://upload.example/{key}',
        }
        self.client.force_authenticate(self.author)

        response = self.client.post(
            reverse('comic-upload-config'),
            {
                'title': 'Лунная Башня',
                'description': 'История про магов и древние кланы.',
                'ageRating': ComicAgeRating.AGE_16,
                'genreId': self.genre.id,
                'tagIds': [self.tag.id],
                'cover': {'filename': 'cover.webp', 'content_type': 'image/webp'},
                'banner': {'filename': 'banner.webp', 'content_type': 'image/webp'},
                'chapters': [
                    {
                        'title': 'Пролог',
                        'description': 'Начало истории',
                        'chapter_number': 1,
                        'pages': [
                            {'filename': '001.webp', 'content_type': 'image/webp'},
                            {'filename': '002.webp', 'content_type': 'image/webp'},
                        ],
                    }
                ],
            },
            format='json',
        )
        response.render()
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ComicUploadDraft.objects.count(), 1)
        self.assertEqual(ChapterUploadDraft.objects.count(), 1)
        self.assertIn('comic_draft_id', payload['data'])
        self.assertEqual(len(payload['data']['chapters']), 1)
        self.assertIsNone(payload['error'])
        self.assertEqual(ComicUploadDraft.objects.get().genre_id, self.genre.id)
        self.assertEqual(ComicUploadDraft.objects.get().age_rating, ComicAgeRating.AGE_16)

    @patch('comics.views.services.S3UploadService.generate_upload')
    def test_upload_config_allows_reader_role(self, mock_generate_upload):
        mock_generate_upload.side_effect = lambda key, content_type: {
            'method': 'PUT',
            'key': key,
            'upload_url': f'https://upload.example/{key}',
        }
        self.client.force_authenticate(self.reader)

        response = self.client.post(
            reverse('comic-upload-config'),
            {
                'title': 'Лунная Башня',
                'ageRating': ComicAgeRating.AGE_12,
                'genreId': self.genre.id,
                'cover': {'filename': 'cover.webp', 'content_type': 'image/webp'},
                'banner': {'filename': 'banner.webp', 'content_type': 'image/webp'},
                'chapters': [],
            },
            format='json',
        )
        response.render()
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(payload['error'])

    @patch('comics.views.services.S3UploadService.object_exists', return_value=True)
    def test_confirm_promotes_reader_to_author_after_first_comic(self, mock_object_exists):
        comic_draft = ComicUploadDraft.objects.create(
            user=self.reader,
            title='Лунная Башня',
            description='История про магов и древние кланы.',
            age_rating=ComicAgeRating.AGE_18,
            genre_id=self.genre.id,
            tag_ids=[self.tag.id],
            scope_prefix='drafts/2/comics/draft-1/',
            cover='drafts/2/comics/draft-1/cover.webp',
            banner='drafts/2/comics/draft-1/banner.webp',
            expires_at=timezone.now() + timedelta(minutes=30),
        )
        ChapterUploadDraft.objects.create(
            user=self.reader,
            comic_draft=comic_draft,
            title='Пролог',
            description='Начало',
            chapter_number=1,
            expected_page_count=1,
            scope_prefix='drafts/2/comics/draft-1/chapters/ch-1/',
            page_keys=['drafts/2/comics/draft-1/chapters/ch-1/001.webp'],
            expires_at=timezone.now() + timedelta(minutes=30),
        )
        self.client.force_authenticate(self.reader)

        response = self.client.post(
            reverse('comic-confirm'),
            {'comic_draft_id': str(comic_draft.id)},
            format='json',
        )
        response.render()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.reader.refresh_from_db()
        self.assertEqual(self.reader.role, User.Role.AUTHOR)

    @patch('comics.views.services.S3UploadService.object_exists', return_value=True)
    def test_confirm_creates_comic_and_chapters_from_draft(self, mock_object_exists):
        comic_draft = ComicUploadDraft.objects.create(
            user=self.author,
            title='Лунная Башня',
            description='История про магов и древние кланы.',
            age_rating=ComicAgeRating.AGE_16,
            genre_id=self.genre.id,
            tag_ids=[self.tag.id],
            scope_prefix='drafts/1/comics/draft-1/',
            cover='drafts/1/comics/draft-1/cover.webp',
            banner='drafts/1/comics/draft-1/banner.webp',
            expires_at=timezone.now() + timedelta(minutes=30),
        )
        ChapterUploadDraft.objects.create(
            user=self.author,
            comic_draft=comic_draft,
            title='Пролог',
            description='Начало',
            chapter_number=1,
            expected_page_count=2,
            scope_prefix='drafts/1/comics/draft-1/chapters/ch-1/',
            page_keys=['drafts/1/comics/draft-1/chapters/ch-1/001.webp', 'drafts/1/comics/draft-1/chapters/ch-1/002.webp'],
            expires_at=timezone.now() + timedelta(minutes=30),
        )
        self.client.force_authenticate(self.author)

        response = self.client.post(
            reverse('comic-confirm'),
            {'comic_draft_id': str(comic_draft.id)},
            format='json',
        )
        response.render()
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Comic.objects.count(), 1)
        self.assertEqual(Chapter.objects.count(), 1)
        self.assertIsNone(payload['error'])
        self.assertEqual(Comic.objects.get().genre, self.genre)
        self.assertEqual(Comic.objects.get().age_rating, ComicAgeRating.AGE_16)
        comic_draft.refresh_from_db()
        self.assertEqual(comic_draft.status, UploadDraftStatus.COMPLETED)

    @patch('comics.views.services.S3UploadService.object_exists', return_value=False)
    def test_confirm_returns_422_when_storage_objects_missing(self, mock_object_exists):
        comic_draft = ComicUploadDraft.objects.create(
            user=self.author,
            title='Лунная Башня',
            scope_prefix='drafts/1/comics/draft-1/',
            cover='drafts/1/comics/draft-1/cover.webp',
            banner='drafts/1/comics/draft-1/banner.webp',
            expires_at=timezone.now() + timedelta(minutes=30),
        )
        self.client.force_authenticate(self.author)

        response = self.client.post(
            reverse('comic-confirm'),
            {'comic_draft_id': str(comic_draft.id)},
            format='json',
        )
        response.render()
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertIsNone(payload['data'])
        self.assertEqual(payload['error']['message'], 'Some uploaded files were not found in storage.')

    def test_comic_detail_returns_page_payload_for_frontend(self):
        comic = Comic.objects.create(
            title='Лунная Башня',
            description='История про магов и древние кланы.',
            cover='comics/1/cover.webp',
            banner='comics/1/banner.webp',
            age_rating=ComicAgeRating.AGE_16,
            author=self.author,
            genre=self.genre,
            status=Comic.Status.PUBLISHED,
        )
        comic.tags.set([self.tag])
        Chapter.objects.create(
            comic=comic,
            title='Пролог',
            description='Начало пути',
            chapter_number=1,
            page_count=2,
            page_keys=['comics/1/chapters/1/001.webp', 'comics/1/chapters/1/002.webp'],
        )
        Comment.objects.create(content_object=comic, user=self.reader, text='Очень сильное начало.')
        ComicRating.objects.create(comic=comic, user=self.reader, value=5)
        ComicStats.objects.create(comic=comic, views=200, unique_readers=70, favorites_count=12, comments_count=1)
        ComicLike.objects.create(comic=comic, user=self.reader)
        ComicFavorite.objects.create(comic=comic, user=self.reader)
        ComicReadingProgress.objects.create(user=self.reader, comic=comic, chapter=comic.chapters.first(), last_page=2)
        self.client.force_authenticate(self.reader)

        response = self.client.get(reverse('comic-detail', kwargs={'comic_id': comic.id}))
        response.render()
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(payload['data']['title'], comic.title)
        self.assertEqual(payload['data']['ageRating'], ComicAgeRating.AGE_16)
        self.assertEqual(payload['data']['coverUrl'], services.build_public_media_url(comic.cover))
        self.assertEqual(payload['data']['bannerUrl'], services.build_public_media_url(comic.banner))
        self.assertEqual(payload['data']['genre']['id'], self.genre.id)
        self.assertEqual(payload['data']['likesCount'], 1)
        self.assertTrue(payload['data']['isLiked'])
        self.assertEqual(payload['data']['favoritesCount'], 1)
        self.assertTrue(payload['data']['isFavorite'])
        self.assertEqual(payload['data']['averageRating'], 5.0)
        self.assertEqual(payload['data']['ratingsCount'], 1)
        self.assertEqual(payload['data']['userRating'], 5)
        self.assertEqual(payload['data']['chaptersCount'], 1)
        self.assertEqual(
            payload['data']['chapters'][0]['previewUrl'],
            services.build_public_media_url('comics/1/chapters/1/001.webp'),
        )
        self.assertEqual(payload['data']['continueReading']['chapterId'], comic.chapters.first().id)
        self.assertEqual(payload['data']['continueReading']['lastPage'], 2)
        self.assertEqual(len(payload['data']['comments']), 1)

    def test_comics_list_returns_catalog_payload(self):
        comic = Comic.objects.create(
            title='Лунная Башня',
            description='История про магов и древние кланы.',
            cover='comics/1/cover.webp',
            banner='comics/1/banner.webp',
            age_rating=ComicAgeRating.AGE_16,
            author=self.author,
            genre=self.genre,
            status=Comic.Status.PUBLISHED,
            published_at=timezone.now(),
        )
        comic.tags.set([self.tag])
        Comment.objects.create(content_object=comic, user=self.reader, text='Очень сильное начало.')
        ComicRating.objects.create(comic=comic, user=self.reader, value=5)
        ComicLike.objects.create(comic=comic, user=self.reader)
        ComicStats.objects.create(comic=comic, views=200, unique_readers=70, favorites_count=12, comments_count=1)

        response = self.client.get(reverse('comics-list'))
        response.render()
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(payload['data']), 1)
        self.assertEqual(payload['data'][0]['id'], comic.id)
        self.assertEqual(payload['data'][0]['title'], comic.title)
        self.assertEqual(payload['data'][0]['coverUrl'], services.build_public_media_url(comic.cover))
        self.assertEqual(payload['data'][0]['genreId'], self.genre.id)
        self.assertEqual(payload['data'][0]['genre'], self.genre.name)
        self.assertEqual(payload['data'][0]['tagIds'], [self.tag.id])
        self.assertEqual(payload['data'][0]['tags'], [self.tag.name])
        self.assertEqual(payload['data'][0]['reviews'], 1)
        self.assertEqual(payload['data'][0]['rating'], 5.0)
        self.assertTrue(payload['data'][0]['isNew'])
        self.assertTrue(payload['data'][0]['isTrending'])

    def test_create_comment_for_comic(self):
        comic = Comic.objects.create(title='Лунная Башня', author=self.author, genre=self.genre)
        self.client.force_authenticate(self.reader)

        response = self.client.post(
            reverse('comic-comment-create', kwargs={'comic_id': comic.id}),
            {'text': 'Очень сильный пилот.'},
            format='json',
        )
        response.render()
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Comment.objects.count(), 1)
        self.assertEqual(payload['data']['text'], 'Очень сильный пилот.')

    def test_toggle_comic_favorite(self):
        comic = Comic.objects.create(title='Лунная Башня', author=self.author, genre=self.genre)
        self.client.force_authenticate(self.reader)

        response = self.client.post(reverse('comic-favorite-toggle', kwargs={'comic_id': comic.id}), format='json')
        response.render()
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(payload['data']['isActive'])
        self.assertEqual(payload['data']['count'], 1)

        response = self.client.post(reverse('comic-favorite-toggle', kwargs={'comic_id': comic.id}), format='json')
        response.render()
        payload = json.loads(response.content)

        self.assertFalse(payload['data']['isActive'])
        self.assertEqual(payload['data']['count'], 0)

    def test_toggle_comic_like(self):
        comic = Comic.objects.create(title='Лунная Башня', author=self.author, genre=self.genre)
        self.client.force_authenticate(self.reader)

        response = self.client.post(reverse('comic-like-toggle', kwargs={'comic_id': comic.id}), format='json')
        response.render()
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(payload['data']['isActive'])
        self.assertEqual(payload['data']['count'], 1)

    def test_user_can_rate_comic(self):
        comic = Comic.objects.create(title='Лунная Башня', author=self.author, genre=self.genre)
        self.client.force_authenticate(self.reader)

        response = self.client.put(
            reverse('comic-rating', kwargs={'comic_id': comic.id}),
            {'value': 4},
            format='json',
        )
        response.render()
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(payload['data']['value'], 4)
        self.assertEqual(payload['data']['averageRating'], 4.0)
        self.assertEqual(payload['data']['ratingsCount'], 1)
        self.assertEqual(ComicRating.objects.get(comic=comic, user=self.reader).value, 4)

        response = self.client.put(
            reverse('comic-rating', kwargs={'comic_id': comic.id}),
            {'value': 5},
            format='json',
        )
        response.render()
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(payload['data']['value'], 5)
        self.assertEqual(payload['data']['averageRating'], 5.0)
        self.assertEqual(payload['data']['ratingsCount'], 1)

    def test_reader_returns_pages_and_navigation(self):
        comic = Comic.objects.create(title='Лунная Башня', author=self.author, genre=self.genre, status=Comic.Status.PUBLISHED)
        first_chapter = Chapter.objects.create(
            comic=comic,
            title='Пролог',
            chapter_number=1,
            page_count=2,
            page_keys=['comics/1/chapters/1/001.webp', 'comics/1/chapters/1/002.webp'],
        )
        second_chapter = Chapter.objects.create(
            comic=comic,
            title='Глава 2',
            chapter_number=2,
            page_count=1,
            page_keys=['comics/1/chapters/2/001.webp'],
        )
        ComicReadingProgress.objects.create(user=self.reader, comic=comic, chapter=first_chapter, last_page=2)
        self.client.force_authenticate(self.reader)

        response = self.client.get(reverse('comic-reader', kwargs={'comic_id': comic.id, 'chapter_id': first_chapter.id}))
        response.render()
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(payload['data']['chapter']['id'], first_chapter.id)
        self.assertEqual(payload['data']['chapter']['pages'][0]['url'], services.build_public_media_url(first_chapter.page_keys[0]))
        self.assertIsNone(payload['data']['navigation']['previousChapterId'])
        self.assertEqual(payload['data']['navigation']['nextChapterId'], second_chapter.id)
        self.assertEqual(payload['data']['progress']['chapterId'], first_chapter.id)
        self.assertEqual(payload['data']['progress']['lastPage'], 2)

    def test_progress_update_saves_unique_reader_and_last_page(self):
        comic = Comic.objects.create(title='Лунная Башня', author=self.author, genre=self.genre, status=Comic.Status.PUBLISHED)
        chapter = Chapter.objects.create(comic=comic, title='Пролог', chapter_number=1, page_count=5, page_keys=['a', 'b', 'c', 'd', 'e'])
        self.client.force_authenticate(self.reader)

        response = self.client.post(
            reverse('comic-reading-progress', kwargs={'comic_id': comic.id, 'chapter_id': chapter.id}),
            {'lastPage': 3},
            format='json',
        )
        response.render()
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(payload['data']['chapterId'], chapter.id)
        self.assertEqual(payload['data']['lastPage'], 3)
        self.assertEqual(ComicReadingProgress.objects.get(user=self.reader, comic=comic).last_page, 3)
        self.assertEqual(ComicStats.objects.get(comic=comic).unique_readers, 1)

        self.client.post(
            reverse('comic-reading-progress', kwargs={'comic_id': comic.id, 'chapter_id': chapter.id}),
            {'lastPage': 5},
            format='json',
        )

        self.assertEqual(ComicReadingProgress.objects.get(user=self.reader, comic=comic).last_page, 5)
        self.assertEqual(ComicStats.objects.get(comic=comic).unique_readers, 1)
