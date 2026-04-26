from django.urls import path

from interactions.views import NotificationListView, NotificationMarkReadView, ReadingHistoryView


urlpatterns = [
    path('notifications/', NotificationListView.as_view(), name='notifications-list'),
    path('notifications/read/', NotificationMarkReadView.as_view(), name='notifications-read'),
    path('history/', ReadingHistoryView.as_view(), name='reading-history'),
]
