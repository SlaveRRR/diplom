import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@api';
import { Response, User, UserProfileUpdatePayload } from '@types';
import { CURRENT_USER_QUERY_KEY } from '@hooks/useCurrentUser';

import { USER_PROFILE_QUERY_KEY } from './useUserProfileQuery';

const ACCOUNT_QUERY_KEY = 'account';

const unwrapUserPayload = (payload: User | Response<User>): User => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data;
  }

  return payload as User;
};

export const useUpdateCurrentProfileMutation = (userId?: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UserProfileUpdatePayload) => {
      const response = await api.updateCurrentUser(data);
      return unwrapUserPayload(response.data);
    },
    onSuccess: (payload) => {
      queryClient.setQueryData([CURRENT_USER_QUERY_KEY], {
        data: payload,
      });

      queryClient.invalidateQueries([CURRENT_USER_QUERY_KEY]);
      queryClient.invalidateQueries([ACCOUNT_QUERY_KEY]);
      const nextUserId = userId ?? payload.id;
      queryClient.invalidateQueries([USER_PROFILE_QUERY_KEY, nextUserId]);
    },
  });
};
