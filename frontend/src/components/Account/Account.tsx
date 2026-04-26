import {
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Form,
  Input,
  Row,
  Segmented,
  Skeleton,
  Space,
  Statistic,
  Tag,
  Typography,
  Upload,
} from 'antd';
import { FC, ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  BookOutlined,
  CameraOutlined,
  CommentOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  HeartOutlined,
  LinkOutlined,
  LogoutOutlined,
  SaveOutlined,
} from '@ant-design/icons';

import { colors } from '@constants';
import { UserProfileComic, UserProfilePost, UserProfileUpdatePayload } from '@types';
import { useUpdateCurrentProfileMutation } from '@components/Profile/hooks/useUpdateCurrentProfileMutation';
import { OutletContext } from '@pages/LayoutPage/types';

import { useAccountAvatarUploadMutation, useAccountQuery, useLogoutMutation } from './hooks';

const { Paragraph, Text, Title } = Typography;

const roleLabels: Record<string, string> = {
  admin: 'Администратор',
  author: 'Автор',
  reader: 'Читатель',
};

const comicStatusLabels: Record<UserProfileComic['status'], string> = {
  draft: 'Черновик',
  under_review: 'На модерации',
  published: 'Опубликован',
  blocked: 'Заблокирован',
  revision: 'На доработке',
};

const comicStatusColors: Record<UserProfileComic['status'], string> = {
  draft: 'default',
  under_review: 'processing',
  published: 'success',
  blocked: 'error',
  revision: 'warning',
};

const postStatusLabels: Record<UserProfilePost['status'], string> = {
  draft: 'Черновик',
  under_review: 'На модерации',
  published: 'Опубликован',
  blocked: 'Заблокирован',
  revision: 'На доработке',
};

const postStatusColors: Record<UserProfilePost['status'], string> = {
  draft: 'default',
  under_review: 'processing',
  published: 'success',
  blocked: 'error',
  revision: 'warning',
};

type PostFilterValue = 'all' | UserProfilePost['status'];

const postFilterOptions: Array<{ value: PostFilterValue; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'draft', label: 'Черновики' },
  { value: 'under_review', label: 'Модерация' },
  { value: 'published', label: 'Опубликованные' },
  { value: 'revision', label: 'Доработка' },
  { value: 'blocked', label: 'Заблокированные' },
];

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

