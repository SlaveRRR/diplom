import { Badge, Button, Drawer, Space, theme } from 'antd';
import { FC, PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  CompassOutlined,
  HeartOutlined,
  HistoryOutlined,
  HomeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ReadOutlined,
  UserOutlined,
} from '@ant-design/icons';

import { colors } from '@constants';
import { useApp } from '@hooks';
import { buildAuthPath, getCurrentRelativeUrl } from '@utils';
import { useNotificationsQuery } from '@components/Notifications/hooks';

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

export const Layout: FC<PropsWithChildren> = ({ children }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const {
    token: { borderRadiusLG, colorBgContainer, colorBorderSecondary, colorPrimary, colorTextSecondary },
  } = theme.useToken();

  const { user, isAuth } = useApp();
  const { data: notifications } = useNotificationsQuery(isAuth);
  const isReaderRoute = /^\/comics\/[^/]+\/chapters\/[^/]+/.test(location.pathname);
  const signInHref = buildAuthPath('/signin', {
    redirectTo: getCurrentRelativeUrl(location.pathname, location.search, location.hash),
  });
  const accountHref = isAuth ? '/account' : signInHref;

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

    return '';
  }, [location.pathname]);

  const menuItems = useMemo(
    () => [
      { key: 'home', icon: <HomeOutlined />, label: <Link to="/">Главная</Link> },
      { key: 'catalog', icon: <CompassOutlined />, label: <Link to="/catalog">Каталог</Link> },
      { key: 'blog', icon: <ReadOutlined />, label: <Link to="/blog">Блог</Link> },
      { key: 'history', icon: <HistoryOutlined />, label: <Link to="/history">История</Link> },
      { key: 'favorites', icon: <HeartOutlined />, label: <Link to="/favorites">Избранное</Link> },
      // { type: 'divider' as const },
      // { key: 'profile', icon: <UserOutlined />, label: <Link to={accountHref}>Личный кабинет</Link> },
    ],
    [accountHref],
  );

  const menuContent = () => <NavigationMenu mode="inline" selectedKeys={[selectedKey]} items={menuItems} />;

  return (
    <RootLayout>
      {!isReaderRoute && !isMobile && (
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
      )}

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
