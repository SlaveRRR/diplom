import { lazy } from 'react';

import { LayoutPage } from '@pages/LayoutPage';

import { Route } from './types';

const AccountPage = lazy(() => import('@pages/AccountPage').then(({ AccountPage }) => ({ default: AccountPage })));
const AchievementsPage = lazy(() =>
  import('@pages/AchievementsPage').then(({ AchievementsPage }) => ({ default: AchievementsPage })),
);
const AnalyticsPage = lazy(() =>
  import('@pages/AnalyticsPage').then(({ AnalyticsPage }) => ({ default: AnalyticsPage })),
);
const BlogPage = lazy(() => import('@pages/BlogPage').then(({ BlogPage }) => ({ default: BlogPage })));
const BlogPostPage = lazy(() => import('@pages/BlogPostPage').then(({ BlogPostPage }) => ({ default: BlogPostPage })));
const CatalogPage = lazy(() => import('@pages/CatalogPage').then(({ CatalogPage }) => ({ default: CatalogPage })));
const ComicDetailsPage = lazy(() =>
  import('@pages/ComicDetailsPage').then(({ ComicDetailsPage }) => ({ default: ComicDetailsPage })),
);
const ComicReaderPage = lazy(() =>
  import('@pages/ComicReaderPage').then(({ ComicReaderPage }) => ({ default: ComicReaderPage })),
);
const ContentGuidelinesPage = lazy(() =>
  import('@pages/ContentGuidelinesPage').then(({ ContentGuidelinesPage }) => ({ default: ContentGuidelinesPage })),
);
const CreateBlogPostPage = lazy(() =>
  import('@pages/CreateBlogPostPage').then(({ CreateBlogPostPage }) => ({ default: CreateBlogPostPage })),
);
const CreateComicPage = lazy(() =>
  import('@pages/CreateComicPage').then(({ CreateComicPage }) => ({ default: CreateComicPage })),
);
const FavoritesPage = lazy(() =>
  import('@pages/FavoritesPage').then(({ FavoritesPage }) => ({ default: FavoritesPage })),
);
const HistoryPage = lazy(() => import('@pages/HistoryPage').then(({ HistoryPage }) => ({ default: HistoryPage })));
const HomePage = lazy(() => import('@pages/HomePage').then(({ HomePage }) => ({ default: HomePage })));
const NotificationsPage = lazy(() =>
  import('@pages/NotificationsPage').then(({ NotificationsPage }) => ({ default: NotificationsPage })),
);
const MonthlyRecapPage = lazy(() =>
  import('@pages/MonthlyRecapPage').then(({ MonthlyRecapPage }) => ({ default: MonthlyRecapPage })),
);
const PersonalDataPage = lazy(() =>
  import('@pages/PersonalDataPage').then(({ PersonalDataPage }) => ({ default: PersonalDataPage })),
);
const PrivacyPolicyPage = lazy(() =>
  import('@pages/PrivacyPolicyPage').then(({ PrivacyPolicyPage }) => ({ default: PrivacyPolicyPage })),
);
const ProfilePage = lazy(() => import('@pages/ProfilePage').then(({ ProfilePage }) => ({ default: ProfilePage })));
const SignInPage = lazy(() => import('@pages/SignInPage').then(({ SignInPage }) => ({ default: SignInPage })));
const SignUpPage = lazy(() => import('@pages/SignUpPage').then(({ SignUpPage }) => ({ default: SignUpPage })));
const UserAgreementPage = lazy(() =>
  import('@pages/UserAgreementPage').then(({ UserAgreementPage }) => ({ default: UserAgreementPage })),
);

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
        path: '/recap',
        page: <MonthlyRecapPage />,
        privateRoute: true,
      },
      {
        path: '/achievements',
        page: <AchievementsPage />,
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
        path: '/comics/create',
        page: <CreateComicPage />,
        privateRoute: true,
      },
      {
        path: '/comics/:comicId/edit',
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
      {
        path: '/personal-data',
        page: <PersonalDataPage />,
      },
      {
        path: '/privacy-policy',
        page: <PrivacyPolicyPage />,
      },
      {
        path: '/content-guidelines',
        page: <ContentGuidelinesPage />,
      },
    ],
  },
];
