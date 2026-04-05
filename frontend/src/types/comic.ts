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
