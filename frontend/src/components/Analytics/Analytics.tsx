import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Flex,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Tour,
  Typography,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { ReactNode, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  BarChartOutlined,
  DownloadOutlined,
  FileSearchOutlined,
  LineChartOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { Column, Line, Pie } from '@ant-design/plots';

import { api } from '@api';
import { colors } from '@constants';
import { usePageOnboarding } from '@hooks';
import {
  AnalyticsContentType,
  AnalyticsFilterItem,
  AnalyticsInterval,
  AnalyticsQueryParams,
  AnalyticsTopItem,
} from '@types';
import { useAccountQuery } from '@components/Account/hooks/useAccountQuery';
import { OutletContext } from '@pages/LayoutPage/types';

import { useAnalyticsQuery } from './hooks';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

type AnalyticsDatePreset = '7d' | '30d' | '90d' | 'all' | 'custom';

const PRESET_LABELS: Record<Exclude<AnalyticsDatePreset, 'custom'>, string> = {
  '7d': '7 дней',
  '30d': '30 дней',
  '90d': '90 дней',
  all: 'За всё время',
};

const buildPresetRange = (preset: Exclude<AnalyticsDatePreset, 'custom'>): [Dayjs, Dayjs] => {
  const today = dayjs();

  switch (preset) {
    case '7d':
      return [today.subtract(6, 'day'), today];
    case '30d':
      return [today.subtract(29, 'day'), today];
    case '90d':
      return [today.subtract(89, 'day'), today];
    case 'all':
      return [today.subtract(10, 'year'), today];
    default:
      return [today.subtract(29, 'day'), today];
  }
};

const defaultPreset: Exclude<AnalyticsDatePreset, 'custom'> = '30d';
const defaultRange: [Dayjs, Dayjs] = buildPresetRange(defaultPreset);

const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  under_review: 'На модерации',
  published: 'Опубликован',
  blocked: 'Заблокирован',
  revision: 'На доработке',
};

const buildParams = (
  contentType: AnalyticsContentType,
  itemId: number | null,
  range: [Dayjs, Dayjs],
  interval: AnalyticsInterval,
): AnalyticsQueryParams => ({
  contentType,
  itemId,
  dateFrom: range[0].format('YYYY-MM-DD'),
  dateTo: range[1].format('YYYY-MM-DD'),
  interval,
});

const formatDelta = (value: number) => `${value > 0 ? '+' : ''}${value.toLocaleString('ru-RU')}`;

const AnalyticsCardPlaceholder = ({ title, description }: { title: string; description: string }) => (
  <Flex vertical gap={16}>
    <Title level={4} className="!mb-0">
      {title}
    </Title>
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description} />
  </Flex>
);

const AnalyticsChartCard = ({
  title,
  hasData,
  emptyDescription,
  children,
}: {
  title: string;
  hasData: boolean;
  emptyDescription: string;
  children: ReactNode;
}) => (
  <Card className="border-0 shadow-sm">
    {hasData ? (
      <Flex vertical gap={16}>
        <Title level={4} className="!mb-0">
          {title}
        </Title>
        {children}
      </Flex>
    ) : (
      <AnalyticsCardPlaceholder title={title} description={emptyDescription} />
    )}
  </Card>
);

