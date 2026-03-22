from django.urls import path

from users.views import CurrentUserView


urlpatterns = [
    path('users/me/', CurrentUserView.as_view(), name='current-user'),
]
