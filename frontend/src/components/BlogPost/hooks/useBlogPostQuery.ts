import { useQuery } from '@tanstack/react-query';

import { api } from '@api';
import { STALE_TIME } from '@constants';

export const BLOG_POST_QUERY_KEY = 'blog-post';

export const useBlogPostQuery = (postId?: string, preview?: boolean) =>
  useQuery({
    queryKey: [BLOG_POST_QUERY_KEY, postId, preview],
    enabled: Boolean(postId),
    staleTime: STALE_TIME,
    queryFn: async () => {
      if (!postId) {
        throw new Error('Пост не найден.');
      }

      const response = await api.getBlogPost(postId, { preview });
      return response.data.data;
    },
  });
