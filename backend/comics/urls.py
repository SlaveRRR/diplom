from django.urls import path

from comics.views import (
    ComicCommentCreateView,
    ComicConfirmView,
    ComicDetailView,
    ComicFavoriteToggleView,
    ComicLikeToggleView,
    ComicRatingView,
    FavoriteComicListView,
    ComicListView,
    ComicReaderView,
    ComicReadingProgressView,
    ComicUploadConfigView,
    TaxonomyView,
)

urlpatterns = [
    path('taxonomy/', TaxonomyView.as_view(), name='taxonomy'),
    path('comics/', ComicListView.as_view(), name='comics-list'),
    path('favorites/', FavoriteComicListView.as_view(), name='favorite-comics-list'),
    path('comics/upload-config/', ComicUploadConfigView.as_view(), name='comic-upload-config'),
    path('comics/confirm/', ComicConfirmView.as_view(), name='comic-confirm'),
    path('comics/<int:comic_id>/', ComicDetailView.as_view(), name='comic-detail'),
    path('comics/<int:comic_id>/chapters/<int:chapter_id>/reader/', ComicReaderView.as_view(), name='comic-reader'),
    path('comics/<int:comic_id>/chapters/<int:chapter_id>/progress/', ComicReadingProgressView.as_view(), name='comic-reading-progress'),
    path('comics/<int:comic_id>/comments/', ComicCommentCreateView.as_view(), name='comic-comment-create'),
    path('comics/<int:comic_id>/favorite/', ComicFavoriteToggleView.as_view(), name='comic-favorite-toggle'),
    path('comics/<int:comic_id>/like/', ComicLikeToggleView.as_view(), name='comic-like-toggle'),
    path('comics/<int:comic_id>/rating/', ComicRatingView.as_view(), name='comic-rating'),
]
