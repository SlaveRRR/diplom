import { PropsWithChildren } from 'react';
import { render, screen } from '@testing-library/react';

import { App } from './App';

vi.mock('@tanstack/react-query', () => ({
  QueryClientProvider: ({ children }: PropsWithChildren) => <div>{children}</div>,
  QueryClient: vi.fn(),
}));

vi.mock('@context', () => ({
  AppProvider: ({ children }: PropsWithChildren) => <div>{children}</div>,
  ThemeProvider: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));

vi.mock('@pages', () => ({
  HomePage: () => <div />,
  LayoutPage: () => <div />,
  SignInPage: () => <div />,
  SignUpPage: () => <div />,
}));

vi.mock('./router', () => ({
  Router: () => <div data-testid="router" />,
}));

describe('App', () => {
  test('проверка отрисовки компонента', () => {
    render(<App />);

    expect(screen.getByTestId('router')).toBeInTheDocument();
  });
});
