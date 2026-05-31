import { Button, Card, Col, Empty, Flex, Input, Result, Row, Segmented, Space, Tag, theme, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { DeleteOutlined, HeartOutlined, ReloadOutlined } from '@ant-design/icons';

import { colors } from '@constants';
import { usePlatformTaxonomy, useWindowSize } from '@hooks';
import { CatalogItem } from '@components/Catalog/hooks/useCatalogStore/types';
import { useComicFavoriteMutation } from '@components/ComicDetails/hooks';
import { ComicCard, ComicCardActionButton, ComicCardSkeleton, Select } from '@components/shared';
import { OutletContext } from '@pages/LayoutPage/types';

import { useFavoriteComicsQuery } from './hooks';

const { Search } = Input;
const { Text, Title } = Typography;

type SortKey = 'recent' | 'rating' | 'readers';
type SelectValue = string | number;

export const Favorites = () => {
  const {
    token: { colorBgContainer, colorBorderSecondary, borderRadiusLG },
  } = theme.useToken();
  const { messageApi } = useOutletContext<OutletContext>();

  const { data: items = [], isError, isLoading, refetch } = useFavoriteComicsQuery();
  const { data: taxonomy, isLoading: isLoadingTaxonomy } = usePlatformTaxonomy();

  const [searchValue, setSearchValue] = useState('');
  const [genreId, setGenreId] = useState<SelectValue>();
  const [tagIds, setTagIds] = useState<SelectValue[]>([]);
  const [sort, setSort] = useState<SortKey>('recent');

  const { size } = useWindowSize();

  const orientation = size === 'mobile' ? 'vertical' : 'horizontal';

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
      case 'rating':
        filtered = filtered.sort((left, right) => right.rating - left.rating || right.reviews - left.reviews);
        break;
      case 'readers':
        filtered = filtered.sort((left, right) => right.readersCount - left.readersCount);
        break;
      case 'recent':
      default:
        filtered = filtered.sort((left, right) => Number(right.isNew) - Number(left.isNew) || right.id - left.id);
        break;
    }

    return filtered;
  }, [genreId, items, searchValue, sort, tagIds]);

  const resetFilters = () => {
    setSearchValue('');
    setGenreId(undefined);
    setTagIds([]);
    setSort('recent');
  };

  return (
    <Flex vertical gap={24} className="w-full">
      <section
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
        <Flex vertical gap={18}>
          <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
            <div>
              <Title level={2} className="!mb-1">
                Избранное
              </Title>
              <Text type="secondary">
                Здесь собраны комиксы, которые вы сохранили для себя. Можно быстро отфильтровать список или убрать
                лишнее.
              </Text>
            </div>
            <Tag color={colors.brand.primary} className="m-0 rounded-full border-0 px-4 py-1 text-sm font-semibold">
              {items.length} в избранном
            </Tag>
          </Flex>

          <Space direction="vertical" size={12} className="w-full">
            <Search
              allowClear
              size="large"
              placeholder="Поиск по названию, автору или описанию"
              onChange={(event) => setSearchValue(event.target.value)}
              value={searchValue}
              className="w-full xl:max-w-[560px]"
            />

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,220px)_minmax(0,280px)_auto] xl:items-center">
              <Select
                isLoading={isLoadingTaxonomy}
                allowClear
                placeholder="Жанры"
                className="!w-full"
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
                className="!w-full"
                options={taxonomy?.tags}
                onChange={(value) => setTagIds(Array.isArray(value) ? value : [])}
                value={tagIds}
                showSearch
              />
              <Segmented<SortKey>
                block
                value={sort}
                orientation={orientation}
                onChange={(value) => setSort(value)}
                options={[
                  { label: 'Сначала новые', value: 'recent' },
                  { label: 'По рейтингу', value: 'rating' },
                  { label: 'По читателям', value: 'readers' },
                ]}
              />
            </div>
          </Space>
        </Flex>
      </section>

      {isError ? (
        <Card className="border-0 shadow-sm">
          <Result
            status="warning"
            title="Не удалось загрузить избранное"
            subTitle="Похоже, список временно недоступен. Попробуйте еще раз или вернитесь в каталог."
            extra={[
              <Button key="retry" type="primary" icon={<ReloadOutlined />} onClick={() => void refetch()}>
                Повторить
              </Button>,
              <Link key="catalog" to="/catalog">
                <Button>Открыть каталог</Button>
              </Link>,
            ]}
          />
        </Card>
      ) : null}

      {!isError && filteredItems.length === 0 && !isLoading ? (
        <Card className="border-0 shadow-sm">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              items.length
                ? 'По текущим фильтрам ничего не нашлось. Попробуйте сбросить часть условий.'
                : 'В избранном пока пусто. Сохраняйте интересные комиксы, чтобы вернуться к ним позже.'
            }
          >
            <Space wrap>
              <Link to="/catalog">
                <Button type="primary" icon={<HeartOutlined />}>
                  Перейти в каталог
                </Button>
              </Link>
              {items.length ? <Button onClick={resetFilters}>Сбросить фильтры</Button> : null}
            </Space>
          </Empty>
        </Card>
      ) : null}

      {!isError && (isLoading || filteredItems.length > 0) ? (
        <Row gutter={[24, 24]}>
          {(isLoading ? Array.from({ length: 8 }) : filteredItems).map((item, index) => (
            <Col key={isLoading ? index : (item as CatalogItem).id} xs={24} sm={12} lg={8} xl={6}>
              {isLoading ? (
                <ComicCardSkeleton />
              ) : (
                <FavoriteComicCard
                  item={item as CatalogItem}
                  background={colorBgContainer}
                  onRemoved={(title) => messageApi.success(`«${title}» удалён из избранного.`)}
                />
              )}
            </Col>
          ))}
        </Row>
      ) : null}
    </Flex>
  );
};

type FavoriteCardProps = {
  item: CatalogItem;
  background: string;
  onRemoved: (title: string) => void;
};

const FavoriteComicCard = ({ item, background, onRemoved }: FavoriteCardProps) => {
  const mutation = useComicFavoriteMutation(String(item.id));

  const handleRemove = async () => {
    await mutation.mutateAsync();
    onRemoved(item.title);
  };

  return (
    <ComicCard
      item={item}
      background={background}
      action={
        <ComicCardActionButton danger icon={<DeleteOutlined />} loading={mutation.isLoading} onClick={handleRemove}>
          Убрать
        </ComicCardActionButton>
      }
    />
  );
};
