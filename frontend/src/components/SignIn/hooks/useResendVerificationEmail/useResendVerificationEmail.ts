import { AxiosError } from 'axios';
import { useOutletContext } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';

import { api } from '@api';
import { OutletContext } from '@pages';
import { VerificationEmailResponse } from '@types';

const getErrorMessage = (error: AxiosError<Record<string, string | string[]>>) => {
  const detail = error.response?.data?.detail;

  if (typeof detail === 'string') {
    return detail;
  }

  return error.message;
};

export const useResendVerificationEmail = () => {
  const { messageApi } = useOutletContext<OutletContext>();

  return useMutation({
    mutationFn: api.resendVerificationEmail,
    onError: (error: AxiosError<Record<string, string | string[]>>) => {
      messageApi.error(getErrorMessage(error));
    },
    onSuccess: ({ data }: { data: VerificationEmailResponse }) => {
      sessionStorage.setItem(
        `verification-cooldown:${data.email.toLowerCase()}`,
        String(Date.now() + data.retry_after * 1000),
      );
      messageApi.success('Письмо для подтверждения отправлено повторно.');
    },
  });
};
