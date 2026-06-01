import { Alert, Button, Card, Checkbox, Empty, Flex, List, Space, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { CheckOutlined, DeleteOutlined, MailOutlined } from '@ant-design/icons';

import { NotificationItem } from '@types';
import { OutletContext } from '@pages/LayoutPage/types';

import { useDeleteNotificationsMutation, useMarkNotificationsReadMutation, useNotificationsQuery } from './hooks';

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
  const navigate = useNavigate();
  const { messageApi } = useOutletContext<OutletContext>();
  const { data, isLoading } = useNotificationsQuery();
  const markReadMutation = useMarkNotificationsReadMutation();
  const deleteMutation = useDeleteNotificationsMutation();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const unreadIds = useMemo(
    () => data?.items.filter((item) => !item.isRead).map((item) => item.id) ?? [],
    [data?.items],
  );
  const selectedUnreadIds = useMemo(() => selectedIds.filter((id) => unreadIds.includes(id)), [selectedIds, unreadIds]);

  useEffect(() => {
    const existingIds = new Set(data?.items.map((item) => item.id) ?? []);
    setSelectedIds((current) => current.filter((id) => existingIds.has(id)));
  }, [data?.items]);

  const handleMarkRead = async (ids: number[]) => {
    const unreadOnlyIds = ids.filter((id) => unreadIds.includes(id));

    if (!unreadOnlyIds.length) {
      messageApi.info('Среди выбранных уведомлений нет новых.');
      return;
    }

    try {
      const result = await markReadMutation.mutateAsync(unreadOnlyIds);
      setSelectedIds((current) => current.filter((id) => !unreadOnlyIds.includes(id)));
      messageApi.success(`Отмечено как прочитанное: ${result.updatedCount}.`);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : 'Не удалось обновить уведомления.');
    }
  };

  const handleDelete = async (ids: number[]) => {
    if (!ids.length) {
      return;
    }

    try {
      const result = await deleteMutation.mutateAsync(ids);
      setSelectedIds((current) => current.filter((id) => !ids.includes(id)));
      messageApi.success(`Удалено уведомлений: ${result.deletedCount}.`);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : 'Не удалось удалить уведомления.');
    }
  };

  const handleOpenNotificationLink = (item: NotificationItem) => {
    if (!item.link) {
      return;
    }

    if (!item.isRead) {
      void handleMarkRead([item.id]);
    }

    navigate(item.link);
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
              disabled={!selectedUnreadIds.length}
              loading={markReadMutation.isLoading}
              onClick={() => void handleMarkRead(selectedUnreadIds)}
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
            <Button
              danger
              icon={<DeleteOutlined />}
              disabled={!selectedIds.length}
              loading={deleteMutation.isLoading}
              onClick={() => void handleDelete(selectedIds)}
            >
              Удалить выбранные
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
                        event.target.checked
                          ? Array.from(new Set([...current, item.id]))
                          : current.filter((id) => id !== item.id),
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
                          <Space size={12} wrap>
                            {item.link ? (
                              <Button
                                size="small"
                                type="link"
                                className="!px-0"
                                onClick={() => handleOpenNotificationLink(item)}
                              >
                                Открыть
                              </Button>
                            ) : null}
                            {!item.isRead ? (
                              <Button
                                size="small"
                                type="link"
                                className="!px-0"
                                loading={markReadMutation.isLoading}
                                onClick={() => void handleMarkRead([item.id])}
                              >
                                Отметить прочитанным
                              </Button>
                            ) : (
                              <Text type="secondary">Прочитано</Text>
                            )}
                            <Button
                              size="small"
                              type="link"
                              danger
                              className="!px-0"
                              loading={deleteMutation.isLoading}
                              onClick={() => void handleDelete([item.id])}
                            >
                              Удалить
                            </Button>
                          </Space>
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
