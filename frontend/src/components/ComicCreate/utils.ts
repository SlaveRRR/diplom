import { MAX_COMIC_CHAPTERS, MAX_COMIC_PAGES_PER_CHAPTER } from '../../utils';
import { CreateComicPayload, StepValidationResult } from './types';

export const validateStep = (step: number, payload: Partial<CreateComicPayload>): StepValidationResult => {
  if (step === 0) {
    if (!payload.title?.trim()) {
      return {
        valid: false,
        message: 'Добавьте название комикса.',
      };
    }

    if (!payload.description?.trim()) {
      return {
        valid: false,
        message: 'Добавьте описание комикса.',
      };
    }

    if (!payload.ageRating) {
      return {
        valid: false,
        message: 'Выберите возрастной рейтинг.',
      };
    }

    if (!payload.genreId) {
      return {
        valid: false,
        message: 'Выберите жанр комикса.',
      };
    }

    if (!payload.tagIds?.length) {
      return {
        valid: false,
        message: 'Выберите хотя бы один тег.',
      };
    }
  }

  if (step === 1) {
    if (!payload.cover) {
      return {
        valid: false,
        message: 'Загрузите обложку комикса.',
      };
    }

    if (!payload.banner) {
      return {
        valid: false,
        message: 'Загрузите баннер комикса.',
      };
    }
  }

  if (step === 2) {
    if (!payload.chapters?.length) {
      return {
        valid: false,
        message: 'Добавьте хотя бы одну главу.',
      };
    }

    if (payload.chapters.length > MAX_COMIC_CHAPTERS) {
      return {
        valid: false,
        message: `Количество глав не должно превышать ${MAX_COMIC_CHAPTERS}.`,
      };
    }

    const invalidChapter = payload.chapters.find(
      (chapter) => !chapter.title.trim() || !chapter.description.trim() || !chapter.pages.length,
    );

    if (invalidChapter) {
      return {
        valid: false,
        message: 'У каждой главы должны быть название, описание и хотя бы одна страница.',
      };
    }

    const oversizedChapter = payload.chapters.find((chapter) => chapter.pages.length > MAX_COMIC_PAGES_PER_CHAPTER);

    if (oversizedChapter) {
      return {
        valid: false,
        message: `В одной главе можно разместить не более ${MAX_COMIC_PAGES_PER_CHAPTER} страниц.`,
      };
    }
  }

  return {
    valid: true,
  };
};
