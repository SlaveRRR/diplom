import { useQuery } from '@tanstack/react-query';

import { api } from '@api';
import { STALE_TIME } from '@constants';

export const BLOG_POSTS_QUERY_KEY = 'blog-posts';

export const useBlogPostsQuery = () =>
  useQuery({
    queryKey: [BLOG_POSTS_QUERY_KEY],
    staleTime: STALE_TIME,
    queryFn: async () => {
      const response = await api.getBlogPosts();
      return response.data.data;
    },
  });
