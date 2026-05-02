import { render, screen } from '@testing-library/react';

import { Router } from './router';

vi.mock('@pages', () => ({
  HomePage: () => <></>,
  LayoutPage: () => <></>,
  SignInPage: () => <></>,
  SignUpPage: () => <></>,
  SwaggerPage: () => <></>,
  CatalogPage: () => <></>,
  CreateComicPage: () => <></>,
  FavoritesPage: () => <></>,
  AccountPage: () => <></>,
  ProfilePage: () => <></>,
  ComicDetailsPage: () => <></>,
  ComicReaderPage: () => <></>,
  HistoryPage: () => <></>,
  NotificationsPage: () => <></>,
  CreateBlogPostPage: () => <></>,
  BlogPage: () => <></>,
  BlogPostPage: () => <></>,
  UserAgreementPage: () => <></>,
  AnalyticsPage: () => <></>,
}));

vi.mock('./utils', () => ({
  getRouter: () => {},
}));

describe('router', () => {
  test('проверка отрисовки компонента', () => {
    render(<Router />);

    expect(screen.getByTestId('router-provider')).toBeInTheDocument();
  });
});
