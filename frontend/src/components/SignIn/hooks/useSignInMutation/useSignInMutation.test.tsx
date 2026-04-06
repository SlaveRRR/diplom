import { QueryClientProvider } from '@test-utils';
import { AxiosResponse } from 'axios';
import { act, renderHook, waitFor } from '@testing-library/react';

import { api } from '@api';

import { useSignInMutation } from './useSignInMutation';

const mockInvalidateQueries = vi.fn();

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual: object = await importOriginal();
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: () => mockInvalidateQueries(),
    }),
  };
});

const mockSucces = vi.fn();
const mockError = vi.fn();

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useOutletContext: () => ({
    messageApi: {
      success: () => mockSucces(),
      error: () => mockError(),
    },
  }),
  useNavigate: () => mockNavigate,
}));

vi.mock('@api', () => ({
  api: {
    signIn: vi.fn(),
  },
}));

const mockSetItem = vi.fn();

const mockSetAuth = vi.fn();

vi.mock('@hooks', async (importOriginal) => {
  const actual: object = await importOriginal();
  return {
    ...actual,
    useLocalStorage: () => ({
      setItem: () => mockSetItem(),
    }),
    useApp: () => ({
      setIsAuth: () => mockSetAuth(),
    }),
  };
});

const mockApi = vi.mocked(api);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useSignInMutation', () => {
  test('проверка работы хука при успешной мутации', async () => {
    const apiResponse = { data: { access_token: '' }, status: 200 } as AxiosResponse;

    mockApi.signIn.mockResolvedValue(apiResponse);

    const { result } = renderHook(() => useSignInMutation(), {
      wrapper: QueryClientProvider,
    });

    await act(async () => {
      await result.current.mutateAsync({ username: 'test', password: 'test' });
    });

    await waitFor(async () => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();

    expect(mockSucces).toBeCalled();
    expect(mockSetItem).toBeCalled();
    expect(mockSetAuth).toBeCalled();
    expect(mockInvalidateQueries).toBeCalled();
    expect(mockNavigate).toBeCalled();
  });

  test('проверка работы хука при ошибке', async () => {
    const { result } = renderHook(() => useSignInMutation(), {
      wrapper: QueryClientProvider,
    });

    const apiResponse = { data: undefined, status: 500 } as AxiosResponse;

    mockApi.signIn.mockRejectedValue(apiResponse);

    await act(async () => {
      try {
        await result.current.mutateAsync({ username: 'test', password: 'test' });
      } catch {
        await waitFor(() => {
          expect(mockError).toBeCalled();
        });
      }
    });
  });
});
