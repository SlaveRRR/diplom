import { describe } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { SignIn } from './SignIn';

vi.mock('@hooks', () => ({
  useForm: () => ({
    handleSubmit: (callback) => callback(),
    control: {},
  }),
}));

vi.mock('@utils', () => ({
  startHeadlessSocialAuth: vi.fn(),
}));

const mockMutate = vi.fn();

vi.mock('./hooks', () => ({
  useSignInMutation: () => ({
    isLoading: false,
    mutate: () => mockMutate(),
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

    expect(mockMutate).toBeCalled();
  });
});
