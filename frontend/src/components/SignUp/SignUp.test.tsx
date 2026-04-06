import { fireEvent, render, screen } from '@testing-library/react';

import { SignUp } from './SignUp';

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
  useSignUpMutation: () => ({
    isLoading: false,
    mutate: () => mockMutate(),
  }),
}));

describe('SignUp', () => {
  test('проверка отрисовки компонента', async () => {
    render(<SignUp />);

    expect(screen.getByTestId('form')).toBeInTheDocument();

    fireEvent.submit(screen.getByTestId('form'));

    expect(mockMutate).toBeCalled();
  });
});
