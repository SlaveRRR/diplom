import { Layout as AntdLayout, Avatar, Button, Menu, Typography } from 'antd';
import styled from 'styled-components';
import { BellOutlined } from '@ant-design/icons';

import type {
  BrandTitleStyledProps,
  MainContentStyledProps,
  MainHeaderStyledProps,
  MainLayoutStyledProps,
  MenuHeaderStyledProps,
  NotificationIconStyledProps,
  SidebarStyledProps,
  UserAvatarStyledProps,
} from './types';

const { Header, Content, Sider } = AntdLayout;
const { Title } = Typography;

const space = (step: number) => `${step * 4}px`;

export const drawerStyles = {
  body: {
    padding: 0,
  },
} as const;

export const RootLayout = styled(AntdLayout)({
  minHeight: '100vh',
});

export const Sidebar = styled(Sider)<SidebarStyledProps>(({ $background, $borderColor }) => ({
  position: 'fixed',
  inset: '0 auto 0 0',
  height: '100vh',
  zIndex: 1000,
  background: $background,
  borderRight: `1px solid ${$borderColor}`,
  willChange: 'width',
  transition: 'width 0.2s ease, min-width 0.2s ease, max-width 0.2s ease, flex-basis 0.2s ease',
}));

export const MenuHeader = styled.div<MenuHeaderStyledProps>(({ $borderColor, $withClose }) => ({
  height: 64,
  display: 'flex',
  alignItems: 'center',
  justifyContent: $withClose ? 'space-between' : 'center',
  padding: `0 ${space(6)}`,
  borderBottom: `1px solid ${$borderColor}`,
}));

export const BrandRow = styled.div({
  display: 'flex',
  alignItems: 'center',
});

export const BrandLogoWrap = styled.div({
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
});

export const BrandTitle = styled(Title)<BrandTitleStyledProps>(({ $color, $visible }) => ({
  margin: $visible ? `0 0 0 ${space(3)}` : '0',
  maxWidth: $visible ? 180 : 0,
  opacity: $visible ? 1 : 0,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  color: $color,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  transition: 'max-width 0.2s ease, opacity 0.15s ease, margin 0.2s ease',
}));

export const NavigationMenu = styled(Menu)({
  borderRight: 0,
  marginTop: space(2),
});

export const MainLayout = styled(AntdLayout)<MainLayoutStyledProps>(({ $isMobile, $collapsed }) => ({
  marginLeft: $isMobile ? 0 : $collapsed ? 64 : 240,
  transition: 'margin-left 0.2s ease',
  minHeight: '100vh',
}));

export const MainHeader = styled(Header)<MainHeaderStyledProps>(({ $background, $borderColor }) => ({
  padding: `0 ${space(4)}`,
  background: $background,
  position: 'sticky',
  top: 0,
  zIndex: 999,
  borderBottom: `1px solid ${$borderColor}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

export const MenuToggleButton = styled(Button)({
  fontSize: 18,
  width: 48,
  height: 48,
});

export const NotificationIcon = styled(BellOutlined)<NotificationIconStyledProps>(({ $color }) => ({
  fontSize: 20,
  color: $color,
}));

export const UserAvatar = styled(Avatar)<UserAvatarStyledProps>(({ $background, $color, $borderColor }) => ({
  background: $background,
  color: $color,
  border: `1px solid ${$borderColor}`,
}));

export const MainContent = styled(Content)<MainContentStyledProps>(({ $background, $isMobile, $radius }) => ({
  padding: 'var(--space-page-y) var(--space-page-x)',
  background: $background,
  borderTopLeftRadius: $isMobile ? 0 : $radius,
}));
