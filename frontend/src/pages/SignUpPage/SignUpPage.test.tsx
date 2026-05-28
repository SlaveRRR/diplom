import { render, screen } from '@testing-library/react';

import { SignUpPage } from './SignUpPage';

vi.mock('@components/SignUp', () => ({
  SignUp: () => <div data-testid="signup-page" />,
}));

describe('SignUpPage', () => {
  test('проверка отрисовки компонента', () => {
    render(<SignUpPage />);
    expect(screen.getByTestId('signup-page')).toBeInTheDocument();
  });
});
