import { MessageInstance } from 'antd/es/message/interface';
import { NotificationInstance } from 'antd/es/notification/interface';

export interface OutletContext {
  messageApi: MessageInstance;
  notificationApi: NotificationInstance;
}
