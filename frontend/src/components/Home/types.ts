import type { MasonryItemType } from 'antd/es/masonry/MasonryItem';

export type GenreItem = {
  title: string;
  image: string;
  height: number;
};

export type GenreMasonryItem = MasonryItemType<GenreItem>;

export type ShowcaseItem = {
  title: string;
  subtitle: string;
  meta: string;
  image: string;
};

export type EditorialSlide = {
  title: string;
  description: string;
  tags: string[];
  image: string;
  quote: string;
  quoteMeta: string;
};

export type ShortcutItem = {
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: React.ReactNode;
  accent: string;
  iconBackground: string;
  iconColor: string;
  disabled?: boolean;
};

export type SlideInnerStyledProps = {
  $image: string;
};

export type CategoryCardStyledProps = {
  $height: number;
};

export type CategoryMediaStyledProps = {
  $image: string;
};

export type ShowcaseBadgeStyledProps = {
  $background: string;
  $color: string;
};

export type ShowcaseCoverStyledProps = {
  $image: string;
};

export type ShortcutCardStyledProps = {
  $accent: string;
};
