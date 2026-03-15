import { CatalogPage, HomePage, LayoutPage, SignInPage, SignUpPage, SwaggerPage } from '@pages';

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
    ],
  },
];
