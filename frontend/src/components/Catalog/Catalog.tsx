import { Button, Card, Carousel, Col, Input, Row, Segmented, Space, theme, Tour, Typography } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { colors } from '@constants';
import { useAdultContentGate, usePageOnboarding, usePlatformTaxonomy } from '@hooks';
import { CatalogItem } from '@components/Catalog/hooks/useCatalogStore/types';
import { ComicCard, ComicCardSkeleton, Select } from '@components/shared';

import { useCatalogQuery } from './hooks';

const { Title, Text } = Typography;
const { Search } = Input;

type SortKey = 'popular' | 'new' | 'reviews';
type SelectValue = string | number;

export const Catalog = () => {
  const {
    token: { borderRadiusLG, colorBorderSecondary },
  } = theme.useToken();

  const { data: items = [], isLoading } = useCatalogQuery();
  const { data: taxonomy, isLoading: isLoadingTaxonomy } = usePlatformTaxonomy();
  const { guardNavigation, adultContentModal } = useAdultContentGate();
  const [searchParams] = useSearchParams();

  const [searchValue, setSearchValue] = useState('');
  const [genreId, setGenreId] = useState<SelectValue>();
  const [tagIds, setTagIds] = useState<SelectValue[]>([]);
  const [sort, setSort] = useState<SortKey>('popular');

  const searchRef = useRef<HTMLDivElement | null>(null);
  const filtersRef = useRef<HTMLDivElement | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const { isOpen: isTourOpen, close: closeTour } = usePageOnboarding({
    storageKey: 'catalog_onboarding_shown',
  });

  useEffect(() => {
    const genreParam = searchParams.get('genre');
    const tagParam = searchParams.get('tag');

    if (genreParam) {
      const parsedGenreId = Number(genreParam);
      if (!Number.isNaN(parsedGenreId)) {
        setGenreId(parsedGenreId);
      }
    }

    if (tagParam) {
      const parsedTagId = Number(tagParam);
      if (!Number.isNaN(parsedTagId)) {
        setTagIds([parsedTagId]);
      }
    }
  }, [searchParams]);

  const filteredItems = useMemo(() => {
    let filtered = [...items];

    if (searchValue.trim()) {
      const query = searchValue.trim().toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.author.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query),
      );
    }

    if (genreId) {
      filtered = filtered.filter((item) => item.genreId !== null && item.genreId === genreId);
    }

    if (tagIds.length) {
      filtered = filtered.filter((item) => item.tagIds.some((tagId) => tagIds.includes(tagId)));
    }

    switch (sort) {
      case 'new':
        filtered = filtered.sort((left, right) => Number(right.isNew) - Number(left.isNew));
        break;
      case 'reviews':
        filtered = filtered.sort((left, right) => right.reviews - left.reviews);
        break;
      case 'popular':
      default:
        filtered = filtered.sort((left, right) => right.rating - left.rating || right.reviews - left.reviews);
        break;
    }

    return filtered;
  }, [genreId, items, searchValue, sort, tagIds]);

  const highlighted = useMemo(() => items.filter((item) => item.isTrending || item.isNew).slice(0, 6), [items]);

  const tourSteps = [
    {
      title: 'Добро пожаловать в каталог',
      description:
        'Здесь собраны новинки, тренды и свежие публикации платформы. Короткий тур поможет быстрее освоиться.',
      target: null,
    },
    {
      title: 'Умный поиск',
      description: 'Ищите по названию, автору или описанию. Каталог фильтруется сразу, без лишних переходов.',
      target: () => searchRef.current,
    },
    {
      title: 'Жанры и теги',
      description: 'Соберите подборку под настроение: можно комбинировать жанры и теги прямо в витрине.',
      target: () => filtersRef.current,
    },
    {
      title: 'Редакционная витрина',
      description:
        'Верхняя карусель показывает свежие релизы и комиксы, которые сейчас цепляют читателей сильнее всего.',
      target: () => carouselRef.current,
    },
    {
      title: 'Живая сетка',
      description: 'Открывайте карточки, смотрите рейтинг, теги и сразу переходите на страницу нужного комикса.',
      target: () => gridRef.current,
    },
  ];

  return (
    <>
      <section
        className="mb-5"
        style={{
          borderRadius: borderRadiusLG,
          padding: 24,
          background:
            `radial-gradient(circle at 0 0, ${colors.surface.infoSubtle} 0, ${colors.white} 42%), ` +
            `radial-gradient(circle at 100% 100%, ${colors.surface.accentSubtle} 0, ${colors.white} 48%)`,
          border: `1px solid ${colorBorderSecondary}`,
          boxShadow: '0 20px 50px rgba(32, 20, 82, 0.05)',
        }}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={12} xl={10}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Title
                level={2}
                style={{
                  margin: 0,
                  fontSize: 'var(--font-h1)',
                  lineHeight: 'var(--line-tight)',
                  letterSpacing: '-0.03em',
                  textWrap: 'balance',
                }}
              >
                Откройте для себя мир комиксов
              </Title>

              <Space direction="vertical" size={12} style={{ width: '100%' }} ref={searchRef}>
                <Search
                  allowClear
                  size="large"
                  placeholder="Поиск по названию, автору или описанию"
                  onChange={(event) => setSearchValue(event.target.value)}
                  value={searchValue}
                  style={{ maxWidth: 520 }}
                />

                <Space wrap ref={filtersRef}>
                  <Select
                    isLoading={isLoadingTaxonomy}
                    allowClear
                    placeholder="Жанры"
                    className="min-w-48"
                    options={taxonomy?.genres}
                    onChange={(value) => setGenreId(value)}
                    value={genreId}
                    maxCount={1}
                    showSearch
                  />
                  <Select
                    isLoading={isLoadingTaxonomy}
                    allowClear
                    mode="multiple"
                    placeholder="Теги"
                    className="min-w-48"
                    options={taxonomy?.tags}
                    onChange={(value) => setTagIds(Array.isArray(value) ? value : [])}
                    value={tagIds}
                    showSearch
                  />
                  <Segmented<SortKey>
                    value={sort}
                    onChange={(value) => setSort(value)}
                    options={[
                      { label: 'Популярное', value: 'popular' },
                      { label: 'Новинки', value: 'new' },
                      { label: 'По отзывам', value: 'reviews' },
                    ]}
                  />
                </Space>
              </Space>
            </Space>
          </Col>

          <Col xs={24} md={12} xl={14} ref={carouselRef}>
            {isLoading || highlighted.length === 0 ? (
              <Card className="p-4">
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <Button loading style={{ width: 120 }} />
                  <Title level={4} className="!mb-0 opacity-0">
                    loading
                  </Title>
                  <Text className="opacity-0">loading</Text>
                </Space>
              </Card>
            ) : (
              <Carousel autoplay dots draggable style={{ borderRadius: borderRadiusLG, overflow: 'hidden' }}>
                {highlighted.map((item) => (
                  <div key={item.id}>
                    <div
                      style={{
                        position: 'relative',
                        minHeight: 260,
                        backgroundImage: `linear-gradient(120deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.15) 55%), url(${item.coverUrl || item.cover})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        color: '#fff',
                        padding: 24,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Space direction="vertical" size={12}>
                        <Space wrap>
                          {item.isNew ? (
                            <span className="rounded-full bg-[var(--color-brand-secondary)] px-3 py-1 text-xs font-semibold">
                              Новинка
                            </span>
                          ) : null}
                          {item.isTrending ? (
                            <span className="rounded-full bg-[var(--color-brand-accent)] px-3 py-1 text-xs font-semibold">
                              В тренде
                            </span>
                          ) : null}
                          {item.genre ? (
                            <span className="rounded-full bg-[var(--color-brand-primary)] px-3 py-1 text-xs font-semibold">
                              {item.genre}
                            </span>
                          ) : null}
                        </Space>

                        <Title level={3} style={{ color: '#fff', margin: 0 }}>
                          {item.title}
                        </Title>

                        <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                          {item.description.length > 150 ? `${item.description.slice(0, 150)}…` : item.description}
                        </Text>
                      </Space>

                      <Space
                        align="center"
                        size={16}
                        style={{ marginTop: 16, justifyContent: 'space-between', width: '100%' }}
                      >
                        <Space direction="vertical" size={4}>
                          <Text strong style={{ color: '#fff' }}>
                            {item.rating.toFixed(1)}
                          </Text>
                          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
                            {item.reviews.toLocaleString('ru-RU')} отзывов
                          </Text>
                        </Space>
                        <Link
                          to={`/comics/${item.id}`}
                          onClick={(event) =>
                            guardNavigation({ href: `/comics/${item.id}`, ageRating: item.ageRating }, event)
                          }
                        >
                          <Button type="primary">Открыть страницу</Button>
                        </Link>
                      </Space>
                    </div>
                  </div>
                ))}
              </Carousel>
            )}
          </Col>
        </Row>
      </section>

      <section ref={gridRef}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
            <Title
              level={3}
              style={{
                margin: 0,
                fontSize: 'var(--font-h2)',
                lineHeight: 'calc(var(--line-tight) + 0.05)',
                letterSpacing: '-0.025em',
              }}
            >
              Каталог
            </Title>
            <Text type="secondary">
              Найдено: {filteredItems.length} из {items.length}
            </Text>
          </Space>

          <Row gutter={[24, 24]}>
            {(isLoading ? Array.from({ length: 8 }) : filteredItems).map((item, index) => (
              <Col key={isLoading ? index : (item as CatalogItem).id} xs={24} sm={12} lg={8} xl={6}>
                {isLoading ? (
                  <ComicCardSkeleton />
                ) : (
                  <ComicCard
                    item={item as CatalogItem}
                    badgeText={
                      (item as CatalogItem).isNew
                        ? 'Новинка'
                        : (item as CatalogItem).isTrending
                          ? 'В тренде'
                          : undefined
                    }
                    badgeColor={(item as CatalogItem).isNew ? colors.brand.secondary : colors.brand.accent}
                  />
                )}
              </Col>
            ))}
          </Row>
        </Space>
      </section>

      <Tour open={isTourOpen} onClose={closeTour} steps={tourSteps} />
      {adultContentModal}
    </>
  );
};
