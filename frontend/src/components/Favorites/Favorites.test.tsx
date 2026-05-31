import { render, screen } from '@testing-library/react';

import { Favorites } from './Favorites';

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  useOutletContext: () => ({ messageApi: { success: vi.fn() } }),
}));

vi.mock('@hooks', () => ({
  usePlatformTaxonomy: () => ({
    data: { genres: [], tags: [] },
    isLoading: false,
  }),
  useWindowSize: () => ({ size: '' }),
}));

vi.mock('@components/shared', () => ({
  ComicCard: ({ item }: { item: { title: string } }) => <div>{item.title}</div>,
  ComicCardActionButton: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  ComicCardSkeleton: () => <div>loading-card</div>,
  Select: ({ placeholder }: { placeholder?: string }) => <div>{placeholder}</div>,
}));

vi.mock('@components/ComicDetails/hooks', () => ({
  useComicFavoriteMutation: () => ({
    isLoading: false,
    mutateAsync: vi.fn(),
  }),
}));

vi.mock('./hooks', () => ({
  useFavoriteComicsQuery: () => ({
    data: [],
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

describe('Favorites', () => {
  test('показывает пустое состояние при отсутствии избранных комиксов', () => {
    render(<Favorites />);

    expect(screen.getByText('Избранное')).toBeInTheDocument();
    expect(
      screen.getByText('В избранном пока пусто. Сохраняйте интересные комиксы, чтобы вернуться к ним позже.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Перейти в каталог')).toBeInTheDocument();
  });
});
