import { ComicTagOption } from '@types';

export interface LocalUploadAsset {
  id: string;
  file: File;
  fingerprint: string;
  preview: string;
}

export interface ChapterDraft {
  id: string;
  title: string;
  description: string;
  chapterNumber: number;
  pages: LocalUploadAsset[];
}

export interface ComicCreateState {
  title: string;
  description: string;
  tagIds: number[];
  genreId: number;
  cover: LocalUploadAsset | null;
  banner: LocalUploadAsset | null;
  chapters: ChapterDraft[];
  currentStep: number;
}

export interface ComicCreateActions {
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setTagIds: (tagIds: number[]) => void;
  setGenreId: (genreId: number) => void;
  setCover: (cover: LocalUploadAsset | null) => void;
  setBanner: (banner: LocalUploadAsset | null) => void;
  addChapter: () => void;
  removeChapter: (chapterId: string) => void;
  updateChapter: (chapterId: string, payload: Partial<Omit<ChapterDraft, 'id' | 'pages'>>) => void;
  setChapterPages: (chapterId: string, pages: LocalUploadAsset[]) => void;
  appendChapterPages: (chapterId: string, pages: LocalUploadAsset[]) => void;
  removeChapterPage: (chapterId: string, pageIndex: number) => void;
  moveChapterPage: (chapterId: string, pageIndex: number, direction: 'backward' | 'forward') => void;
  setCurrentStep: (step: number) => void;
  reset: () => void;
}

export type ComicCreateStore = ComicCreateState & ComicCreateActions;

export interface CreateComicPayload {
  title: string;
  description: string;
  tagIds: number[];
  genreId: number;
  cover: LocalUploadAsset;
  banner: LocalUploadAsset;
  chapters: ChapterDraft[];
}

export interface StepValidationResult {
  valid: boolean;
  message?: string;
}

export interface TagSelectOption {
  label: string;
  value: number;
  option: ComicTagOption;
}

export type ComicUploadStage = 'idle' | 'config' | 'upload' | 'confirm';

export interface ComicUploadState {
  stage: ComicUploadStage;
  uploadedFiles: number;
  totalFiles: number;
}
