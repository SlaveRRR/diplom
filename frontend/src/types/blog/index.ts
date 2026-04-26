export interface BlogTag {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export interface BlogAuthor {
  id: number;
  username: string;
  avatar: string | null;
  role: string;
}

export interface BlogComment {
  id: number;
  text: string;
  createdAt: string;
  replyToId: number | null;
  author: BlogAuthor;
}

export interface BlogPostListItem {
  id: number;
  title: string;
  excerpt: string;
  cover: string;
  coverUrl: string;
  tags: BlogTag[];
  author: BlogAuthor;
  commentsCount: number;
  publishedAt: string;
}

export interface BlogPostDetail {
  id: number;
  title: string;
  content: Record<string, unknown>;
  cover: string;
  coverUrl: string;
  tags: BlogTag[];
  author: BlogAuthor;
  comments: BlogComment[];
  commentsCount: number;
  publishedAt: string;
}

export interface BlogEditablePost {
  id: number;
  title: string;
  content: Record<string, unknown>;
  cover: string;
  coverUrl: string;
  tagIds: number[];
  status: 'draft' | 'under_review' | 'published' | 'blocked' | 'revision';
}

export interface BlogUploadFilePayload {
  filename: string;
  content_type: string;
}

export interface BlogInlineImageUploadPayload extends BlogUploadFilePayload {
  uploadId: string;
}

export interface BlogPostUploadConfigPayload {
  cover?: BlogUploadFilePayload | null;
  inlineImages: BlogInlineImageUploadPayload[];
}

export interface BlogUploadTarget {
  method: string;
  key: string;
  upload_url: string;
}

export interface BlogInlineImageUploadTarget extends BlogUploadTarget {
  uploadId: string;
}

export interface BlogPostUploadConfigResponse {
  postDraftId: number;
  expiresAt: string;
  cover: BlogUploadTarget | null;
  inlineImages: BlogInlineImageUploadTarget[];
}

export interface BlogPostConfirmPayload {
  postId?: number | null;
  postDraftId: number;
  title: string;
  content: Record<string, unknown>;
  tagIds: number[];
  status: 'draft' | 'under_review';
}

export interface BlogPostCreateResponse {
  id: number;
  title: string;
  coverUrl: string;
  status: 'draft' | 'under_review' | 'published' | 'blocked' | 'revision';
}

export interface BlogCommentCreatePayload {
  text: string;
  replyToId?: number | null;
}
