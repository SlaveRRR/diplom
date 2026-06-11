import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';

import { RequiredAuth } from './RequiredAuth';

const AuthorizedContent = <div data-testid="auth-required" />;

const mockUseApp = vi.fn();

vi.mock('@hooks', () => ({
  useApp: () => mockUseApp(),
}));

describe('RequiredAuth', () => {
  test('проверка отрисовки компонента для авторизованного пользователя', () => {
    mockUseApp.mockReturnValue({ isAuth: true });
    render(<RequiredAuth>{AuthorizedContent}</RequiredAuth>, {
      wrapper: MemoryRouter,
    });

    expect(screen.getByTestId('auth-required')).toBeInTheDocument();
  });

  test('проверка отрисовки компонента для неавторизованного пользователя', () => {
    mockUseApp.mockReturnValue({ isAuth: false });
    render(<RequiredAuth>{AuthorizedContent}</RequiredAuth>, {
      wrapper: MemoryRouter,
    });

    expect(screen.queryByTestId('auth-required')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('card')).toHaveLength(1);
    expect(screen.getByTestId('title')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument();
    expect(screen.getAllByTestId('link')).toHaveLength(3);
    expect(screen.getByTestId('icon-lock')).toBeInTheDocument();
  });
});
