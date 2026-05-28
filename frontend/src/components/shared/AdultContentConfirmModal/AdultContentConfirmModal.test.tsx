import { fireEvent, render, screen } from '@testing-library/react';

import { AdultContentConfirmModal } from './AdultContentConfirmModal';

vi.mock('antd', () => ({
  Modal: ({ children, open, onCancel }) =>
    open ? (
      <div data-testid="modal" onClick={onCancel}>
        {children}
      </div>
    ) : null,
  Button: ({ children, onClick }) => (
    <button data-testid="button" onClick={onClick}>
      {children}
    </button>
  ),
  Flex: ({ children }) => <div>{children}</div>,
  Typography: {
    Paragraph: ({ children }) => <div>{children}</div>,
    Text: ({ children }) => <div>{children}</div>,
    Title: ({ children }) => <div>{children}</div>,
  },
}));

describe('AdultContentConfirmModal', () => {
  test('отображает действия модального окна и вызывает обработчики', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(<AdultContentConfirmModal open onConfirm={onConfirm} onCancel={onCancel} />);

    const buttons = screen.getAllByTestId('button');
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);

    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).toHaveBeenCalled();
  });
});
