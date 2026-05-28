import os

from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from core.admin_views import admin_logs_view

admin.site.site_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:5173').rstrip('/')}/"

urlpatterns = [
    path('admin/logs/', admin.site.admin_view(admin_logs_view), name='admin-logs'),
    path('admin/', admin.site.urls),
    path('accounts/', include('allauth.urls')),
    path('_allauth/', include('allauth.headless.urls')),
    path('verification/', include('verify_email.urls')),
    path('api/v1/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/v1/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger'),
    path('api/v1/', include('authentication.urls')),
    path('api/v1/', include('analytics.urls')),
    path('api/v1/', include('users.urls')),
    path('api/v1/', include('comics.urls')),
    path('api/v1/', include('blog.urls')),
    path('api/v1/', include('interactions.urls')),
]
