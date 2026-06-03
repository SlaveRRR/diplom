import { ContentReactionSummary } from './reaction';

export interface UploadConfigFilePayload {
  filename: string;
  content_type: string;
}

export interface UploadAssetPayload {
  existingKey?: string;
  filename?: string;
  content_type?: string;
}

export interface ChapterUploadConfigPayload {
  title: string;
  description: string;
  chapter_number: number;
  pages: UploadAssetPayload[];
}

export interface ComicUploadConfigPayload {
  comicId?: number;
  title: string;
  description: string;
  ageRating: string;
  tagIds: number[];
  genreId: number;
  cover: UploadAssetPayload;
  banner: UploadAssetPayload;
  chapters: ChapterUploadConfigPayload[];
}

export interface UploadTarget {
  method: string;
  key: string;
  upload_url: string;
}

export interface ChapterUploadConfigResponse {
  chapter_draft_id: string;
  chapter_number: number;
  pages: Array<UploadTarget & { page_index: number }>;
}

export interface ComicUploadConfigResponse {
  comic_draft_id: string;
  expires_at: string;
  cover: UploadTarget | null;
  banner: UploadTarget | null;
  chapters: ChapterUploadConfigResponse[];
}

export interface ComicConfirmPayload {
  comic_draft_id: string;
  comic_id?: number;
  submission_mode: 'draft' | 'under_review' | 'published';
}

export interface ComicConfirmResponse {
  id: number;
  comic_id?: number;
  title: string;
  status: 'draft' | 'under_review' | 'published' | 'blocked' | 'revision';
  chapter_ids: number[];
}

export interface ComicTagOption {
  id: number;
  title: string;
  description: string;
}

export interface ComicAuthor {
  id: number;
  username: string;
  avatar: string | null;
  role: string;
}

export interface ComicTaxonomyItem {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export interface ComicComment {
  id: number;
  text: string;
  createdAt: string;
  replyToId: number | null;
  author: ComicAuthor;
}

export interface ComicDetailChapter {
  id: number;
  title: string;
  description: string;
  chapterNumber: number;
  pageCount: number;
  pageKeys: string[];
  previewUrl: string;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  publishedAt: string | null;
}

export interface ComicDetailsResponse {
  id: number;
  title: string;
  description: string;
  cover: string;
  coverUrl: string;
  banner: string;
  bannerUrl: string;
  status: 'draft' | 'under_review' | 'published' | 'blocked' | 'revision';
  ageRating: string;
  genre: ComicTaxonomyItem | null;
  tags: ComicTaxonomyItem[];
  author: ComicAuthor;
  likesCount: number;
  isLiked: boolean;
  favoritesCount: number;
  isFavorite: boolean;
  averageRating: number;
  ratingsCount: number;
  userRating: number | null;
  commentsCount: number;
  reactions: ContentReactionSummary[];
  currentEmoji: string | null;
  readersCount: number;
  chaptersCount: number;
  chapters: ComicDetailChapter[];
  comments: ComicComment[];
  continueReading: ComicReadingProgress | null;
}

export interface ComicInteractionResponse {
  isActive: boolean;
  count: number;
}

export interface ComicRatingResponse {
  value: number;
  averageRating: number;
  ratingsCount: number;
}

export interface ComicCommentCreatePayload {
  text: string;
  replyToId?: number | null;
}

type Status = 'draft' | 'under_review' | 'published' | 'blocked' | 'revision';

export interface CatalogComicResponse {
  id: number;
  title: string;
  description: string;
  cover: string;
  coverUrl: string;
  ageRating: string;
  author: string;
  genreId: number | null;
  genre: string | null;
  tagIds: number[];
  tags: string[];
  rating: number;
  reviews: number;
  likesCount: number;
  readersCount: number;
  status: Status;
  isNew: boolean;
  isTrending: boolean;
}

export interface CatalogComicsQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  genreId?: number | null;
  tagIds?: number[];
  sort?: 'popular' | 'new' | 'reviews';
}

export interface ComicReadingProgress {
  chapterId: number;
  lastPage: number;
}

export interface ComicReaderPage {
  index: number;
  key: string;
  url: string;
}

export interface ComicReaderChapter {
  id: number;
  title: string;
  chapterNumber: number;
  pageCount: number;
  pages: ComicReaderPage[];
}

export interface ComicReaderChapterListItem {
  id: number;
  title: string;
  chapterNumber: number;
}

export interface ComicReaderNavigation {
  previousChapterId: number | null;
  nextChapterId: number | null;
}

export interface ComicReaderResponse {
  comicId: number;
  comicTitle: string;
  chapter: ComicReaderChapter;
  chapters: ComicReaderChapterListItem[];
  navigation: ComicReaderNavigation;
  likesCount: number;
  commentsCount: number;
  reactions: ContentReactionSummary[];
  currentEmoji: string | null;
  isLiked: boolean;
  favoritesCount: number;
  isFavorite: boolean;
  progress: ComicReadingProgress | null;
  status: Status;
}

export interface ComicEditorPage {
  key: string;
  url: string;
}

export interface ComicEditorChapter {
  id: number;
  title: string;
  description: string;
  chapterNumber: number;
  pages: ComicEditorPage[];
}

export interface ComicEditorResponse {
  id: number;
  title: string;
  description: string;
  cover: string;
  coverUrl: string;
  banner: string;
  bannerUrl: string;
  ageRating: string;
  genreId: number | null;
  tagIds: number[];
  status: Status;
  chapters: ComicEditorChapter[];
}
