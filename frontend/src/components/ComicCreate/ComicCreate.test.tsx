import { render, screen } from '@testing-library/react';

import { ComicCreate } from './ComicCreate';

const navigateMock = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  useParams: () => ({}),
  useOutletContext: () => ({
    messageApi: {
      warning: vi.fn(),
      success: vi.fn(),
    },
  }),
  Link: () => <></>,
}));

vi.mock('@hooks', () => ({
  useCurrentUser: () => ({
    data: undefined,
  }),
  usePlatformTaxonomy: () => ({
    data: {
      genres: [],
      tags: [],
    },
    isLoading: false,
  }),
}));

vi.mock('./components', () => ({
  FirstStep: () => <div data-testid="first-step">first-step</div>,
}));

vi.mock('./hooks', () => ({
  useComicCreateStore: () => ({
    title: '',
    description: '',
    ageRating: '',
    tagIds: [],
    cover: null,
    banner: null,
    chapters: [],
    currentStep: 0,
    genreId: null,
    setCover: vi.fn(),
    setBanner: vi.fn(),
    addChapter: vi.fn(),
    removeChapter: vi.fn(),
    updateChapter: vi.fn(),
    appendChapterPages: vi.fn(),
    removeChapterPage: vi.fn(),
    moveChapterPage: vi.fn(),
    setCurrentStep: vi.fn(),
    hydrate: vi.fn(),
    reset: vi.fn(),
  }),
  useEditableComicQuery: () => ({
    data: undefined,
    isLoading: false,
  }),
  useCreateComicMutation: () => ({
    mutation: {
      isLoading: false,
      mutateAsync: vi.fn(),
    },
    uploadState: {
      stage: 'idle',
      uploadedFiles: 0,
      totalFiles: 0,
      isDraftLocked: false,
      lockedDraftId: null,
      errorMessage: null,
    },
    clearUploadLock: vi.fn(),
  }),
}));

describe('ComicCreate', () => {
  test('показывает предупреждение для неавторизованного пользователя', () => {
    render(<ComicCreate />);

    expect(screen.getByText('Нужна авторизация, чтобы загрузить комикс.')).toBeInTheDocument();
    expect(screen.getByText('Основа')).toBeInTheDocument();
    expect(screen.getByText('Медиа')).toBeInTheDocument();
    expect(screen.getByText('Главы')).toBeInTheDocument();
    expect(screen.getByText('Проверка')).toBeInTheDocument();
    expect(screen.getByTestId('first-step')).toBeInTheDocument();
  });
});
