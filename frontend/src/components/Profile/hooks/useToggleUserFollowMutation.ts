import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@api';

import { USER_PROFILE_QUERY_KEY } from './useUserProfileQuery';

export const useToggleUserFollowMutation = (userId?: string | number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error('Идентификатор пользователя не найден.');
      }

      const response = await api.toggleUserFollow(userId);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries([USER_PROFILE_QUERY_KEY, userId]);
    },
  });
};
