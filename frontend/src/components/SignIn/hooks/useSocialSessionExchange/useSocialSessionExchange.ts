import { AxiosError } from 'axios';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@api';
import { OutletContext } from '@pages';
import { consumePendingAuthRedirect, getRedirectFromSearch } from '@utils';
import { useApp } from '@hooks/useApp';
import { CURRENT_USER_QUERY_KEY } from '@hooks/useCurrentUser';
import { useLocalStorage } from '@hooks/useLocalStorage';

export const useSocialSessionExchange = () => {
  const { setItem } = useLocalStorage();
  const { setIsAuth } = useApp();
  const { messageApi } = useOutletContext<OutletContext>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  return useMutation({
    mutationFn: api.exchangeSocialSession,
    onError: (error: AxiosError<Record<string, string | string[]>>) => {
      messageApi.error(error.message);
      navigate('/signin', { replace: true });
    },
    onSuccess: (data) => {
      setItem('token', data.data['access_token']);
      setIsAuth(true);
      queryClient.invalidateQueries([CURRENT_USER_QUERY_KEY]);
      navigate(consumePendingAuthRedirect() || getRedirectFromSearch(location.search), { replace: true });
    },
  });
};
