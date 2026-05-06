import {
  AccountPage,
  AnalyticsPage,
  BlogPage,
  BlogPostPage,
  CatalogPage,
  ComicDetailsPage,
  ComicReaderPage,
  CreateBlogPostPage,
  CreateComicPage,
  FavoritesPage,
  HistoryPage,
  NotificationsPage,
  ProfilePage,
} from '.';
import { render, screen } from '@testing-library/react';

vi.mock('@components', () => ({
  Account: () => <div data-testid="account-component" />,
  Analytics: () => <div data-testid="analytics-component" />,
  Blog: () => <div data-testid="blog-component" />,
  BlogPost: () => <div data-testid="blog-post-component" />,
  Catalog: () => <div data-testid="catalog-component" />,
  ComicDetails: () => <div data-testid="comic-details-component" />,
  ComicReader: () => <div data-testid="comic-reader-component" />,
  BlogCreate: () => <div data-testid="blog-create-component" />,
  ComicCreate: () => <div data-testid="comic-create-component" />,
  Favorites: () => <div data-testid="favorites-component" />,
  History: () => <div data-testid="history-component" />,
  Notifications: () => <div data-testid="notifications-component" />,
  Profile: () => <div data-testid="profile-component" />,
}));

describe('page wrappers', () => {
  test('проксируют соответствующие компоненты страниц', () => {
    render(
      <>
        <AccountPage />
        <AnalyticsPage />
        <BlogPage />
        <BlogPostPage />
        <CatalogPage />
        <ComicDetailsPage />
        <ComicReaderPage />
        <CreateBlogPostPage />
        <CreateComicPage />
        <FavoritesPage />
        <HistoryPage />
        <NotificationsPage />
        <ProfilePage />
      </>,
    );

    expect(screen.getByTestId('account-component')).toBeInTheDocument();
    expect(screen.getByTestId('analytics-component')).toBeInTheDocument();
    expect(screen.getByTestId('blog-component')).toBeInTheDocument();
    expect(screen.getByTestId('blog-post-component')).toBeInTheDocument();
    expect(screen.getByTestId('catalog-component')).toBeInTheDocument();
    expect(screen.getByTestId('comic-details-component')).toBeInTheDocument();
    expect(screen.getByTestId('comic-reader-component')).toBeInTheDocument();
    expect(screen.getByTestId('blog-create-component')).toBeInTheDocument();
    expect(screen.getByTestId('comic-create-component')).toBeInTheDocument();
    expect(screen.getByTestId('favorites-component')).toBeInTheDocument();
    expect(screen.getByTestId('history-component')).toBeInTheDocument();
    expect(screen.getByTestId('notifications-component')).toBeInTheDocument();
    expect(screen.getByTestId('profile-component')).toBeInTheDocument();
  });
});
