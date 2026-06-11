import { Button, Carousel, Col, Empty, Flex, Masonry, Row, Skeleton, Tag, Typography } from 'antd';
import { FC, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightOutlined, CalendarOutlined, CommentOutlined, ReadOutlined } from '@ant-design/icons';

import { colors } from '@constants';
import { useAdultContentGate } from '@hooks';
import { BlogPostListItem, HomeTaxonomyTile } from '@types';
import { ComicCard, ComicCardSkeleton } from '@components/shared';

import { useHomeQuery } from './hooks';

const { Paragraph, Text, Title } = Typography;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));

const isAdultContent = (ageRating: string) => ageRating === '18+';

type BlogSelectionCardProps = {
  post: BlogPostListItem;
  accent: 'brand' | 'info';
  isAdultContentConfirmed: boolean;
  onOpen: (href: string, ageRating: string, event: React.MouseEvent<HTMLAnchorElement>) => void;
};

const BlogSelectionCard = ({ post, accent, isAdultContentConfirmed, onOpen }: BlogSelectionCardProps) => {
  const isAdultRestricted = isAdultContent(post.ageRating) && !isAdultContentConfirmed;

  return (
    <Link to={`/blog/${post.id}`} onClick={(event) => onOpen(`/blog/${post.id}`, post.ageRating, event)}>
      <div className="h-full overflow-hidden rounded-[24px] border border-black/6 bg-white shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(32,20,82,0.08)]">
        <div className="relative h-60 w-full overflow-hidden">
          {post.coverUrl || post.cover ? (
            <img
              src={post.coverUrl || post.cover}
              alt={post.title}
              width={1200}
              height={675}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-end p-6"
              style={{
                background:
                  accent === 'brand'
                    ? `linear-gradient(135deg, ${colors.surface.brandSubtle} 0%, ${colors.white} 58%, ${colors.surface.infoSubtle} 100%)`
                    : `linear-gradient(135deg, ${colors.surface.infoSubtle} 0%, ${colors.white} 58%, ${colors.surface.brandSubtle} 100%)`,
              }}
            />
          )}
          {isAdultRestricted ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(32,20,82,0.58)_100%)] backdrop-blur-[8px]">
              <Flex vertical align="center" gap={10} className="max-w-[190px] px-4 text-center text-white">
                <div className="rounded-[16px] bg-white/14 px-3 py-1.5 text-sm font-semibold tracking-[0.08em] shadow-[0_8px_18px_rgba(32,20,82,0.18)] backdrop-blur-sm">
                  18+
                </div>
                <Text className="!text-sm !font-medium !leading-5 !text-white/88">
                  Откроется после подтверждения возраста
                </Text>
              </Flex>
            </div>
          ) : null}
        </div>

        <Flex vertical gap={14} className="p-5">
          <Flex gap={8} wrap>
            <Tag color={isAdultContent(post.ageRating) ? 'volcano' : 'default'} className="m-0 rounded-full px-3 py-1">
              {post.ageRating}
            </Tag>
            {post.tags.slice(0, 2).map((tag) => (
              <Tag
                key={tag.id}
                className="m-0 rounded-full border-0 px-3 py-1"
                style={{
                  background: accent === 'brand' ? colors.surface.brandSubtle : colors.surface.infoSubtle,
                  color: accent === 'brand' ? colors.brand.primary : colors.brand.secondary,
                }}
              >
                #{tag.name}
              </Tag>
            ))}
          </Flex>

          <div>
            <Title level={4} className="!mb-2 !text-xl" ellipsis={{ rows: 2, tooltip: post.title }}>
              {post.title}
            </Title>
            <Paragraph
              className="!mb-0 min-h-12 text-[15px] text-[var(--color-text-secondary)]"
              ellipsis={{ rows: 2, tooltip: post.excerpt }}
            >
              {post.excerpt}
            </Paragraph>
          </div>

          <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
            <Flex vertical gap={4}>
              <Text strong>@{post.author.username}</Text>
              <Text type="secondary" className="flex items-center gap-1.5">
                <CalendarOutlined />
                {formatDate(post.publishedAt)}
              </Text>
            </Flex>
            <Tag color="processing" className="m-0 rounded-full px-3 py-1">
              <CommentOutlined /> {post.commentsCount}
            </Tag>
          </Flex>
        </Flex>
      </div>
    </Link>
  );
};

