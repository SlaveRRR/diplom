import { render, screen } from '@testing-library/react';

import { Analytics } from './Analytics';

vi.mock('@ant-design/icons', () => ({
  BarChartOutlined: () => <span data-testid="icon-bar-chart" />,
  DownloadOutlined: () => <span data-testid="icon-download" />,
  FileSearchOutlined: () => <span data-testid="icon-file-search" />,
  LineChartOutlined: () => <span data-testid="icon-line-chart" />,
  RiseOutlined: () => <span data-testid="icon-rise" />,
}));

vi.mock('@ant-design/plots', () => ({
  Column: () => <div data-testid="column-chart" />,
  Line: () => <div data-testid="line-chart" />,
  Pie: () => <div data-testid="pie-chart" />,
}));

vi.mock('react-router-dom', () => ({
  useOutletContext: () => ({
    messageApi: {
      success: vi.fn(),
      error: vi.fn(),
    },
  }),
}));

vi.mock('@hooks', () => ({
  usePageOnboarding: () => ({
    isOpen: false,
    close: vi.fn(),
  }),
}));

vi.mock('@components/Account/hooks/useAccountQuery', () => ({
  useAccountQuery: () => ({
    data: {
      comics: [],
      posts: [],
    },
    isLoading: false,
  }),
}));

vi.mock('./hooks', () => ({
  useAnalyticsQuery: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

describe('Analytics', () => {
  test('показывает пустое состояние, если у пользователя нет контента для аналитики', () => {
    render(<Analytics />);

    expect(
      screen.getByText('Аналитика станет доступна, когда у вас появится хотя бы один комикс или пост.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Создать комикс')).toBeInTheDocument();
    expect(screen.getByText('Создать пост')).toBeInTheDocument();
  });
});
