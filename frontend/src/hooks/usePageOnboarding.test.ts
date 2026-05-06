import { act, renderHook } from '@testing-library/react';

import { usePageOnboarding } from './usePageOnboarding';

describe('usePageOnboarding', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  test('открывает onboarding один раз и пишет флаг в sessionStorage', () => {
    const first = renderHook(() => usePageOnboarding({ storageKey: 'catalog_onboarding_shown' }));

    expect(first.result.current.isOpen).toBe(true);
    expect(window.sessionStorage.getItem('catalog_onboarding_shown')).toBe('true');

    const second = renderHook(() => usePageOnboarding({ storageKey: 'catalog_onboarding_shown' }));
    expect(second.result.current.isOpen).toBe(false);
  });

  test('умеет работать с localStorage и reset/open/close', () => {
    const { result } = renderHook(() =>
      usePageOnboarding({ storageKey: 'analytics_onboarding_shown', storage: 'local' }),
    );

    expect(window.localStorage.getItem('analytics_onboarding_shown')).toBe('true');

    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);

    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.reset());
    expect(result.current.isOpen).toBe(true);
    expect(window.localStorage.getItem('analytics_onboarding_shown')).toBeNull();
  });

  test('не открывает onboarding, если enabled=false', () => {
    const { result } = renderHook(() => usePageOnboarding({ storageKey: 'disabled', enabled: false }));

    expect(result.current.isOpen).toBe(false);
    expect(window.sessionStorage.getItem('disabled')).toBeNull();
  });
});
