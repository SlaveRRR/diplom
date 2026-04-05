import { useQuery } from '@tanstack/react-query';

import { comicTagOptionsMock } from '../data/tags';

export const COMIC_TAGS_QUERY_KEY = 'comic-tags';

export const useComicTagsQuery = () => {
  return useQuery({
    queryFn: async () => comicTagOptionsMock,
    queryKey: [COMIC_TAGS_QUERY_KEY],
    staleTime: Infinity,
  });
};