export const Account: FC = () => {
  const { messageApi } = useOutletContext<OutletContext>();
  const [form] = Form.useForm<UserProfileUpdatePayload>();
  const [isEditing, setIsEditing] = useState(false);
  const [localAvatarPreview, setLocalAvatarPreview] = useState<string | null>(null);
  const [postFilter, setPostFilter] = useState<PostFilterValue>('all');

  const { data, isLoading, isError } = useAccountQuery();
  const updateProfileMutation = useUpdateCurrentProfileMutation(data?.id);
  const avatarUploadMutation = useAccountAvatarUploadMutation(data?.id);
  const logoutMutation = useLogoutMutation();

  useEffect(() => {
    if (!data) {
      return;
    }

    form.setFieldsValue({
      username: data.username,
      email: data.email,
      name: data.name,
      surname: data.surname,
    });
  }, [data, form]);

  useEffect(() => {
    return () => {
      if (localAvatarPreview) {
        URL.revokeObjectURL(localAvatarPreview);
      }
    };
  }, [localAvatarPreview]);

  const resolvedAvatar = localAvatarPreview || data?.avatar || undefined;
  const authorComics = useMemo(() => data?.comics ?? [], [data?.comics]);
  const authorPosts = useMemo(() => data?.posts ?? [], [data?.posts]);
  const filteredAuthorPosts = useMemo(() => {
    if (postFilter === 'all') {
      return authorPosts;
    }

    return authorPosts.filter((post) => post.status === postFilter);
  }, [authorPosts, postFilter]);
  const isCreator = data?.role === 'author' || Boolean(authorComics.length) || Boolean(authorPosts.length);

  const handleSaveProfile = async (values: UserProfileUpdatePayload) => {
    try {
      await updateProfileMutation.mutateAsync({
        username: values.username?.trim(),
        email: values.email?.trim(),
        name: values.name?.trim(),
        surname: values.surname?.trim(),
      });

      setIsEditing(false);
      messageApi.success('Личные данные обновлены.');
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : 'Не удалось сохранить изменения.');
    }
  };

  const handleAvatarUpload = async (file: File) => {
    const nextPreview = URL.createObjectURL(file);

    if (localAvatarPreview) {
      URL.revokeObjectURL(localAvatarPreview);
    }

    setLocalAvatarPreview(nextPreview);

    try {
      await avatarUploadMutation.mutateAsync(file);
      setLocalAvatarPreview(null);
      messageApi.success('Аватар обновлён.');
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : 'Не удалось загрузить аватар.');
    }

    return false;
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
        <Empty description="Личный кабинет пока недоступен." />
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
                <Flex vertical gap={14} align="center">
                  <Avatar
                    size={{ xs: 88, sm: 104, md: 120 }}
                    src={resolvedAvatar}
                    className="border-4 border-white/80 shadow-[0_12px_36px_rgba(32,20,82,0.12)]"
                  >
                    {data.username[0]?.toUpperCase()}
                  </Avatar>

                  <Upload
                    accept="image/*"
                    beforeUpload={(file) => handleAvatarUpload(file)}
                    showUploadList={false}
                    disabled={!isEditing || avatarUploadMutation.isLoading}
                  >
                    <Button icon={<CameraOutlined />} loading={avatarUploadMutation.isLoading} disabled={!isEditing}>
                      Загрузить аватар
                    </Button>
                  </Upload>
                </Flex>

                <Flex vertical gap={14} className="min-w-[220px] flex-1">
                  <Flex vertical gap={8}>
                    <Space wrap>
                      <Tag
                        color={colors.brand.primary}
                        className="m-0 rounded-full border-0 px-3 py-1 text-xs font-semibold"
                      >
                        {roleLabels[data.role] ?? data.role}
                      </Tag>
                      <Tag
                        color={colors.brand.secondary}
                        className="m-0 rounded-full border-0 px-3 py-1 text-xs font-semibold"
                      >
                        Личный кабинет
                      </Tag>
                    </Space>

                    <div>
                      <Title level={1} className="!mb-1 !text-3xl sm:!text-4xl">
                        @{data.username}
                      </Title>
                    </div>
                  </Flex>

                  <Flex gap={12} wrap="wrap">
                    <AccountMetric label="Подписчики" value={formatCount(data.followersCount)} />
                    <AccountMetric label="Подписки" value={formatCount(data.followingCount)} />
                    {isCreator ? <AccountMetric label="Комиксы" value={formatCount(authorComics.length)} /> : null}
                    {isCreator ? <AccountMetric label="Посты" value={formatCount(authorPosts.length)} /> : null}
                  </Flex>
                </Flex>
              </Flex>
            </Col>

            <Col xs={24} xl={9}>
              <Card className="border-0 bg-white/80 shadow-none backdrop-blur-sm" styles={{ body: { padding: 20 } }}>
                <Flex vertical gap={14}>
                  <Text className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
                    Быстрые действия
                  </Text>

                  <Flex gap={12} wrap="wrap">
                    <Button
                      type={isEditing ? 'default' : 'primary'}
                      icon={<EditOutlined />}
                      onClick={() => setIsEditing((current) => !current)}
                    >
                      {isEditing ? 'Закрыть редактирование' : 'Редактировать данные'}
                    </Button>
                    <Link to={data.publicProfilePath}>
                      <Button icon={<LinkOutlined />}>Открыть публичный профиль</Button>
                    </Link>
                    <Link to="/comics/create">
                      <Button icon={<BookOutlined />}>Создать комикс</Button>
                    </Link>
                    <Link to="/blog/create">
                      <Button icon={<FileTextOutlined />}>Создать пост</Button>
                    </Link>
                    <Button
                      icon={<LogoutOutlined />}
                      danger
                      loading={logoutMutation.isLoading}
                      onClick={() => logoutMutation.mutate()}
                    >
                      Выйти из аккаунта
                    </Button>
                  </Flex>
                </Flex>
              </Card>
            </Col>
          </Row>
        </div>
      </Card>

      <Card className="border-0 shadow-sm">
        <Flex vertical gap={20}>
          <Title level={3} className="!mb-0">
            Личные данные
          </Title>

          <Form<UserProfileUpdatePayload>
            form={form}
            layout="vertical"
            disabled={!isEditing}
            onFinish={handleSaveProfile}
          >
            <Row gutter={[16, 0]}>
              <Col xs={24} md={12}>
                <Form.Item label="Никнейм" name="username" rules={[{ required: true, message: 'Введите никнейм.' }]}>
                  <Input prefix="@" placeholder="Введите публичный никнейм" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Почта" name="email" rules={[{ type: 'email', message: 'Введите корректную почту.' }]}>
                  <Input placeholder="name@example.com" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Имя" name="name">
                  <Input placeholder="Как к вам обращаться" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Фамилия" name="surname">
                  <Input placeholder="Необязательно" />
                </Form.Item>
              </Col>
            </Row>

            <Flex justify="end">
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={updateProfileMutation.isLoading}
                disabled={!isEditing}
              >
                Сохранить изменения
              </Button>
            </Flex>
          </Form>
        </Flex>
      </Card>

      {isCreator ? (
        <Card className="border-0 shadow-sm">
          <Flex vertical gap={20}>
            <Flex vertical gap={4}>
              <Title level={3} className="!mb-0">
                Мои комиксы
              </Title>
              <Text type="secondary">Здесь собраны все ваши комиксы, включая черновики и публикации на модерации.</Text>
            </Flex>

            {authorComics.length ? (
              <Row gutter={[16, 16]}>
                {authorComics.map((comic) => (
                  <Col key={comic.id} xs={24} lg={12}>
                    <AuthorComicCard comic={comic} />
                  </Col>
                ))}
              </Row>
            ) : (
              <Empty description="Пока нет комиксов. Первый можно создать прямо из кабинета.">
                <Link to="/comics/create">
                  <Button type="primary">Создать комикс</Button>
                </Link>
              </Empty>
            )}
          </Flex>
        </Card>
      ) : null}

      {isCreator ? (
        <Card className="border-0 shadow-sm">
          <Flex vertical gap={20}>
            <Flex justify="space-between" align="start" wrap="wrap" gap={12}>
              <Flex vertical gap={4}>
                <Title level={3} className="!mb-0">
                  Мои посты
                </Title>
                <Text type="secondary">
                  В блоге отображаются только опубликованные посты, а здесь видны все статусы: от черновика до доработки
                  или блокировки.
                </Text>
              </Flex>

              <Segmented<PostFilterValue>
                value={postFilter}
                onChange={(value) => setPostFilter(value)}
                options={postFilterOptions}
              />
            </Flex>

            {filteredAuthorPosts.length ? (
              <Row gutter={[16, 16]}>
                {filteredAuthorPosts.map((post) => (
                  <Col key={post.id} xs={24} lg={12}>
                    <AuthorPostCard post={post} />
                  </Col>
                ))}
              </Row>
            ) : (
              <Empty
                description={
                  authorPosts.length
                    ? 'По выбранному фильтру постов не найдено.'
                    : 'Пока нет постов. Первый можно отправить на модерацию из редактора блога.'
                }
              >
                {!authorPosts.length ? (
                  <Link to="/blog/create">
                    <Button type="primary">Создать пост</Button>
                  </Link>
                ) : null}
              </Empty>
            )}
          </Flex>
        </Card>
      ) : null}
    </Flex>
  );
};

