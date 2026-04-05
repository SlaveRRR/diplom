import { useQuery } from '@tanstack/react-query';

import { api } from '@api';

export const CURRENT_USER_QUERY_KEY = 'current_user';

type UseCurrentUserOptions = {
  enabled?: boolean;
};

export const useCurrentUser = ({ enabled = true }: UseCurrentUserOptions = {}) =>
  useQuery({
    enabled,
    queryFn: api.getCurrentUser,
    queryKey: [CURRENT_USER_QUERY_KEY],
    retry: false,
    select: ({ data }) => data.data,
  });
