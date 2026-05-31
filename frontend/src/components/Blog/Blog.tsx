import { Button, Card, Col, Empty, Flex, Input, Pagination, Row, Segmented, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarOutlined, CommentOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';

import { useAdultContentGate, useApp, useWindowSize } from '@hooks';
import { Select } from '@components/shared';

import { useBlogPostsQuery, useBlogTagsQuery } from './hooks';

const { Paragraph, Text, Title } = Typography;

type SortKey = 'recent' | 'comments' | 'title';

const BLOG_PAGE_SIZE = 9;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));

const isAdultContent = (ageRating: string) => ageRating === '18+';

export const Blog = () => {
  const { isAuth } = useApp();
  const { guardNavigation, adultContentModal, isAdultContentConfirmed } = useAdultContentGate();
  const { data: tags = [], isLoading: isLoadingTags } = useBlogTagsQuery();

  const [searchValue, setSearchValue] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<(string | number)[]>([]);
  const [sort, setSort] = useState<SortKey>('recent');
  const [currentPage, setCurrentPage] = useState(1);

  const { size } = useWindowSize();
  const orientation = size === 'mobile' ? 'vertical' : 'horizontal';

  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, selectedTagIds, sort]);

  const blogQuery = useBlogPostsQuery({
    page: currentPage,
    pageSize: BLOG_PAGE_SIZE,
    search: searchValue || undefined,
    tagIds: selectedTagIds.length ? selectedTagIds.map(Number) : undefined,
    sort,
  });

  const posts = blogQuery.data?.items ?? [];
  const total = blogQuery.data?.pagination.total ?? 0;

  return (
    <Flex vertical gap={24} className="w-full">
      <section className="rounded-[32px] border border-black/6 bg-[radial-gradient(circle_at_top_left,rgba(255,208,91,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(114,84,230,0.12),transparent_32%),linear-gradient(135deg,#fffdf7_0%,#ffffff_100%)] p-6 shadow-[0_20px_60px_rgba(32,20,82,0.06)] sm:p-8">
        <Flex justify="space-between" align="start" wrap="wrap" gap={16}>
          <Flex vertical gap={8} className="max-w-3xl">
            <Title level={1} className="!mb-0 !text-3xl sm:!text-4xl">
              Блог
            </Title>
            <Paragraph className="!mb-0 text-base text-[var(--color-text-secondary)]">
              Здесь собираются редакционные статьи, разборы, дневники разработки и заметки авторов.
            </Paragraph>
          </Flex>
          {isAuth ? (
            <Link to="/blog/create">
              <Button type="primary" size="large" icon={<EditOutlined />}>
                Написать пост
              </Button>
            </Link>
          ) : null}
        </Flex>
      </section>

      <Card className="border-0 shadow-sm">
        <Flex vertical gap={16}>
          <Input
            size="large"
            prefix={<SearchOutlined />}
            allowClear
            placeholder="Поиск по заголовку, автору или содержимому"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />

          <Flex gap={12} wrap="wrap">
            <Select
              isLoading={isLoadingTags}
              mode="multiple"
              allowClear
              showSearch
              className="min-w-60"
              placeholder="Фильтр по тегам"
              options={tags.map((tag) => ({ label: tag.name, value: tag.id }))}
              value={selectedTagIds}
              onChange={(value) => setSelectedTagIds(Array.isArray(value) ? value : [])}
            />
            <Segmented<SortKey>
              orientation={orientation}
              value={sort}
              onChange={(value) => setSort(value)}
              classNames={{
                root: 'flex-wrap',
              }}
              options={[
                { label: 'Сначала новые', value: 'recent' },
                { label: 'По комментариям', value: 'comments' },
                { label: 'По названию', value: 'title' },
              ]}
            />
          </Flex>
        </Flex>
      </Card>

      {posts.length === 0 && !blogQuery.isLoading ? (
        <Card className="border-0 shadow-sm">
          <Empty description="Посты по текущим фильтрам не найдены." />
        </Card>
      ) : (
        <Flex vertical gap={24}>
          <Row gutter={[24, 24]}>
            {posts.map((post) => (
              <Col key={post.id} xs={24} md={12} xl={8}>
                <Link
                  to={`/blog/${post.id}`}
                  onClick={(event) => guardNavigation({ href: `/blog/${post.id}`, ageRating: post.ageRating }, event)}
                >
                  <Card
                    hoverable
                    className="h-full overflow-hidden border-0 shadow-sm transition-transform duration-200 hover:-translate-y-1"
                    cover={
                      <div className="relative h-64 w-full overflow-hidden">
                        <img src={post.coverUrl || post.cover} alt={post.title} className="h-64 w-full object-cover" />
                        {isAdultContent(post.ageRating) && !isAdultContentConfirmed ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(32,20,82,0.58)_100%)] backdrop-blur-[8px]">
                            <Flex
                              vertical
                              align="center"
                              gap={10}
                              className="max-w-[190px] px-4 text-center text-white"
                            >
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
                    }
                  >
                    <Flex vertical gap={14}>
                      <Flex gap={8} wrap="wrap">
                        <Tag
                          color={post.ageRating === '18+' ? 'volcano' : 'default'}
                          className="m-0 rounded-full px-3 py-1"
                        >
                          {post.ageRating}
                        </Tag>
                        {post.tags.slice(0, 3).map((tag) => (
                          <Tag key={tag.id} className="m-0 rounded-full border-0 bg-black/5 px-3 py-1">
                            #{tag.name}
                          </Tag>
                        ))}
                      </Flex>

                      <div>
                        <Title level={3} className="!mb-2 !text-2xl" ellipsis={{ rows: 2 }}>
                          {post.title}
                        </Title>
                        <Paragraph
                          className="!mb-0 min-h-16 text-[15px] text-[var(--color-text-secondary)]"
                          ellipsis={{ rows: 3 }}
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
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>

          {total > BLOG_PAGE_SIZE ? (
            <div className="flex justify-center">
              <Pagination
                current={currentPage}
                pageSize={BLOG_PAGE_SIZE}
                total={total}
                onChange={setCurrentPage}
                showSizeChanger={false}
              />
            </div>
          ) : null}
        </Flex>
      )}
      {adultContentModal}
    </Flex>
  );
};
