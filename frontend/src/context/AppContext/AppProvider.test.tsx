import { render, waitFor } from '@testing-library/react';

import { AppProvider } from './AppProvider';

const mockInvalidateQueries = vi.fn();
const mockRemoveQueries = vi.fn();
const mockRefreshToken = vi.fn();
const mockGetIsTokenExpired = vi.fn();
let storageToken: string | null = null;
const mockGetItem = vi.fn((key: string) => (key === 'token' ? storageToken : null));
const mockRemoveItem = vi.fn((key: string) => {
  if (key === 'token') {
    storageToken = null;
  }
});
const mockSetItem = vi.fn((key: string, value: string) => {
  if (key === 'token') {
    storageToken = value;
  }
});
const mockUseCurrentUser = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
    removeQueries: mockRemoveQueries,
  }),
}));

vi.mock('@hooks', () => ({
  CURRENT_USER_QUERY_KEY: 'current_user',
  useLocalStorage: () => ({
    getItem: mockGetItem,
    removeItem: mockRemoveItem,
    setItem: mockSetItem,
  }),
  useCurrentUser: (params: unknown) => mockUseCurrentUser(params),
}));

vi.mock('@api', () => ({
  api: {
    refreshToken: (...args: unknown[]) => mockRefreshToken(...args),
  },
}));

vi.mock('@utils', () => ({
  getIsTokenExpired: (...args: unknown[]) => mockGetIsTokenExpired(...args),
}));

describe('AppProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storageToken = null;
    mockUseCurrentUser.mockReturnValue({ data: {} });
  });

  test('обновляет access token на старте, если текущий токен истекает', async () => {
    storageToken = 'token';
    mockGetIsTokenExpired.mockReturnValue(true);
    mockRefreshToken.mockResolvedValue({
      data: {
        access_token: 'next-token',
      },
    });

    render(<AppProvider />);

    await waitFor(() => {
      expect(mockRefreshToken).toHaveBeenCalled();
    });

    expect(mockSetItem).toHaveBeenCalledWith('token', 'next-token');
    expect(mockInvalidateQueries).toHaveBeenCalledWith(['current_user']);
  });

  test('тихо очищает токен и user cache при неуспешном refresh', async () => {
    storageToken = 'token';
    mockGetIsTokenExpired.mockReturnValue(true);
    mockRefreshToken.mockRejectedValue(new Error('refresh failed'));

    render(<AppProvider />);

    await waitFor(() => {
      expect(mockRemoveItem).toHaveBeenCalledWith('token');
    });

    expect(mockRemoveQueries).toHaveBeenCalledWith(['current_user']);
  });

  test('не делает refresh без токена', async () => {
    render(<AppProvider />);

    await waitFor(() => {
      expect(mockUseCurrentUser).toHaveBeenCalled();
    });

    expect(mockRefreshToken).not.toHaveBeenCalled();
  });
});
