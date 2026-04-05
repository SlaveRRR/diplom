import { create } from 'zustand';

import { ChapterDraft, ComicCreateStore } from '../types';

const createChapterDraft = (chapterNumber: number): ChapterDraft => ({
  id: crypto.randomUUID(),
  title: '',
  description: '',
  chapterNumber,
  pages: [],
});

const initialState = {
  title: '',
  description: '',
  tagIds: [],
  genreId: null,
  cover: null,
  banner: null,
  chapters: [createChapterDraft(1)],
  currentStep: 0,
};

export const useComicCreateStore = create<ComicCreateStore>()((set) => ({
  ...initialState,
  setTitle: (title) => set({ title }),
  setDescription: (description) => set({ description }),
  setTagIds: (tagIds) => set({ tagIds }),
  setGenreId: (genreId) => set({ genreId }),
  setCover: (cover) => set({ cover }),
  setBanner: (banner) => set({ banner }),
  addChapter: () =>
    set((state) => ({
      chapters: [...state.chapters, createChapterDraft(state.chapters.length + 1)],
    })),
  removeChapter: (chapterId) =>
    set((state) => {
      const chapters = state.chapters.filter((chapter) => chapter.id !== chapterId);

      return {
        chapters: chapters.length
          ? chapters.map((chapter, index) => ({
              ...chapter,
              chapterNumber: index + 1,
            }))
          : [createChapterDraft(1)],
      };
    }),
  updateChapter: (chapterId, payload) =>
    set((state) => ({
      chapters: state.chapters.map((chapter) => (chapter.id === chapterId ? { ...chapter, ...payload } : chapter)),
    })),
  setChapterPages: (chapterId, pages) =>
    set((state) => ({
      chapters: state.chapters.map((chapter) => (chapter.id === chapterId ? { ...chapter, pages } : chapter)),
    })),
  appendChapterPages: (chapterId, pages) =>
    set((state) => ({
      chapters: state.chapters.map((chapter) =>
        chapter.id === chapterId
          ? {
              ...chapter,
              pages: [
                ...chapter.pages,
                ...pages.filter(
                  (nextPage) => !chapter.pages.some((currentPage) => currentPage.fingerprint === nextPage.fingerprint),
                ),
              ],
            }
          : chapter,
      ),
    })),
  removeChapterPage: (chapterId, pageIndex) =>
    set((state) => ({
      chapters: state.chapters.map((chapter) =>
        chapter.id === chapterId
          ? {
              ...chapter,
              pages: chapter.pages.filter((_, index) => index !== pageIndex),
            }
          : chapter,
      ),
    })),
  moveChapterPage: (chapterId, pageIndex, direction) =>
    set((state) => ({
      chapters: state.chapters.map((chapter) => {
        if (chapter.id !== chapterId) {
          return chapter;
        }

        const nextIndex = direction === 'backward' ? pageIndex - 1 : pageIndex + 1;

        if (nextIndex < 0 || nextIndex >= chapter.pages.length) {
          return chapter;
        }

        const pages = [...chapter.pages];
        const [movedPage] = pages.splice(pageIndex, 1);
        pages.splice(nextIndex, 0, movedPage);

        return {
          ...chapter,
          pages,
        };
      }),
    })),
  setCurrentStep: (currentStep) => set({ currentStep }),
  reset: () => set(initialState),
}));
