import { render, screen } from '@testing-library/react';

import { Home } from './Home';

describe('Home', () => {
  test('проверка отрисовки компонента', () => {
    render(<Home />);
    expect(screen.getByTestId('masonry')).toBeInTheDocument();
  });
});
