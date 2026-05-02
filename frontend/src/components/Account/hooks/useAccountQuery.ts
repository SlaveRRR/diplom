import { useQuery } from '@tanstack/react-query';

import { api } from '@api';
import { STALE_TIME } from '@constants';

export const ACCOUNT_QUERY_KEY = 'account';

export const useAccountQuery = (enabled = true) =>
  useQuery({
    queryKey: [ACCOUNT_QUERY_KEY],
    enabled,
    staleTime: STALE_TIME,
    queryFn: async () => {
      const response = await api.getAccount();
      return response.data.data;
    },
  });
