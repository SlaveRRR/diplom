import { QueryClientProvider } from '@test-utils';
import { render, screen } from '@testing-library/react';

import { Layout } from './Layout';

vi.mock('@hooks', () => ({
  useApp: () => ({
    isAuth: false,
    user: null,
  }),
}));

vi.mock('@components/Account/hooks/useAccountQuery', () => ({
  useAccountQuery: () => ({
    data: null,
  }),
}));

vi.mock('@components/Notifications/hooks', () => ({
  useNotificationsQuery: () => ({
    data: { unreadCount: 0 },
  }),
  useNotificationsSocket: vi.fn(),
}));

describe('Layout', () => {
  test('проверка отрисовки компонента', () => {
    render(
      <QueryClientProvider>
        <Layout notificationApi={{ open: vi.fn() } as never}>
          <p>test</p>
        </Layout>
      </QueryClientProvider>,
    );

    expect(screen.getByText('test')).toBeInTheDocument();
  });
});
