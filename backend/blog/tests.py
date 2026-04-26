import json
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from blog.models import BlogTag, Post
from interactions.models import Comment

User = get_user_model()


@override_settings(S3_PUBLIC_BASE_URL='https://cdn.example.com', S3_PRESIGNED_EXPIRATION=1800)
class BlogApiTests(APITestCase):
    def setUp(self):
        self.author = User.objects.create_user(
            username='blog-author',
            email='blog-author@example.com',
            password='strongpass123',
            role=User.Role.AUTHOR,
            avatar='users/42/avatars/avatar.png',
        )
        self.reader = User.objects.create_user(
            username='blog-reader',
            email='blog-reader@example.com',
            password='strongpass123',
        )
        self.admin = User.objects.create_user(
            username='blog-admin',
            email='blog-admin@example.com',
            password='strongpass123',
            role=User.Role.ADMIN,
        )
        self.tag = BlogTag.objects.create(name='??????')

    @patch('blog.views.S3UploadService.generate_upload')
    def test_post_upload_config_returns_presigned_uploads(self, generate_upload_mock):
        self.client.force_authenticate(user=self.author)
        generate_upload_mock.side_effect = lambda key, content_type: {
            'method': 'PUT',
            'key': key,
            'upload_url': f'https://storage.example.com/{key}',
        }

        response = self.client.post(
            '/api/v1/posts/upload-config/',
            {
                'cover': {
                    'filename': 'cover.png',
                    'content_type': 'image/png',
                },
                'inlineImages': [
                    {
                        'uploadId': 'image-1',
                        'filename': 'inline.png',
                        'content_type': 'image/png',
                    }
                ],
            },
            format='json',
        )
        response.render()
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('postDraftId', payload['data'])
        self.assertEqual(payload['data']['inlineImages'][0]['uploadId'], 'image-1')

    def test_post_upload_config_allows_missing_cover(self):
        self.client.force_authenticate(user=self.author)

        response = self.client.post(
            '/api/v1/posts/upload-config/',
            {
                'inlineImages': [],
            },
            format='json',
        )
        response.render()
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(payload['data']['cover'])

    @patch('blog.views.S3UploadService.object_exists', return_value=True)
    def test_confirm_creates_post_with_under_review_status(self, object_exists_mock):
        self.client.force_authenticate(user=self.author)
        config_response = self.client.post(
            '/api/v1/posts/upload-config/',
            {
                'cover': {
                    'filename': 'cover.png',
                    'content_type': 'image/png',
                },
                'inlineImages': [
                    {
                        'uploadId': 'image-1',
                        'filename': 'inline.png',
                        'content_type': 'image/png',
                    }
                ],
            },
            format='json',
        )
        config_response.render()
        config_payload = json.loads(config_response.content)

        response = self.client.post(
            '/api/v1/posts/confirm/',
            {
                'postDraftId': config_payload['data']['postDraftId'],
                'title': '????? ????',
                'tagIds': [self.tag.id],
                'status': Post.Status.UNDER_REVIEW,
                'content': {
                    'type': 'doc',
                    'content': [
                        {
                            'type': 'paragraph',
                            'content': [
                                {'type': 'text', 'text': '??????, ????!'},
                            ],
                        },
                        {
                            'type': 'image',
                            'attrs': {
                                'src': config_payload['data']['inlineImages'][0]['key'],
                            },
                        },
                    ],
                },
            },
            format='json',
        )
        response.render()
        payload = json.loads(response.content)
        post = Post.objects.get(title='????? ????', author=self.author)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(post.status, Post.Status.UNDER_REVIEW)
        self.assertIsNone(post.published_at)
        self.assertEqual(payload['data']['status'], Post.Status.UNDER_REVIEW)
        self.assertTrue(object_exists_mock.called)

    @patch('blog.views.S3UploadService.object_exists', return_value=True)
    def test_confirm_creates_post_as_draft_without_cover(self, object_exists_mock):
        self.client.force_authenticate(user=self.author)
        config_response = self.client.post(
            '/api/v1/posts/upload-config/',
            {
                'inlineImages': [],
            },
            format='json',
        )
        config_response.render()
        config_payload = json.loads(config_response.content)

        response = self.client.post(
            '/api/v1/posts/confirm/',
            {
                'postDraftId': config_payload['data']['postDraftId'],
                'title': '???? ??? ???????',
                'tagIds': [self.tag.id],
                'status': Post.Status.DRAFT,
                'content': {
                    'type': 'doc',
                    'content': [
                        {
                            'type': 'paragraph',
                            'content': [
                                {'type': 'text', 'text': '????? ??? ???????.'},
                            ],
                        }
                    ],
                },
            },
            format='json',
        )
        response.render()
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(payload['data']['coverUrl'], '')
        self.assertEqual(payload['data']['status'], Post.Status.DRAFT)
        self.assertTrue(Post.objects.filter(title='???? ??? ???????', author=self.author, cover='', status=Post.Status.DRAFT).exists())
        self.assertFalse(object_exists_mock.called)

    def test_editor_returns_draft_payload_for_author(self):
        post = Post.objects.create(
            title='???????? ?????',
            content={
                'type': 'doc',
                'content': [
                    {
                        'type': 'image',
                        'attrs': {
                            'src': 'drafts/1/posts/existing/inline/cover.png',
                        },
                    }
                ],
            },
            cover='drafts/1/posts/existing/cover.png',
            author=self.author,
            status=Post.Status.DRAFT,
        )
        post.tags.add(self.tag)

        self.client.force_authenticate(user=self.author)
        response = self.client.get(f'/api/v1/posts/{post.id}/editor/')
        response.render()
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(payload['data']['id'], post.id)
        self.assertEqual(payload['data']['status'], Post.Status.DRAFT)
        self.assertEqual(payload['data']['tagIds'], [self.tag.id])
        self.assertEqual(payload['data']['coverUrl'], 'https://cdn.example.com/drafts/1/posts/existing/cover.png')
        image_attrs = payload['data']['content']['content'][0]['attrs']
        self.assertEqual(image_attrs['storageKey'], 'drafts/1/posts/existing/inline/cover.png')

    @patch('blog.views.S3UploadService.object_exists', return_value=True)
    def test_confirm_updates_existing_draft_post(self, object_exists_mock):
        post = Post.objects.create(
            title='?????? ????????',
            content={
                'type': 'doc',
                'content': [
                    {
                        'type': 'image',
                        'attrs': {
                            'src': 'drafts/1/posts/existing/inline/old.png',
                        },
                    }
                ],
            },
            cover='',
            author=self.author,
            status=Post.Status.DRAFT,
        )
        post.tags.add(self.tag)

        self.client.force_authenticate(user=self.author)
        config_response = self.client.post(
            '/api/v1/posts/upload-config/',
            {
                'inlineImages': [
                    {
                        'uploadId': 'new-image',
                        'filename': 'inline.png',
                        'content_type': 'image/png',
                    }
                ],
            },
            format='json',
        )
        config_response.render()
        config_payload = json.loads(config_response.content)

        response = self.client.post(
            '/api/v1/posts/confirm/',
            {
                'postId': post.id,
                'postDraftId': config_payload['data']['postDraftId'],
                'title': '??????????? ????????',
                'tagIds': [self.tag.id],
                'status': Post.Status.UNDER_REVIEW,
                'content': {
                    'type': 'doc',
                    'content': [
                        {
                            'type': 'image',
                            'attrs': {
                                'src': 'drafts/1/posts/existing/inline/old.png',
                            },
                        },
                        {
                            'type': 'image',
                            'attrs': {
                                'src': config_payload['data']['inlineImages'][0]['key'],
                            },
                        },
                    ],
                },
            },
            format='json',
        )
        response.render()
        payload = json.loads(response.content)
        post.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(post.id, payload['data']['id'])
        self.assertEqual(post.title, '??????????? ????????')
        self.assertEqual(post.status, Post.Status.UNDER_REVIEW)
        self.assertEqual(payload['data']['status'], Post.Status.UNDER_REVIEW)

    def test_post_list_and_detail_return_only_published_posts(self):
        published_post = Post.objects.create(
            title='???? ? ????????',
            content={
                'type': 'doc',
                'content': [
                    {
                        'type': 'paragraph',
                        'content': [
                            {'type': 'text', 'text': '??? ????? ??????? ????? ??? ?????? ? ???????? ?????.'},
                        ],
                    }
                ],
            },
            cover='posts/cover.png',
            author=self.author,
            status=Post.Status.PUBLISHED,
            published_at=timezone.now(),
        )
        published_post.tags.add(self.tag)
        Post.objects.create(
            title='???? ?? ?????????',
            content={'type': 'doc', 'content': []},
            author=self.author,
            status=Post.Status.UNDER_REVIEW,
        )

        list_response = self.client.get('/api/v1/posts/')
        list_response.render()
        list_payload = json.loads(list_response.content)

        detail_response = self.client.get(f'/api/v1/posts/{published_post.id}/')
        detail_response.render()
        detail_payload = json.loads(detail_response.content)

        hidden_response = self.client.get(f'/api/v1/posts/{published_post.id + 1}/')

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_payload['data']), 1)
        self.assertEqual(list_payload['data'][0]['id'], published_post.id)
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_payload['data']['author']['id'], self.author.id)
        self.assertEqual(hidden_response.status_code, status.HTTP_404_NOT_FOUND)

    def test_preview_can_open_unpublished_post(self):
        hidden_post = Post.objects.create(
            title='????? ??? preview',
            content={'type': 'doc', 'content': []},
            author=self.author,
            status=Post.Status.UNDER_REVIEW,
        )

        preview_response = self.client.get(f'/api/v1/posts/{hidden_post.id}/?preview=true')
        preview_response.render()
        preview_payload = json.loads(preview_response.content)

        self.assertEqual(preview_response.status_code, status.HTTP_200_OK)
        self.assertEqual(preview_payload['data']['id'], hidden_post.id)
        self.assertEqual(preview_payload['data']['title'], hidden_post.title)

    def test_authenticated_user_can_comment_on_published_post(self):
        post = Post.objects.create(
            title='???? ? ?????????????',
            content={'type': 'doc', 'content': []},
            author=self.author,
            status=Post.Status.PUBLISHED,
            published_at=timezone.now(),
        )

        self.client.force_authenticate(user=self.reader)
        response = self.client.post(
            f'/api/v1/posts/{post.id}/comments/',
            {
                'text': '????? ???????? ??????',
            },
            format='json',
        )
        response.render()
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(payload['data']['author']['id'], self.reader.id)
        self.assertTrue(Comment.objects.filter(object_id=post.id, text='????? ???????? ??????').exists())


