import { render, screen } from '@testing-library/react';

import { HomePage } from './HomePage';

vi.mock('@components/Home', () => ({
  Home: () => <div data-testid="home-page" />,
}));

describe('HomePage', () => {
  test('проверка отрисовки компонента', () => {
    render(<HomePage />);
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });
});
