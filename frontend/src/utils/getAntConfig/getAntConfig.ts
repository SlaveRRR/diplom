import { theme, ThemeConfig } from 'antd';

import { colors } from '@constants';
import { AppTheme } from '@types';

const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: colors.brand.primary,
    colorLink: colors.brand.secondary,
    colorInfo: colors.brand.secondary,
    colorSuccess: colors.success[500],
    colorWarning: colors.warning[500],
    colorError: colors.error[500],
    colorTextBase: colors.text.primary,
    colorText: colors.text.primary,
    colorTextSecondary: colors.text.secondary,
    colorTextTertiary: colors.text.muted,
    colorBgBase: colors.surface.base,
    colorBgLayout: colors.surface.base,
    colorBgContainer: colors.surface.elevated,
    colorBgElevated: colors.surface.elevated,
    colorFillAlter: colors.surface.muted,
    colorBorder: colors.border.default,
    colorBorderSecondary: colors.border.subtle,
    fontSize: 15,
    fontSizeSM: 13,
    fontSizeLG: 17,
    lineHeight: 1.55,
    lineHeightLG: 1.5,
    lineHeightSM: 1.45,
    fontWeightStrong: 600,
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    wireframe: false,
  },
  components: {
    Layout: {
      bodyBg: colors.surface.base,
      headerBg: colors.surface.elevated,
      siderBg: colors.surface.elevated,
      triggerBg: colors.brand.primary,
      triggerColor: colors.text.inverse,
    },
    Menu: {
      itemBg: 'transparent',
      itemColor: colors.text.secondary,
      itemHoverColor: colors.brand.primary,
      itemHoverBg: colors.surface.brandSubtle,
      itemSelectedBg: colors.surface.brandSubtle,
      itemSelectedColor: colors.brand.primary,
      itemActiveBg: colors.surface.brandSubtle,
      itemBorderRadius: 8,
      itemHeight: 42,
      itemMarginBlock: 4,
      itemMarginInline: 8,
    },
    Card: {
      colorBgContainer: colors.surface.elevated,
      colorBorderSecondary: colors.border.subtle,
      borderRadiusLG: 12,
      boxShadowTertiary: '0 18px 48px rgba(32, 20, 82, 0.08)',
    },
    Button: {
      borderRadius: 8,
      controlHeight: 35,
      controlHeightLG: 40,
      fontWeight: 500,
      contentFontSize: 14,
      contentFontSizeLG: 15,
      primaryShadow: '0 10px 24px rgba(114, 84, 230, 0.22)',
      defaultBorderColor: colors.border.default,
      defaultColor: colors.text.primary,
      defaultBg: colors.surface.elevated,
    },
    Input: {
      borderRadius: 8,
      controlHeight: 35,
      inputFontSize: 15,
      colorBorder: colors.border.default,
      activeBorderColor: colors.brand.primary,
      hoverBorderColor: colors.primary[400],
      activeShadow: '0 0 0 4px rgba(114, 84, 230, 0.12)',
    },
    Select: {
      borderRadius: 8,
      controlHeight: 35,
      optionFontSize: 14,
      colorBorder: colors.border.default,
      optionSelectedBg: colors.surface.brandSubtle,
      optionActiveBg: colors.surface.infoSubtle,
    },
    Drawer: {
      colorBgElevated: colors.surface.elevated,
    },
    Typography: {
      titleMarginTop: 0,
      titleMarginBottom: '0.4em',
      fontSize: 15,
    },
    Tag: {
      defaultBg: colors.surface.muted,
      defaultColor: colors.text.secondary,
      borderRadiusSM: 999,
    },
    Badge: {
      colorError: colors.brand.accent,
    },
  },
};

// const darkTheme: ThemeConfig = {
//   token: {
//     colorBgBase: colors.darkPrimary.bg,
//     colorTextBase: colors.darkPrimary.text,
//     colorPrimary: colors.primary[500],
//     colorInfo: colors.primary[500],
//     colorLink: colors.primary[500],
//     colorWarning: colors.accent[500],
//     colorSuccess: colors.primary[500],
//   },
//   algorithm: theme.darkAlgorithm,
//   components: {
//     Layout: {
//       headerBg: colors.darkPrimary.layoutHeaderBg,
//       siderBg: colors.darkPrimary.layoutHeaderBg,
//     },
//     Collapse: {
//       headerBg: colors.darkPrimary.collapseHeader,
//     },
//   },
// };

export const getAntConfig = (appTheme?: AppTheme): ThemeConfig => {
  const themeConfig = lightTheme;

  return {
    algorithm: appTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      fontFamily: '"Manrope","Inter","Segoe UI","Helvetica Neue",Arial,sans-serif',
      ...themeConfig.token,
    },
    components: themeConfig.components,
  };
};
