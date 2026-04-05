import { AxiosHeaders } from 'axios';

import { addAuthHeaderInterceptor, refreshTokenOnError } from './interceptors';

const mockAxiosGet = vi.fn();
const mockRequest = vi.fn();

vi.mock('axios', () => ({
  default: {
    get: (...args: unknown[]) => mockAxiosGet(...args),
    create: () => ({
      request: (...args: unknown[]) => mockRequest(...args),
      interceptors: {
        request: {
          use: vi.fn(),
        },
        response: {
          use: vi.fn(),
        },
      },
    }),
  },
}));

const mockGetItem = vi.fn();
const mockSetItem = vi.fn();
const mockRemoveItem = vi.fn();

vi.stubGlobal('localStorage', {
  getItem: (...args: unknown[]) => mockGetItem(...args),
  removeItem: (...args: unknown[]) => mockRemoveItem(...args),
  setItem: (...args: unknown[]) => mockSetItem(...args),
});

describe('interceptors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addAuthHeaderInterceptor', () => {
    test('добавляет заголовок с токеном из localStorage', () => {
      const token = 'test-token';

      mockGetItem.mockReturnValue(JSON.stringify(token));

      const config = addAuthHeaderInterceptor({ headers: {} as AxiosHeaders });

      expect(config.headers.Authorization).toBe(`Bearer ${token}`);
    });
  });

  describe('refreshTokenOnError', () => {
    test('обновляет токен и повторяет исходный запрос после 401', async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          access_token: 'next-token',
        },
      });
      mockRequest.mockResolvedValue({ status: 200 });

      await refreshTokenOnError({
        config: { _retry: false, headers: {}, url: '/users/me/' },
        response: {
          status: 401,
        },
      });

      expect(mockAxiosGet).toHaveBeenCalledTimes(1);
      expect(mockSetItem).toHaveBeenCalledWith('token', JSON.stringify('next-token'));
      expect(mockRequest).toHaveBeenCalledTimes(1);
      expect(mockRequest.mock.calls[0][0].headers.Authorization).toBe('Bearer next-token');
    });

    test('тихо очищает токен при ошибке refresh без показа сообщений', async () => {
      mockAxiosGet.mockRejectedValue(new Error('refresh failed'));

      await expect(
        refreshTokenOnError({
          config: { _retry: false, headers: {}, url: '/users/me/' },
          response: {
            status: 401,
          },
        }),
      ).rejects.toThrow('refresh failed');

      expect(mockRemoveItem).toHaveBeenCalledWith('token');
      expect(mockRequest).not.toHaveBeenCalled();
    });

    test('не пытается рефрешить сам refresh endpoint и просто очищает токен', async () => {
      const error = {
        config: { _retry: false, headers: {}, url: '/token/refresh/' },
        response: {
          status: 401,
        },
      };

      await expect(refreshTokenOnError(error)).rejects.toBe(error);

      expect(mockRemoveItem).toHaveBeenCalledWith('token');
      expect(mockAxiosGet).not.toHaveBeenCalled();
    });
  });
});
