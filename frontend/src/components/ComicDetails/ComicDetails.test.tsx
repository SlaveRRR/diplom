import { render, screen } from '@testing-library/react';

import { ComicDetails } from './ComicDetails';

const navigateMock = vi.fn();
const successMock = vi.fn();
const errorMock = vi.fn();

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => navigateMock,
  useLocation: () => ({ pathname: '/comics/9', search: '', hash: '' }),
  useOutletContext: () => ({
    messageApi: {
      success: successMock,
      error: errorMock,
    },
  }),
  useParams: () => ({ comicId: '9' }),
}));

vi.mock('@hooks/useApp', () => ({
  useApp: () => ({ isAuth: false }),
}));

vi.mock('@hooks/useRequireAuthAction', () => ({
  useRequireAuthAction: () => ({ redirectToAuth: vi.fn() }),
}));

vi.mock('./hooks', () => ({
  useComicCommentMutation: () => ({
    isLoading: false,
    mutateAsync: vi.fn(),
  }),
  useComicCommentsSocket: vi.fn(),
  useComicDetailsQuery: () => ({
    data: undefined,
    isLoading: false,
    isError: true,
  }),
  useComicFavoriteMutation: () => ({
    isLoading: false,
    mutateAsync: vi.fn(),
  }),
  useComicLikeMutation: () => ({
    isLoading: false,
    mutateAsync: vi.fn(),
  }),
  useComicRatingMutation: () => ({
    isLoading: false,
    mutateAsync: vi.fn(),
  }),
}));

describe('ComicDetails', () => {
  test('показывает пустое состояние, если комикс не найден', () => {
    render(<ComicDetails />);

    expect(screen.getByText('Похоже, этого комикса пока нет в каталоге.')).toBeInTheDocument();
    expect(screen.getByText('Вернуться в каталог')).toBeInTheDocument();
  });
});
