import { AxiosError } from 'axios';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@api';
import { CURRENT_USER_QUERY_KEY, useApp, useLocalStorage } from '@hooks';
import { OutletContext } from '@pages';

export const useSocialSessionExchange = () => {
  const { setItem } = useLocalStorage();
  const { setIsAuth } = useApp();
  const { messageApi } = useOutletContext<OutletContext>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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
      navigate('/', { replace: true });
    },
  });
};
