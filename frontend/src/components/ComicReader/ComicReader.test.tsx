import { render, screen } from '@testing-library/react';

import { ComicReader } from './ComicReader';

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/comics/12/chapters/3', search: '', hash: '' }),
  useOutletContext: () => ({
    messageApi: {
      success: vi.fn(),
      error: vi.fn(),
    },
  }),
  useParams: () => ({
    comicId: '12',
    chapterId: '3',
  }),
  useSearchParams: () => [new URLSearchParams()],
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

vi.mock('@hooks/useApp', () => ({
  useApp: () => ({
    isAuth: false,
  }),
}));

vi.mock('@hooks/useRequireAuthAction', () => ({
  useRequireAuthAction: () => ({
    redirectToAuth: vi.fn(),
  }),
}));

vi.mock('./hooks', () => ({
  useComicReaderQuery: () => ({
    data: undefined,
    isLoading: false,
    isError: true,
  }),
  useComicReadingProgressMutation: () => ({
    mutate: vi.fn(),
  }),
}));

describe('ComicReader', () => {
  test('показывает сообщение об ошибке, если ридер не удалось открыть', () => {
    render(<ComicReader />);

    expect(screen.getByText('Не удалось открыть ридер этой главы.')).toBeInTheDocument();
    expect(screen.getByText('Вернуться назад')).toBeInTheDocument();
  });
});
