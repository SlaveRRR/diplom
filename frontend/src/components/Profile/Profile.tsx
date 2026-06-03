import { Avatar, Button, Card, Col, Empty, Flex, Row, Skeleton, Space, Statistic, Tag, Typography } from 'antd';
import { FC, ReactNode, useMemo } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import {
  BookOutlined,
  CommentOutlined,
  EyeOutlined,
  HeartOutlined,
  LinkOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
} from '@ant-design/icons';

import { colors } from '@constants';
import { useApp, useRequireAuthAction } from '@hooks';
import { UserProfileComic } from '@types';
import { OutletContext } from '@pages/LayoutPage/types';

import { useToggleUserFollowMutation, useUserProfileQuery } from './hooks';

const { Paragraph, Text, Title } = Typography;

const roleLabels: Record<string, string> = {
  admin: 'Администратор',
  author: 'Автор',
  reader: 'Читатель',
};

const formatCount = (value: number) => value.toLocaleString('ru-RU');

const formatDate = (value?: string | null) => {
  if (!value) {
    return 'Пока без даты публикации';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
};

export const Profile: FC = () => {
  const { userId } = useParams();
  const { isAuth } = useApp();
  const { redirectToAuth } = useRequireAuthAction();
  const { messageApi } = useOutletContext<OutletContext>();

  const { data, isLoading, isError } = useUserProfileQuery(userId);
  const followMutation = useToggleUserFollowMutation(userId);
  const publishedComics = useMemo(() => data?.comics ?? [], [data?.comics]);
  const isAuthor = data?.role === 'author';

  const handleToggleFollow = async () => {
    if (!isAuth) {
      redirectToAuth('follow');
      return;
    }

    try {
      const result = await followMutation.mutateAsync();
      messageApi.success(result.isActive ? 'Подписка оформлена.' : 'Подписка удалена.');
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : 'Не удалось обновить подписку.');
    }
  };

  if (isLoading) {
    return (
      <Flex vertical gap={24} className="w-full">
        <Card className="border-0 shadow-sm">
          <Skeleton active avatar paragraph={{ rows: 5 }} />
        </Card>
        <Card className="border-0 shadow-sm">
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </Flex>
    );
  }

  if (isError || !data) {
    return (
      <Card className="border-0 shadow-sm">
        <Empty description="Профиль не найден или пока недоступен.">
          <Link to="/catalog">
            <Button type="primary">Вернуться в каталог</Button>
          </Link>
        </Empty>
      </Card>
    );
  }

  return (
    <Flex vertical gap={24} className="w-full">
      <Card
        className="overflow-hidden border-0 shadow-sm"
        styles={{
          body: {
            padding: 0,
          },
        }}
      >
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(114,84,230,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(46,144,250,0.12),transparent_28%),linear-gradient(135deg,#ffffff_0%,#f5f7fc_100%)] p-4 sm:p-6 lg:p-8">
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} xl={15}>
              <Flex gap={20} align="start" wrap="wrap">
                <Avatar
                  size={{ xs: 88, sm: 104, md: 120 }}
                  src={data.avatar || undefined}
                  className="shrink-0 border-4 border-white/80 shadow-[0_12px_36px_rgba(32,20,82,0.12)]"
                >
                  {data.username[0]?.toUpperCase()}
                </Avatar>

                <Flex vertical gap={14} className="min-w-0 flex-1 sm:min-w-[220px]">
                  <Flex vertical gap={8}>
                    <Space wrap>
                      <Tag
                        color={colors.brand.primary}
                        className="m-0 rounded-full border-0 px-3 py-1 text-xs font-semibold"
                      >
                        {roleLabels[data.role] ?? data.role}
                      </Tag>
                      {isAuthor ? (
                        <Tag
                          color={colors.brand.secondary}
                          className="m-0 rounded-full border-0 px-3 py-1 text-xs font-semibold"
                        >
                          Публичный профиль автора
                        </Tag>
                      ) : (
                        <Tag className="m-0 rounded-full border-0 bg-black/5 px-3 py-1 text-xs font-semibold">
                          Публичный профиль
                        </Tag>
                      )}
                    </Space>

                    <div>
                      <Title level={1} className="!mb-1 !text-3xl sm:!text-4xl">
                        @{data.username}
                      </Title>
                      <Paragraph className="!mb-0 max-w-3xl text-base leading-7 text-[var(--color-text-secondary)]">
                        {!!data.name || (!!data.surname && `${data.name} ${data.surname}`.trim())}
                      </Paragraph>
                    </div>
                  </Flex>

                  <Flex gap={12} wrap="wrap">
                    <ProfileMetric label="Подписчики" value={formatCount(data.followersCount)} />
                    <ProfileMetric label="Подписки" value={formatCount(data.followingCount)} />
                    {isAuthor ? <ProfileMetric label="Публикации" value={formatCount(publishedComics.length)} /> : null}
                  </Flex>
                </Flex>
              </Flex>
            </Col>

            <Col xs={24} xl={9}>
              <Card className="border-0 bg-white/80 shadow-none backdrop-blur-sm" styles={{ body: { padding: 20 } }}>
                <Flex vertical gap={14}>
                  {data.isCurrentUser ? (
                    <Link to="/account" className="w-full sm:w-auto">
                      <Button className="w-full sm:w-auto" type="primary" icon={<LinkOutlined />}>
                        Перейти в личный кабинет
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      className="w-full sm:w-auto"
                      type={data.isFollowing ? 'default' : 'primary'}
                      icon={data.isFollowing ? <UserDeleteOutlined /> : <UserAddOutlined />}
                      loading={followMutation.isLoading}
                      onClick={handleToggleFollow}
                    >
                      {data.isFollowing ? 'Отписаться' : 'Подписаться'}
                    </Button>
                  )}
                </Flex>
              </Card>
            </Col>
          </Row>
        </div>
      </Card>

      {isAuthor ? (
        <Card className="border-0 shadow-sm">
          <Flex vertical gap={20}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
              <Flex vertical gap={4}>
                <Title level={3} className="!mb-0">
                  Опубликованные комиксы
                </Title>
              </Flex>
            </Flex>

            {publishedComics.length ? (
              <Row gutter={[16, 16]}>
                {publishedComics.map((comic) => (
                  <Col key={comic.id} xs={24} lg={12}>
                    <PublicComicCard comic={comic} />
                  </Col>
                ))}
              </Row>
            ) : (
              <Empty description="У этого автора пока нет опубликованных комиксов." />
            )}
          </Flex>
        </Card>
      ) : null}
    </Flex>
  );
};