const AccountMetric: FC<{ label: string; value: string }> = ({ label, value }) => (
  <Card className="min-w-[132px] border-0 bg-white/80 shadow-none">
    <Statistic title={label} value={value} />
  </Card>
);

const AuthorComicCard: FC<{ comic: UserProfileComic }> = ({ comic }) => (
  <Card className="h-full border border-black/6 shadow-none transition-transform duration-200 hover:-translate-y-0.5">
    <Flex gap={16} align="start" wrap>
      {comic.coverUrl || comic.cover ? (
        <img
          alt={comic.title}
          src={comic.coverUrl || comic.cover}
          className="h-32 w-24 rounded-2xl object-cover sm:h-36 sm:w-28"
        />
      ) : (
        <div className="flex h-32 w-24 items-center justify-center rounded-2xl bg-black/[0.04] text-xs text-[var(--color-text-secondary)] sm:h-36 sm:w-28">
          Нет обложки
        </div>
      )}

      <Flex vertical gap={12} className="min-w-0 flex-1">
        <Flex justify="space-between" align="start" gap={12} wrap="wrap">
          <Flex vertical gap={8} className="min-w-0">
            <Space wrap>
              <Tag color={comicStatusColors[comic.status]} className="m-0 rounded-full px-3 py-1 text-xs font-semibold">
                {comicStatusLabels[comic.status]}
              </Tag>
              <Tag className="m-0 rounded-full border-0 bg-black/5 px-3 py-1 text-xs font-semibold">
                {comic.ageRating}
              </Tag>
            </Space>

            <div>
              <Title level={4} className="!mb-1" ellipsis={{ rows: 1 }}>
                {comic.title}
              </Title>
              <Text type="secondary">{comic.genre ?? 'Без жанра'}</Text>
            </div>
          </Flex>

          <Link to={`/comics/${comic.id}`}>
            <Button icon={<LinkOutlined />}>Страница комикса</Button>
          </Link>
        </Flex>

        <Paragraph className="!mb-0" type="secondary" ellipsis={{ rows: 3 }}>
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
            <ItemStat icon={<HeartOutlined />} label="Лайки" value={formatCount(comic.likesCount)} />
          </Col>
          <Col xs={12} sm={8}>
            <ItemStat icon={<CommentOutlined />} label="Комментарии" value={formatCount(comic.commentsCount)} />
          </Col>
          <Col xs={12} sm={8}>
            <ItemStat icon={<EyeOutlined />} label="Читатели" value={formatCount(comic.readersCount)} />
          </Col>
          <Col xs={12} sm={8}>
            <ItemStat icon={<BookOutlined />} label="Главы" value={formatCount(comic.chaptersCount)} />
          </Col>
        </Row>

        <Text type="secondary">
          {comic.status === 'published' ? 'Опубликован' : 'Последнее обновление'}:{' '}
          {formatDate(comic.publishedAt ?? comic.updatedAt)}
        </Text>
      </Flex>
    </Flex>
  </Card>
);