export const Analytics = () => {
  const { messageApi } = useOutletContext<OutletContext>();
  const { data: account, isLoading: isLoadingAccount } = useAccountQuery();
  const [contentType, setContentType] = useState<AnalyticsContentType>('all');
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [range, setRange] = useState<[Dayjs, Dayjs]>(defaultRange);
  const [interval, setInterval] = useState<AnalyticsInterval>('day');
  const [datePreset, setDatePreset] = useState<AnalyticsDatePreset>(defaultPreset);

  const heroRef = useRef<HTMLDivElement | null>(null);
  const filtersRef = useRef<HTMLDivElement | null>(null);
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const chartsRef = useRef<HTMLDivElement | null>(null);
  const topRef = useRef<HTMLDivElement | null>(null);

  const params = useMemo(
    () => buildParams(contentType, selectedItemId, range, interval),
    [contentType, selectedItemId, range, interval],
  );

  const { data, isLoading, isError, refetch } = useAnalyticsQuery(params);
  const hasAnalyticsAccess = Boolean(account && ((account.comics?.length ?? 0) || (account.posts?.length ?? 0)));
  const { isOpen: isTourOpen, close: closeTour } = usePageOnboarding({
    storageKey: 'analytics_onboarding_shown',
    enabled: !isLoadingAccount && !isLoading && hasAnalyticsAccess,
  });

  const availableItems = useMemo(
    () => (data?.availableItems ?? []).filter((item) => contentType === 'all' || item.contentType === contentType),
    [contentType, data?.availableItems],
  );

  const pieData = useMemo(
    () => [
      {
        type: 'Комиксы',
        value: data?.totalsByContentType.comic.engagement ?? 0,
      },
      {
        type: 'Посты',
        value: data?.totalsByContentType.post.engagement ?? 0,
      },
    ],
    [data?.totalsByContentType],
  );

  const hasTimelineData = Boolean(data?.timeline.length);
  const hasPieData = pieData.some((item) => item.value > 0);
  const hasContentSummaryData = Boolean(
    data &&
      (Object.values(data.totalsByContentType.comic).some((value) => value > 0) ||
        Object.values(data.totalsByContentType.post).some((value) => value > 0)),
  );

  const topContentColumns = [
    {
      title: 'Материал',
      dataIndex: 'title',
      key: 'title',
      render: (_: string, item: AnalyticsTopItem) => (
        <Flex vertical gap={4}>
          <Text strong>{item.title}</Text>
          <Text type="secondary">{item.contentType === 'comic' ? 'Комикс' : 'Пост'}</Text>
        </Flex>
      ),
    },
    {
      title: 'Просмотры',
      dataIndex: 'views',
      key: 'views',
    },
    {
      title: 'Охват',
      dataIndex: 'reach',
      key: 'reach',
    },
    {
      title: 'Вовлечение',
      dataIndex: 'engagement',
      key: 'engagement',
    },
  ];

  const handleExport = async () => {
    try {
      const response = await api.exportAnalytics(params);
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'otchet-analitika.xlsx';
      document.body.append(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      messageApi.success('Отчёт по аналитике скачан.');
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : 'Не удалось скачать отчёт.');
    }
  };

  const handlePresetChange = (preset: Exclude<AnalyticsDatePreset, 'custom'>) => {
    setDatePreset(preset);
    setRange(buildPresetRange(preset));
  };

  const tourSteps = [
    {
      title: 'Аналитика автора',
      description: 'Здесь собраны ключевые метрики по вашим комиксам и постам за выбранный период.',
      target: () => heroRef.current,
    },
    {
      title: 'Гибкие фильтры',
      description: 'Можно быстро переключать тип контента, конкретный материал, период и шаг агрегации.',
      target: () => filtersRef.current,
    },
    {
      title: 'Сводные KPI',
      description: 'Верхние карточки показывают базовую динамику: просмотры, охват, комментарии и ER.',
      target: () => summaryRef.current,
    },
    {
      title: 'Графики',
      description: 'Ниже вы видите, как меняется внимание к контенту во времени и как оно распределяется по типам.',
      target: () => chartsRef.current,
    },
    {
      title: 'Топ материалов',
      description: 'Таблица помогает быстро понять, какие публикации тянут на себя больше всего внимания.',
      target: () => topRef.current,
    },
  ];

  if (isLoadingAccount) {
    return (
      <Flex align="center" justify="center" className="min-h-[320px]">
        <Spin size="large" />
      </Flex>
    );
  }

  if (!hasAnalyticsAccess) {
    return (
      <Card className="border-0 shadow-sm">
        <Empty
          description="Аналитика станет доступна, когда у вас появится хотя бы один комикс или пост."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Space>
            <Button type="primary" href="/comics/create">
              Создать комикс
            </Button>
            <Button href="/blog/create">Создать пост</Button>
          </Space>
        </Empty>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Flex align="center" justify="center" className="min-h-[320px]">
        <Spin size="large" />
      </Flex>
    );
  }

  if (isError || !data) {
    return (
      <Card className="border-0 shadow-sm">
        <Empty description="Не удалось загрузить аналитику.">
          <Button onClick={() => void refetch()}>Повторить</Button>
        </Empty>
      </Card>
    );
  }

  return (
    <Flex vertical gap={24} className="w-full">
      <div ref={heroRef}>
        <Card className="border-0 shadow-sm">
          <Flex justify="space-between" align="start" wrap="wrap" gap={16}>
            <div>
              <Title level={2} className="!mb-1">
                Аналитика
              </Title>
              <Text type="secondary">
                Сводная статистика по комиксам и постам: просмотры, охваты, вовлечение и экспорт отчёта в Excel.
              </Text>
            </div>
            <Button type="primary" icon={<DownloadOutlined />} onClick={() => void handleExport()}>
              Скачать Excel
            </Button>
          </Flex>
        </Card>
      </div>

      <div ref={filtersRef}>
        <Card className="border-0 shadow-sm">
          <Flex vertical gap={16}>
            <Space wrap size={12}>
              <Segmented<AnalyticsContentType>
                value={contentType}
                onChange={(value) => {
                  setContentType(value);
                  setSelectedItemId(null);
                }}
                options={[
                  { label: 'Все', value: 'all' },
                  { label: 'Комиксы', value: 'comic' },
                  { label: 'Посты', value: 'post' },
                ]}
              />

              <Select<number | null>
                allowClear
                disabled={contentType === 'all'}
                placeholder={contentType === 'all' ? 'Сначала выберите тип контента' : 'Выбрать материал'}
                value={selectedItemId}
                className="min-w-[300px]"
                options={availableItems.map((item: AnalyticsFilterItem) => ({
                  label: `${item.title} • ${statusLabels[item.status] ?? item.status}`,
                  value: item.id,
                }))}
                onChange={(value) => setSelectedItemId(value ?? null)}
              />

              <RangePicker
                value={range}
                onChange={(value) => {
                  if (value?.[0] && value[1]) {
                    setRange([value[0], value[1]]);
                    setDatePreset('custom');
                  }
                }}
              />

              <Segmented<AnalyticsInterval>
                value={interval}
                onChange={(value) => setInterval(value)}
                options={[
                  { label: 'День', value: 'day' },
                  { label: 'Неделя', value: 'week' },
                  { label: 'Месяц', value: 'month' },
                ]}
              />
            </Space>

            <Space wrap size={8}>
              {Object.entries(PRESET_LABELS).map(([preset, label]) => (
                <Button
                  key={preset}
                  type={datePreset === preset ? 'primary' : 'default'}
                  onClick={() => handlePresetChange(preset as Exclude<AnalyticsDatePreset, 'custom'>)}
                >
                  {label}
                </Button>
              ))}
            </Space>
          </Flex>
        </Card>
      </div>

      <div ref={summaryRef}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} xl={6}>
            <Card className="border-0 shadow-sm">
              <Statistic
                title="Просмотры"
                value={data.summary.views.value}
                prefix={<LineChartOutlined />}
                suffix={<Text type="secondary">{formatDelta(data.summary.views.delta)}</Text>}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card className="border-0 shadow-sm">
              <Statistic
                title="Охват"
                value={data.summary.reach.value}
                prefix={<RiseOutlined />}
                suffix={<Text type="secondary">{formatDelta(data.summary.reach.delta)}</Text>}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card className="border-0 shadow-sm">
              <Statistic
                title="Комментарии"
                value={data.summary.comments.value}
                prefix={<FileSearchOutlined />}
                suffix={<Text type="secondary">{formatDelta(data.summary.comments.delta)}</Text>}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card className="border-0 shadow-sm">
              <Statistic
                title="ER, %"
                value={data.summary.engagementRate.value}
                precision={2}
                prefix={<BarChartOutlined />}
                suffix={<Text type="secondary">{formatDelta(data.summary.engagementRate.delta)}</Text>}
              />
            </Card>
          </Col>
        </Row>
      </div>

      <div ref={chartsRef}>
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={16}>
            <AnalyticsChartCard
              title="Динамика просмотров и охвата"
              hasData={hasTimelineData}
              emptyDescription="По выбранным фильтрам пока нет событий просмотров и охвата."
            >
              <Line
                data={data.timeline.flatMap((item) => [
                  { period: item.period, metric: 'Просмотры', value: item.views },
                  { period: item.period, metric: 'Охват', value: item.reach },
                ])}
                xField="period"
                yField="value"
                seriesField="metric"
                color={[colors.brand.secondary, colors.success[500]]}
                smooth
                legend={{ position: 'top' }}
              />
            </AnalyticsChartCard>
          </Col>
          <Col xs={24} xl={8}>
            <AnalyticsChartCard
              title="Вклад типов контента"
              hasData={hasPieData}
              emptyDescription="Недостаточно данных, чтобы построить распределение по типам контента."
            >
              <Pie
                data={pieData}
                angleField="value"
                colorField="type"
                color={[colors.brand.primary, colors.brand.secondary]}
                legend={{ position: 'bottom' }}
                label={{ text: 'type' }}
              />
            </AnalyticsChartCard>
          </Col>
        </Row>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <AnalyticsChartCard
            title="Вовлечение по периодам"
            hasData={hasTimelineData}
            emptyDescription="Пока нет активности, из которой можно собрать динамику вовлечения."
          >
            <Column
              data={data.timeline}
              xField="period"
              yField="engagement"
              color={colors.brand.primary}
              label={false}
            />
          </AnalyticsChartCard>
        </Col>
        <Col xs={24} xl={10}>
          <AnalyticsChartCard
            title="Сводка по типам контента"
            hasData={hasContentSummaryData}
            emptyDescription="Как только появятся просмотры, комментарии или реакции, здесь появится разрез по постам и комиксам."
          >
            <Space direction="vertical" className="w-full">
              <Tag color={colors.brand.primary} className="w-fit rounded-full border-0 px-3 py-1">
                Комиксы
              </Tag>
              <Text>Просмотры: {data.totalsByContentType.comic.views.toLocaleString('ru-RU')}</Text>
              <Text>Комментарии: {data.totalsByContentType.comic.comments.toLocaleString('ru-RU')}</Text>
              <Text>Лайки: {data.totalsByContentType.comic.likes.toLocaleString('ru-RU')}</Text>
              <Text>Избранное: {data.totalsByContentType.comic.favorites.toLocaleString('ru-RU')}</Text>

              <Tag color={colors.brand.secondary} className="mt-3 w-fit rounded-full border-0 px-3 py-1">
                Посты
              </Tag>
              <Text>Просмотры: {data.totalsByContentType.post.views.toLocaleString('ru-RU')}</Text>
              <Text>Комментарии: {data.totalsByContentType.post.comments.toLocaleString('ru-RU')}</Text>
              <Text>Публикации: {data.totalsByContentType.post.publications.toLocaleString('ru-RU')}</Text>
            </Space>
          </AnalyticsChartCard>
        </Col>
      </Row>

      <div ref={topRef}>
        <Card className="border-0 shadow-sm">
          <Flex vertical gap={16}>
            <Title level={4} className="!mb-0">
              Топ материалов
            </Title>
            <Table
              rowKey={(item) => `${item.contentType}-${item.objectId}`}
              columns={topContentColumns}
              dataSource={data.topItems}
              pagination={false}
              locale={{ emptyText: 'Для выбранных фильтров пока нет событий аналитики.' }}
            />
          </Flex>
        </Card>
      </div>

      <Tour open={isTourOpen} onClose={closeTour} steps={tourSteps} />
    </Flex>
  );
};
