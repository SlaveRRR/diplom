from allauth.socialaccount.adapter import DefaultSocialAccountAdapter

class SocialAccountAdapter(DefaultSocialAccountAdapter):
    YANDEX_AVATAR_BASE_URL = 'https://avatars.yandex.net/get-yapic'
    YANDEX_AVATAR_SIZE = 'islands-34'

    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(request, sociallogin, data)
        avatar_url = self.get_social_avatar_url(sociallogin)

        if avatar_url:
            user.avatar = avatar_url

        return user

    def get_social_avatar_url(self, sociallogin):
        try:
            avatar_url = sociallogin.account.get_avatar_url()
        except Exception:
            avatar_url = None

        if avatar_url:
            return avatar_url

        if sociallogin.account.provider == 'yandex':
            return self.build_yandex_avatar_url(sociallogin.account.extra_data)

        return None

    def build_yandex_avatar_url(self, extra_data):
        avatar_id = extra_data.get('default_avatar_id')
        is_avatar_empty = extra_data.get('is_avatar_empty')

        if not avatar_id or is_avatar_empty:
            return None

        return f'{self.YANDEX_AVATAR_BASE_URL}/{avatar_id}/{self.YANDEX_AVATAR_SIZE}'