const BlogSelectionCardSkeleton = () => (
  <div className="h-full overflow-hidden rounded-[24px] border border-black/6 bg-white shadow-sm">
    <Skeleton.Image active className="!h-60 !w-full" />
    <div className="p-5">
      <Skeleton active paragraph={{ rows: 4 }} />
    </div>
  </div>
);

type HomeSectionProps = {
  eyebrow: string;
  title: string;
  actionHref: string;
  actionLabel: string;
  children: ReactNode;
};

const HomeSection = ({ eyebrow, title, actionHref, actionLabel, children }: HomeSectionProps) => (
  <Flex vertical gap={20}>
    <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
      <Flex vertical gap={6}>
        <Text className="!text-xs !font-semibold !uppercase !tracking-[0.12em] !text-[var(--color-brand-secondary)]">
          {eyebrow}
        </Text>
        <Title level={2} className="!mb-0 !text-2xl sm:!text-3xl">
          {title}
        </Title>
      </Flex>

      <Link to={actionHref}>
        <Button icon={<ArrowRightOutlined />}>{actionLabel}</Button>
      </Link>
    </Flex>

    {children}
  </Flex>
);

export const Home: FC = () => {
  const { data, isLoading } = useHomeQuery();
  const { guardNavigation, adultContentModal, isAdultContentConfirmed } = useAdultContentGate();

  const sliderComics = data?.heroComics ?? [];
  const popularComics = data?.popularComics ?? [];
  const freshComics = data?.freshComics ?? [];
  const popularPosts = data?.popularPosts ?? [];
  const freshPosts = data?.freshPosts ?? [];
  const taxonomyTiles = data?.taxonomyTiles ?? [];

  const comicSkeletonItems = [0, 1, 2, 3];
  const postSkeletonItems = [0, 1, 2];

  const handleProtectedOpen = (href: string, ageRating: string, event: React.MouseEvent<HTMLAnchorElement>) => {
    guardNavigation({ href, ageRating }, event);
  };

  return (
    <Flex vertical gap={32} className="w-full pb-10 pt-2">
      <section className="overflow-hidden rounded-[32px] border border-black/6 bg-white shadow-[0_20px_60px_rgba(32,20,82,0.06)]">
        {isLoading ? (
          <div className="min-h-[380px] p-6 sm:min-h-[420px] sm:p-8">
            <Skeleton.Image active className="!mb-6 !h-48 !w-full sm:!h-56" />
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        ) : sliderComics.length ? (
          <Carousel autoplay dots draggable adaptiveHeight>
            {sliderComics.map((comic) => {
              const isAdultRestricted = isAdultContent(comic.ageRating) && !isAdultContentConfirmed;

              return (
                <div key={comic.id}>
                  <div
                    className="relative min-h-[380px] p-6 sm:min-h-[420px] sm:p-8"
                    style={{
                      backgroundImage:
                        `linear-gradient(120deg, rgba(8,8,8,0.76) 0%, rgba(32,20,82,0.72) 46%, rgba(46,144,250,0.34) 100%), ` +
                        `url(${comic.coverUrl || comic.cover})`,
                      backgroundPosition: 'center',
                      backgroundSize: 'cover',
                    }}
                  >
                    {isAdultRestricted ? (
                      <div className="absolute inset-0 z-[1] flex items-center justify-center bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(32,20,82,0.62)_100%)] backdrop-blur-[10px]">
                        <Flex vertical align="center" gap={10} className="max-w-[220px] px-5 text-center text-white">
                          <div className="rounded-[16px] bg-white/14 px-3 py-1.5 text-sm font-semibold tracking-[0.08em] shadow-[0_8px_18px_rgba(32,20,82,0.18)] backdrop-blur-sm">
                            18+
                          </div>
                          <Text className="!text-sm !font-medium !leading-5 !text-white/88">
                            Откроется после подтверждения возраста
                          </Text>
                        </Flex>
                      </div>
                    ) : null}

                    <Flex vertical justify="space-between" className="relative min-h-[332px] sm:min-h-[356px]">
                      <Flex vertical gap={16} className="max-w-3xl">
                        <Flex gap={8} wrap>
                          <Tag className="m-0 rounded-full border-0 bg-white/14 px-3 py-1 text-white">
                            {comic.ageRating}
                          </Tag>
                          {comic.genre ? (
                            <Tag className="m-0 rounded-full border-0 bg-white/14 px-3 py-1 text-white">
                              {comic.genre}
                            </Tag>
                          ) : null}
                          {comic.isTrending ? (
                            <Tag className="m-0 rounded-full border-0 bg-[rgba(238,70,188,0.18)] px-3 py-1 text-white">
                              В тренде
                            </Tag>
                          ) : null}
                          {comic.isNew ? (
                            <Tag className="m-0 rounded-full border-0 bg-[rgba(46,144,250,0.18)] px-3 py-1 text-white">
                              Новинка
                            </Tag>
                          ) : null}
                        </Flex>

                        <Title level={1} className="!mb-0 !max-w-3xl !text-4xl !leading-tight !text-white sm:!text-5xl">
                          {comic.title}
                        </Title>

                        <Paragraph className="!mb-0 !max-w-2xl !text-base !leading-7 !text-white/82 sm:!text-lg">
                          {comic.description}
                        </Paragraph>
                      </Flex>

                      <Flex justify="space-between" align="end" wrap="wrap" gap={20}>
                        <Flex gap={20} wrap>
                          <Flex vertical gap={2}>
                            <Text className="!text-xs !uppercase !tracking-[0.08em] !text-white/54">Рейтинг</Text>
                            <Text className="!text-xl !font-semibold !text-white">{comic.rating.toFixed(1)}</Text>
                          </Flex>
                          <Flex vertical gap={2}>
                            <Text className="!text-xs !uppercase !tracking-[0.08em] !text-white/54">Отзывы</Text>
                            <Text className="!text-xl !font-semibold !text-white">
                              {comic.reviews.toLocaleString('ru-RU')}
                            </Text>
                          </Flex>
                          <Flex vertical gap={2}>
                            <Text className="!text-xs !uppercase !tracking-[0.08em] !text-white/54">Лайки</Text>
                            <Text className="!text-xl !font-semibold !text-white">
                              {comic.likesCount.toLocaleString('ru-RU')}
                            </Text>
                          </Flex>
                        </Flex>

                        <Flex gap={12} wrap className="relative z-10">
                          <Link
                            to={`/comics/${comic.id}`}
                            onClick={(event) => handleProtectedOpen(`/comics/${comic.id}`, comic.ageRating, event)}
                          >
                            <Button type="primary" size="large" icon={<ReadOutlined />}>
                              Открыть комикс
                            </Button>
                          </Link>
                          <Link to="/catalog">
                            <Button size="large">Перейти в каталог</Button>
                          </Link>
                        </Flex>
                      </Flex>
                    </Flex>
                  </div>
                </div>
              );
            })}
          </Carousel>
        ) : (
          <div className="p-6 sm:p-8">
            <Empty description="Комиксы пока не опубликованы." />
          </div>
        )}
      </section>

      <HomeSection eyebrow="Комиксы" title="Популярные комиксы" actionHref="/catalog" actionLabel="Весь каталог">
        <Row gutter={[24, 24]}>
          {isLoading
            ? comicSkeletonItems.map((index) => (
                <Col key={index} xs={24} sm={12} xl={6}>
                  <ComicCardSkeleton />
                </Col>
              ))
            : popularComics.map((comic) => (
                <Col key={comic.id} xs={24} sm={12} xl={6}>
                  <ComicCard item={comic} />
                </Col>
              ))}
        </Row>
      </HomeSection>

      <HomeSection eyebrow="Комиксы" title="Свежие релизы" actionHref="/catalog" actionLabel="Открыть новинки">
        <Row gutter={[24, 24]}>
          {isLoading
            ? comicSkeletonItems.map((index) => (
                <Col key={index} xs={24} sm={12} xl={6}>
                  <ComicCardSkeleton />
                </Col>
              ))
            : freshComics.map((comic) => (
                <Col key={comic.id} xs={24} sm={12} xl={6}>
                  <ComicCard
                    item={comic}
                    badgeText={comic.isNew ? 'Новый релиз' : undefined}
                    badgeColor={colors.brand.secondary}
                  />
                </Col>
              ))}
        </Row>
      </HomeSection>

      {taxonomyTiles.length ? (
        <HomeSection eyebrow="Навигация" title="Жанры и темы" actionHref="/catalog" actionLabel="Все фильтры">
          <Masonry
            columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 4 }}
            gutter={[20, 20]}
            items={taxonomyTiles.map((tile) => ({
              key: tile.key,
              height: tile.height,
              data: tile,
            }))}
            itemRender={({ data }: { data: HomeTaxonomyTile }) => (
              <Link to={data.href}>
                <div
                  className="relative overflow-hidden rounded-[24px] border border-black/6 p-5 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(32,20,82,0.08)]"
                  style={{
                    minHeight: data.height,
                    background:
                      `radial-gradient(circle at top left, ${data.surface} 0, transparent 46%), ` +
                      `linear-gradient(180deg, ${colors.white} 0%, ${colors.gray[10]} 100%)`,
                  }}
                >
                  <Flex vertical justify="space-between" className="h-full">
                    <Flex vertical gap={14}>
                      <Tag
                        className="m-0 w-fit rounded-full border-0 px-3 py-1"
                        style={{
                          background: data.surface,
                          color: data.accent,
                        }}
                      >
                        {data.kind === 'genre' ? 'Жанр' : 'Тег'}
                      </Tag>

                      <div>
                        <Title level={3} className="!mb-2 !text-2xl !leading-tight">
                          {data.item.name}
                        </Title>
                        <Paragraph className="!mb-0 !text-[15px] !leading-6 !text-[var(--color-text-secondary)]">
                          {data.item.description ||
                            (data.kind === 'genre'
                              ? 'Открыть подборку комиксов этого жанра.'
                              : 'Посмотреть работы, объединённые этой темой.')}
                        </Paragraph>
                      </div>
                    </Flex>

                    <Text className="!text-sm !font-medium !text-[var(--color-brand-primary)]">
                      Открыть подборку <ArrowRightOutlined />
                    </Text>
                  </Flex>
                </div>
              </Link>
            )}
          />
        </HomeSection>
      ) : null}

      <HomeSection eyebrow="Блог" title="Популярные статьи" actionHref="/blog" actionLabel="Весь блог">
        <Row gutter={[24, 24]}>
          {isLoading
            ? postSkeletonItems.map((index) => (
                <Col key={index} xs={24} md={12} xl={8}>
                  <BlogSelectionCardSkeleton />
                </Col>
              ))
            : popularPosts.map((post) => (
                <Col key={post.id} xs={24} md={12} xl={8}>
                  <BlogSelectionCard
                    post={post}
                    accent="brand"
                    isAdultContentConfirmed={isAdultContentConfirmed}
                    onOpen={(href, ageRating, event) => handleProtectedOpen(href, ageRating, event)}
                  />
                </Col>
              ))}
        </Row>
      </HomeSection>

      <HomeSection eyebrow="Блог" title="Свежие публикации" actionHref="/blog" actionLabel="Все публикации">
        <Row gutter={[24, 24]}>
          {isLoading
            ? postSkeletonItems.map((index) => (
                <Col key={index} xs={24} md={12} xl={8}>
                  <BlogSelectionCardSkeleton />
                </Col>
              ))
            : freshPosts.map((post) => (
                <Col key={post.id} xs={24} md={12} xl={8}>
                  <BlogSelectionCard
                    post={post}
                    accent="info"
                    isAdultContentConfirmed={isAdultContentConfirmed}
                    onOpen={(href, ageRating, event) => handleProtectedOpen(href, ageRating, event)}
                  />
                </Col>
              ))}
        </Row>
      </HomeSection>

      {adultContentModal}
    </Flex>
  );
};
