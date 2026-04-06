import { BACKEND_URL } from '@constants';

type SocialProvider = 'google' | 'yandex' | 'vk';

export const startHeadlessSocialAuth = (provider: SocialProvider) => {
  window.location.href = `${BACKEND_URL}/api/v1/social/${provider}/start/`;
};
