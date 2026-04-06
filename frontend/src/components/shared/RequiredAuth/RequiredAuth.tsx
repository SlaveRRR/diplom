import { Button, Flex, Typography } from 'antd';
import { FC } from 'react';

import { useApp } from '@hooks';

import { RequiredAuthProps } from './types';

const { Title } = Typography;

export const RequiredAuth: FC<RequiredAuthProps> = ({ children }) => {
  const { isAuth } = useApp();
  return isAuth ? (
    children
  ) : (
    <Flex justify="center" gap={15} vertical align="center" className="pt-20">
      <Title className="text-center" level={3} type="danger">
        Только для авторизованных пользователей!
      </Title>
      <Button type="link" href="/signin">
        Войти
      </Button>
    </Flex>
  );
};
