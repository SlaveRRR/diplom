import { Badge, Button, Drawer, Space, theme } from 'antd';
import { FC, PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChartOutlined,
  CompassOutlined,
  HeartOutlined,
  HistoryOutlined,
  HomeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ReadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { NotificationInstance } from 'antd/es/notification/interface';

import { colors } from '@constants';
import { useApp } from '@hooks';
import { NotificationItem } from '@types';
import { buildAuthPath, getCurrentRelativeUrl } from '@utils';
import { useAccountQuery } from '@components/Account/hooks/useAccountQuery';
import { useNotificationsQuery, useNotificationsSocket } from '@components/Notifications/hooks';

import {
  drawerStyles,
  MainContent,
  MainHeader,
  MainLayout,
  MenuToggleButton,
  NavigationMenu,
  NotificationIcon,
  RootLayout,
  Sidebar,
  UserAvatar,
} from './styled';

type LayoutProps = PropsWithChildren<{
  notificationApi: NotificationInstance;
}>;

const notificationTitles: Record<NotificationItem['type'], string> = {
  info: 'Новое уведомление',
  success: 'Хорошая новость',
  warning: 'Требуется внимание',
  error: 'Важное уведомление',
};

export const Layout: FC<LayoutProps> = ({ children, notificationApi }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const {
    token: { borderRadiusLG, colorBgContainer, colorBorderSecondary, colorPrimary, colorTextSecondary },
  } = theme.useToken();

  const { user, isAuth } = useApp();
  const { data: account } = useAccountQuery(isAuth);
  const { data: notifications } = useNotificationsQuery(isAuth);

  const handleNotificationCreated = useCallback(
    (item: NotificationItem) => {
      notificationApi.open({
        key: `notification-${item.id}`,
        message: notificationTitles[item.type] ?? 'Новое уведомление',
        description: item.message,
        placement: 'topRight',
        duration: 5,
        showProgress: true,
        onClick: () => navigate(item.link || '/notifications'),
        classNames: { root: 'cursor-pointer' },
      });
    },
    [navigate, notificationApi],
  );

  useNotificationsSocket(isAuth, {
    onCreated: handleNotificationCreated,
  });

  const hasAnalyticsAccess = Boolean(account && ((account.comics?.length ?? 0) || (account.posts?.length ?? 0)));
  const isReaderRoute = /^\/comics\/[^/]+\/chapters\/[^/]+/.test(location.pathname);
  const signInHref = buildAuthPath('/signin', {
    redirectTo: getCurrentRelativeUrl(location.pathname, location.search, location.hash),
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      if (mobile) {
        setCollapsed(false);
      } else {
        setCollapsed(true);
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const selectedKey = useMemo(() => {
    if (location.pathname === '/') {
      return 'home';
    }

    if (location.pathname.startsWith('/catalog')) {
      return 'catalog';
    }

    if (location.pathname.startsWith('/blog')) {
      return 'blog';
    }

    if (location.pathname.startsWith('/favorites')) {
      return 'favorites';
    }

    if (location.pathname.startsWith('/history')) {
      return 'history';
    }

    if (location.pathname.startsWith('/profile') || location.pathname.startsWith('/account')) {
      return 'profile';
    }

    if (location.pathname.startsWith('/analytics')) {
      return 'analytics';
    }

    return '';
  }, [location.pathname]);

  const menuItems = useMemo(
    () => [
      { key: 'home', icon: <HomeOutlined />, label: <Link to="/">Главная</Link> },
      { key: 'catalog', icon: <CompassOutlined />, label: <Link to="/catalog">Каталог</Link> },
      { key: 'blog', icon: <ReadOutlined />, label: <Link to="/blog">Блог</Link> },
      ...(hasAnalyticsAccess
        ? [{ key: 'analytics', icon: <BarChartOutlined />, label: <Link to="/analytics">Аналитика</Link> }]
        : []),
      { key: 'history', icon: <HistoryOutlined />, label: <Link to="/history">История</Link> },
      { key: 'favorites', icon: <HeartOutlined />, label: <Link to="/favorites">Избранное</Link> },
    ],
    [hasAnalyticsAccess],
  );

  const menuContent = () => <NavigationMenu mode="inline" selectedKeys={[selectedKey]} items={menuItems} />;

  return (
    <RootLayout>
      {!isReaderRoute && !isMobile ? (
        <Sidebar
          collapsible
          collapsed={collapsed}
          trigger={null}
          width={240}
          collapsedWidth={64}
          $background={colorBgContainer}
          $borderColor={colorBorderSecondary}
        >
          {menuContent()}
        </Sidebar>
      ) : null}

      {!isReaderRoute ? (
        <Drawer
          placement="left"
          closable={false}
          onClose={() => setMobileMenuOpen(false)}
          open={isMobile && mobileMenuOpen}
          size={280}
          mask
          maskClosable
          styles={drawerStyles}
        >
          {menuContent()}
        </Drawer>
      ) : null}

      <MainLayout $isMobile={isMobile} $collapsed={collapsed} $isReaderMode={isReaderRoute}>
        {!isReaderRoute ? (
          <MainHeader $background={colorBgContainer} $borderColor={colorBorderSecondary}>
            <MenuToggleButton
              type="text"
              icon={isMobile ? <MenuUnfoldOutlined /> : collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => (isMobile ? setMobileMenuOpen(true) : setCollapsed((prev) => !prev))}
            />

            <Space size="middle" classNames={{ item: 'inline-flex' }}>
              {isAuth ? (
                <Link to="/notifications">
                  <Badge count={notifications?.unreadCount ?? 0} size="small">
                    <NotificationIcon $color={colorTextSecondary} />
                  </Badge>
                </Link>
              ) : null}

              {isAuth ? (
                <Link to="/account">
                  <UserAvatar
                    alt="user avatar"
                    icon={<UserOutlined />}
                    $background={colors.surface.brandSubtle}
                    $color={colorPrimary}
                    $borderColor={colorBorderSecondary}
                    src={user?.avatar}
                  />
                </Link>
              ) : (
                <Link to={signInHref}>
                  <Button type="primary">Войти</Button>
                </Link>
              )}
            </Space>
          </MainHeader>
        ) : null}

        <MainContent
          $background={isReaderRoute ? '#1c1623' : colors.surface.base}
          $isMobile={isMobile}
          $radius={borderRadiusLG}
          $isReaderMode={isReaderRoute}
        >
          {children}
        </MainContent>
      </MainLayout>
    </RootLayout>
  );
};
