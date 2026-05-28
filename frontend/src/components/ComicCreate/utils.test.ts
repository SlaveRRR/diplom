import { CreateComicPayload } from './types';
import { validateStep } from './utils';

const createValidPayload = (): CreateComicPayload => ({
  title: 'Лунная башня',
  description: 'Описание комикса',
  ageRating: '16+',
  tagIds: [1],
  genreId: 2,
  cover: {
    id: 'cover',
    fingerprint: 'cover',
    preview: 'blob:cover',
    file: new File(['cover'], 'cover.png', { type: 'image/png' }),
  },
  banner: {
    id: 'banner',
    fingerprint: 'banner',
    preview: 'blob:banner',
    file: new File(['banner'], 'banner.png', { type: 'image/png' }),
  },
  chapters: [
    {
      id: 'chapter-1',
      title: 'Глава 1',
      description: 'Начало',
      chapterNumber: 1,
      pages: [
        {
          id: 'page-1',
          fingerprint: 'page-1',
          preview: 'blob:page-1',
          file: new File(['page'], 'page.png', { type: 'image/png' }),
        },
      ],
    },
  ],
});

describe('validateStep', () => {
  test('возвращает невалидный результат при отсутствии базовых данных на шаге 0', () => {
    expect(validateStep(0, { description: 'text', ageRating: '16+', genreId: 1, tagIds: [1] })).toMatchObject({
      valid: false,
    });
    expect(validateStep(0, { title: 'Title', ageRating: '16+', genreId: 1, tagIds: [1] })).toMatchObject({
      valid: false,
    });
  });

  test('возвращает невалидный результат при отсутствии медиа на шаге 1', () => {
    const payload = createValidPayload();

    expect(validateStep(1, { banner: payload.banner })).toMatchObject({ valid: false });
    expect(validateStep(1, { cover: payload.cover })).toMatchObject({ valid: false });
  });

  test('возвращает невалидный результат при незаполненных главах на шаге 2', () => {
    expect(
      validateStep(2, {
        chapters: [
          {
            id: 'chapter-1',
            title: '',
            description: 'Описание',
            chapterNumber: 1,
            pages: [],
          },
        ],
      }),
    ).toMatchObject({
      valid: false,
    });
  });

  test('возвращает валидный результат для полностью заполненных данных', () => {
    expect(validateStep(0, createValidPayload())).toEqual({ valid: true });
    expect(validateStep(1, createValidPayload())).toEqual({ valid: true });
    expect(validateStep(2, createValidPayload())).toEqual({ valid: true });
  });
});
