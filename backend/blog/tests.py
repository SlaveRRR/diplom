import json
import math
from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from blog.models import BlogTag, Post, PostUploadDraft
from blog.services import PostContentValidationError, validate_post_content_document
from interactions.models import Comment

User = get_user_model()


class BlogContentValidationTests(APITestCase):
    def test_accepts_tiptap_image_dimensions(self):
        content = {
            'type': 'doc',
            'content': [
                {
                    'type': 'image',
                    'attrs': {
                        'src': 'drafts/1/posts/27/inline/image.webp',
                        'alt': None,
                        'title': None,
                        'width': None,
                        'height': '240px',
                        'uploadId': 'image',
                        'storageKey': 'drafts/1/posts/27/inline/image.webp',
                    },
                },
                {
                    'type': 'image',
                    'attrs': {
                        'src': 'https://example.com/image.webp',
                        'width': '80%',
                        'height': 320,
                    },
                },
            ],
        }

        self.assertEqual(validate_post_content_document(content), content)

    def test_rejects_unsafe_image_dimensions(self):
        base_content = {
            'type': 'doc',
            'content': [{'type': 'image', 'attrs': {'src': 'https://example.com/image.webp'}}],
        }

        for value in ('Infinitypx', '120%', 0, True):
            with self.subTest(value=value):
                content = json.loads(json.dumps(base_content))
                content['content'][0]['attrs']['width'] = value

                with self.assertRaises(PostContentValidationError):
                    validate_post_content_document(content)

    def test_rejects_non_finite_json_numbers(self):
        content = {
            'type': 'doc',
            'content': [
                {
                    'type': 'image',
                    'attrs': {
                        'src': 'https://example.com/image.webp',
                        'width': math.nan,
                    },
                }
            ],
        }

        with self.assertRaises(PostContentValidationError):
            validate_post_content_document(content)


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
        self.tag = BlogTag.objects.create(name='Новости')

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

    def test_post_upload_config_rejects_non_image_file(self):
        self.client.force_authenticate(user=self.author)

        response = self.client.post(
            '/api/v1/posts/upload-config/',
            {
                'cover': {
                    'filename': 'payload.exe',
                    'content_type': 'image/png',
                },
                'inlineImages': [],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_posts_list_returns_paginated_payload(self):
        first_post = Post.objects.create(
            title='Пост о релизе',
            content={'type': 'doc', 'content': []},
            cover='posts/1/cover.webp',
            age_rating='12+',
            author=self.author,
            status=Post.Status.PUBLISHED,
            published_at=timezone.now(),
        )
        second_post = Post.objects.create(
            title='Пост о разработке',
            content={'type': 'doc', 'content': []},
            cover='posts/2/cover.webp',
            age_rating='16+',
            author=self.author,
            status=Post.Status.PUBLISHED,
            published_at=timezone.now() - timedelta(days=1),
        )
        first_post.tags.set([self.tag])
        second_post.tags.set([self.tag])

        response = self.client.get('/api/v1/posts/', {'page': 1, 'page_size': 1, 'sort': 'recent'})
        response.render()
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(payload['data']['pagination']['page'], 1)
        self.assertEqual(payload['data']['pagination']['pageSize'], 1)
        self.assertEqual(payload['data']['pagination']['total'], 2)
        self.assertEqual(payload['data']['pagination']['totalPages'], 2)
        self.assertEqual(len(payload['data']['items']), 1)
        self.assertEqual(payload['data']['items'][0]['id'], first_post.id)
        self.assertEqual(payload['data']['items'][0]['title'], first_post.title)

    def test_hidden_published_post_is_excluded_from_public_blog_and_guest_detail(self):
        visible_post = Post.objects.create(
            title='Visible post',
            content={'type': 'doc', 'content': []},
            age_rating='12+',
            author=self.author,
            status=Post.Status.PUBLISHED,
            published_at=timezone.now(),
        )
        hidden_post = Post.objects.create(
            title='Hidden post',
            content={'type': 'doc', 'content': []},
            age_rating='12+',
            author=self.author,
            status=Post.Status.PUBLISHED,
            is_hidden=True,
            published_at=timezone.now(),
        )

        list_response = self.client.get('/api/v1/posts/')
        list_response.render()
        list_payload = json.loads(list_response.content)

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(list_payload['data']['pagination']['total'], 1)
        self.assertEqual(list_payload['data']['items'][0]['id'], visible_post.id)
        self.assertEqual(self.client.get(f'/api/v1/posts/{hidden_post.id}/').status_code, status.HTTP_404_NOT_FOUND)

        self.client.force_authenticate(user=self.author)
        self.assertEqual(self.client.get(f'/api/v1/posts/{hidden_post.id}/').status_code, status.HTTP_200_OK)

    def test_author_can_toggle_published_post_visibility(self):
        post = Post.objects.create(
            title='Toggle post',
            content={'type': 'doc', 'content': []},
            age_rating='12+',
            author=self.author,
            status=Post.Status.PUBLISHED,
            published_at=timezone.now(),
        )

        self.client.force_authenticate(user=self.author)
        response = self.client.post(f'/api/v1/posts/{post.id}/visibility/')
        response.render()
        payload = json.loads(response.content)
        post.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(payload['data']['isHidden'])
        self.assertTrue(post.is_hidden)

    @patch('blog.views.S3UploadService.delete_objects', return_value=3)
    def test_author_can_delete_own_draft_post_with_media(self, mock_delete_objects):
        post = Post.objects.create(
            title='Draft post',
            content={
                'type': 'doc',
                'content': [
                    {
                        'type': 'image',
                        'attrs': {
                            'src': 'drafts/1/posts/1/inline/image-1.webp',
                        },
                    },
                    {
                        'type': 'image',
                        'attrs': {
                            'src': 'drafts/1/posts/1/inline/image-2.webp',
                        },
                    },
                ],
            },
            cover='drafts/1/posts/1/cover.webp',
            age_rating='12+',
            author=self.author,
            status=Post.Status.DRAFT,
        )

        self.client.force_authenticate(user=self.author)
        response = self.client.delete(f'/api/v1/posts/{post.id}/draft/')
        response.render()
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(payload['data']['deletedMediaCount'], 3)
        self.assertFalse(Post.objects.filter(id=post.id).exists())
        mock_delete_objects.assert_called_once_with(
            [
                'drafts/1/posts/1/cover.webp',
                'drafts/1/posts/1/inline/image-1.webp',
                'drafts/1/posts/1/inline/image-2.webp',
            ]
        )

    def test_author_cannot_delete_published_post_as_draft(self):
        post = Post.objects.create(
            title='Published post',
            content={'type': 'doc', 'content': []},
            author=self.author,
            status=Post.Status.PUBLISHED,
            published_at=timezone.now(),
        )

        self.client.force_authenticate(user=self.author)
        response = self.client.delete(f'/api/v1/posts/{post.id}/draft/')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Post.objects.filter(id=post.id).exists())

    @override_settings(
        ADMINS_EMAILS=['moderation-1@example.com', 'moderation-2@example.com'],
        BACKEND_PUBLIC_URL='https://api.comicsera.ru',
    )
    @patch('core.moderation.send_email_task.delay')
    @patch('blog.views.S3UploadService.validate_image_object', return_value=True)
    @patch('blog.views.S3UploadService.object_exists', return_value=True)
    def test_confirm_creates_post_with_under_review_status(self, object_exists_mock, validate_image_object_mock, send_email_task_mock):
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
                'title': 'Новый пост',
                'ageRating': '16+',
                'tagIds': [self.tag.id],
                'status': Post.Status.UNDER_REVIEW,
                'content': {
                    'type': 'doc',
                    'content': [
                        {
                            'type': 'paragraph',
                            'content': [
                                {'type': 'text', 'text': 'Привет, мир!'},
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
        post = Post.objects.get(title='Новый пост', author=self.author)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(post.status, Post.Status.UNDER_REVIEW)
        self.assertIsNone(post.published_at)
        self.assertEqual(payload['data']['status'], Post.Status.UNDER_REVIEW)
        self.assertTrue(object_exists_mock.called)
        send_email_task_mock.assert_called_once()
        self.assertEqual(
            send_email_task_mock.call_args.kwargs['recipient_list'],
            ['moderation-1@example.com', 'moderation-2@example.com'],
        )
        self.assertIn('/admin/blog/post/', send_email_task_mock.call_args.kwargs['message'])
        self.assertIn('/change/', send_email_task_mock.call_args.kwargs['message'])

    @patch('core.moderation.send_email_task.delay')
    @patch('blog.views.S3UploadService.validate_image_object', return_value=True)
    @patch('blog.views.S3UploadService.object_exists', return_value=True)
    def test_confirm_creates_post_as_draft_without_cover(self, object_exists_mock, validate_image_object_mock, send_email_task_mock):
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
                'title': 'Пост без обложки',
                'ageRating': '16+',
                'tagIds': [self.tag.id],
                'status': Post.Status.DRAFT,
                'content': {
                    'type': 'doc',
                    'content': [
                        {
                            'type': 'paragraph',
                            'content': [
                                {'type': 'text', 'text': 'Текст без обложки.'},
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
        self.assertTrue(Post.objects.filter(title='Пост без обложки', author=self.author, cover='', status=Post.Status.DRAFT).exists())
        self.assertFalse(object_exists_mock.called)
        send_email_task_mock.assert_not_called()

    def test_confirm_accepts_valid_rich_text_json(self):
        draft = PostUploadDraft.objects.create(
            user=self.author,
            expires_at=timezone.now() + timedelta(minutes=30),
        )
        self.client.force_authenticate(user=self.author)

        response = self.client.post(
            '/api/v1/posts/confirm/',
            {
                'postDraftId': draft.id,
                'title': 'Rich text post',
                'ageRating': '16+',
                'tagIds': [self.tag.id],
                'status': Post.Status.DRAFT,
                'content': {
                    'type': 'doc',
                    'content': [
                        {
                            'type': 'heading',
                            'attrs': {'level': 1, 'textAlign': 'center'},
                            'content': [
                                {
                                    'type': 'text',
                                    'text': 'Title',
                                    'marks': [{'type': 'highlight'}],
                                }
                            ],
                        },
                        {
                            'type': 'paragraph',
                            'attrs': {'textAlign': 'justify'},
                            'content': [{'type': 'text', 'text': 'Body'}],
                        },
                        {
                            'type': 'image',
                            'attrs': {
                                'src': 'https://example.com/image.webp',
                                'alt': None,
                                'title': None,
                                'width': None,
                                'height': '240px',
                            },
                        },
                    ],
                },
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        post = Post.objects.get(title='Rich text post')
        self.assertEqual(post.content['content'][0]['attrs']['level'], 1)
        self.assertEqual(post.content['content'][0]['content'][0]['marks'][0]['type'], 'highlight')
        self.assertEqual(post.content['content'][2]['attrs']['height'], '240px')

    def test_confirm_rejects_unknown_rich_text_node(self):
        draft = PostUploadDraft.objects.create(
            user=self.author,
            expires_at=timezone.now() + timedelta(minutes=30),
        )
        self.client.force_authenticate(user=self.author)

        response = self.client.post(
            '/api/v1/posts/confirm/',
            {
                'postDraftId': draft.id,
                'title': 'Invalid node',
                'ageRating': '16+',
                'tagIds': [],
                'status': Post.Status.DRAFT,
                'content': {
                    'type': 'doc',
                    'content': [{'type': 'script', 'attrs': {'src': 'https://example.com/x.js'}}],
                },
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Post.objects.filter(title='Invalid node').exists())

    def test_confirm_rejects_unsafe_image_source(self):
        draft = PostUploadDraft.objects.create(
            user=self.author,
            expires_at=timezone.now() + timedelta(minutes=30),
        )
        self.client.force_authenticate(user=self.author)

        response = self.client.post(
            '/api/v1/posts/confirm/',
            {
                'postDraftId': draft.id,
                'title': 'Unsafe image',
                'ageRating': '16+',
                'tagIds': [],
                'status': Post.Status.DRAFT,
                'content': {
                    'type': 'doc',
                    'content': [
                        {
                            'type': 'image',
                            'attrs': {'src': 'javascript:alert(1)'},
                        }
                    ],
                },
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Post.objects.filter(title='Unsafe image').exists())

    @patch('blog.views.S3UploadService.validate_image_object', return_value=False)
    @patch('blog.views.S3UploadService.object_exists', return_value=True)
    def test_confirm_rejects_uploaded_non_image_object(self, object_exists_mock, validate_image_object_mock):
        draft = PostUploadDraft.objects.create(
            user=self.author,
            cover='drafts/1/posts/1/cover.png',
            expires_at=timezone.now() + timedelta(minutes=30),
        )
        self.client.force_authenticate(user=self.author)

        response = self.client.post(
            '/api/v1/posts/confirm/',
            {
                'postDraftId': draft.id,
                'title': 'Invalid binary',
                'ageRating': '16+',
                'tagIds': [],
                'status': Post.Status.DRAFT,
                'content': {'type': 'doc', 'content': []},
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertFalse(Post.objects.filter(title='Invalid binary').exists())

    def test_editor_returns_draft_payload_for_author(self):
        post = Post.objects.create(
            title='Черновик поста',
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

    @patch('blog.views.S3UploadService.validate_image_object', return_value=True)
    @patch('blog.views.S3UploadService.object_exists', return_value=True)
    def test_confirm_updates_existing_draft_post(self, object_exists_mock, validate_image_object_mock):
        post = Post.objects.create(
            title='Старый черновик',
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
                'title': 'Обновленный черновик',
                'ageRating': '18+',
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
        self.assertEqual(post.title, 'Обновленный черновик')
        self.assertEqual(post.status, Post.Status.UNDER_REVIEW)
        self.assertEqual(payload['data']['status'], Post.Status.UNDER_REVIEW)

    def test_post_list_and_detail_return_only_published_posts(self):
        published_post = Post.objects.create(
            title='Пост о публикации',
            content={
                'type': 'doc',
                'content': [
                    {
                        'type': 'paragraph',
                        'content': [
                            {'type': 'text', 'text': 'Это опубликованный пост для проверки списка.'},
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
            title='Пост на модерации',
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
        self.assertEqual(len(list_payload['data']['items']), 1)
        self.assertEqual(list_payload['data']['items'][0]['id'], published_post.id)
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_payload['data']['author']['id'], self.author.id)
        self.assertEqual(self.author.analytics_events.filter(event_type='view', content_kind='post', object_id=published_post.id).count(), 1)

        detail_response_repeat = self.client.get(f'/api/v1/posts/{published_post.id}/')
        self.assertEqual(detail_response_repeat.status_code, status.HTTP_200_OK)
        self.assertEqual(self.author.analytics_events.filter(event_type='view', content_kind='post', object_id=published_post.id).count(), 1)
        self.assertEqual(hidden_response.status_code, status.HTTP_404_NOT_FOUND)

    def test_preview_can_open_unpublished_post(self):
        hidden_post = Post.objects.create(
            title='Пост для preview',
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
            title='Пост с комментариями',
            content={'type': 'doc', 'content': []},
            author=self.author,
            status=Post.Status.PUBLISHED,
            published_at=timezone.now(),
        )

        self.client.force_authenticate(user=self.reader)
        response = self.client.post(
            f'/api/v1/posts/{post.id}/comments/',
            {
                'text': 'Новый комментарий читателя',
            },
            format='json',
        )
        response.render()
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(payload['data']['author']['id'], self.reader.id)
        self.assertTrue(Comment.objects.filter(object_id=post.id, text='Новый комментарий читателя').exists())


