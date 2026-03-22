import { Button, Flex, Form, Input, Typography } from 'antd';
import { FC } from 'react';
import { SubmitHandler } from 'react-hook-form';
import { FormItem } from 'react-hook-form-antd';

import { useForm } from '@hooks';
import { SignUpParams } from '@types';

import { SignUpFormSchema, signUpFormSchema } from './constants';
import { useSignUpMutation } from './hooks';

const { Title, Link } = Typography;

export const SignUp: FC = () => {
  const { handleSubmit, control } = useForm(signUpFormSchema);

  const { mutate, isLoading } = useSignUpMutation();
  const submitHanlder: SubmitHandler<SignUpFormSchema> = (data) => mutate(data as SignUpParams);
  return (
    <section>
      <div className="my-container">
        <Form onFinish={handleSubmit(submitHanlder)}>
          <Title level={3}>Регистрация</Title>
          <FormItem control={control} name="username" label="Имя пользователя">
            <Input placeholder="Заполните это поле" />
          </FormItem>

          <FormItem control={control} name="email" label="Электронная почта">
            <Input placeholder="Заполните это поле" />
          </FormItem>

          <FormItem control={control} name="password" label="Пароль">
            <Input.Password placeholder="Заполните это поле" />
          </FormItem>
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
