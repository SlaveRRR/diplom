import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@api';
import { BLOG_POSTS_QUERY_KEY } from '@components/Blog/hooks';
import { CATALOG_QUERY_KEY } from '@components/Catalog/hooks/useCatalogStore/useCatalogStore';
import { FAVORITE_COMICS_QUERY_KEY } from '@components/Favorites/hooks/useFavoriteComicsQuery';
import { READING_HISTORY_QUERY_KEY } from '@components/History/hooks/useReadingHistoryQuery';
import { HOME_QUERY_KEY } from '@components/Home/hooks';
import { USER_PROFILE_QUERY_KEY } from '@components/Profile/hooks/useUserProfileQuery';

import { ACCOUNT_QUERY_KEY } from './useAccountQuery';

type ToggleVisibilityPayload = {
  id: number;
  kind: 'comic' | 'post';
};

export const useAccountContentVisibilityMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, kind }: ToggleVisibilityPayload) => {
      const response = kind === 'comic' ? await api.toggleComicVisibility(id) : await api.toggleBlogPostVisibility(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries([ACCOUNT_QUERY_KEY]);
      queryClient.invalidateQueries([USER_PROFILE_QUERY_KEY]);
      queryClient.invalidateQueries([HOME_QUERY_KEY]);
      queryClient.invalidateQueries([CATALOG_QUERY_KEY]);
      queryClient.invalidateQueries([BLOG_POSTS_QUERY_KEY]);
      queryClient.invalidateQueries([FAVORITE_COMICS_QUERY_KEY]);
      queryClient.invalidateQueries([READING_HISTORY_QUERY_KEY]);
    },
  });
};
