import { Button, Card, Col, Flex, Row, Space, Typography } from 'antd';
import { FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRightOutlined, CompassOutlined, LockOutlined, UserAddOutlined } from '@ant-design/icons';

import { useApp } from '@hooks';
import { buildAuthPath, getCurrentRelativeUrl } from '@utils';

import { RequiredAuthProps } from './types';

const { Title } = Typography;

export const RequiredAuth: FC<RequiredAuthProps> = ({ children }) => {
  const { isAuth } = useApp();
  const location = useLocation();

  const redirectTo = getCurrentRelativeUrl(location.pathname, location.search, location.hash);
  const signInHref = buildAuthPath('/signin', {
    intent: 'create',
    redirectTo,
  });
  const signUpHref = buildAuthPath('/signup', {
    intent: 'create',
    redirectTo,
  });

  if (isAuth) {
    return children;
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-0 sm:py-12">
      <Card
        className="overflow-hidden border-0 shadow-[0_24px_80px_rgba(32,20,82,0.12)]"
        styles={{ body: { padding: 0 } }}
      >
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(114,84,230,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(46,144,250,0.16),transparent_32%),linear-gradient(135deg,#ffffff_0%,#f4f6fb_100%)] p-5 sm:p-8 lg:p-10">
          <Row gutter={[24, 24]} align="middle" justify="center">
            <Col xs={24} lg={14}>
              <Space direction="vertical" size={18} className="w-full">
                <Flex
                  align="center"
                  justify="center"
                  className="h-14 w-14 rounded-2xl bg-[rgba(114,84,230,0.12)] text-[24px] text-[var(--color-brand-primary)]"
                >
                  <LockOutlined />
                </Flex>

                <Title level={2} className="!mb-0 !text-balance" data-testid="title">
                  Этот раздел открывается после входа в аккаунт
                </Title>

                <Flex gap={12} wrap="wrap">
                  <Link to={signInHref}>
                    <Button data-testid="signin-button" size="large" type="primary" icon={<ArrowRightOutlined />}>
                      Войти
                    </Button>
                  </Link>
                  <Link to={signUpHref}>
                    <Button size="large" icon={<UserAddOutlined />}>
                      Зарегистрироваться
                    </Button>
                  </Link>
                  <Link to="/catalog" className="pt-2">
                    <Button type="link" className="!px-0" icon={<CompassOutlined />}>
                      Вернуться в каталог
                    </Button>
                  </Link>
                </Flex>
              </Space>
            </Col>
          </Row>
        </div>
      </Card>
    </div>
  );
};
