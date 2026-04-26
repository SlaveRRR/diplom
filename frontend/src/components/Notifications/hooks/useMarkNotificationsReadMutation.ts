import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@api';

import { NOTIFICATIONS_QUERY_KEY } from './useNotificationsQuery';

export const useMarkNotificationsReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: number[]) => {
      if (!ids.length) {
        throw new Error('Выберите хотя бы одно уведомление.');
      }

      const response = await api.markNotificationsRead({ ids });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries([NOTIFICATIONS_QUERY_KEY]);
    },
  });
};
