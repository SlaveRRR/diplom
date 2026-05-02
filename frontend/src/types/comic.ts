export interface UploadConfigFilePayload {
  filename: string;
  content_type: string;
}

export interface ChapterUploadConfigPayload {
  title: string;
  description: string;
  chapter_number: number;
  pages: UploadConfigFilePayload[];
}

export interface ComicUploadConfigPayload {
  title: string;
  description: string;
  ageRating: string;
  tagIds: number[];
  genreId: number;
  cover: UploadConfigFilePayload;
  banner: UploadConfigFilePayload;
  chapters: ChapterUploadConfigPayload[];
}

export interface UploadTarget {
  method: string;
  key: string;
  upload_url: string;
}

export interface ChapterUploadConfigResponse {
  draft_id: string;
  chapter_number: number;
  pages: UploadTarget[];
}

export interface ComicUploadConfigResponse {
  comic_draft_id: string;
  expires_at: string;
  cover: UploadTarget;
  banner: UploadTarget;
  chapters: ChapterUploadConfigResponse[];
}

export interface ComicConfirmPayload {
  comic_draft_id: string;
}

export interface ComicConfirmResponse {
  comic_id: number;
  title: string;
  status: string;
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
  status: 'draft' | 'under_review' | 'published' | 'blocked' | 'revision';
  isNew: boolean;
  isTrending: boolean;
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
  isLiked: boolean;
  favoritesCount: number;
  isFavorite: boolean;
  progress: ComicReadingProgress | null;
}
