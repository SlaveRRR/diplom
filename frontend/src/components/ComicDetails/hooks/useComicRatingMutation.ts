import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@api';
import { ComicDetailsResponse } from '@types';
import { CATALOG_QUERY_KEY } from '@components/Catalog/hooks/useCatalogStore/useCatalogStore';

import { COMIC_DETAILS_QUERY_KEY } from './useComicDetailsQuery';

export const useComicRatingMutation = (comicId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (value: number) => {
      if (!comicId) {
        throw new Error('Комикс не найден.');
      }

      const response = await api.rateComic(comicId, value);
      return response.data.data;
    },
    onSuccess: (payload) => {
      queryClient.setQueryData<ComicDetailsResponse | undefined>([COMIC_DETAILS_QUERY_KEY, comicId], (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          averageRating: payload.averageRating,
          ratingsCount: payload.ratingsCount,
          userRating: payload.value,
        };
      });

      queryClient.invalidateQueries([COMIC_DETAILS_QUERY_KEY, comicId]);
      queryClient.invalidateQueries([CATALOG_QUERY_KEY]);
    },
  });
};
