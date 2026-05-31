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
    tags: ['Тайна'],
    rating: 4.8,
    reviews: 120,
    likesCount: 90,
    readersCount: 400,
    isNew: true,
    isTrending: true,
    cover: '/cover.jpg',
    coverUrl: '',
    ageRating: '16+',
    status: 'published',
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
    tourProps: {},
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
  useCatalogQuery: ({ pageSize }: { pageSize?: number } = {}) => ({
    data: {
      items: catalogItems.slice(0, pageSize ?? catalogItems.length),
      pagination: {
        page: 1,
        pageSize: pageSize ?? 12,
        total: 1,
        totalPages: 1,
      },
    },
    isLoading: false,
  }),
}));

describe('Catalog', () => {
  test('отображает витрину каталога и найденные комиксы', () => {
    render(<Catalog />);

    expect(screen.getByText('Откройте для себя мир комиксов')).toBeInTheDocument();
    expect(screen.getByText('Каталог')).toBeInTheDocument();
    expect(screen.getByText('Найдено: 1')).toBeInTheDocument();
    expect(screen.getAllByText('Город туманов').length).toBeGreaterThan(0);
    expect(screen.getByTestId('adult-modal')).toBeInTheDocument();
  });
});
