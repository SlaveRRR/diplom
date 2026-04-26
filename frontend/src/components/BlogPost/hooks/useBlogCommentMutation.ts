import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@api';

import { BLOG_POST_QUERY_KEY } from './useBlogPostQuery';

export const useBlogCommentMutation = (postId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { text: string; replyToId?: number | null }) => {
      if (!postId) {
        throw new Error('Пост не найден.');
      }

      const response = await api.createBlogComment(postId, payload);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries([BLOG_POST_QUERY_KEY, postId]);
    },
  });
};
