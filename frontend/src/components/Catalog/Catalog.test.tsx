import { render, screen } from '@testing-library/react';

import { Catalog } from './Catalog';

const catalogItems = [
  {
    id: 1,
    title: 'Город туманов',
    author: 'Aster',
    description: 'Городская мистическая история.',
    genreId: 1,
    genre: 'Мистика',
    tagIds: [3],
    rating: 4.8,
    reviews: 120,
    readersCount: 400,
    isNew: true,
    isTrending: true,
    cover: '/cover.jpg',
    coverUrl: '',
    ageRating: '16+',
  },
];

vi.mock('react-router-dom', () => ({
  Link: ({
    children,
    to,
    onClick,
  }: {
    children: React.ReactNode;
    to: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  }) => (
    <a href={to} onClick={onClick}>
      {children}
    </a>
  ),
  useSearchParams: () => [new URLSearchParams()],
}));

vi.mock('@hooks', () => ({
  useAdultContentGate: () => ({
    guardNavigation: vi.fn(),
    adultContentModal: <div data-testid="adult-modal" />,
  }),
  usePageOnboarding: () => ({
    isOpen: false,
    close: vi.fn(),
  }),
  usePlatformTaxonomy: () => ({
    data: {
      genres: [],
      tags: [],
    },
    isLoading: false,
  }),
}));

vi.mock('@components/shared', () => ({
  ComicCard: ({ item }: { item: { title: string } }) => <div>{item.title}</div>,
  ComicCardSkeleton: () => <div>loading-card</div>,
  Select: ({ placeholder }: { placeholder?: string }) => <div>{placeholder}</div>,
}));

vi.mock('./hooks', () => ({
  useCatalogQuery: () => ({
    data: catalogItems,
    isLoading: false,
  }),
}));

describe('Catalog', () => {
  test('отображает витрину каталога и найденные комиксы', () => {
    render(<Catalog />);

    expect(screen.getByText('Откройте для себя мир комиксов')).toBeInTheDocument();
    expect(screen.getByText('Каталог')).toBeInTheDocument();
    expect(screen.getByText('Найдено: 1 из 1')).toBeInTheDocument();
    expect(screen.getAllByText('Город туманов').length).toBeGreaterThan(0);
    expect(screen.getByTestId('adult-modal')).toBeInTheDocument();
  });
});
