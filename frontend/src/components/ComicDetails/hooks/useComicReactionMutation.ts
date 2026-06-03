import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@api';
import { ContentReactionState } from '@types';
import { COMIC_READER_QUERY_KEY } from '@components/ComicReader/hooks/useComicReaderQuery';

import { COMIC_DETAILS_QUERY_KEY } from './useComicDetailsQuery';

export const useComicReactionMutation = (comicId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (emoji: string) => {
      if (!comicId) {
        throw new Error('Комикс не найден.');
      }

      const response = await api.toggleComicReaction(comicId, { emoji });
      return response.data.data;
    },
    onSuccess: (payload: ContentReactionState) => {
      queryClient.setQueriesData({ queryKey: [COMIC_DETAILS_QUERY_KEY, comicId] }, (current: unknown) => {
        if (!current || typeof current !== 'object') {
          return current;
        }

        return {
          ...(current as Record<string, unknown>),
          reactions: payload.reactions,
          currentEmoji: payload.currentEmoji,
        };
      });

      queryClient.setQueriesData({ queryKey: [COMIC_READER_QUERY_KEY, comicId] }, (current: unknown) => {
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
