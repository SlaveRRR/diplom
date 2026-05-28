import { PropsWithChildren } from 'react';
import { render, screen } from '@testing-library/react';

import { LayoutPage } from './LayoutPage';

vi.mock('@components/Layout', () => ({
  Layout: ({ children }: PropsWithChildren) => <div data-testid="layout-page">{children}</div>,
}));

describe('LayoutPage', () => {
  test('проверка отрисовки компонента', () => {
    render(<LayoutPage />);
    expect(screen.getByTestId('layout-page')).toBeInTheDocument();
    expect(screen.getByTestId('context-holder')).toBeInTheDocument();
  });
});
