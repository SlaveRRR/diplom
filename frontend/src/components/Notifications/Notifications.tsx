import { Alert, Button, Card, Checkbox, Empty, Flex, List, Space, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CheckOutlined, MailOutlined } from '@ant-design/icons';

import { NotificationItem } from '@types';
import { OutletContext } from '@pages/LayoutPage/types';

import { useMarkNotificationsReadMutation, useNotificationsQuery } from './hooks';

const { Text, Title } = Typography;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

export const Notifications = () => {
  const { messageApi } = useOutletContext<OutletContext>();
  const { data, isLoading } = useNotificationsQuery();
  const markReadMutation = useMarkNotificationsReadMutation();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const unreadIds = useMemo(
    () => data?.items.filter((item) => !item.isRead).map((item) => item.id) ?? [],
    [data?.items],
  );

  const handleMarkRead = async (ids: number[]) => {
    if (!ids.length) {
      return;
    }

    try {
      const result = await markReadMutation.mutateAsync(ids);
      setSelectedIds((current) => current.filter((id) => !ids.includes(id)));
      messageApi.success(`Отмечено как прочитанное: ${result.updatedCount}.`);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : 'Не удалось обновить уведомления.');
    }
  };

  return (
    <Flex vertical gap={24} className="w-full">
      <Card className="border-0 shadow-sm">
        <Flex justify="space-between" align="start" wrap="wrap" gap={16}>
          <div>
            <Title level={2} className="!mb-1">
              Уведомления
            </Title>
          </div>

          <Space wrap>
            <Button
              icon={<CheckOutlined />}
              disabled={!selectedIds.length}
              loading={markReadMutation.isLoading}
              onClick={() => void handleMarkRead(selectedIds)}
            >
              Отметить выбранные
            </Button>
            <Button
              type="primary"
              icon={<MailOutlined />}
              disabled={!unreadIds.length}
              loading={markReadMutation.isLoading}
              onClick={() => void handleMarkRead(unreadIds)}
            >
              Прочитать все новые
            </Button>
          </Space>
        </Flex>
      </Card>

      <Card className="border-0 shadow-sm" loading={isLoading}>
        {!data?.items.length ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Пока уведомлений нет. Когда появятся новые события, они будут собраны здесь."
          />
        ) : (
          <List
            dataSource={data.items}
            renderItem={(item: NotificationItem) => (
              <List.Item className="!px-0">
                <Flex gap={12} align="start" className="w-full">
                  <Checkbox
                    checked={selectedIds.includes(item.id)}
                    onChange={(event) => {
                      setSelectedIds((current) =>
                        event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id),
                      );
                    }}
                  />

                  <Flex vertical gap={8} className="w-full">
                    <Alert
                      type={item.type}
                      showIcon
                      message={item.message}
                      description={
                        <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                          <Text type="secondary">{formatDate(item.createdAt)}</Text>
                          {!item.isRead ? (
                            <Button
                              size="small"
                              type="link"
                              className="!px-0"
                              onClick={() => void handleMarkRead([item.id])}
                            >
                              Отметить прочитанным
                            </Button>
                          ) : (
                            <Text type="secondary">Прочитано</Text>
                          )}
                        </Flex>
                      }
                    />
                  </Flex>
                </Flex>
              </List.Item>
            )}
          />
        )}
      </Card>
    </Flex>
  );
};
