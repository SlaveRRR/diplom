import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Home } from './Home';

vi.mock('@components/Catalog/hooks', () => ({
  useCatalogQuery: () => ({
    data: [],
    isLoading: false,
  }),
}));

vi.mock('@components/Blog/hooks', () => ({
  useBlogPostsQuery: () => ({
    data: [],
    isLoading: false,
  }),
}));

vi.mock('@hooks', () => ({
  useAdultContentGate: () => ({
    guardNavigation: vi.fn(),
    adultContentModal: null,
  }),
  usePlatformTaxonomy: () => ({
    data: {
      genres: [{}],
      tags: [{}],
      ageRatings: [],
    },
  }),
}));

describe('Home', () => {
  test('отображает основные секции главной страницы', () => {
    render(<Home />);

    expect(screen.getByTestId('masonry')).toBeInTheDocument();
  });
});
