import { createContext, FC, PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { api } from '@api';
import { CURRENT_USER_QUERY_KEY, useCurrentUser, useLocalStorage } from '@hooks';
import { getIsTokenExpired } from '@utils';

import { AppContext } from './types';

export const appContext = createContext<AppContext>({} as AppContext);

export const AppProvider: FC<PropsWithChildren> = ({ children }) => {
  const [auth, setAuth] = useState(false);

  const { data: user } = useCurrentUser();

  const queryClient = useQueryClient();

  const { getItem, setItem } = useLocalStorage();

  const refreshToken = useCallback(async () => {
    const response = await api.refreshToken();

    if (response.status === 200) {
      setAuth(true);
      setItem('token', response.data['access_token']);
      queryClient.invalidateQueries([CURRENT_USER_QUERY_KEY]);
    }
  }, [queryClient, setItem]);

  const providerProps = useMemo(() => ({ auth, user, setAuth }), [auth, user, setAuth]);

  useEffect(() => {
    const token = getItem<string>('token');

    if (token && getIsTokenExpired(token)) {
      refreshToken();
    }
  }, [refreshToken, getItem]);

  return <appContext.Provider value={providerProps}>{children}</appContext.Provider>;
};
