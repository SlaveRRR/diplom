import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@api';
import { ContentReactionState } from '@types';

import { BLOG_POST_QUERY_KEY } from './useBlogPostQuery';

export const useBlogReactionMutation = (postId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (emoji: string) => {
      if (!postId) {
        throw new Error('Пост не найден.');
      }

      const response = await api.toggleBlogPostReaction(postId, { emoji });
      return response.data.data;
    },
    onSuccess: (payload: ContentReactionState) => {
      queryClient.setQueriesData({ queryKey: [BLOG_POST_QUERY_KEY, postId] }, (current: unknown) => {
        if (!current || typeof current !== 'object') {
          return current;
        }

        return {
          ...(current as Record<string, unknown>),
          reactions: payload.reactions,
          currentEmoji: payload.currentEmoji,
        };
      });
    },
  });
};
