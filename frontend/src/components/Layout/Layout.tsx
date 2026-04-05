import { Badge, Drawer, Space, theme } from 'antd';
import { FC, PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOutlined,
  ClockCircleOutlined,
  CompassOutlined,
  FireOutlined,
  HeartOutlined,
  HistoryOutlined,
  HomeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';

import { colors } from '@constants';

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

  const selectedKey = location.pathname.startsWith('/catalog') ? 'catalog' : location.pathname === '/' ? 'home' : '';

  const menuItems = useMemo(
    () => [
      { key: 'home', icon: <HomeOutlined />, label: <Link to="/">Главная</Link> },
      { key: 'catalog', icon: <CompassOutlined />, label: <Link to="/catalog">Каталог</Link> },
      { key: '3', icon: <FireOutlined />, label: 'Популярное' },
      { key: '4', icon: <ClockCircleOutlined />, label: 'Блог' },
      { key: '5', icon: <HistoryOutlined />, label: 'История' },
      { key: '6', icon: <HeartOutlined />, label: 'Избранное' },
      { key: '7', icon: <BookOutlined />, label: 'Моя библиотека' },
      { type: 'divider' as const },
      { key: '8', icon: <TeamOutlined />, label: 'Сообщество' },
      { key: '9', icon: <UserOutlined />, label: 'Профиль' },
    ],
    [],
  );

  const menuContent = () => {
    return (
      <>
        {/* <MenuHeader $borderColor={colorBorderSecondary} $withClose={withClose}>
          {withClose && <Button type="text" icon={<CloseOutlined />} onClick={() => setMobileMenuOpen(false)} />}
        </MenuHeader> */}

        <NavigationMenu mode="inline" selectedKeys={[selectedKey]} items={menuItems} />
      </>
    );
  };

  return (
    <RootLayout>
      {!isMobile && (
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

      <Drawer
        placement="left"
        closable={false}
        onClose={() => setMobileMenuOpen(false)}
        open={isMobile && mobileMenuOpen}
        size={280}
        mask={true}
        maskClosable={true}
        styles={drawerStyles}
      >
        {menuContent()}
      </Drawer>

      <MainLayout $isMobile={isMobile} $collapsed={collapsed}>
        <MainHeader $background={colorBgContainer} $borderColor={colorBorderSecondary}>
          <MenuToggleButton
            type="text"
            icon={isMobile ? <MenuUnfoldOutlined /> : collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => (isMobile ? setMobileMenuOpen(true) : setCollapsed((prev) => !prev))}
          />

          <Space size="middle">
            <Badge count={5}>
              <NotificationIcon $color={colorTextSecondary} />
            </Badge>
            <UserAvatar
              icon={<UserOutlined />}
              $background={colors.surface.brandSubtle}
              $color={colorPrimary}
              $borderColor={colorBorderSecondary}
            />
          </Space>
        </MainHeader>

        <MainContent $background={colors.surface.base} $isMobile={isMobile} $radius={borderRadiusLG}>
          {children}
        </MainContent>
      </MainLayout>
    </RootLayout>
  );
};
