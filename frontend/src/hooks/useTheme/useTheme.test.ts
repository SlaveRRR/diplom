import { act, renderHook } from '@testing-library/react';

import { useTheme } from './useTheme';

vi.mock('@hooks', () => ({
  useLocalStorage: () => ({
    setItem: vi.fn(),
  }),
}));

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: () => 'dark',
  },
});

describe('useTheme', () => {
  test('проверка работы хука', async () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('dark');

    act(() => {
      result.current.updateAppTheme(false);
    });

    expect(result.current.theme).toBe('light');

    act(() => {
      result.current.updateAppTheme(true);
    });

    expect(result.current.theme).toBe('dark');
  });
});
