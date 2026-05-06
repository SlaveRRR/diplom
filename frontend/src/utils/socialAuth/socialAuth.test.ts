import { startHeadlessSocialAuth } from './socialAuth';

const mockStorePendingAuthRedirect = vi.fn();

vi.mock('../authRedirect', () => ({
  storePendingAuthRedirect: (...args: unknown[]) => mockStorePendingAuthRedirect(...args),
}));

vi.mock('@constants', () => ({
  BACKEND_URL: 'http://127.0.0.1:8000',
}));

describe('socialAuth utils', () => {
  test('сохраняет redirect и переводит пользователя на start endpoint', () => {
    const originalLocation = window.location;

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { href: 'http://localhost:5173/' },
    });

    startHeadlessSocialAuth('yandex', '/profile/7');

    expect(mockStorePendingAuthRedirect).toHaveBeenCalledWith('/profile/7');
    expect(window.location.href).toBe('http://127.0.0.1:8000/api/v1/social/yandex/start/');

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });
});
