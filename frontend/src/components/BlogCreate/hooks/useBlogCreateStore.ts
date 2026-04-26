import { create } from 'zustand';

type InlineImageRecord = {
  file: File;
  previewUrl: string;
};

type BlogCreateState = {
  editingPostId: number | null;
  title: string;
  tagIds: number[];
  coverFile: File | null;
  coverPreviewUrl: string;
  inlineImages: Record<string, InlineImageRecord>;
  setEditingPostId: (postId: number | null) => void;
  setTitle: (title: string) => void;
  setTagIds: (tagIds: number[]) => void;
  setCoverFile: (file: File | null, previewUrl?: string) => void;
  hydrate: (payload: { postId: number; title: string; tagIds: number[]; coverPreviewUrl?: string }) => void;
  registerInlineImage: (uploadId: string, file: File, previewUrl: string) => void;
  removeInlineImage: (uploadId: string) => void;
  reset: () => void;
};

const revokeUrl = (url?: string) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

export const useBlogCreateStore = create<BlogCreateState>((set, get) => ({
  editingPostId: null,
  title: '',
  tagIds: [],
  coverFile: null,
  coverPreviewUrl: '',
  inlineImages: {},
  setEditingPostId: (editingPostId) => set({ editingPostId }),
  setTitle: (title) => set({ title }),
  setTagIds: (tagIds) => set({ tagIds }),
  setCoverFile: (file, previewUrl = '') =>
    set((state) => {
      revokeUrl(state.coverPreviewUrl);
      return {
        coverFile: file,
        coverPreviewUrl: previewUrl,
      };
    }),
  hydrate: ({ postId, title, tagIds, coverPreviewUrl = '' }) =>
    set((state) => {
      revokeUrl(state.coverPreviewUrl);
      Object.values(state.inlineImages).forEach((item) => revokeUrl(item.previewUrl));

      return {
        editingPostId: postId,
        title,
        tagIds,
        coverFile: null,
        coverPreviewUrl,
        inlineImages: {},
      };
    }),
  registerInlineImage: (uploadId, file, previewUrl) =>
    set((state) => {
      const existing = state.inlineImages[uploadId];
      revokeUrl(existing?.previewUrl);

      return {
        inlineImages: {
          ...state.inlineImages,
          [uploadId]: {
            file,
            previewUrl,
          },
        },
      };
    }),
  removeInlineImage: (uploadId) =>
    set((state) => {
      const nextInlineImages = { ...state.inlineImages };
      revokeUrl(nextInlineImages[uploadId]?.previewUrl);
      delete nextInlineImages[uploadId];

      return {
        inlineImages: nextInlineImages,
      };
    }),
  reset: () => {
    const { coverPreviewUrl, inlineImages } = get();
    revokeUrl(coverPreviewUrl);
    Object.values(inlineImages).forEach((item) => revokeUrl(item.previewUrl));

    set({
      editingPostId: null,
      title: '',
      tagIds: [],
      coverFile: null,
      coverPreviewUrl: '',
      inlineImages: {},
    });
  },
}));