const ProfileMetric: FC<{ label: string; value: string }> = ({ label, value }) => (
  <Card className="min-w-0 border-0 bg-white/80 shadow-none sm:min-w-[132px]">
    <Statistic title={label} value={value} />
  </Card>
);

const PublicComicCard: FC<{ comic: UserProfileComic }> = ({ comic }) => (
  <Card className="h-full border border-black/6 shadow-none transition-transform duration-200 hover:-translate-y-0.5">
    <Flex gap={16} align="start" wrap>
      <img
        alt={comic.title}
        src={comic.coverUrl || comic.cover}
        className="h-32 w-24 rounded-2xl object-cover sm:h-36 sm:w-28"
      />

      <Flex vertical gap={12} className="min-w-0 flex-1">
        <Flex justify="space-between" align="start" gap={12} wrap="wrap">
          <Flex vertical gap={8} className="min-w-0">
            <Space wrap>
              <Tag color="success" className="m-0 rounded-full px-3 py-1 text-xs font-semibold">
                Опубликован
              </Tag>
              <Tag className="m-0 rounded-full border-0 bg-black/5 px-3 py-1 text-xs font-semibold">
                {comic.ageRating}
              </Tag>
            </Space>

            <div>
              <Title level={4} className="!mb-1" ellipsis={{ rows: 1, tooltip: comic.title }}>
                {comic.title}
              </Title>
              <Text type="secondary">{comic.genre ?? 'Без жанра'}</Text>
            </div>
          </Flex>

          <Link to={`/comics/${comic.id}`}>
            <Button icon={<LinkOutlined />}>Открыть</Button>
          </Link>
        </Flex>

        <Paragraph
          className="!mb-0"
          type="secondary"
          ellipsis={{ rows: 3, tooltip: comic.description || 'Описание пока не заполнено.' }}
        >
          {comic.description || 'Описание пока не заполнено.'}
        </Paragraph>

        <Flex gap={8} wrap="wrap">
          {comic.tags.length ? (
            comic.tags.map((tag) => (
              <Tag key={tag} className="m-0 rounded-full border-0 bg-[rgba(114,84,230,0.08)] px-3 py-1">
                #{tag}
              </Tag>
            ))
          ) : (
            <Tag className="m-0 rounded-full">Без тегов</Tag>
          )}
        </Flex>

        <Row gutter={[12, 12]}>
          <Col xs={12} sm={8}>
            <ComicStat icon={<HeartOutlined />} label="Лайки" value={formatCount(comic.likesCount)} />
          </Col>
          <Col xs={12} sm={8}>
            <ComicStat icon={<CommentOutlined />} label="Комментарии" value={formatCount(comic.commentsCount)} />
          </Col>
          <Col xs={12} sm={8}>
            <ComicStat icon={<EyeOutlined />} label="Читатели" value={formatCount(comic.readersCount)} />
          </Col>
          <Col xs={12} sm={8}>
            <ComicStat icon={<BookOutlined />} label="Главы" value={formatCount(comic.chaptersCount)} />
          </Col>
        </Row>

        <Text type="secondary">Опубликован: {formatDate(comic.publishedAt ?? comic.updatedAt)}</Text>
      </Flex>
    </Flex>
  </Card>
);

const ComicStat: FC<{ icon: ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <Flex vertical gap={4} className="rounded-2xl bg-black/[0.025] p-3">
    <Text type="secondary" className="flex items-center gap-1.5 text-xs">
      {icon}
      {label}
    </Text>
    <Text strong>{value}</Text>
  </Flex>
);
