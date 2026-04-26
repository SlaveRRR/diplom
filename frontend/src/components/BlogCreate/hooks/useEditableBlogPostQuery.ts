import { useQuery } from '@tanstack/react-query';

import { api } from '@api';

export const EDITABLE_BLOG_POST_QUERY_KEY = 'editable-blog-post';

export const useEditableBlogPostQuery = (postId?: string) =>
  useQuery({
    queryKey: [EDITABLE_BLOG_POST_QUERY_KEY, postId],
    enabled: Boolean(postId),
    queryFn: async () => {
      const response = await api.getEditableBlogPost(postId as string);
      return response.data.data;
    },
  });
