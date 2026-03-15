export type ComicStatus = 'ongoing' | 'completed' | 'paused' | 'announced';

export interface CatalogItem {
  /** Уникальный идентификатор */
  id: string;

  /** Название комикса */
  title: string;

  /** Подзаголовок/том */
  subtitle: string;

  /** Автор */
  author: string;

  /** Основной жанр */
  genre: string;

  /** Теги для фильтрации */
  tags: string[];

  /** Рейтинг (0-5) */
  rating: number;

  /** Количество отзывов */
  reviews: number;

  /** Статус публикации */
  status: ComicStatus;

  /** Флаг "Новинка" */
  isNew: boolean;

  /** Флаг "Популярное" */
  isTrending: boolean;

  /** URL обложки */
  coverUrl: string;

  /** Описание комикса */
  description: string;
}
