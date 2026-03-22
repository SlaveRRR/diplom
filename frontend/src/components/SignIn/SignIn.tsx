import { Button, Flex, Form, Input, Typography } from 'antd';
import { FC } from 'react';
import { SubmitHandler } from 'react-hook-form';
import { FormItem } from 'react-hook-form-antd';

import { useForm } from '@hooks';
import { SignInParams } from '@types';

import { SignInFormSchema, signInFormSchema } from './constants';
import { useSignInMutation } from './hooks';

const { Title, Link } = Typography;

export const SignIn: FC = () => {
  const { handleSubmit, control } = useForm(signInFormSchema);

  const { mutate, isLoading } = useSignInMutation();

  const submitHanlder: SubmitHandler<SignInFormSchema> = (data) => mutate(data as SignInParams);

  return (
    <section>
      <div className="my-container">
        <Form onFinish={handleSubmit(submitHanlder)}>
          <Title level={3}>Авторизация</Title>
          <FormItem control={control} name="username" label="Имя пользователя">
            <Input placeholder="Заполните это поле" />
          </FormItem>

          <FormItem control={control} name="password" label="Пароль">
            <Input.Password placeholder="Заполните это поле" />
          </FormItem>

          <Flex justify="center" gap={9} align="center" vertical className="pt-2">
            <Button loading={isLoading} type="primary" htmlType="submit">
              Войти
            </Button>
            <Link href="/signup">Еще нет аккаунта?</Link>
          </Flex>
        </Form>
      </div>
    </section>
  );
};
