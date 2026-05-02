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
  HomePage,
  LayoutPage,
  NotificationsPage,
  ProfilePage,
  SignInPage,
  SignUpPage,
  SwaggerPage,
  UserAgreementPage,
} from '@pages';

import { Route } from './types';

export const ROUTES: Route[] = [
  {
    page: <LayoutPage />,
    path: '/',
    children: [
      {
        path: '/',
        page: <HomePage />,
      },
      {
        path: '/catalog',
        page: <CatalogPage />,
      },
      {
        path: '/blog',
        page: <BlogPage />,
      },
      {
        path: '/blog/create',
        page: <CreateBlogPostPage />,
        privateRoute: true,
      },
      {
        path: '/blog/:postId/edit',
        page: <CreateBlogPostPage />,
        privateRoute: true,
      },
      {
        path: '/blog/:postId',
        page: <BlogPostPage />,
      },
      {
        path: '/favorites',
        page: <FavoritesPage />,
        privateRoute: true,
      },
      {
        path: '/history',
        page: <HistoryPage />,
        privateRoute: true,
      },
      {
        path: '/notifications',
        page: <NotificationsPage />,
        privateRoute: true,
      },
      {
        path: '/analytics',
        page: <AnalyticsPage />,
        privateRoute: true,
      },
      {
        path: '/comics/:comicId',
        page: <ComicDetailsPage />,
      },
      {
        path: '/comics/:comicId/chapters/:chapterId',
        page: <ComicReaderPage />,
      },
      {
        path: '/signin',
        page: <SignInPage />,
      },
      {
        path: '/signup',
        page: <SignUpPage />,
      },
      {
        path: '/swagger',
        page: <SwaggerPage />,
      },
      {
        path: '/comics/create',
        page: <CreateComicPage />,
        privateRoute: true,
      },
      {
        path: '/account',
        page: <AccountPage />,
        privateRoute: true,
      },
      {
        path: '/profile/:userId',
        page: <ProfilePage />,
      },
      {
        path: '/user-agreement',
        page: <UserAgreementPage />,
      },
    ],
  },
];
