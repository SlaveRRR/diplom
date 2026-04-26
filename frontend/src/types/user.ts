export interface User {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_active: boolean;
  is_superuser: boolean;
  active?: boolean;
  name?: string;
  surname?: string;
  avatar?: string | null;
  role: string;
  followersCount?: number;
  followingCount?: number;
}

export interface UserProfileComic {
  id: number;
  title: string;
  description: string;
  cover: string;
  coverUrl: string;
  ageRating: string;
  status: 'draft' | 'under_review' | 'published' | 'blocked' | 'revision';
  genre: string | null;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  readersCount: number;
  chaptersCount: number;
  updatedAt: string;
  publishedAt: string | null;
}

export interface UserProfilePost {
  id: number;
  title: string;
  excerpt: string;
  cover: string;
  coverUrl: string;
  status: 'draft' | 'under_review' | 'published' | 'blocked' | 'revision';
  tags: string[];
  commentsCount: number;
  updatedAt: string;
  publishedAt: string | null;
}

export interface UserProfile {
  id: number;
  username: string;
  avatar?: string | null;
  role: string;
  name: string;
  surname: string;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isCurrentUser: boolean;
  comics: UserProfileComic[];
}

export interface UserAccount {
  id: number;
  username: string;
  email: string;
  avatar?: string | null;
  role: string;
  name: string;
  surname: string;
  followersCount: number;
  followingCount: number;
  publicProfilePath: string;
  comics: UserProfileComic[];
  posts: UserProfilePost[];
}

export interface UserProfileUpdatePayload {
  username?: string;
  email?: string;
  name?: string;
  surname?: string;
}

export interface UserFollowToggleResponse {
  isActive: boolean;
  followersCount: number;
}

export interface AvatarUploadConfigPayload {
  filename: string;
  content_type: string;
}

export interface AvatarUploadTarget {
  method: string;
  key: string;
  upload_url: string;
}

export interface AvatarUploadConfigResponse {
  avatarDraftId: number;
  expiresAt: string;
  file: AvatarUploadTarget;
}

export interface AvatarUploadConfirmPayload {
  avatarDraftId: number;
}

export interface AvatarUploadConfirmResponse {
  avatar: string;
}
