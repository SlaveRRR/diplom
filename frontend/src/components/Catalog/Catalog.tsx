import {
  Badge,
  Card,
  Carousel,
  Col,
  Input,
  Rate,
  Row,
  Segmented,
  Skeleton,
  Space,
  Tag,
  theme,
  Tour,
  Typography,
} from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/shallow';

import { colors } from '@constants';
import { usePlatformTaxonomy } from '@hooks';
import { Select } from '@components/shared';

import { useCatalogStore } from './hooks';

const { Title, Text } = Typography;
const { Search } = Input;

type SortKey = 'popular' | 'new' | 'reviews';

export const Catalog = () => {
  const {
    token: { borderRadius, borderRadiusLG, colorBgContainer, colorBorderSecondary },
  } = theme.useToken();

  const { items, isLoading, init } = useCatalogStore(
    useShallow((state) => ({
      items: state.items,
      init: state.init,
      isLoading: state.isLoading,
    })),
  );

  const { data, isLoading: isLoadingTaxonomy } = usePlatformTaxonomy();

  const [searchValue, setSearchValue] = useState('');
  const [genre, setGenre] = useState<string | undefined>();
  const [tag, setTag] = useState<string | undefined>();
  const [sort, setSort] = useState<SortKey>('popular');
  const [isTourOpen, setIsTourOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement | null>(null);
  const filtersRef = useRef<HTMLDivElement | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    init();
    const firstVisitKey = 'catalog_onboarding_shown';
    const isShown = window.sessionStorage.getItem(firstVisitKey);

    if (!isShown) {
      setIsTourOpen(true);
      window.sessionStorage.setItem(firstVisitKey, 'true');
    }
  }, [init]);

  const filteredItems = useMemo(() => {
    let filtered = [...items];

    if (searchValue.trim()) {
      const q = searchValue.trim().toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.author.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q),
      );
    }

    if (genre) {
      filtered = filtered.filter((item) => item.genre === genre);
    }

    if (tag) {
      filtered = filtered.filter((item) => item.tags.includes(tag));
    }

    switch (sort) {
      case 'new':
        filtered = filtered.sort((a, b) => Number(b.isNew) - Number(a.isNew));
        break;
      case 'reviews':
        filtered = filtered.sort((a, b) => b.reviews - a.reviews);
        break;
      case 'popular':
      default:
        filtered = filtered.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
        break;
    }

    return filtered;
  }, [genre, items, searchValue, sort, tag]);

  const highlighted = useMemo(() => items.filter((item) => item.isTrending || item.isNew), [items]);

  const tourSteps = [
    {
      title: 'Добро пожаловать в каталог',
      description: 'Здесь собраны новинки, тренды и любимая классика. Пройдите короткий тур, чтобы быстрее освоиться.',
      target: null,
    },
    {
      title: 'Умный поиск',
      description: 'Ищите по названию, автору или описанию — результаты обновляются мгновенно.',
      target: () => searchRef.current,
    },
    {
      title: 'Жанры и теги',
      description: 'Отфильтруйте подборку по жанрам и тегам, чтобы находить идеальные истории под настроение.',
      target: () => filtersRef.current,
    },
    {
      title: 'Витрина новинок и трендов',
      description: 'Свайпайте карусель, чтобы увидеть самые яркие релизы и популярные тайтлы.',
      target: () => carouselRef.current,
    },
    {
      title: 'Живая сетка тайтлов',
      description: 'Открывайте карточки, изучайте описание, рейтинг и теги — всё, чтобы выбрать, что читать дальше.',
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
            <Space orientation="vertical" size={16} style={{ width: '100%' }}>
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
              <Space orientation="vertical" size={12} style={{ width: '100%' }} ref={searchRef}>
                <Search
                  allowClear
                  size="large"
                  placeholder="Поиск по названию, автору или описанию"
                  onChange={(e) => setSearchValue(e.target.value)}
                  value={searchValue}
                  style={{ maxWidth: 520 }}
                />
                <Space wrap ref={filtersRef}>
                  <Select
                    isLoading={isLoadingTaxonomy}
                    allowClear
                    placeholder="Жанр"
                    className="min-w-48"
                    options={data?.genres}
                    onChange={(value) => setGenre(value)}
                    value={genre}
                    mode="multiple"
                    showSearch
                  />
                  <Select
                    isLoading={isLoadingTaxonomy}
                    allowClear
                    placeholder="Теги"
                    className="min-w-48"
                    options={data?.tags}
                    onChange={(value) => setTag(value)}
                    value={tag}
                    showSearch
                    mode="multiple"
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
                <Space orientation="vertical" size={16} style={{ width: '100%' }}>
                  <Skeleton.Button active style={{ width: 120 }} />
                  <Skeleton active title paragraph={{ rows: 2 }} />
                  <Skeleton.Input active style={{ width: 160 }} />
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
                        backgroundImage: `linear-gradient(120deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 55%), url(${item.coverUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        color: '#fff',
                        padding: 24,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Space orientation="vertical" size={12}>
                        <Space wrap>
                          {item.isNew && <Tag color={colors.brand.secondary}>Новинка</Tag>}
                          {item.isTrending && <Tag color={colors.brand.accent}>В тренде</Tag>}
                          <Tag color={colors.brand.primary}>{item.genre}</Tag>
                        </Space>
                        <Title level={3} style={{ color: '#fff', margin: 0 }}>
                          {item.title}
                        </Title>
                        {item.subtitle && <Text style={{ color: 'rgba(255,255,255,0.85)' }}>{item.subtitle}</Text>}
                      </Space>
                      <Space align="center" size={16} style={{ marginTop: 16 }}>
                        <Space orientation="vertical" size={4}>
                          <Space>
                            <Rate allowHalf disabled defaultValue={item.rating} />
                            <Text strong>{item.rating.toFixed(1)}</Text>
                          </Space>
                          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
                            {item.reviews.toLocaleString('ru-RU')} отзывов
                          </Text>
                        </Space>
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
        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
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
              <Col key={isLoading ? index : (item as (typeof filteredItems)[number]).id} xs={24} sm={12} lg={8} xl={6}>
                {isLoading ? (
                  <Card
                    style={{ borderRadius: borderRadiusLG, overflow: 'hidden' }}
                    cover={
                      <Skeleton.Image
                        className="border-r w-full"
                        active
                        classNames={{
                          content: `w-full h-[244px] rounded-[${borderRadiusLG}px]`,
                        }}
                      />
                    }
                  >
                    <Skeleton active paragraph={{ rows: 3 }} />
                  </Card>
                ) : (
                  <Badge.Ribbon
                    text={
                      (item as (typeof filteredItems)[number]).isNew
                        ? 'Новинка'
                        : (item as (typeof filteredItems)[number]).isTrending
                          ? 'В тренде'
                          : undefined
                    }
                    color={
                      (item as (typeof filteredItems)[number]).isNew ? colors.brand.secondary : colors.brand.accent
                    }
                    style={
                      !(item as (typeof filteredItems)[number]).isNew &&
                      !(item as (typeof filteredItems)[number]).isTrending
                        ? { display: 'none' }
                        : undefined
                    }
                  >
                    <Card
                      hoverable
                      style={{ borderRadius: borderRadiusLG, overflow: 'hidden', background: colorBgContainer }}
                      cover={
                        <div
                          style={{
                            padding: 12,
                            background: `linear-gradient(135deg, ${colors.surface.infoSubtle}, ${colors.surface.brandSubtle})`,
                          }}
                        >
                          <div
                            style={{
                              borderRadius,
                              overflow: 'hidden',
                              height: 220,
                              backgroundImage: `url(${(item as (typeof filteredItems)[number]).coverUrl})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }}
                          />
                        </div>
                      }
                    >
                      <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                        <Space align="baseline" style={{ justifyContent: 'space-between', width: '100%' }}>
                          <Space orientation="vertical" size={4} style={{ maxWidth: '70%' }}>
                            <Text
                              strong
                              ellipsis
                              style={{
                                fontSize: 'var(--font-card-title)',
                                lineHeight: 1.3,
                                letterSpacing: '-0.015em',
                              }}
                            >
                              {(item as (typeof filteredItems)[number]).title}
                            </Text>
                            {(item as (typeof filteredItems)[number]).subtitle && (
                              <Text type="secondary" ellipsis>
                                {(item as (typeof filteredItems)[number]).subtitle}
                              </Text>
                            )}
                            <Text type="secondary" style={{ fontSize: 'var(--font-body-sm)', lineHeight: 1.45 }}>
                              {(item as (typeof filteredItems)[number]).author}
                            </Text>
                          </Space>
                        </Space>

                        <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
                          <Space size={4}>
                            <Rate
                              disabled
                              allowHalf
                              defaultValue={(item as (typeof filteredItems)[number]).rating}
                              style={{ fontSize: 14 }}
                            />
                            <Text type="secondary" style={{ fontSize: 'var(--font-body-sm)', lineHeight: 1.45 }}>
                              ({(item as (typeof filteredItems)[number]).reviews.toLocaleString('ru-RU')})
                            </Text>
                          </Space>
                          <Tag
                            color={
                              (item as (typeof filteredItems)[number]).status === 'ongoing'
                                ? colors.brand.secondary
                                : colors.success[500]
                            }
                          >
                            {(item as (typeof filteredItems)[number]).status === 'ongoing' ? 'Онгоинг' : 'Завершено'}
                          </Tag>
                        </Space>

                        <Space size={4} wrap>
                          {(item as (typeof filteredItems)[number]).tags.slice(0, 3).map((t) => (
                            <Tag key={t}>{t}</Tag>
                          ))}
                          {(item as (typeof filteredItems)[number]).tags.length > 3 && (
                            <Tag color="default">+{(item as (typeof filteredItems)[number]).tags.length - 3}</Tag>
                          )}
                        </Space>
                      </Space>
                    </Card>
                  </Badge.Ribbon>
                )}
              </Col>
            ))}
          </Row>
        </Space>
      </section>
      <Tour open={isTourOpen} onClose={() => setIsTourOpen(false)} steps={tourSteps} />
    </>
  );
};
