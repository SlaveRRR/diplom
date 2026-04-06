from django.urls import path

from authentication.views import (
    LogoutView,
    ResendVerificationEmailView,
    SignInView,
    SignUpView,
    SocialLoginStartView,
    SocialSessionExchangeView,
    TokenRefreshCookieView,
)

urlpatterns = [
    path('signup/', SignUpView.as_view(), name='signup'),
    path('signup/resend-verification/', ResendVerificationEmailView.as_view(), name='signup-resend-verification'),
    path('signin/', SignInView.as_view(), name='signin'),
    path('token/refresh/', TokenRefreshCookieView.as_view(), name='token-refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('social/<str:provider>/start/', SocialLoginStartView.as_view(), name='social-start'),
    path('social/exchange/', SocialSessionExchangeView.as_view(), name='social-exchange'),
]
