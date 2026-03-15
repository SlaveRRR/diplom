import { useCallback, useState } from 'react';

import { LS_APP_THEME } from '@constants';
import { useLocalStorage } from '@hooks';
import { AppTheme } from '@types';

const getInitTheme = () => {
  const initTheme = localStorage.getItem(LS_APP_THEME) as AppTheme;

  return initTheme || 'light';
};

export const useTheme = () => {
  const { setItem } = useLocalStorage();

  const [theme, setTheme] = useState<AppTheme>(() => getInitTheme());

  const updateAppTheme = useCallback(
    (isDarkMode: boolean) => {
      const theme = isDarkMode ? 'dark' : 'light';

      setItem(LS_APP_THEME, theme);

      setTheme(theme);
    },
    [setItem, setTheme],
  );

  return { theme, updateAppTheme };
};
