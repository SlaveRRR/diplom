import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Form,
  Input,
  List,
  Rate,
  Row,
  Segmented,
  Skeleton,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import { FC, ReactNode, useMemo, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { TelegramIcon, TelegramShareButton, VKIcon, VKShareButton } from 'react-share';
import {
  BookOutlined,
  CommentOutlined,
  CopyOutlined,
  EyeOutlined,
  HeartFilled,
  HeartOutlined,
  MessageOutlined,
  ReadOutlined,
  SendOutlined,
  ShareAltOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons';

import { colors } from '@constants';
import { useApp, useRequireAuthAction } from '@hooks';
import { ComicComment, ComicDetailChapter } from '@types';
import { OutletContext } from '@pages/LayoutPage/types';

import {
  useComicCommentMutation,
  useComicCommentsSocket,
  useComicDetailsQuery,
  useComicFavoriteMutation,
  useComicLikeMutation,
  useComicRatingMutation,
} from './hooks';
import { EpisodeSortOrder } from './types';

const { Paragraph, Text, Title } = Typography;
const { TextArea } = Input;

type ThreadedComicComment = ComicComment & {
  replies: ThreadedComicComment[];
};

const formatCount = (value: number) => value.toLocaleString('ru-RU');

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));

const roleLabels: Record<string, string> = {
  admin: 'Администратор',
  author: 'Автор',
  reader: 'Читатель',
};

const statusLabels: Record<'draft' | 'under_review' | 'published' | 'blocked' | 'revision', string> = {
  draft: 'Черновик',
  under_review: 'На модерации',
  published: 'Опубликован',
  blocked: 'Заблокирован',
  revision: 'На доработке',
};

const getChapterPreviewUrl = (chapter: ComicDetailChapter) => chapter.previewUrl || chapter.pageKeys[0] || '';

const buildCommentTree = (comments: ComicComment[]): ThreadedComicComment[] => {
  const commentsMap = new Map<number, ThreadedComicComment>();

  comments.forEach((comment) => {
    commentsMap.set(comment.id, {
      ...comment,
      replies: [],
    });
  });

  const roots: ThreadedComicComment[] = [];

  comments.forEach((comment) => {
    const current = commentsMap.get(comment.id);

    if (!current) {
      return;
    }

    if (comment.replyToId) {
      const parent = commentsMap.get(comment.replyToId);

      if (parent) {
        parent.replies.push(current);
        return;
      }
    }

    roots.push(current);
  });

  return roots;
};

