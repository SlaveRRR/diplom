import { MAX_COMIC_CHAPTERS, MAX_COMIC_PAGES_PER_CHAPTER } from '../../../utils';
import { LocalUploadAsset } from '../types';
import { useComicCreateStore } from './useComicCreateStore';

const createAsset = (id: string, fingerprint = id): LocalUploadAsset => ({
  id,
  fingerprint,
  preview: `blob:${id}`,
  file: new File([id], `${id}.png`, { type: 'image/png' }),
  source: 'new',
});

describe('useComicCreateStore', () => {
  beforeEach(() => {
    useComicCreateStore.getState().reset();
  });

  test('добавляет главы и сохраняет корректную нумерацию после удаления', () => {
    useComicCreateStore.getState().addChapter();
    useComicCreateStore.getState().addChapter();

    const initialChapters = useComicCreateStore.getState().chapters;
    expect(initialChapters.map((chapter) => chapter.chapterNumber)).toEqual([1, 2, 3]);

    useComicCreateStore.getState().removeChapter(initialChapters[1].id);

    expect(useComicCreateStore.getState().chapters.map((chapter) => chapter.chapterNumber)).toEqual([1, 2]);
  });

  test('сохраняет хотя бы одну главу при удалении последней', () => {
    const [firstChapter] = useComicCreateStore.getState().chapters;

    useComicCreateStore.getState().removeChapter(firstChapter.id);

    expect(useComicCreateStore.getState().chapters).toHaveLength(1);
    expect(useComicCreateStore.getState().chapters[0].chapterNumber).toBe(1);
  });

  test('пропускает страницы с дублирующимися отпечатками и позволяет менять порядок', () => {
    const [chapter] = useComicCreateStore.getState().chapters;
    const page1 = createAsset('page-1', 'fingerprint-1');
    const duplicatePage1 = createAsset('page-1-duplicate', 'fingerprint-1');
    const page2 = createAsset('page-2', 'fingerprint-2');

    useComicCreateStore.getState().setChapterPages(chapter.id, [page1]);
    useComicCreateStore.getState().appendChapterPages(chapter.id, [duplicatePage1, page2]);

    expect(useComicCreateStore.getState().chapters[0].pages.map((page) => page.id)).toEqual(['page-1', 'page-2']);

    useComicCreateStore.getState().moveChapterPage(chapter.id, 0, 'forward');

    expect(useComicCreateStore.getState().chapters[0].pages.map((page) => page.id)).toEqual(['page-2', 'page-1']);
  });

  test('сброс возвращает стор в исходное состояние создания', () => {
    const [chapter] = useComicCreateStore.getState().chapters;

    useComicCreateStore.getState().setTitle('Moon Tower');
    useComicCreateStore.getState().setDescription('Description');
    useComicCreateStore.getState().setAgeRating('16+');
    useComicCreateStore.getState().setTagIds([1, 2]);
    useComicCreateStore.getState().setGenreId(5);
    useComicCreateStore.getState().setChapterPages(chapter.id, [createAsset('page-1')]);
    useComicCreateStore.getState().setCurrentStep(2);

    useComicCreateStore.getState().reset();

    expect(useComicCreateStore.getState()).toMatchObject({
      title: '',
      description: '',
      ageRating: null,
      tagIds: [],
      genreId: null,
      cover: null,
      banner: null,
      currentStep: 0,
    });
    expect(useComicCreateStore.getState().chapters).toHaveLength(1);
    expect(useComicCreateStore.getState().chapters[0].pages).toEqual([]);
  });

  test('не позволяет добавить больше 50 глав', () => {
    Array.from({ length: MAX_COMIC_CHAPTERS + 10 }).forEach(() => {
      useComicCreateStore.getState().addChapter();
    });

    expect(useComicCreateStore.getState().chapters).toHaveLength(MAX_COMIC_CHAPTERS);
    expect(useComicCreateStore.getState().chapters.at(-1)?.chapterNumber).toBe(MAX_COMIC_CHAPTERS);
  });

  test('не позволяет хранить больше 50 страниц в одной главе', () => {
    const [chapter] = useComicCreateStore.getState().chapters;
    const pages = Array.from({ length: MAX_COMIC_PAGES_PER_CHAPTER + 10 }, (_, index) =>
      createAsset(`page-${index + 1}`, `fingerprint-${index + 1}`),
    );

    useComicCreateStore.getState().appendChapterPages(chapter.id, pages);

    expect(useComicCreateStore.getState().chapters[0].pages).toHaveLength(MAX_COMIC_PAGES_PER_CHAPTER);
  });
});
