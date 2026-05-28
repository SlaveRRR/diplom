import { act, renderHook } from '@testing-library/react';

import { useRequireAuthAction } from './useRequireAuthAction';

const mockNavigate = vi.fn();
const mockStorePendingAuthRedirect = vi.fn();
const mockUseApp = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual: object = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      pathname: '/comics/1',
      search: '?chapter=2',
      hash: '#reader',
    }),
  };
});

vi.mock('@utils', () => ({
  buildAuthPath: vi.fn((pathname: string) => `${pathname}?mocked=true`),
  getCurrentRelativeUrl: vi.fn(() => '/comics/1?chapter=2#reader'),
  storePendingAuthRedirect: (...args: unknown[]) => mockStorePendingAuthRedirect(...args),
}));

vi.mock('../useApp', () => ({
  useApp: () => mockUseApp(),
}));

describe('useRequireAuthAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('перенаправляет неавторизованного пользователя на страницу входа', () => {
    mockUseApp.mockReturnValue({ isAuth: false });

    const { result } = renderHook(() => useRequireAuthAction());

    expect(result.current.redirectTo).toBe('/comics/1?chapter=2#reader');

    act(() => {
      result.current.redirectToAuth('comment');
    });

    expect(mockStorePendingAuthRedirect).toHaveBeenCalledWith('/comics/1?chapter=2#reader');
    expect(mockNavigate).toHaveBeenCalledWith('/signin?mocked=true');
  });

  test('runWithAuth выполняет действие для авторизованного пользователя', () => {
    mockUseApp.mockReturnValue({ isAuth: true });
    const action = vi.fn();

    const { result } = renderHook(() => useRequireAuthAction());

    let response = false;
    act(() => {
      response = result.current.runWithAuth('favorite', action);
    });

    expect(response).toBe(true);
    expect(action).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('runWithAuth запускает сценарий авторизации, если пользователь не вошёл', () => {
    mockUseApp.mockReturnValue({ isAuth: false });
    const action = vi.fn();

    const { result } = renderHook(() => useRequireAuthAction());

    let response = true;
    act(() => {
      response = result.current.runWithAuth('like', action);
    });

    expect(response).toBe(false);
    expect(action).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalled();
  });
});
