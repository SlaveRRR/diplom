import { render, screen } from '@testing-library/react';

import { Notifications } from './Notifications';

const notificationsData = { items: [] };

vi.mock('@ant-design/icons', () => ({
  CheckOutlined: () => <span data-testid="icon-check" />,
  DeleteOutlined: () => <span data-testid="icon-delete" />,
  MailOutlined: () => <span data-testid="icon-mail" />,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useOutletContext: () => ({
    messageApi: {
      info: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
    },
  }),
}));

vi.mock('./hooks', () => ({
  useNotificationsQuery: () => ({
    data: notificationsData,
    isLoading: false,
  }),
  useMarkNotificationsReadMutation: () => ({
    isLoading: false,
    mutateAsync: vi.fn(),
  }),
  useDeleteNotificationsMutation: () => ({
    isLoading: false,
    mutateAsync: vi.fn(),
  }),
}));

describe('Notifications', () => {
  test('показывает пустое состояние при отсутствии уведомлений', () => {
    render(<Notifications />);

    expect(screen.getByText('Уведомления')).toBeInTheDocument();
    expect(
      screen.getByText('Пока уведомлений нет. Когда появятся новые события, они будут собраны здесь.'),
    ).toBeInTheDocument();
  });
});
