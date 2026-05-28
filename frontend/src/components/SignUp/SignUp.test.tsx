import { fireEvent, render, screen } from '@testing-library/react';

import { SignUp } from './SignUp';

const mockMutate = vi.fn();

vi.mock('@hooks/useForm', () => ({
  useForm: () => ({
    handleSubmit:
      (
        callback: (data: {
          username: string;
          email: string;
          password: string;
          userAgreement: boolean;
          privacyPolicy: boolean;
          personalDataPolicy: boolean;
        }) => void,
      ) =>
      () =>
        callback({
          username: 'reader',
          email: 'reader@example.com',
          password: 'password123',
          userAgreement: true,
          privacyPolicy: true,
          personalDataPolicy: true,
        }),
    control: {},
    formState: {
      errors: {},
    },
    getValues: () => ({
      username: 'reader',
      email: 'reader@example.com',
      password: 'password123',
      userAgreement: true,
      privacyPolicy: true,
      personalDataPolicy: true,
    }),
    trigger: vi.fn(),
  }),
}));

vi.mock('react-hook-form', () => ({
  Controller: ({
    render,
  }: {
    render: (props: { field: { value: boolean; onChange: (value: boolean) => void } }) => JSX.Element;
  }) => render({ field: { value: true, onChange: vi.fn() } }),
}));

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/signup', search: '', hash: '' }),
}));

vi.mock('@utils', () => ({
  startHeadlessSocialAuth: vi.fn(),
  getRedirectFromSearch: vi.fn(() => ''),
}));

vi.mock('./hooks', () => ({
  useSignUpMutation: () => ({
    isLoading: false,
    mutate: mockMutate,
  }),
}));

describe('SignUp', () => {
  test('проверка отрисовки компонента', async () => {
    render(<SignUp />);

    expect(screen.getByTestId('form')).toBeInTheDocument();

    fireEvent.submit(screen.getByTestId('form'));

    expect(mockMutate).toBeCalledWith({
      username: 'reader',
      email: 'reader@example.com',
      password: 'password123',
    });
  });
});
