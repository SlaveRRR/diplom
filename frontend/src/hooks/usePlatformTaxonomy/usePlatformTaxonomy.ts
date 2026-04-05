import { useQuery } from '@tanstack/react-query';

import { api } from '@api';
import { STALE_TIME } from '@constants';
import { convertIdNamedObjectToSelectOption } from '@utils';

export const TAXONOMY_PLATFORM_QUERY_KEY = 'taxonomy';

export const usePlatformTaxonomy = () =>
  useQuery({
    queryFn: api.getPlatformTaxonomy,
    queryKey: [TAXONOMY_PLATFORM_QUERY_KEY],
    staleTime: STALE_TIME,
    select: ({ data }) => convertIdNamedObjectToSelectOption(data.data),
  });