export const ComicDetails: FC = () => {
  const { comicId } = useParams();
  const navigate = useNavigate();
  const { messageApi } = useOutletContext<OutletContext>();
  const { isAuth } = useApp();
  const { redirectToAuth } = useRequireAuthAction();
  const { data, isLoading, isError } = useComicDetailsQuery(comicId);
  const likeMutation = useComicLikeMutation(comicId);
  const favoriteMutation = useComicFavoriteMutation(comicId);
  const commentMutation = useComicCommentMutation(comicId);
  const ratingMutation = useComicRatingMutation(comicId);
  useComicCommentsSocket(comicId);
  const [commentText, setCommentText] = useState('');
  const [replyToComment, setReplyToComment] = useState<ComicComment | null>(null);
  const [episodeSortOrder, setEpisodeSortOrder] = useState<EpisodeSortOrder>('latest');

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return `https://graf-comics.local/comics/${comicId ?? ''}`;
    }

    return `${window.location.origin}/comics/${comicId ?? ''}`;
  }, [comicId]);

  const orderedEpisodes = useMemo(() => {
    if (!data) {
      return [];
    }

    const episodes = [...data.chapters];

    if (episodeSortOrder === 'first') {
      return episodes.sort((left, right) => left.chapterNumber - right.chapterNumber);
    }

    return episodes.sort((left, right) => right.chapterNumber - left.chapterNumber);
  }, [data, episodeSortOrder]);

  const threadedComments = useMemo(() => buildCommentTree(data?.comments ?? []), [data?.comments]);
  const continueReadingChapterId = data?.continueReading?.chapterId ?? null;
  const firstChapterId = data?.chapters[0]?.id ?? null;
  const primaryReaderChapterId = continueReadingChapterId ?? firstChapterId;
  const averageRating = Number(data?.averageRating ?? 0);
  const ratingsCount = Number(data?.ratingsCount ?? 0);

  const openReader = (chapterId: number) => {
    navigate(`/comics/${data?.id}/chapters/${chapterId}`);
  };

  const handleSubmitComment = async () => {
    const normalized = commentText.trim();

    if (!normalized) {
      return;
    }

    if (!isAuth) {
      redirectToAuth('comment');
      return;
    }

    try {
      await commentMutation.mutateAsync({
        text: normalized,
        replyToId: replyToComment?.id ?? null,
      });

      setCommentText('');
      setReplyToComment(null);
      messageApi.success(replyToComment ? 'Ответ опубликован.' : 'Комментарий опубликован.');
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : 'Не удалось отправить комментарий.');
    }
  };

  const handleToggleLike = async () => {
    if (!isAuth) {
      redirectToAuth('like');
      return;
    }

    try {
      const result = await likeMutation.mutateAsync();
      messageApi.success(result.isActive ? 'Лайк добавлен.' : 'Лайк убран.');
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : 'Не удалось обновить лайк.');
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuth) {
      redirectToAuth('favorite');
      return;
    }

    try {
      const result = await favoriteMutation.mutateAsync();
      messageApi.success(result.isActive ? 'Комикс добавлен в избранное.' : 'Комикс удалён из избранного.');
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : 'Не удалось обновить избранное.');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      messageApi.success('Ссылка на комикс скопирована.');
    } catch {
      messageApi.error('Не удалось скопировать ссылку.');
    }
  };

  const handleRateComic = async (value: number) => {
    if (!isAuth) {
      redirectToAuth('rate');
      return;
    }

    try {
      await ratingMutation.mutateAsync(value);
      messageApi.success('Оценка сохранена.');
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : 'Не удалось сохранить оценку.');
    }
  };

  if (isLoading) {
    return (
      <Flex vertical gap={24} className="w-full">
        <Card className="overflow-hidden">
          <Skeleton active avatar paragraph={{ rows: 6 }} />
        </Card>
        <Card>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      </Flex>
    );
  }

  if (isError || !data) {
    return (
      <Card className="border-0 shadow-sm">
        <Empty description="Похоже, этого комикса пока нет в каталоге." image={Empty.PRESENTED_IMAGE_SIMPLE}>
          <Link to="/catalog">
            <Button type="primary">Вернуться в каталог</Button>
          </Link>
        </Empty>
      </Card>
    );
  }

  const infoStats = [
    {
      key: 'readers',
      icon: <EyeOutlined />,
      label: 'читателей',
      value: formatCount(data.readersCount),
    },
    {
      key: 'likes',
      icon: <HeartOutlined />,
      label: 'лайков',
      value: formatCount(data.likesCount),
    },
    {
      key: 'comments',
      icon: <MessageOutlined />,
      label: 'комментариев',
      value: formatCount(data.commentsCount),
    },
  ];

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
        <div
          className="relative overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(8, 8, 8, 0.8) 0%, rgba(32, 20, 82, 0.84) 44%, rgba(9, 29, 50, 0.88) 100%), url(${data.bannerUrl || data.banner})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(238,70,188,0.16),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(46,144,250,0.16),transparent_34%)]" />

          <Row gutter={[24, 24]} className="relative p-4 sm:p-6 lg:p-8">
            <Col xs={24} lg={6}>
              <Flex vertical gap={16}>
                <Card
                  className="overflow-hidden border-0 bg-transparent shadow-none"
                  cover={
                    <div className="relative">
                      <img
                        alt={data.title}
                        src={data.coverUrl || data.cover}
                        className="aspect-[3/4] w-full rounded-2xl object-cover"
                      />
                      <Tag className="absolute bottom-3 left-3 m-0 border-0 px-3 py-1 text-xs font-semibold">
                        {data.ageRating}
                      </Tag>
                    </div>
                  }
                  styles={{ body: { padding: 0 } }}
                />

                <Flex vertical gap={12}>
                  <Button
                    size="large"
                    type="primary"
                    icon={<ReadOutlined />}
                    disabled={!primaryReaderChapterId}
                    onClick={() => {
                      if (primaryReaderChapterId) {
                        openReader(primaryReaderChapterId);
                      }
                    }}
                  >
                    {continueReadingChapterId ? 'Продолжить чтение' : 'Читать с первой главы'}
                  </Button>

                  <Flex gap={12} wrap>
                    <Button
                      size="large"
                      icon={data.isFavorite ? <StarFilled /> : <StarOutlined />}
                      loading={favoriteMutation.isLoading}
                      onClick={handleToggleFavorite}
                    >
                      {data.favoritesCount}
                    </Button>
                    <Button
                      size="large"
                      icon={data.isLiked ? <HeartFilled /> : <HeartOutlined />}
                      loading={likeMutation.isLoading}
                      onClick={handleToggleLike}
                    >
                      {data.likesCount}
                    </Button>
                    <Button size="large" icon={<ShareAltOutlined />} onClick={handleCopyLink} />
                  </Flex>
                </Flex>
              </Flex>
            </Col>

            <Col xs={24} lg={12}>
              <Flex vertical gap={20} className="h-full">
                <Flex vertical gap={12}>
                  {data.genre ? (
                    <Tag color={colors.brand.primary} className="w-fit border-0 px-3 py-1 text-xs font-semibold">
                      {data.genre.name}
                    </Tag>
                  ) : null}

                  <Title level={1} className="!mb-0 !text-white">
                    {data.title}
                  </Title>

                  <Paragraph className="!mb-0 max-w-3xl text-base leading-7 text-white/78">
                    {data.description}
                  </Paragraph>
                </Flex>

                <Row gutter={[12, 12]}>
                  {infoStats.map((item) => (
                    <Col xs={24} sm={8} key={item.key}>
                      <Card
                        className="border-0 bg-white/8 shadow-none backdrop-blur-sm"
                        styles={{ body: { padding: 16 } }}
                      >
                        <Flex vertical gap={6}>
                          <Text className="text-white/64">{item.icon}</Text>
                          <Text className="text-2xl font-semibold text-white">{item.value}</Text>
                          <Text className="text-white/64">{item.label}</Text>
                        </Flex>
                      </Card>
                    </Col>
                  ))}
                </Row>

                <Card className="border-0 bg-white/8 shadow-none backdrop-blur-sm" styles={{ body: { padding: 16 } }}>
                  <Flex vertical gap={8}>
                    <Flex justify="space-between" align="center" gap={12} wrap="wrap">
                      <Text className="text-white/64">Рейтинг читателей</Text>
                      <Text className="text-white/64">
                        {averageRating.toFixed(1)} из 5 • {formatCount(ratingsCount)} оценок
                      </Text>
                    </Flex>
                    <Rate
                      allowClear={false}
                      value={data.userRating ?? 0}
                      onChange={(value) => void handleRateComic(value)}
                      disabled={ratingMutation.isLoading}
                    />
                    <Text className="text-white/64">
                      {data.userRating
                        ? `Ваша оценка: ${data.userRating}/5`
                        : 'Поставьте оценку, чтобы помочь другим читателям.'}
                    </Text>
                  </Flex>
                </Card>
              </Flex>
            </Col>

            <Col xs={24} lg={6}>
              <Flex vertical gap={16}>
                <Card className="border-0 bg-white/8 shadow-none backdrop-blur-sm" styles={{ body: { padding: 20 } }}>
                  <Flex vertical gap={16}>
                    <Flex align="center" gap={12}>
                      <Link to={`/profile/${data.author.id}`}>
                        <Avatar size={56} src={data.author.avatar}>
                          {data.author.username[0]?.toUpperCase()}
                        </Avatar>
                      </Link>
                      <Flex vertical gap={2}>
                        <Text className="text-xs uppercase tracking-[0.2em] text-white/50">Автор</Text>
                        <Link to={`/profile/${data.author.id}`}>
                          <Text className="text-lg font-semibold text-white">{data.author.username}</Text>
                        </Link>
                        <Text className="text-white/64">{roleLabels[data.author.role] ?? data.author.role}</Text>
                      </Flex>
                    </Flex>
                  </Flex>
                </Card>

                <Card className="border-0 bg-white/8 shadow-none backdrop-blur-sm" styles={{ body: { padding: 20 } }}>
                  <Flex vertical gap={14}>
                    <Text className="text-xs uppercase tracking-[0.2em] text-white/50">Теги</Text>
                    <Flex wrap gap={8}>
                      {data.tags.length ? (
                        data.tags.map((tag) => (
                          <Tag
                            key={tag.id}
                            className="m-0 rounded-full border-0 bg-white/12 px-3 py-1 text-[13px] text-white"
                          >
                            #{tag.name}
                          </Tag>
                        ))
                      ) : (
                        <Text className="text-white/64">Теги пока не добавлены.</Text>
                      )}
                    </Flex>
                  </Flex>
                </Card>

                <Card className="border-0 bg-white/8 shadow-none backdrop-blur-sm" styles={{ body: { padding: 20 } }}>
                  <Flex vertical gap={14}>
                    <Text className="text-xs uppercase tracking-[0.2em] text-white/50">Поделиться</Text>
                    <Flex gap={10} wrap>
                      <TelegramShareButton url={shareUrl} title={data.title}>
                        <TelegramIcon round size={40} />
                      </TelegramShareButton>
                      <VKShareButton url={shareUrl} title={data.title}>
                        <VKIcon round size={40} />
                      </VKShareButton>
                      <Button shape="circle" icon={<CopyOutlined />} onClick={handleCopyLink} />
                    </Flex>
                  </Flex>
                </Card>
              </Flex>
            </Col>
          </Row>
        </div>
      </Card>

      <Row gutter={[24, 24]} align="top">
        <Col xs={24} xl={16}>
          <Card className="border-0 shadow-sm">
            <Flex vertical gap={20}>
              <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <Flex vertical gap={4}>
                  <Title level={2} className="!mb-0">
                    Эпизоды
                  </Title>
                  <Text type="secondary">{data.chaptersCount} глав в текущем релизе</Text>
                </Flex>
                <Segmented<EpisodeSortOrder>
                  value={episodeSortOrder}
                  onChange={(value) => setEpisodeSortOrder(value)}
                  options={[
                    { label: 'Сначала новые', value: 'latest' },
                    { label: 'Сначала первые', value: 'first' },
                  ]}
                />
              </Flex>

              <Flex vertical gap={14}>
                {orderedEpisodes.map((episode) => (
                  <Card
                    key={episode.id}
                    hoverable
                    className="overflow-hidden border border-black/5 transition-transform duration-200 hover:-translate-y-0.5"
                    styles={{ body: { padding: 18 } }}
                    onClick={() => openReader(episode.id)}
                  >
                    <Flex gap={16} align="center" wrap="wrap">
                      <img
                        src={getChapterPreviewUrl(episode)}
                        alt={episode.title}
                        className="h-24 w-20 rounded-2xl object-cover"
                      />
                      <Flex vertical gap={8} className="min-w-[220px] flex-1">
                        <Text type="secondary">Эпизод {episode.chapterNumber}</Text>
                        <Title level={4} className="!mb-0">
                          {episode.title}
                        </Title>
                        <Text type="secondary">{episode.pageCount} страниц</Text>
                      </Flex>
                      <Flex gap={20} wrap="wrap" className="ml-auto">
                        <EpisodeStat
                          label="просмотров"
                          value={formatCount(episode.viewsCount)}
                          icon={<EyeOutlined />}
                        />
                        <EpisodeStat
                          label="комментариев"
                          value={formatCount(episode.commentsCount)}
                          icon={<CommentOutlined />}
                        />
                        <EpisodeStat label="лайков" value={formatCount(episode.likesCount)} icon={<HeartOutlined />} />
                      </Flex>
                    </Flex>
                  </Card>
                ))}
              </Flex>
            </Flex>
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Flex vertical gap={24}>
            <Card id="comments" className="border-0 shadow-sm">
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={8} xl={12}>
                  <Statistic title="Статус" value={statusLabels[data.status]} />
                </Col>
                <Col xs={12} sm={8} xl={12}>
                  <Statistic title="Глав" value={data.chaptersCount} prefix={<BookOutlined />} />
                </Col>
                <Col xs={12} sm={8} xl={24}>
                  <Statistic title="Комментариев" value={data.commentsCount} prefix={<MessageOutlined />} />
                </Col>
              </Row>
            </Card>

            <Card className="border-0 shadow-sm">
              <Flex vertical gap={16}>
                <Flex vertical gap={4}>
                  <Title level={3} className="!mb-0">
                    Обсуждение
                  </Title>
                  <Text type="secondary">
                    Комментарии под комиксом сразу подтягиваются из backend и доступны всем читателям страницы.
                  </Text>
                </Flex>

                <Form layout="vertical" onFinish={handleSubmitComment}>
                  {replyToComment ? (
                    <Alert
                      type="info"
                      showIcon
                      className="mb-3"
                      message={`Ответ для ${replyToComment.author.username}`}
                      description={
                        replyToComment.text.length > 120
                          ? `${replyToComment.text.slice(0, 120)}...`
                          : replyToComment.text
                      }
                      action={
                        <Button size="small" type="text" onClick={() => setReplyToComment(null)}>
                          Отменить
                        </Button>
                      }
                    />
                  ) : null}

                  <Form.Item className="!mb-3" label="Добавить комментарий">
                    <TextArea
                      value={commentText}
                      onChange={(event) => setCommentText(event.target.value)}
                      rows={4}
                      maxLength={600}
                      placeholder={
                        replyToComment
                          ? 'Напишите ответ на комментарий.'
                          : isAuth
                            ? 'Напишите, что вам понравилось в сюжете, атмосфере или подаче.'
                            : 'Войдите, чтобы оставить комментарий к комиксу.'
                      }
                    />
                  </Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SendOutlined />}
                    disabled={!commentText.trim()}
                    loading={commentMutation.isLoading}
                  >
                    {replyToComment ? 'Отправить ответ' : 'Отправить комментарий'}
                  </Button>
                </Form>

                <List
                  dataSource={threadedComments}
                  locale={{ emptyText: 'Пока никто не начал обсуждение. Можно быть первым.' }}
                  renderItem={(comment) => (
                    <ComicCommentItem
                      comment={comment}
                      onReply={(nextComment) => {
                        setReplyToComment(nextComment);
                        setCommentText('');
                      }}
                    />
                  )}
                />
              </Flex>
            </Card>
          </Flex>
        </Col>
      </Row>
    </Flex>
  );
};

type EpisodeStatProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

const EpisodeStat: FC<EpisodeStatProps> = ({ icon, label, value }) => (
  <Flex vertical gap={4} className="min-w-[88px]">
    <Text type="secondary" className="flex items-center gap-1.5">
      {icon}
      {label}
    </Text>
    <Text strong>{value}</Text>
  </Flex>
);

type ComicCommentItemProps = {
  comment: ThreadedComicComment;
  onReply: (comment: ComicComment) => void;
};

const ComicCommentItem: FC<ComicCommentItemProps> = ({ comment, onReply }) => (
  <List.Item className="!px-0">
    <Flex vertical gap={12} className="w-full">
      <Flex gap={12} align="start" className="w-full">
        <Link to={`/profile/${comment.author.id}`}>
          <Avatar src={comment.author.avatar} size={44}>
            {comment.author.username[0]?.toUpperCase()}
          </Avatar>
        </Link>
        <Flex vertical gap={8} className="flex-1">
          <Flex justify="space-between" align="start" gap={12} wrap="wrap">
            <Flex vertical gap={2}>
              <Link to={`/profile/${comment.author.id}`}>
                <Text strong>{comment.author.username}</Text>
              </Link>
              <Text type="secondary">
                {roleLabels[comment.author.role] ? `${roleLabels[comment.author.role]} • ` : ''}
                {formatDate(comment.createdAt)}
              </Text>
            </Flex>
          </Flex>
          <Text>{comment.text}</Text>
          <Flex>
            <Button type="link" className="!px-0" onClick={() => onReply(comment)}>
              Ответить
            </Button>
          </Flex>
        </Flex>
      </Flex>

      {comment.replies.length ? (
        <div className="ml-14 border-l border-black/8 pl-4">
          <Flex vertical gap={12}>
            {comment.replies.map((reply) => (
              <ComicCommentItem key={reply.id} comment={reply} onReply={onReply} />
            ))}
          </Flex>
        </div>
      ) : null}
    </Flex>
  </List.Item>
);
