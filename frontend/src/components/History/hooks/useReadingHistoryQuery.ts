import { useQuery } from '@tanstack/react-query';

import { api } from '@api';
import { STALE_TIME } from '@constants';

export const READING_HISTORY_QUERY_KEY = 'reading-history';

export const useReadingHistoryQuery = () =>
  useQuery({
    queryKey: [READING_HISTORY_QUERY_KEY],
    staleTime: STALE_TIME,
    queryFn: async () => {
      const response = await api.getReadingHistory();
      return response.data.data;
    },
  });
