import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@api';
import { CURRENT_USER_QUERY_KEY } from '@hooks/useCurrentUser';

import { ACCOUNT_QUERY_KEY } from './useAccountQuery';

type DeleteDraftPayload = {
  id: number;
  kind: 'comic' | 'post';
};

export const useAccountDraftDeleteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, kind }: DeleteDraftPayload) => {
      const response = kind === 'comic' ? await api.deleteComicDraft(id) : await api.deleteBlogPostDraft(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries([ACCOUNT_QUERY_KEY]);
      queryClient.invalidateQueries([CURRENT_USER_QUERY_KEY]);
    },
  });
};
