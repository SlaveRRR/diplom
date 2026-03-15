import { useCallback } from 'react';

export const useLocalStorage = () => {
  const setItem = useCallback(<T>(key: string, value: T) => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, []);

  const getItem = useCallback(<T>(key: string): T | null => {
    const item = window.localStorage.getItem(key);

    if (!item) {
      return null;
    }

    try {
      return JSON.parse(item) as T;
    } catch {
      return item as T;
    }
  }, []);

  const removeItem = useCallback((key: string): void => {
    window.localStorage.removeItem(key);
  }, []);

  return { setItem, getItem, removeItem };
};
