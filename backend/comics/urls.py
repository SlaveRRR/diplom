from django.urls import path

from comics.views import ComicConfirmView, ComicUploadConfigView, TaxonomyView

urlpatterns = [
    path('taxonomy/', TaxonomyView.as_view(), name='taxonomy'),
    path('comics/upload-config/', ComicUploadConfigView.as_view(), name='comic-upload-config'),
    path('comics/confirm/', ComicConfirmView.as_view(), name='comic-confirm'),
]
