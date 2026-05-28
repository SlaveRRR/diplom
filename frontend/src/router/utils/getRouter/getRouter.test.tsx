import { Spin } from 'antd';
import { PropsWithChildren, Suspense } from 'react';

import { RequiredAuth } from '@components/shared/RequiredAuth';

import { getRouter } from './getRouter';

vi.mock('@components/shared/RequiredAuth', () => ({
  RequiredAuth: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));

describe('getRouter', () => {
  test('проверка получения роутера', () => {
    const fallback = <Spin className="w-full" />;

    expect(
      getRouter([
        {
          page: 'page',
          path: '/',
          privateRoute: true,
          children: [{ path: '/children', page: 'children' }],
        },
      ]),
    ).toMatchObject([
      {
        element: (
          <RequiredAuth>
            <Suspense fallback={fallback}>page</Suspense>
          </RequiredAuth>
        ),
        path: '/',
        children: [
          {
            path: '/children',
            element: <Suspense fallback={fallback}>children</Suspense>,
          },
        ],
      },
    ]);
  });
});
