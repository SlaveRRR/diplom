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

    const invalidChapter = payload.chapters.find(
      (chapter) => !chapter.title.trim() || !chapter.description.trim() || !chapter.pages.length,
    );

    if (invalidChapter) {
      return {
        valid: false,
        message: 'У каждой главы должны быть название, описание и хотя бы одна страница.',
      };
    }
  }

  return {
    valid: true,
  };
};
