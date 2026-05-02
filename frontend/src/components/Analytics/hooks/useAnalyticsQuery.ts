import { useQuery } from '@tanstack/react-query';

import { api } from '@api';
import { AnalyticsQueryParams } from '@types';

export const ANALYTICS_QUERY_KEY = 'analytics-dashboard';

export const useAnalyticsQuery = (params: AnalyticsQueryParams) =>
  useQuery({
    queryKey: [ANALYTICS_QUERY_KEY, params],
    queryFn: async () => {
      const response = await api.getAnalytics(params);
      return response.data.data;
    },
  });
