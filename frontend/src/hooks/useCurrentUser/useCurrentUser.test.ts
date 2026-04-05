import { QueryClientProvider } from '@test-utils';
import { AxiosResponse } from 'axios';
import { renderHook, waitFor } from '@testing-library/react';

import { api } from '@api';

import { useCurrentUser } from './useCurrentUser';

vi.mock('@api', () => ({
  api: {
    getCurrentUser: vi.fn(),
  },
}));

const mockApi = vi.mocked(api);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useCurrentUser', () => {
  test('проверка работы хука', async () => {
    const apiResponse = { data: { data: { id: 1, name: 'Test User' } }, status: 200 } as AxiosResponse;

    mockApi.getCurrentUser.mockResolvedValue(apiResponse);

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: QueryClientProvider,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
  });
});
