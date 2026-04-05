export interface IdNamedDescriptionData {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export interface TaxonomyPlatformData {
  genres: IdNamedDescriptionData[];
  tags: IdNamedDescriptionData[];
}

export type MappedData<T, V> = {
  [K in keyof T]: V;
};
