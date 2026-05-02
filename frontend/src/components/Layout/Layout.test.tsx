import { QueryClientProvider } from '@test-utils';
import { render, screen } from '@testing-library/react';

import { Layout } from './Layout';

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
