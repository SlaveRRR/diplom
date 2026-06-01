import { render, screen } from '@testing-library/react';

import { ComicReader } from './ComicReader';

const mockUseComicReaderQuery = vi.fn();

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
  useComicReaderQuery: (...args: unknown[]) => mockUseComicReaderQuery(...args),
  useComicReadingProgressMutation: () => ({
    mutate: vi.fn(),
  }),
}));

describe('ComicReader', () => {
  test('показывает skeleton в состоянии загрузки', () => {
    mockUseComicReaderQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    const { container } = render(<ComicReader />);

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  test('показывает сообщение об ошибке, если ридер не удалось открыть', () => {
    mockUseComicReaderQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(<ComicReader />);

    expect(screen.getByText('Вернуться назад')).toBeInTheDocument();
  });
});
