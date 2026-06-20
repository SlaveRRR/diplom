from django.urls import path

from blog.views import (
    BlogCommentCreateView,
    BlogPostConfirmView,
    BlogPostDetailView,
    BlogPostDraftDeleteView,
    BlogPostEditorView,
    BlogPostListView,
    BlogPostReactionToggleView,
    BlogPostUploadConfigView,
    BlogPostVisibilityToggleView,
    BlogTagListView,
)

urlpatterns = [
    path('posts/', BlogPostListView.as_view(), name='blog-post-list'),
    path('posts/tags/', BlogTagListView.as_view(), name='blog-tag-list'),
    path('posts/upload-config/', BlogPostUploadConfigView.as_view(), name='blog-post-upload-config'),
    path('posts/confirm/', BlogPostConfirmView.as_view(), name='blog-post-confirm'),
    path('posts/<int:post_id>/editor/', BlogPostEditorView.as_view(), name='blog-post-editor'),
    path('posts/<int:post_id>/draft/', BlogPostDraftDeleteView.as_view(), name='blog-post-draft-delete'),
    path('posts/<int:post_id>/', BlogPostDetailView.as_view(), name='blog-post-detail'),
    path('posts/<int:post_id>/visibility/', BlogPostVisibilityToggleView.as_view(), name='blog-post-visibility-toggle'),
    path('posts/<int:post_id>/comments/', BlogCommentCreateView.as_view(), name='blog-post-comment-create'),
    path('posts/<int:post_id>/reaction/', BlogPostReactionToggleView.as_view(), name='blog-post-reaction-toggle'),
]
