import { useQuery } from '@tanstack/react-query';

import { api } from '@api';
import { STALE_TIME } from '@constants';

export const NOTIFICATIONS_QUERY_KEY = 'notifications';

export const useNotificationsQuery = (enabled = true) =>
  useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY],
    enabled,
    staleTime: STALE_TIME,
    queryFn: async () => {
      const response = await api.getNotifications();
      return response.data.data;
    },
  });
