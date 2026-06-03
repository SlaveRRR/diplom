import { Button, Card, Col, Flex, Row, Space, Typography } from 'antd';
import { FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRightOutlined, CompassOutlined, LockOutlined, UserAddOutlined } from '@ant-design/icons';

import { useApp } from '@hooks';
import { buildAuthPath, getCurrentRelativeUrl } from '@utils';

import { RequiredAuthProps } from './types';

const { Paragraph, Text, Title } = Typography;

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
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} lg={14}>
              <Space direction="vertical" size={18} className="w-full">
                <Flex
                  align="center"
                  justify="center"
                  className="h-14 w-14 rounded-2xl bg-[rgba(114,84,230,0.12)] text-[24px] text-[var(--color-brand-primary)]"
                >
                  <LockOutlined />
                </Flex>

                <Space direction="vertical" size={10} className="w-full">
                  <Title level={2} className="!mb-0 !text-balance" data-testid="title">
                    Этот раздел открывается после входа в аккаунт
                  </Title>
                  <Paragraph className="!mb-0 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
                    Каталог, чтение комиксов и публичные страницы доступны без авторизации. Войти нужно, когда вы хотите
                    создать собственный релиз, сохранить прогресс чтения, собирать избранное и работать с личными
                    действиями внутри платформы.
                  </Paragraph>
                </Space>

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
                </Flex>
              </Space>
            </Col>

            <Col xs={24} lg={10}>
              <Card className="border-0 bg-white/80 shadow-none backdrop-blur-sm">
                <Space direction="vertical" size={14} className="w-full">
                  <Text strong className="text-[15px]">
                    Что можно делать без входа
                  </Text>
                  <Flex vertical gap={10}>
                    <AuthFeature text="Смотреть главную страницу и подборки" />
                    <AuthFeature text="Открывать каталог и страницы комиксов" />
                    <AuthFeature text="Читать главы и знакомиться с блогом" />
                  </Flex>

                  <div className="h-px w-full bg-black/6" />

                  <Text strong className="text-[15px]">
                    Что откроется после авторизации
                  </Text>
                  <Flex vertical gap={10}>
                    <AuthFeature text="Создание комиксов и управление публикациями" />
                    <AuthFeature text="Лайки, комментарии, избранное и личная библиотека" />
                    <AuthFeature text="Возврат к последней прочитанной странице" />
                  </Flex>

                  <Link to="/catalog" className="pt-2">
                    <Button type="link" className="!px-0" icon={<CompassOutlined />}>
                      Вернуться в каталог
                    </Button>
                  </Link>
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      </Card>
    </div>
  );
};

const AuthFeature: FC<{ text: string }> = ({ text }) => (
  <Flex align="start" gap={10}>
    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--color-brand-primary)]" />
    <Text className="leading-6 text-[var(--color-text-secondary)]">{text}</Text>
  </Flex>
);
