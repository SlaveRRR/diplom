import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Home } from './Home';

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

vi.mock('./hooks', () => ({
  useHomeQuery: () => ({
    data: {
      heroComics: [],
      popularComics: [],
      freshComics: [],
      popularPosts: [],
      freshPosts: [],
      taxonomyTiles: [],
    },
    isLoading: false,
  }),
}));

vi.mock('@hooks', () => ({
  useAdultContentGate: () => ({
    guardNavigation: vi.fn(),
    adultContentModal: null,
  }),
}));

describe('Home', () => {
  test('отображает основные секции главной страницы', () => {
    render(<Home />);

    expect(screen.getByText('Популярные комиксы')).toBeInTheDocument();
    expect(screen.getByText('Свежие релизы')).toBeInTheDocument();
    expect(screen.getByText('Популярные статьи')).toBeInTheDocument();
    expect(screen.getByText('Свежие публикации')).toBeInTheDocument();
  });
});
