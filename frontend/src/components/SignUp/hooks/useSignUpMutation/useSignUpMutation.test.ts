import { QueryClientProvider } from '@test-utils';
import { AxiosError, AxiosResponse } from 'axios';
import { act, renderHook, waitFor } from '@testing-library/react';

import { api } from '@api';

import { useSignUpMutation } from './useSignUpMutation';

const mockSuccess = vi.fn();
const mockError = vi.fn();
const mockNavigate = vi.fn();
const mockSetItem = vi.fn();
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

vi.mock('react-router-dom', () => ({
  useOutletContext: () => ({
    messageApi: {
      success: mockSuccess,
      error: mockError,
    },
  }),
  useNavigate: () => mockNavigate,
}));

vi.mock('@api', () => ({
  api: {
    signUp: vi.fn(),
  },
}));

const sessionStorageMock = {
  setItem: mockSetItem,
  getItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

const mockApi = vi.mocked(api);

beforeEach(() => {
  vi.clearAllMocks();
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

describe('useSignUpMutation', () => {
  test('успешная регистрация сохраняет cooldown и переводит на экран подтверждения почты', async () => {
    const apiResponse = {
      data: {
        detail: 'Verification email sent successfully.',
        email: 'test@example.com',
        retry_after: 60,
      },
      status: 201,
    } as AxiosResponse;

    mockApi.signUp.mockResolvedValue(apiResponse);

    const { result } = renderHook(() => useSignUpMutation(), {
      wrapper: QueryClientProvider,
    });

    await act(async () => {
      await result.current.mutateAsync({
        username: 'test',
        password: 'password123',
        email: 'test@example.com',
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSetItem).toHaveBeenCalledWith('verification-cooldown:test@example.com', expect.any(String));
    expect(mockSuccess).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/signin?verification=pending&email=test%40example.com&retryAfter=60', {
      replace: true,
    });
  });

  test('ошибка регистрации показывает сообщение от backend', async () => {
    const backendError = new AxiosError('Request failed');

    backendError.response = {
      data: {
        detail: 'User with this email already exists.',
      },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: {} as never,
    };

    mockApi.signUp.mockRejectedValue(backendError);

    const { result } = renderHook(() => useSignUpMutation(), {
      wrapper: QueryClientProvider,
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          username: 'test',
          password: 'password123',
          email: 'test@example.com',
        });
      } catch {
        /* empty */
      }
    });

    await waitFor(() => {
      expect(mockError).toHaveBeenCalledWith('User with this email already exists.');
    });
  });
});
