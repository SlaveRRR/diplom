from django.urls import path

from authentication.views import LogoutView, SignInView, SignUpView, TokenRefreshCookieView

urlpatterns = [
    path('signup/', SignUpView.as_view(), name='signup'),
    path('signin/', SignInView.as_view(), name='signin'),
    path('token/refresh/', TokenRefreshCookieView.as_view(), name='token-refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
]
