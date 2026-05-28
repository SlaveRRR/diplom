import { fireEvent, render, screen } from '@testing-library/react';

import { CatalogItem } from '@components/Catalog/hooks/useCatalogStore/types';

import { ComicCard, ComicCardActionButton, ComicCardSkeleton } from './ComicCard';

const mockGuardNavigation = vi.fn();

vi.mock('@hooks', () => ({
  useAdultContentGate: () => ({
    guardNavigation: mockGuardNavigation,
    adultContentModal: <div data-testid="adult-content-modal" />,
    isAdultContentConfirmed: false,
  }),
}));

const item: CatalogItem = {
  id: 11,
  title: 'Лунная башня',
  description: 'Приключенческий комикс о странствиях и магии.',
  cover: '/covers/moon-tower.jpg',
  coverUrl: '',
  ageRating: '16+',
  author: 'reader',
  genreId: 7,
  genre: 'Фэнтези',
  tagIds: [1, 2, 3],
  tags: ['Приключение', 'Магия', 'Драма'],
  rating: 4.5,
  reviews: 123,
  likesCount: 55,
  readersCount: 240,
  status: 'published',
  isNew: true,
  isTrending: false,
};

describe('ComicCard', () => {
  beforeEach(() => {
    mockGuardNavigation.mockClear();
  });

  test('отображает основные данные карточки комикса', () => {
    render(<ComicCard item={item} showStatus={false} />);

    expect(screen.getByText('Лунная башня')).toBeInTheDocument();
    expect(screen.getByText('reader')).toBeInTheDocument();
    expect(screen.getByText('Приключенческий комикс о странствиях и магии.')).toBeInTheDocument();
    expect(screen.getByText('(123)')).toBeInTheDocument();
    expect(screen.getByText('16+')).toBeInTheDocument();
    expect(screen.getByText('Фэнтези')).toBeInTheDocument();
    expect(screen.getByText('Приключение')).toBeInTheDocument();
    expect(screen.getByText('Магия')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  test('перед переходом по ссылке вызывает защиту возрастного контента', () => {
    render(<ComicCard item={{ ...item, ageRating: '18+' }} showStatus={false} />);

    fireEvent.click(screen.getByTestId('link'));

    expect(mockGuardNavigation).toHaveBeenCalledTimes(1);
    expect(mockGuardNavigation.mock.calls[0][0]).toMatchObject({
      href: '/comics/11',
      ageRating: '18+',
    });
    expect(screen.getByTestId('adult-content-modal')).toBeInTheDocument();
  });

  test('оборачивает карточку в ленту, если передан текст бейджа', () => {
    render(<ComicCard item={item} badgeText="Новинка" badgeColor="gold" showStatus={false} />);

    expect(screen.getByTestId('badge-ribbon')).toHaveAttribute('data-text', 'Новинка');
    expect(screen.getByTestId('badge-ribbon')).toHaveAttribute('data-color', 'gold');
  });
});

describe('ComicCardSkeleton', () => {
  test('отображает каркас карточки в состоянии загрузки', () => {
    render(<ComicCardSkeleton />);

    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByTestId('skeleton-image')).toHaveAttribute('data-active', 'true');
  });
});

describe('ComicCardActionButton', () => {
  test('вызывает обработчик по нажатию', () => {
    const onClick = vi.fn();

    render(<ComicCardActionButton onClick={onClick}>Удалить</ComicCardActionButton>);

    fireEvent.click(screen.getByTestId('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
