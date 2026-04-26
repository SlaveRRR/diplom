import { Button, Card, Empty, Flex, List, Tabs, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { BookOutlined, ReadOutlined } from '@ant-design/icons';

import { ComicReadingHistoryItem, PostReadingHistoryItem } from '@types';

import { useReadingHistoryQuery } from './hooks';

const { Paragraph, Text, Title } = Typography;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

export const History = () => {
  const { data, isLoading } = useReadingHistoryQuery();

  return (
    <Flex vertical gap={24} className="w-full">
      <Card className="border-0 shadow-sm">
        <Title level={2} className="!mb-1">
          История чтения
        </Title>
        <Text type="secondary">Здесь можно быстро вернуться к комиксам и статьям, которые вы уже открывали.</Text>
      </Card>

      <Card className="border-0 shadow-sm" loading={isLoading}>
        <Tabs
          items={[
            {
              key: 'comics',
              label: `Комиксы (${data?.comics.length ?? 0})`,
              children: data?.comics.length ? (
                <List
                  dataSource={data.comics}
                  renderItem={(item) => (
                    <List.Item className="!px-0">
                      <ComicHistoryCard item={item} />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="История чтения комиксов пока пуста." />
              ),
            },
            {
              key: 'posts',
              label: `Статьи (${data?.posts.length ?? 0})`,
              children: data?.posts.length ? (
                <List
                  dataSource={data.posts}
                  renderItem={(item) => (
                    <List.Item className="!px-0">
                      <PostHistoryCard item={item} />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="История чтения статей пока пуста." />
              ),
            },
          ]}
        />
      </Card>
    </Flex>
  );
};

const ComicHistoryCard = ({ item }: { item: ComicReadingHistoryItem }) => (
  <Card className="w-full border border-black/6 shadow-none">
    <Flex gap={16} align="start" wrap="wrap">
      {item.coverUrl || item.cover ? (
        <img alt={item.title} src={item.coverUrl || item.cover} className="h-32 w-24 rounded-2xl object-cover" />
      ) : null}

      <Flex vertical gap={8} className="min-w-0 flex-1">
        <Flex justify="space-between" align="start" wrap="wrap" gap={12}>
          <div>
            <Title level={4} className="!mb-1">
              {item.title}
            </Title>
            <Text type="secondary">Последнее чтение: {formatDate(item.lastReadAt)}</Text>
          </div>

          <Link to={item.path}>
            <Button type="primary" icon={<BookOutlined />}>
              Продолжить
            </Button>
          </Link>
        </Flex>

        <Flex gap={8} wrap="wrap">
          <Tag className="m-0 rounded-full">{item.ageRating}</Tag>
          {item.chapterTitle ? <Tag className="m-0 rounded-full">Глава: {item.chapterTitle}</Tag> : null}
          <Tag className="m-0 rounded-full">Страница: {item.lastPage}</Tag>
        </Flex>
      </Flex>
    </Flex>
  </Card>
);

const PostHistoryCard = ({ item }: { item: PostReadingHistoryItem }) => (
  <Card className="w-full border border-black/6 shadow-none">
    <Flex gap={16} align="start" wrap="wrap">
      {item.coverUrl || item.cover ? (
        <img alt={item.title} src={item.coverUrl || item.cover} className="h-32 w-24 rounded-2xl object-cover" />
      ) : null}

      <Flex vertical gap={8} className="min-w-0 flex-1">
        <Flex justify="space-between" align="start" wrap="wrap" gap={12}>
          <div>
            <Title level={4} className="!mb-1">
              {item.title}
            </Title>
            <Text type="secondary">Последнее чтение: {formatDate(item.lastReadAt)}</Text>
          </div>

          <Link to={item.path}>
            <Button type="primary" icon={<ReadOutlined />}>
              Открыть статью
            </Button>
          </Link>
        </Flex>

        <Paragraph className="!mb-0" type="secondary" ellipsis={{ rows: 3 }}>
          {item.excerpt || 'Для этой статьи пока нет краткого превью.'}
        </Paragraph>
      </Flex>
    </Flex>
  </Card>
);
