import { createContext, FC, PropsWithChildren, useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { api } from '@api';
import { CURRENT_USER_QUERY_KEY, useCurrentUser, useLocalStorage } from '@hooks';
import { getIsTokenExpired } from '@utils';

import { AppContext } from './types';

export const appContext = createContext<AppContext>({} as AppContext);

export const AppProvider: FC<PropsWithChildren> = ({ children }) => {
  const [auth, setAuth] = useState(false);
  const [isAuthResolved, setIsAuthResolved] = useState(false);

  const { data: user } = useCurrentUser({
    enabled: auth && isAuthResolved,
  });

  const queryClient = useQueryClient();

  const { getItem, removeItem, setItem } = useLocalStorage();

  const refreshToken = useCallback(async () => {
    try {
      const response = await api.refreshToken();

      setAuth(true);
      setItem('token', response.data['access_token']);
      queryClient.invalidateQueries([CURRENT_USER_QUERY_KEY]);

      return true;
    } catch {
      removeItem('token');
      setAuth(false);
      queryClient.removeQueries([CURRENT_USER_QUERY_KEY]);

      return false;
    }
  }, [queryClient, removeItem, setItem]);

  const providerProps = useMemo(() => ({ auth, user, setAuth }), [auth, user, setAuth]);

  useLayoutEffect(() => {
    const token = getItem<string>('token');

    if (!token) {
      setAuth(false);
      setIsAuthResolved(true);
      return;
    }

    setAuth(true);

    const syncAuth = async () => {
      try {
        if (getIsTokenExpired(token)) {
          await refreshToken();
        }
      } catch {
        removeItem('token');
        setAuth(false);
      } finally {
        setIsAuthResolved(true);
      }
    };

    syncAuth();
  }, [refreshToken, getItem, removeItem]);

  useLayoutEffect(() => {
    if (!auth) {
      setIsAuthResolved(true);
    }
  }, [auth]);

  return <appContext.Provider value={providerProps}>{children}</appContext.Provider>;
};
