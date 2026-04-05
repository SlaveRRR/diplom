import { ConfigProvider } from 'antd';
import { FC, PropsWithChildren } from 'react';
import { StyleProvider } from '@ant-design/cssinjs';
import ruRU from 'antd/locale/ru_RU';

import { useTheme } from '@hooks';
import { getAntConfig } from '@utils/getAntConfig';

export const ThemeProvider: FC<PropsWithChildren> = ({ children }) => {
  const { theme } = useTheme();

  const config = getAntConfig(theme);
  return (
    <StyleProvider layer>
      <ConfigProvider locale={ruRU} theme={config}>
        {children}
      </ConfigProvider>
    </StyleProvider>
  );
};
