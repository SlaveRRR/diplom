import { fireEvent, render, screen } from '@testing-library/react';

import { useAdultContentGate } from './useAdultContentGate';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@components/shared/AdultContentConfirmModal', () => ({
  AdultContentConfirmModal: ({ open, onConfirm, onCancel }) =>
    open ? (
      <div data-testid="adult-modal">
        <button data-testid="confirm-adult" onClick={onConfirm} />
        <button data-testid="cancel-adult" onClick={onCancel} />
      </div>
    ) : null,
}));

const TestComponent = () => {
  const { guardNavigation, adultContentModal, isAdultContentConfirmed } = useAdultContentGate();

  return (
    <>
      <button data-testid="safe-link" onClick={() => guardNavigation({ href: '/blog/11', ageRating: '16+' })} />
      <button data-testid="adult-link" onClick={() => guardNavigation({ href: '/comics/2', ageRating: '18+' })} />
      <div data-testid="confirmed-state">{String(isAdultContentConfirmed)}</div>
      {adultContentModal}
    </>
  );
};

describe('useAdultContentGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  test('сразу пропускает навигацию для не-18+ контента', () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByTestId('safe-link'));

    expect(mockNavigate).toHaveBeenCalledWith('/blog/11');
    expect(screen.queryByTestId('adult-modal')).not.toBeInTheDocument();
  });

  test('показывает modal и подтверждает доступ для 18+ контента', () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByTestId('adult-link'));
    expect(screen.getByTestId('adult-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('confirm-adult'));

    expect(window.localStorage.getItem('adult-content-confirmed')).toBe('true');
    expect(mockNavigate).toHaveBeenCalledWith('/comics/2');
    expect(screen.getByTestId('confirmed-state')).toHaveTextContent('true');
  });

  test('закрывает modal по cancel', () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByTestId('adult-link'));
    fireEvent.click(screen.getByTestId('cancel-adult'));

    expect(screen.queryByTestId('adult-modal')).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
