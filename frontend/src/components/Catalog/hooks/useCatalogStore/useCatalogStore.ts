import { useQuery } from '@tanstack/react-query';

import { api } from '@api';
import { STALE_TIME } from '@constants';
import { CatalogComicsQueryParams } from '@types';

export const CATALOG_QUERY_KEY = 'catalog';

export const useCatalogQuery = (params?: CatalogComicsQueryParams) =>
  useQuery({
    queryKey: [CATALOG_QUERY_KEY, params],
    staleTime: STALE_TIME,
    queryFn: async () => {
      const response = await api.getCatalogComics(params);
      return response.data.data;
    },
  });
