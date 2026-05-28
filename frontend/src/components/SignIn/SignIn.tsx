import { Alert, Button, Checkbox, Divider, Flex, Form, Image, Input, Typography } from 'antd';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Controller, SubmitHandler } from 'react-hook-form';
import { FormItem } from 'react-hook-form-antd';
import { useLocation, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';

import { OutletContext } from '@pages';
import { SignInParams } from '@types';
import {
  buildAuthPath,
  getIntentFromSearch,
  getIntentLabel,
  getRedirectFromSearch,
  SocialProvider,
  startHeadlessSocialAuth,
} from '@utils';
import GoogleIcon from '@assets/icons/google.svg';
import VkIcon from '@assets/icons/vk.svg';
import YandexIcon from '@assets/icons/yandex.svg';
import { useForm } from '@hooks/useForm';

import { SignInFormSchema, signInFormSchema } from './constants';
import { useResendVerificationEmail, useSignInMutation, useSocialSessionExchange } from './hooks';

const { Title, Link, Text } = Typography;

export const SignIn: FC = () => {
  const {
    handleSubmit,
    control,
    getValues,
    trigger,
    formState: { errors },
  } = useForm(signInFormSchema);
  const { mutate, isLoading } = useSignInMutation();
  const { mutate: exchangeSocialSession, isLoading: isSocialExchangeLoading } = useSocialSessionExchange();
  const { mutateAsync: resendVerificationEmail, isLoading: isResendingVerificationEmail } =
    useResendVerificationEmail();
  const { messageApi } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const socialState = searchParams.get('social');
  const socialError = searchParams.get('error');
  const verificationState = searchParams.get('verification');
  const verificationEmail = searchParams.get('email') || '';
  const retryAfter = Number(searchParams.get('retryAfter') || '60');
  const redirectTo = getRedirectFromSearch(location.search);
  const intent = getIntentFromSearch(location.search);
  const intentLabel = getIntentLabel(intent);
  const socialExchangeTriggered = useRef(false);
  const verificationSuccessHandled = useRef(false);
  const [verificationCooldown, setVerificationCooldown] = useState(0);

  const submitHanlder: SubmitHandler<SignInFormSchema> = (data) =>
    mutate({
      username: data.username,
      password: data.password,
    } as SignInParams);
  const verificationCooldownStorageKey = verificationEmail
    ? `verification-cooldown:${verificationEmail.toLowerCase()}`
    : null;

  const auth = async (type: SocialProvider) => {
    await trigger(['privacyPolicy', 'personalDataPolicy']);

    if (getValues('privacyPolicy') && getValues('personalDataPolicy')) {
      startHeadlessSocialAuth(type, redirectTo);
    }
  };

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
    <section className="py-4 sm:py-6 lg:py-8">
      <div className="mx-auto w-full max-w-[560px] rounded-[28px] bg-white p-5 shadow-sm sm:p-7 lg:p-8">
        <Form data-testid="form" onFinish={handleSubmit(submitHanlder)} layout="vertical">
          <Title className="text-center" level={3}>
            Авторизация
          </Title>

          {intentLabel ? (
            <Alert
              className="mb-4"
              type="warning"
              showIcon
              message="Нужен аккаунт"
              description={`Войдите или зарегистрируйтесь, чтобы ${intentLabel}. После входа вы автоматически вернётесь к нужному экрану.`}
            />
          ) : null}

          {verificationState === 'pending' && verificationEmail ? (
            <Alert
              className="mb-4"
              type="info"
              message="Подтвердите электронную почту"
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
            <Input size="large" placeholder="Заполните это поле" />
          </FormItem>

          <FormItem control={control} name="password" label="Пароль">
            <Input.Password size="large" placeholder="Заполните это поле" />
          </FormItem>

          <Divider plain>или войти через</Divider>

          <div className="mb-3 grid grid-cols-3 gap-3">
            <Button
              className="!flex !h-12 !items-center !justify-center [&_img]:inline"
              size="large"
              icon={<Image src={GoogleIcon} preview={false} />}
              block
              disabled={isSocialExchangeLoading}
              onClick={() => auth('google')}
            />
            <Button
              className="!flex !h-12 !items-center !justify-center [&_img]:inline"
              size="large"
              icon={<Image src={YandexIcon} preview={false} />}
              block
              disabled={isSocialExchangeLoading}
              onClick={() => auth('yandex')}
            />
            <Button
              className="!flex !h-12 !items-center !justify-center [&_img]:inline"
              size="large"
              icon={<Image src={VkIcon} preview={false} />}
              block
              disabled={isSocialExchangeLoading}
              onClick={() => auth('vk')}
            />
          </div>

          <Flex justify="center" gap={9} align="center" vertical className="pt-2">
            <Controller
              name="privacyPolicy"
              control={control}
              render={({ field: { value, onChange, ...field } }) => (
                <Flex gap={12} vertical={false} align="start" className="w-full max-w-[420px]" wrap="nowrap">
                  <Text className="flex-1 leading-6">
                    Я ознакомлен с <Link href="/privacy-policy">политикой конфиденциальности</Link>
                  </Text>
                  <Checkbox
                    {...field}
                    checked={value}
                    onChange={(event) => onChange(event.target.checked)}
                    className="mt-1 shrink-0"
                  />
                </Flex>
              )}
            />
            {!!errors?.privacyPolicy?.message && <Text type="danger">{errors.privacyPolicy.message}</Text>}
            <Controller
              name="personalDataPolicy"
              control={control}
              render={({ field: { value, onChange, ...field } }) => (
                <Flex gap={12} vertical={false} align="start" className="w-full max-w-[420px]" wrap="nowrap">
                  <Text className="flex-1 leading-6">
                    Я ознакомлен с <Link href="/personal-data">политикой обработки персональных данных</Link>
                  </Text>
                  <Checkbox
                    {...field}
                    checked={value}
                    onChange={(event) => onChange(event.target.checked)}
                    className="mt-1 shrink-0"
                  />
                </Flex>
              )}
            />
            {!!errors?.personalDataPolicy?.message && <Text type="danger">{errors.personalDataPolicy.message}</Text>}
            <Button
              className="w-full sm:w-auto"
              loading={isLoading || isSocialExchangeLoading}
              size="large"
              type="primary"
              htmlType="submit"
            >
              Войти
            </Button>
            <Link href={buildAuthPath('/signup', { intent, redirectTo })}>Ещё нет аккаунта?</Link>
          </Flex>
        </Form>
      </div>
    </section>
  );
};
