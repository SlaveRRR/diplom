import { useQuery } from '@tanstack/react-query';

import { api } from '@api';

export const EDITABLE_COMIC_QUERY_KEY = 'editable-comic';

export const useEditableComicQuery = (comicId?: string) => {
  const query = useQuery({
    queryKey: [EDITABLE_COMIC_QUERY_KEY, comicId],
    enabled: Boolean(comicId),
    queryFn: async () => {
      const response = await api.getEditableComic(comicId as string);
      return response.data.data;
    },
  });

  return {
    ...query,
    isLoading: Boolean(comicId) && query.isLoading,
  };
};
