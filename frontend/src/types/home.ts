import { BlogPostListItem } from './blog';
import { CatalogComicResponse } from './comic';

export type HomeTaxonomyTileKind = 'genre' | 'tag';

export interface HomeTaxonomyTileItem {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export interface HomeTaxonomyTile {
  key: string;
  kind: HomeTaxonomyTileKind;
  href: string;
  height: number;
  accent: string;
  surface: string;
  item: HomeTaxonomyTileItem;
}

export interface HomeSelectionsResponse {
  heroComics: CatalogComicResponse[];
  popularComics: CatalogComicResponse[];
  freshComics: CatalogComicResponse[];
  popularPosts: BlogPostListItem[];
  freshPosts: BlogPostListItem[];
  taxonomyTiles: HomeTaxonomyTile[];
}
