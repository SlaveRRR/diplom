import { render, screen } from '@testing-library/react';

import { SignInPage } from './SignInPage';

vi.mock('@components/SignIn', () => ({
  SignIn: () => <div data-testid="signin-page" />,
}));

describe('SignInPage', () => {
  test('проверка отрисовки компонента', () => {
    render(<SignInPage />);
    expect(screen.getByTestId('signin-page')).toBeInTheDocument();
  });
});
