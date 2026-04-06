import { Alert, Button, Divider, Flex, Form, Image, Input, Space, Typography } from 'antd';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { SubmitHandler } from 'react-hook-form';
import { FormItem } from 'react-hook-form-antd';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';

import { useForm } from '@hooks';
import { OutletContext } from '@pages';
import { SignInParams } from '@types';
import { startHeadlessSocialAuth } from '@utils';
import GoogleIcon from '@assets/icons/google.svg';
import VkIcon from '@assets/icons/vk.svg';
import YandexIcon from '@assets/icons/yandex.svg';

import { SignInFormSchema, signInFormSchema } from './constants';
import { useResendVerificationEmail, useSignInMutation, useSocialSessionExchange } from './hooks';

const { Title, Link } = Typography;

export const SignIn: FC = () => {
  const { handleSubmit, control } = useForm(signInFormSchema);
  const { mutate, isLoading } = useSignInMutation();
  const { mutate: exchangeSocialSession, isLoading: isSocialExchangeLoading } = useSocialSessionExchange();
  const { mutateAsync: resendVerificationEmail, isLoading: isResendingVerificationEmail } =
    useResendVerificationEmail();
  const { messageApi } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const socialState = searchParams.get('social');
  const socialError = searchParams.get('error');
  const verificationState = searchParams.get('verification');
  const verificationEmail = searchParams.get('email') || '';
  const retryAfter = Number(searchParams.get('retryAfter') || '60');
  const socialExchangeTriggered = useRef(false);
  const verificationSuccessHandled = useRef(false);
  const [verificationCooldown, setVerificationCooldown] = useState(0);

  const submitHanlder: SubmitHandler<SignInFormSchema> = (data) => mutate(data as SignInParams);
  const verificationCooldownStorageKey = verificationEmail
    ? `verification-cooldown:${verificationEmail.toLowerCase()}`
    : null;

  const syncVerificationCooldown = useCallback(
    (initialRetryAfter = 0) => {
      if (!verificationCooldownStorageKey) {
        setVerificationCooldown(0);
        return;
      }

      let cooldownExpiresAt = Number(sessionStorage.getItem(verificationCooldownStorageKey) || '0');

      if (!cooldownExpiresAt && initialRetryAfter > 0) {
        cooldownExpiresAt = Date.now() + initialRetryAfter * 1000;
        sessionStorage.setItem(verificationCooldownStorageKey, String(cooldownExpiresAt));
      }

      const nextCooldown = Math.max(Math.ceil((cooldownExpiresAt - Date.now()) / 1000), 0);

      if (nextCooldown === 0 && cooldownExpiresAt) {
        sessionStorage.removeItem(verificationCooldownStorageKey);
      }

      setVerificationCooldown(nextCooldown);
    },
    [verificationCooldownStorageKey],
  );

  useEffect(() => {
    if (socialState !== 'callback') {
      return;
    }

    if (socialError) {
      messageApi.error('Не удалось выполнить вход через соцсеть.');
      navigate('/signin', { replace: true });
      return;
    }

    if (socialExchangeTriggered.current) {
      return;
    }

    socialExchangeTriggered.current = true;
    exchangeSocialSession();
  }, [exchangeSocialSession, messageApi, navigate, socialError, socialState]);

  useEffect(() => {
    if (verificationState !== 'success' || verificationSuccessHandled.current) {
      return;
    }

    verificationSuccessHandled.current = true;
    messageApi.success('Почта подтверждена. Теперь можно войти в аккаунт.');
    navigate('/signin', { replace: true });
  }, [messageApi, navigate, verificationState]);

  useEffect(() => {
    if (verificationState !== 'pending') {
      setVerificationCooldown(0);
      return;
    }

    syncVerificationCooldown(retryAfter);

    const timerId = window.setInterval(() => {
      syncVerificationCooldown();
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [retryAfter, syncVerificationCooldown, verificationState]);

  const handleResendVerificationEmail = async () => {
    if (!verificationEmail) {
      return;
    }

    const response = await resendVerificationEmail(verificationEmail);

    syncVerificationCooldown(response.data.retry_after);
  };

  return (
    <section>
      <div className="my-container">
        <Form onFinish={handleSubmit(submitHanlder)}>
          <Title className="text-center" level={3}>
            Авторизация
          </Title>

          {verificationState === 'pending' && verificationEmail ? (
            <Alert
              className="mb-4"
              type="info"
              title="Подтвердите электронную почту"
              description={
                <Flex vertical gap={12}>
                  <span>
                    Мы отправили письмо на <strong>{verificationEmail}</strong>. После подтверждения почты можно будет
                    войти в аккаунт.
                  </span>
                  <Flex gap={12} align="center" wrap="wrap">
                    <Button
                      type="default"
                      onClick={handleResendVerificationEmail}
                      disabled={verificationCooldown > 0}
                      loading={isResendingVerificationEmail}
                    >
                      Отправить письмо повторно
                    </Button>
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      {verificationCooldown > 0
                        ? `Повторная отправка будет доступна через ${verificationCooldown} сек.`
                        : 'Можно запросить новое письмо.'}
                    </span>
                  </Flex>
                </Flex>
              }
            />
          ) : null}

          <FormItem control={control} name="username" label="Имя пользователя">
            <Input placeholder="Заполните это поле" />
          </FormItem>

          <FormItem control={control} name="password" label="Пароль">
            <Input.Password placeholder="Заполните это поле" />
          </FormItem>

          <Divider plain>или войти через</Divider>

          <Space size={12} className="mb-3 flex w-full justify-center">
            <Button
              className="flex items-center px-7 py-5 [&_img]:inline"
              size="large"
              icon={<Image src={GoogleIcon} preview={false} />}
              block
              disabled={isSocialExchangeLoading}
              onClick={() => startHeadlessSocialAuth('google')}
            />
            <Button
              className="flex items-center px-7 py-5 [&_img]:inline"
              size="large"
              icon={<Image src={YandexIcon} preview={false} />}
              block
              disabled={isSocialExchangeLoading}
              onClick={() => startHeadlessSocialAuth('yandex')}
            />
            <Button
              className="flex items-center px-7 py-5 [&_img]:inline"
              size="large"
              icon={<Image src={VkIcon} preview={false} />}
              block
              disabled={isSocialExchangeLoading}
              onClick={() => startHeadlessSocialAuth('vk')}
            />
          </Space>

          <Flex justify="center" gap={9} align="center" vertical className="pt-2">
            <Button loading={isLoading || isSocialExchangeLoading} type="primary" htmlType="submit">
              Войти
            </Button>
            <Link href="/signup">Ещё нет аккаунта?</Link>
          </Flex>
        </Form>
      </div>
    </section>
  );
};
