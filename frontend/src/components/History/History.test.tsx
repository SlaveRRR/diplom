import { render, screen } from '@testing-library/react';

import { History } from './History';

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

vi.mock('./hooks', () => ({
  useReadingHistoryQuery: () => ({
    data: { comics: [], posts: [] },
    isLoading: false,
  }),
}));

describe('History', () => {
  test('отображает пустые состояния для истории комиксов и статей', () => {
    render(<History />);

    expect(screen.getByText('История чтения')).toBeInTheDocument();
    expect(screen.getByText('Комиксы (0)')).toBeInTheDocument();
    expect(screen.getByText('Статьи (0)')).toBeInTheDocument();
    expect(screen.getByText('История чтения комиксов пока пуста.')).toBeInTheDocument();
    expect(screen.getByText('История чтения статей пока пуста.')).toBeInTheDocument();
  });
});
