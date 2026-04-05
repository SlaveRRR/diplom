import { TaxonomyPlatformData } from '@types';

export interface UsePlatformTaxonomyParams<TSelectResult> {
  select?: (data: TaxonomyPlatformData) => TSelectResult;
}
