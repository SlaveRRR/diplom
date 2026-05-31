import { ComicTagOption } from '@types';

export interface LocalUploadAsset {
  id: string;
  file: File | null;
  fingerprint: string;
  preview: string;
  source: 'new' | 'existing';
  storageKey?: string;
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
  ageRating: string | null;
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
  setAgeRating: (ageRating: string | null) => void;
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
  hydrate: (state: Partial<ComicCreateState>) => void;
  reset: () => void;
}

export type ComicCreateStore = ComicCreateState & ComicCreateActions;

export interface CreateComicPayload {
  comicId?: number;
  title: string;
  description: string;
  ageRating: string;
  tagIds: number[];
  genreId: number;
  cover: LocalUploadAsset;
  banner: LocalUploadAsset;
  chapters: ChapterDraft[];
  submissionMode: ComicSubmissionMode;
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

export type ComicSubmissionMode = 'draft' | 'under_review';

export type ComicUploadStage = 'idle' | 'config' | 'upload' | 'confirm';

export interface ComicUploadState {
  stage: ComicUploadStage;
  uploadedFiles: number;
  totalFiles: number;
  isDraftLocked: boolean;
  lockedDraftId: string | null;
  errorMessage: string | null;
}