const AuthorPostCard: FC<{ post: UserProfilePost }> = ({ post }) => (
  <Card className="h-full border border-black/6 shadow-none transition-transform duration-200 hover:-translate-y-0.5">
    <Flex gap={16} align="start" wrap>
      {post.coverUrl || post.cover ? (
        <img
          alt={post.title}
          src={post.coverUrl || post.cover}
          className="h-32 w-24 rounded-2xl object-cover sm:h-36 sm:w-28"
        />
      ) : (
        <div className="flex h-32 w-24 items-center justify-center rounded-2xl bg-black/[0.04] text-xs text-[var(--color-text-secondary)] sm:h-36 sm:w-28">
          Нет обложки
        </div>
      )}

      <Flex vertical gap={12} className="min-w-0 flex-1">
        <Flex justify="space-between" align="start" gap={12} wrap="wrap">
          <Flex vertical gap={8} className="min-w-0">
            <Tag
              color={postStatusColors[post.status]}
              className="m-0 w-fit rounded-full px-3 py-1 text-xs font-semibold"
            >
              {postStatusLabels[post.status]}
            </Tag>

            <div>
              <Title level={4} className="!mb-1" ellipsis={{ rows: 1 }}>
                {post.title}
              </Title>
              <Text type="secondary">
                {post.status === 'published'
                  ? `Опубликован: ${formatDate(post.publishedAt)}`
                  : `Обновлён: ${formatDate(post.updatedAt)}`}
              </Text>
            </div>
          </Flex>

          {post.status === 'published' ? (
            <Link to={`/blog/${post.id}`}>
              <Button icon={<LinkOutlined />}>Страница поста</Button>
            </Link>
          ) : post.status === 'draft' || post.status === 'revision' ? (
            <Link to={`/blog/${post.id}/edit`}>
              <Button icon={<EditOutlined />}>Продолжить редактирование</Button>
            </Link>
          ) : (
            <Tag className="m-0 rounded-full border-0 bg-black/5 px-3 py-1 text-xs">Пока скрыт из блога</Tag>
          )}
        </Flex>

        <Paragraph className="!mb-0" type="secondary" ellipsis={{ rows: 4 }}>
          {post.excerpt || 'Текст поста пока слишком короткий для превью.'}
        </Paragraph>

        <Flex gap={8} wrap="wrap">
          {post.tags.length ? (
            post.tags.map((tag) => (
              <Tag key={tag} className="m-0 rounded-full border-0 bg-[rgba(46,144,250,0.08)] px-3 py-1">
                #{tag}
              </Tag>
            ))
          ) : (
            <Tag className="m-0 rounded-full">Без тегов</Tag>
          )}
        </Flex>

        <Row gutter={[12, 12]}>
          <Col xs={12} sm={8}>
            <ItemStat icon={<CommentOutlined />} label="Комментарии" value={formatCount(post.commentsCount)} />
          </Col>
          <Col xs={12} sm={8}>
            <ItemStat icon={<FileTextOutlined />} label="Статус" value={postStatusLabels[post.status]} />
          </Col>
        </Row>
      </Flex>
    </Flex>
  </Card>
);

const ItemStat: FC<{ icon: ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <Flex vertical gap={4} className="rounded-2xl bg-black/[0.025] p-3">
    <Text type="secondary" className="flex items-center gap-1.5 text-xs">
      {icon}
      {label}
    </Text>
    <Text strong>{value}</Text>
  </Flex>
);
