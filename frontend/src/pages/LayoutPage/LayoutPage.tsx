import { message, notification } from 'antd';
import { Outlet } from 'react-router-dom';

import { Layout } from '@components';

import { OutletContext } from './types';

export const LayoutPage = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [notificationApi, notificationContextHolder] = notification.useNotification();

  return (
    <Layout notificationApi={notificationApi}>
      {contextHolder}
      {notificationContextHolder}
      <Outlet context={{ messageApi, notificationApi } satisfies OutletContext} />
    </Layout>
  );
};
