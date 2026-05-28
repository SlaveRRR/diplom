import { render, screen } from '@testing-library/react';

import { OptionsRender } from './OptionsRender';

vi.mock('antd', () => ({
  Space: ({ children }) => <div data-testid="option-space">{children}</div>,
  Typography: {
    Text: ({ children }) => <span>{children}</span>,
  },
}));

describe('OptionsRender', () => {
  test('отображает название и описание опции', () => {
    render(
      <>{OptionsRender?.({ data: { label: 'Фэнтези', description: 'Миры и магия' } } as never, undefined as never)}</>,
    );

    expect(screen.getByTestId('option-space')).toBeInTheDocument();
    expect(screen.getByText('Фэнтези')).toBeInTheDocument();
    expect(screen.getByText('Миры и магия')).toBeInTheDocument();
  });
});
