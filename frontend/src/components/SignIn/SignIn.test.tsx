import { fireEvent, render, screen } from '@testing-library/react';

import { SignIn } from './SignIn';

const mockMutate = vi.fn();

vi.mock('@hooks/useForm', () => ({
  useForm: () => ({
    handleSubmit:
      (
        callback: (data: {
          username: string;
          password: string;
          privacyPolicy: boolean;
          personalDataPolicy: boolean;
        }) => void,
      ) =>
      () =>
        callback({
          username: 'reader',
          password: 'password123',
          privacyPolicy: true,
          personalDataPolicy: true,
        }),
    control: {},
    formState: {
      errors: {},
    },
    getValues: (name?: 'privacyPolicy' | 'personalDataPolicy') =>
      name ? true : { privacyPolicy: true, personalDataPolicy: true },
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
  useLocation: () => ({ pathname: '/signin', search: '', hash: '' }),
  useNavigate: () => vi.fn(),
  useOutletContext: () => ({ messageApi: { error: vi.fn(), success: vi.fn() } }),
  useSearchParams: () => [new URLSearchParams('')],
}));

vi.mock('@utils', () => ({
  startHeadlessSocialAuth: vi.fn(),
  getRedirectFromSearch: vi.fn(() => ''),
  getIntentFromSearch: vi.fn(() => undefined),
  buildAuthPath: vi.fn(() => '/signup'),
  getIntentLabel: vi.fn(() => undefined),
}));

vi.mock('./hooks', () => ({
  useSignInMutation: () => ({
    isLoading: false,
    mutate: mockMutate,
  }),
  useSocialSessionExchange: () => ({
    isLoading: false,
    mutate: vi.fn(),
  }),
  useResendVerificationEmail: () => ({
    isLoading: false,
    mutateAsync: vi.fn(),
  }),
}));

describe('SignIn', () => {
  test('проверка отрисовки компонента', async () => {
    render(<SignIn />);

    expect(screen.getByTestId('form')).toBeInTheDocument();

    fireEvent.submit(screen.getByTestId('form'));

    expect(mockMutate).toBeCalledWith({
      username: 'reader',
      password: 'password123',
    });
  });
});
