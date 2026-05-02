from django.urls import path

from analytics.views import AnalyticsDashboardView, AnalyticsExportView


urlpatterns = [
    path('analytics/', AnalyticsDashboardView.as_view(), name='analytics-dashboard'),
    path('analytics/export/', AnalyticsExportView.as_view(), name='analytics-export'),
]
