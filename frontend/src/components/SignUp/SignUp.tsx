import { Button, Divider, Flex, Form, Image, Input, Space, Typography } from 'antd';
import { FC } from 'react';
import { SubmitHandler } from 'react-hook-form';
import { FormItem } from 'react-hook-form-antd';

import { useForm } from '@hooks';
import { SignUpParams } from '@types';
import { startHeadlessSocialAuth } from '@utils';
import GoogleIcon from '@assets/icons/google.svg';
import VkIcon from '@assets/icons/vk.svg';
import YandexIcon from '@assets/icons/yandex.svg';

import { SignUpFormSchema, signUpFormSchema } from './constants';
import { useSignUpMutation } from './hooks';

const { Title, Link, Text } = Typography;

export const SignUp: FC = () => {
  const { handleSubmit, control } = useForm(signUpFormSchema);
  const { mutate, isLoading } = useSignUpMutation();

  const submitHanlder: SubmitHandler<SignUpFormSchema> = (data) => mutate(data as SignUpParams);

  return (
    <section>
      <div className="my-container">
        <Form onFinish={handleSubmit(submitHanlder)}>
          <Title className="text-center" level={3}>
            Регистрация
          </Title>

          <FormItem control={control} name="username" label="Имя пользователя">
            <Input placeholder="Заполните это поле" />
          </FormItem>

          <FormItem control={control} name="email" label="Электронная почта">
            <Input placeholder="Заполните это поле" />
          </FormItem>

          <FormItem control={control} name="password" label="Пароль">
            <Input.Password placeholder="Заполните это поле" />
          </FormItem>

          <Divider plain>
            <Text type="secondary">или создать аккаунт через</Text>
          </Divider>

          <Space size={12} className="w-full justify-center mb-3">
            <Button
              className="px-7 py-5 flex items-center [&_img]:inline"
              size="large"
              icon={<Image src={GoogleIcon} />}
              block
              onClick={() => startHeadlessSocialAuth('google')}
            />
            <Button
              className="px-7 py-5 flex items-center [&_img]:inline"
              size="large"
              icon={<Image src={YandexIcon} />}
              block
              onClick={() => startHeadlessSocialAuth('yandex')}
            />
            <Button
              className="px-7 py-5 flex items-center [&_img]:inline"
              size="large"
              icon={<Image src={VkIcon} />}
              block
              onClick={() => startHeadlessSocialAuth('vk')}
            />
          </Space>

          <Flex justify="center" gap={9} align="center" vertical className="pt-3">
            <Button loading={isLoading} type="primary" htmlType="submit">
              Зарегистрироваться
            </Button>
            <Link href="/signin">Уже есть аккаунт?</Link>
          </Flex>
        </Form>
      </div>
    </section>
  );
};
