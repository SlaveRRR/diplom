import { useQuery } from '@tanstack/react-query';

import { api } from '@api';
import { STALE_TIME } from '@constants';

export const USER_PROFILE_QUERY_KEY = 'user-profile';

export const useUserProfileQuery = (userId?: string | number) =>
  useQuery({
    queryKey: [USER_PROFILE_QUERY_KEY, userId],
    enabled: Boolean(userId),
    staleTime: STALE_TIME,
    queryFn: async () => {
      if (!userId) {
        throw new Error('Идентификатор пользователя не найден.');
      }

      const response = await api.getUserProfile(userId);
      return response.data.data;
    },
  });
