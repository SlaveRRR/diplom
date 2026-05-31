import { useQuery } from '@tanstack/react-query';

import { api } from '@api';
import { STALE_TIME } from '@constants';
import { BlogPostsQueryParams } from '@types';

export const BLOG_POSTS_QUERY_KEY = 'blog-posts';

export const useBlogPostsQuery = (params?: BlogPostsQueryParams) =>
  useQuery({
    queryKey: [BLOG_POSTS_QUERY_KEY, params],
    staleTime: STALE_TIME,
    queryFn: async () => {
      const response = await api.getBlogPosts(params);
      return response.data.data;
    },
  });
