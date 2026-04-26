import { useQuery } from '@tanstack/react-query';

import { api } from '@api';
import { STALE_TIME } from '@constants';

export const BLOG_TAGS_QUERY_KEY = 'blog-tags';

export const useBlogTagsQuery = () =>
  useQuery({
    queryKey: [BLOG_TAGS_QUERY_KEY],
    staleTime: STALE_TIME,
    queryFn: async () => {
      const response = await api.getBlogTags();
      return response.data.data;
    },
  });
