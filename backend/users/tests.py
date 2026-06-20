import json
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from blog.models import Post
from comics.models import Chapter, Comic
from users.achievements import register_chapter_read
from users.models import AvatarUploadDraft, UserAchievement, UserFollow, UserStats

User = get_user_model()


@override_settings(S3_PUBLIC_BASE_URL='https://cdn.example.com')
class UsersApiTests(APITestCase):
    def test_user_stats_are_created_automatically_for_new_user(self):
        user = User.objects.create_user(
            username='stats-reader',
            email='stats-reader@example.com',
            password='strongpass123',
        )

        self.assertTrue(UserStats.objects.filter(user=user).exists())

    def test_current_user_can_be_updated(self):
        user = User.objects.create_user(
            username='reader3',
            email='reader3@example.com',
            password='strongpass123',
        )
        self.client.force_authenticate(user=user)

        response = self.client.put(
            '/api/v1/users/me/',
            {
                'username': 'reader-updated',
                'email': 'updated@example.com',
                'name': 'Ivan',
                'surname': 'Petrov',
            },
            format='json',
        )
        response.render()
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(payload['data']['username'], 'reader-updated')
        self.assertEqual(payload['data']['email'], 'updated@example.com')
        self.assertEqual(payload['data']['name'], 'Ivan')
        self.assertEqual(payload['data']['surname'], 'Petrov')
        self.assertIsNone(payload['error'])

    def test_admin_role_sets_staff_flag(self):
        admin_user = User.objects.create_user(
            username='admin1',
            email='admin1@example.com',
            password='strongpass123',
            role=User.Role.ADMIN,
        )

        self.assertTrue(admin_user.is_staff)
        self.assertEqual(admin_user.role, User.Role.ADMIN)

    def test_account_returns_private_comics_and_profile_path(self):
        author = User.objects.create_user(
            username='cabinet-author',
            email='cabinet-author@example.com',
            password='strongpass123',
            role=User.Role.AUTHOR,
            avatar='users/1/avatars/current.png',
            first_name='Ilya',
            last_name='Sokolov',
        )
        Comic.objects.create(
            title='Published comic',
            description='Visible for everyone',
            author=author,
            status=Comic.Status.PUBLISHED,
        )
        Comic.objects.create(
            title='Draft comic',
            description='Visible only in cabinet',
            author=author,
            status=Comic.Status.DRAFT,
        )
        Comic.objects.create(
            title='Hidden published comic',
            description='Visible only in cabinet until shown',
            author=author,
            status=Comic.Status.PUBLISHED,
            is_hidden=True,
        )
        Post.objects.create(
            title='Published post',
            content={'type': 'doc', 'content': []},
            author=author,
            status=Post.Status.PUBLISHED,
        )
        Post.objects.create(
            title='Post on moderation',
            content={'type': 'doc', 'content': []},
            author=author,
            status=Post.Status.UNDER_REVIEW,
        )
        Post.objects.create(
            title='Hidden published post',
            content={'type': 'doc', 'content': []},
            author=author,
            status=Post.Status.PUBLISHED,
            is_hidden=True,
        )

        self.client.force_authenticate(user=author)
        response = self.client.get('/api/v1/account/')
        response.render()
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(payload['data']['publicProfilePath'], f'/profile/{author.id}')
        self.assertEqual(payload['data']['avatar'], 'https://cdn.example.com/users/1/avatars/current.png')
        self.assertEqual(len(payload['data']['comics']), 3)
        self.assertEqual(len(payload['data']['posts']), 3)
        self.assertTrue(next(comic for comic in payload['data']['comics'] if comic['title'] == 'Hidden published comic')['isHidden'])
        self.assertTrue(next(post for post in payload['data']['posts'] if post['title'] == 'Hidden published post')['isHidden'])
        self.assertEqual({post['status'] for post in payload['data']['posts']}, {Post.Status.PUBLISHED, Post.Status.UNDER_REVIEW})

    def test_public_profile_returns_only_published_comics_for_guest(self):
        author = User.objects.create_user(
            username='author-profile',
            email='author@example.com',
            password='strongpass123',
            role=User.Role.AUTHOR,
            avatar='users/55/avatars/author.png',
            first_name='Ilya',
            last_name='Sokolov',
        )
        Comic.objects.create(
            title='Published comic',
            description='Visible for everyone',
            author=author,
            status=Comic.Status.PUBLISHED,
        )
        Comic.objects.create(
            title='Draft comic',
            description='Visible only for author',
            author=author,
            status=Comic.Status.DRAFT,
        )
        Comic.objects.create(
            title='Hidden published comic',
            description='Hidden from public profile',
            author=author,
            status=Comic.Status.PUBLISHED,
            is_hidden=True,
        )

        response = self.client.get(f'/api/v1/profiles/{author.id}/')
        response.render()
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(payload['data']['id'], author.id)
        self.assertEqual(payload['data']['username'], author.username)
        self.assertEqual(payload['data']['avatar'], 'https://cdn.example.com/users/55/avatars/author.png')
        self.assertEqual(payload['data']['followersCount'], 0)
        self.assertEqual(payload['data']['followingCount'], 0)
        self.assertEqual(len(payload['data']['comics']), 1)
        self.assertEqual(payload['data']['comics'][0]['title'], 'Published comic')

    @patch('users.views.services.S3UploadService.generate_upload')
    def test_avatar_upload_config_returns_presigned_upload(self, generate_upload_mock):
        user = User.objects.create_user(
            username='avatar-owner',
            email='avatar-owner@example.com',
            password='strongpass123',
        )
        self.client.force_authenticate(user=user)
        generate_upload_mock.return_value = {
            'method': 'PUT',
            'key': 'users/10/avatars/15.png',
            'upload_url': 'https://storage.example.com/upload-avatar',
        }

        response = self.client.post(
            '/api/v1/account/avatar-upload-config/',
            {
                'filename': 'avatar.png',
                'content_type': 'image/png',
            },
            format='json',
        )
        response.render()
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('avatarDraftId', payload['data'])
        self.assertEqual(payload['data']['file']['upload_url'], 'https://storage.example.com/upload-avatar')
        self.assertTrue(AvatarUploadDraft.objects.filter(id=payload['data']['avatarDraftId'], user=user).exists())

    def test_avatar_upload_config_rejects_non_image_file(self):
        user = User.objects.create_user(
            username='avatar-invalid',
            email='avatar-invalid@example.com',
            password='strongpass123',
        )
        self.client.force_authenticate(user=user)

        response = self.client.post(
            '/api/v1/account/avatar-upload-config/',
            {
                'filename': 'avatar.exe',
                'content_type': 'image/png',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AvatarUploadDraft.objects.filter(user=user).exists())

    @patch('users.views.services.S3UploadService.validate_image_object', return_value=True)
    @patch('users.views.services.S3UploadService.object_exists', return_value=True)
    def test_avatar_confirm_updates_user_avatar(self, object_exists_mock, validate_image_object_mock):
        user = User.objects.create_user(
            username='confirm-owner',
            email='confirm-owner@example.com',
            password='strongpass123',
        )
        avatar_draft = AvatarUploadDraft.objects.create(
            user=user,
            file_key='users/12/avatars/33.png',
        )
        self.client.force_authenticate(user=user)

        response = self.client.post(
            '/api/v1/account/avatar-confirm/',
            {'avatarDraftId': avatar_draft.id},
            format='json',
        )
        response.render()
        payload = json.loads(response.content)
        user.refresh_from_db()
        avatar_draft.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(user.avatar, 'users/12/avatars/33.png')
        self.assertEqual(payload['data']['avatar'], 'https://cdn.example.com/users/12/avatars/33.png')
        self.assertEqual(avatar_draft.status, AvatarUploadDraft.Status.CONFIRMED)
        object_exists_mock.assert_called_once_with('users/12/avatars/33.png')

    @patch('users.views.services.S3UploadService.validate_image_object', return_value=False)
    @patch('users.views.services.S3UploadService.object_exists', return_value=True)
    def test_avatar_confirm_rejects_uploaded_non_image_object(self, object_exists_mock, validate_image_object_mock):
        user = User.objects.create_user(
            username='invalid-avatar-confirm',
            email='invalid-avatar-confirm@example.com',
            password='strongpass123',
        )
        avatar_draft = AvatarUploadDraft.objects.create(
            user=user,
            file_key='users/12/avatars/44.png',
        )
        self.client.force_authenticate(user=user)

        response = self.client.post(
            '/api/v1/account/avatar-confirm/',
            {'avatarDraftId': avatar_draft.id},
            format='json',
        )
        avatar_draft.refresh_from_db()
        user.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertEqual(user.avatar, '')
        self.assertEqual(avatar_draft.status, AvatarUploadDraft.Status.PENDING)
        object_exists_mock.assert_called_once_with('users/12/avatars/44.png')
        validate_image_object_mock.assert_called_once_with('users/12/avatars/44.png')

    def test_user_can_follow_author_profile(self):
        author = User.objects.create_user(
            username='follow-author',
            email='follow-author@example.com',
            password='strongpass123',
            role=User.Role.AUTHOR,
        )
        reader = User.objects.create_user(
            username='follow-reader',
            email='follow-reader@example.com',
            password='strongpass123',
        )

        self.client.force_authenticate(user=reader)
        response = self.client.post(f'/api/v1/profiles/{author.id}/follow/')
        response.render()
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(payload['data']['isActive'])
        self.assertEqual(payload['data']['followersCount'], 1)
        self.assertTrue(UserFollow.objects.filter(follower=reader, following=author).exists())

    def test_user_cannot_follow_self(self):
        author = User.objects.create_user(
            username='self-author',
            email='self-author@example.com',
            password='strongpass123',
            role=User.Role.AUTHOR,
        )

        self.client.force_authenticate(user=author)
        response = self.client.post(f'/api/v1/profiles/{author.id}/follow/')
        response.render()
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(payload['error']['message'], 'You cannot follow yourself.')

    def test_repeated_chapter_read_does_not_duplicate_stats_or_achievement(self):
        author = User.objects.create_user(
            username='comic-author',
            email='comic-author@example.com',
            password='strongpass123',
            role=User.Role.AUTHOR,
        )
        reader = User.objects.create_user(
            username='comic-reader',
            email='comic-reader@example.com',
            password='strongpass123',
        )
        comic = Comic.objects.create(
            title='First comic',
            description='Readable comic',
            author=author,
            status=Comic.Status.PUBLISHED,
        )
        chapter = Chapter.objects.create(
            comic=comic,
            title='Chapter 1',
            chapter_number=1,
            page_count=5,
            page_keys=['comics/1/chapter-1/page-1.webp'],
        )

        register_chapter_read(reader, chapter)
        register_chapter_read(reader, chapter)

        stats = UserStats.objects.get(user=reader)

        self.assertEqual(stats.chapters_read_count, 1)
        self.assertEqual(stats.comics_started_count, 1)
        self.assertEqual(stats.comics_finished_count, 1)
        self.assertEqual(UserAchievement.objects.filter(user=reader, code='read_1_chapter').count(), 1)
        self.assertEqual(UserAchievement.objects.filter(user=reader, code='finish_1_comic').count(), 1)

    def test_achievements_endpoint_returns_live_progress(self):
        author = User.objects.create_user(
            username='api-author',
            email='api-author@example.com',
            password='strongpass123',
            role=User.Role.AUTHOR,
        )
        reader = User.objects.create_user(
            username='api-reader',
            email='api-reader@example.com',
            password='strongpass123',
        )
        comic = Comic.objects.create(
            title='Endpoint comic',
            description='Readable comic',
            author=author,
            status=Comic.Status.PUBLISHED,
        )
        chapter = Chapter.objects.create(
            comic=comic,
            title='Chapter 1',
            chapter_number=1,
            page_count=4,
            page_keys=['comics/2/chapter-1/page-1.webp'],
        )
        register_chapter_read(reader, chapter)

        self.client.force_authenticate(user=reader)
        response = self.client.get('/api/v1/users/me/achievements/')
        response.render()
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(payload['data']['stats']['chaptersReadCount'], 1)
        self.assertTrue(any(item['code'] == 'read_1_chapter' and item['achieved'] for item in payload['data']['achievements']))
