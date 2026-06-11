import { Button, Checkbox, Divider, Flex, Form, Image, Input, Typography } from 'antd';
import { FC } from 'react';
import { Controller, SubmitHandler } from 'react-hook-form';
import { FormItem } from 'react-hook-form-antd';
import { useLocation } from 'react-router-dom';

import { SignUpParams } from '@types';
import { getRedirectFromSearch, SocialProvider, startHeadlessSocialAuth } from '@utils';
import GoogleIcon from '@assets/icons/google.svg';
import VkIcon from '@assets/icons/vk.svg';
import YandexIcon from '@assets/icons/yandex.svg';
import { useForm } from '@hooks/useForm';

import { SignUpFormSchema, signUpFormSchema } from './constants';
import { useSignUpMutation } from './hooks';

const { Title, Link, Text } = Typography;

export const SignUp: FC = () => {
  const {
    handleSubmit,
    control,
    formState: { errors },
    getValues,
    trigger,
  } = useForm(signUpFormSchema);
  const { mutate, isLoading } = useSignUpMutation();
  const location = useLocation();
  const redirectTo = getRedirectFromSearch(location.search);

  const submitHanlder: SubmitHandler<SignUpFormSchema> = (data) =>
    mutate({
      username: data.username,
      email: data.email,
      password: data.password,
    } as SignUpParams);

  const auth = async (type: SocialProvider) => {
    await trigger();

    const value = getValues('policy');

    if (value) {
      startHeadlessSocialAuth(type, redirectTo);
    }
  };

  return (
    <section className="py-4 sm:py-6 lg:py-8">
      <div className="mx-auto w-full max-w-[560px] rounded-[28px] bg-white p-5 shadow-sm sm:p-7 lg:p-8">
        <Form data-testid="form" onFinish={handleSubmit(submitHanlder)} layout="vertical">
          <Title className="text-center" level={3}>
            Регистрация
          </Title>

          <FormItem control={control} name="username" label="Имя пользователя">
            <Input size="large" placeholder="Заполните это поле" />
          </FormItem>

          <FormItem control={control} name="email" label="Электронная почта">
            <Input size="large" placeholder="Заполните это поле" />
          </FormItem>

          <FormItem control={control} name="password" label="Пароль">
            <Input.Password size="large" placeholder="Заполните это поле" />
          </FormItem>

          <Divider plain>
            <Text type="secondary">или создать аккаунт через</Text>
          </Divider>

          <div className="mb-3 grid grid-cols-3 gap-3">
            <Button
              className="!flex !h-12 !items-center !justify-center [&_img]:inline"
              size="large"
              icon={<Image src={GoogleIcon} preview={false} />}
              block
              onClick={() => auth('google')}
            />
            <Button
              className="!flex !h-12 !items-center !justify-center [&_img]:inline"
              size="large"
              icon={<Image src={YandexIcon} preview={false} />}
              block
              onClick={() => auth('yandex')}
            />
            <Button
              className="!flex !h-12 !items-center !justify-center [&_img]:inline"
              size="large"
              icon={<Image src={VkIcon} preview={false} />}
              block
              onClick={() => auth('vk')}
            />
          </div>

          <Flex justify="center" gap={9} align="center" vertical className="pt-3">
            <Controller
              name="policy"
              control={control}
              render={({ field: { value, onChange, ...field } }) => (
                <Flex gap={12} vertical={false} align="start" className="w-full max-w-[420px]" wrap="nowrap">
                  <Text className="flex-1 leading-6">
                    Я ознакомлен с <Link href="/user-agreement">пользовательским соглашением</Link>,{' '}
                    <Link href="/privacy-policy">политикой конфиденциальности</Link>,{' '}
                    <Link href="/personal-data">политикой обработки персональных данных</Link>
                  </Text>
                  <Checkbox
                    {...field}
                    checked={value}
                    onChange={(e) => onChange(e.target.checked)}
                    className="mt-1 shrink-0"
                  />
                </Flex>
              )}
            />
            {!!errors?.policy?.message && <Text type="danger">{errors.policy.message}</Text>}
            <Button className="w-full sm:w-auto" loading={isLoading} size="large" type="primary" htmlType="submit">
              Зарегистрироваться
            </Button>
            <Link href="/signin">Уже есть аккаунт?</Link>
          </Flex>
        </Form>
      </div>
    </section>
  );
};
