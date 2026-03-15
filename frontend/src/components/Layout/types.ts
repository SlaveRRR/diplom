export interface LayoutProps {
  children: React.ReactNode;
}

export type SidebarStyledProps = {
  $background: string;
  $borderColor: string;
};

export type MenuHeaderStyledProps = {
  $borderColor: string;
  $withClose: boolean;
};

export type BrandTitleStyledProps = {
  $color: string;
  $visible: boolean;
};

export type MainLayoutStyledProps = {
  $isMobile: boolean;
  $collapsed: boolean;
};

export type MainHeaderStyledProps = {
  $background: string;
  $borderColor: string;
};

export type NotificationIconStyledProps = {
  $color: string;
};

export type UserAvatarStyledProps = {
  $background: string;
  $color: string;
  $borderColor: string;
};

export type MainContentStyledProps = {
  $background: string;
  $isMobile: boolean;
  $radius: number;
};
