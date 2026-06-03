from django.urls import path

from users.views import AccountView, AvatarConfirmView, AvatarUploadConfigView, CurrentUserView, PublicProfileView, UserAchievementsView, UserFollowToggleView, UserMonthlyRecapView


urlpatterns = [
    path('users/me/', CurrentUserView.as_view(), name='current-user'),
    path('users/me/achievements/', UserAchievementsView.as_view(), name='user-achievements'),
    path('users/me/recap/', UserMonthlyRecapView.as_view(), name='user-monthly-recap'),
    path('account/', AccountView.as_view(), name='account'),
    path('account/avatar-upload-config/', AvatarUploadConfigView.as_view(), name='account-avatar-upload-config'),
    path('account/avatar-confirm/', AvatarConfirmView.as_view(), name='account-avatar-confirm'),
    path('profiles/<int:user_id>/', PublicProfileView.as_view(), name='user-profile'),
    path('profiles/<int:user_id>/follow/', UserFollowToggleView.as_view(), name='user-follow-toggle'),
]
