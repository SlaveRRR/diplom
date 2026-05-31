import { useQuery } from '@tanstack/react-query';

import { api } from '@api';

export const ACCOUNT_QUERY_KEY = 'account';

export const useAccountQuery = (enabled = true) =>
  useQuery({
    queryKey: [ACCOUNT_QUERY_KEY],
    enabled,
    staleTime: 0,
    queryFn: async () => {
      const response = await api.getAccount();
      return response.data.data;
    },
  });
