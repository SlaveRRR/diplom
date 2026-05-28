import { Spin } from 'antd';
import { ReactNode, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { RequiredAuth } from '@components/shared/RequiredAuth';

import { Route } from '../../types';

const withSuspense = (page: ReactNode) => <Suspense fallback={<Spin className="w-full" />}>{page}</Suspense>;

export const getRouter = (routes: Route[]) => {
  const mapRoutes = (routeList: Route[]) =>
    routeList.map(({ page, path, children, privateRoute }) => ({
      element: privateRoute ? <RequiredAuth>{withSuspense(page)}</RequiredAuth> : withSuspense(page),
      path: path,
      children: children ? mapRoutes(children) : undefined,
    }));

  return createBrowserRouter(mapRoutes(routes));
};
