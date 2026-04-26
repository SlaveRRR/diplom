export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationItem {
  id: number;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationListResponse {
  unreadCount: number;
  items: NotificationItem[];
}

export interface NotificationMarkReadPayload {
  ids: number[];
}

export interface NotificationMarkReadResponse {
  updatedCount: number;
  unreadCount: number;
}

export interface ComicReadingHistoryItem {
  comicId: number;
  title: string;
  cover: string;
  coverUrl: string;
  ageRating: string;
  chapterId: number | null;
  chapterTitle: string | null;
  lastPage: number;
  lastReadAt: string;
  path: string;
}

export interface PostReadingHistoryItem {
  postId: number;
  title: string;
  cover: string;
  coverUrl: string;
  excerpt: string;
  lastReadAt: string;
  path: string;
}

export interface ReadingHistoryResponse {
  comics: ComicReadingHistoryItem[];
  posts: PostReadingHistoryItem[];
}
