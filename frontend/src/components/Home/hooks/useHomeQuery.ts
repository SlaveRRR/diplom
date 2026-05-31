import { useQuery } from '@tanstack/react-query';

import { api } from '@api';

export const HOME_QUERY_KEY = 'home-selections';

export const useHomeQuery = () =>
  useQuery({
    queryKey: [HOME_QUERY_KEY],
    queryFn: async () => {
      const response = await api.getHomeSelections();
      return response.data.data;
    },
  });
