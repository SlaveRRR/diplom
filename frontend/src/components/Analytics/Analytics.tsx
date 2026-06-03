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
import { Dayjs } from 'dayjs';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  BarChartOutlined,
  CaretDownFilled,
  CaretUpFilled,
  DownloadOutlined,
  FileSearchOutlined,
  LineChartOutlined,
  MinusOutlined,
  RiseOutlined,
} from '@ant-design/icons';

import { api } from '@api';
import { colors } from '@constants';
import { AnalyticsContentType, AnalyticsFilterItem, AnalyticsInterval, AnalyticsTopItem } from '@types';
import { useAccountQuery } from '@components/Account/hooks/useAccountQuery';
import { usePageOnboarding } from '@hooks/usePageOnboarding';
import { OutletContext } from '@pages/LayoutPage/types';

import { AnalyticsColumnChart, AnalyticsLineChart } from './components/LazyCharts';
import { DEFAULT_PRESET, DEFAULT_RANGE, PRESET_LABELS, STATUS_LABELS } from './constants';
import { useAnalyticsQuery } from './hooks';
import { AnalyticsDatePreset } from './types';
import { getParams, getPresetRange } from './utils';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const formatDelta = (value: number) => `${value > 0 ? '+' : ''}${value.toLocaleString('ru-RU')}`;

const getTrendMeta = (value: number) => {
  if (value > 0) {
    return {
      color: '#16a34a',
      icon: <CaretUpFilled />,
    };
  }

  if (value < 0) {
    return {
      color: '#dc2626',
      icon: <CaretDownFilled />,
    };
  }

  return {
    color: '#94a3b8',
    icon: <MinusOutlined />,
  };
};

const StatisticTrend = ({ value }: { value: number }) => {
  const trend = getTrendMeta(value);

  return (
    <Text
      style={{
        color: trend.color,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {trend.icon}
      {formatDelta(value)}
    </Text>
  );
};

const useAnimatedNumber = (targetValue: number, duration = 900) => {
  const [animatedValue, setAnimatedValue] = useState(targetValue);
  const previousValueRef = useRef(targetValue);

  useEffect(() => {
    const startValue = previousValueRef.current;
    const startTime = performance.now();

    const tick = (currentTime: number) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setAnimatedValue(startValue + (targetValue - startValue) * progress);

      if (progress < 1) {
        window.requestAnimationFrame(tick);
      } else {
        previousValueRef.current = targetValue;
      }
    };

    const frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [duration, targetValue]);

  return animatedValue;
};

const AnimatedStatisticValue = ({ value, precision = 0 }: { value: number; precision?: number }) => {
  const animatedValue = useAnimatedNumber(value);

  return animatedValue.toLocaleString('ru-RU', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
};

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
  const [range, setRange] = useState<[Dayjs, Dayjs]>(DEFAULT_RANGE);
  const [interval, setInterval] = useState<AnalyticsInterval>('day');
  const [datePreset, setDatePreset] = useState<AnalyticsDatePreset>(DEFAULT_PRESET);

  const heroRef = useRef<HTMLDivElement | null>(null);
  const filtersRef = useRef<HTMLDivElement | null>(null);
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const chartsRef = useRef<HTMLDivElement | null>(null);
  const topRef = useRef<HTMLDivElement | null>(null);

  const [isLoadingExcel, setIsLoadingExcel] = useState(false);

  const params = useMemo(
    () => getParams(contentType, selectedItemId, range, interval),
    [contentType, selectedItemId, range, interval],
  );

  const { data, isLoading, isError, refetch } = useAnalyticsQuery(params);
  const hasAnalyticsAccess = Boolean(account && ((account.comics?.length ?? 0) || (account.posts?.length ?? 0)));
  const { tourProps } = usePageOnboarding({
    storageKey: 'analytics_onboarding_shown',
    enabled: !isLoadingAccount && !isLoading && hasAnalyticsAccess,
  });

  const availableItems = useMemo(
    () => (data?.availableItems ?? []).filter((item) => contentType === 'all' || item.contentType === contentType),
    [contentType, data?.availableItems],
  );

  const hasTimelineData = Boolean(data?.timeline.length);
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
      width: 280,
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
      width: 140,
    },
    {
      title: 'Охват',
      dataIndex: 'reach',
      key: 'reach',
      width: 140,
    },
    {
      title: 'Вовлеченность',
      dataIndex: 'engagement',
      key: 'engagement',
      width: 160,
    },
  ];

  const handleExport = async () => {
    try {
      setIsLoadingExcel(true);
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
    } finally {
      setIsLoadingExcel(false);
    }
  };

  const handlePresetChange = (preset: Exclude<AnalyticsDatePreset, 'custom'>) => {
    setDatePreset(preset);
    setRange(getPresetRange(preset));
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
      description: 'Ниже видно, как меняется внимание к контенту во времени и как оно распределяется по типам.',
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
        <Spin />
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
        <Spin size="middle" />
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
                Сводная статистика по комиксам и постам: просмотры, охваты, вовлеченность и экспорт отчёта в Excel.
              </Text>
            </div>
            <Button loading={isLoadingExcel} type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
              Скачать Excel
            </Button>
          </Flex>
        </Card>
      </div>

      <div ref={filtersRef}>
        <Card className="border-0 shadow-sm">
          <Flex vertical gap={16}>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[auto_minmax(0,320px)_auto_auto] xl:items-center">
              <Segmented<AnalyticsContentType>
                block
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
                className="!w-full md:!w-[320px]"
                options={availableItems.map((item: AnalyticsFilterItem) => ({
                  label: `${item.title} • ${STATUS_LABELS[item.status] ?? item.status}`,
                  value: item.id,
                }))}
                onChange={(value) => setSelectedItemId(value ?? null)}
              />

              <RangePicker
                className="!w-full md:!w-auto"
                value={range}
                onChange={(value) => {
                  if (value?.[0] && value[1]) {
                    setRange([value[0], value[1]]);
                    setDatePreset('custom');
                  }
                }}
              />

              <Segmented<AnalyticsInterval>
                block
                value={interval}
                onChange={(value) => setInterval(value)}
                options={[
                  { label: 'День', value: 'day' },
                  { label: 'Неделя', value: 'week' },
                  { label: 'Месяц', value: 'month' },
                ]}
              />
            </div>

            <Flex gap={8} wrap="wrap">
              {Object.entries(PRESET_LABELS).map(([preset, label]) => (
                <Button
                  key={preset}
                  type={datePreset === preset ? 'primary' : 'default'}
                  onClick={() => handlePresetChange(preset as Exclude<AnalyticsDatePreset, 'custom'>)}
                >
                  {label}
                </Button>
              ))}
            </Flex>
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
                formatter={() => <AnimatedStatisticValue value={data.summary.views.value} />}
                prefix={<LineChartOutlined />}
                suffix={<StatisticTrend value={data.summary.views.delta} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card className="border-0 shadow-sm">
              <Statistic
                title="Охват"
                value={data.summary.reach.value}
                formatter={() => <AnimatedStatisticValue value={data.summary.reach.value} />}
                prefix={<RiseOutlined />}
                suffix={<StatisticTrend value={data.summary.reach.delta} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card className="border-0 shadow-sm">
              <Statistic
                title="Комментарии"
                value={data.summary.comments.value}
                formatter={() => <AnimatedStatisticValue value={data.summary.comments.value} />}
                prefix={<FileSearchOutlined />}
                suffix={<StatisticTrend value={data.summary.comments.delta} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card className="border-0 shadow-sm">
              <Statistic
                title="ER, %"
                value={data.summary.engagementRate.value}
                precision={2}
                formatter={() => <AnimatedStatisticValue value={data.summary.engagementRate.value} precision={2} />}
                prefix={<BarChartOutlined />}
                suffix={<StatisticTrend value={data.summary.engagementRate.delta} />}
              />
            </Card>
          </Col>
        </Row>
      </div>

      <div ref={chartsRef}>
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={24}>
            <AnalyticsChartCard
              title="Динамика просмотров и охвата"
              hasData={hasTimelineData}
              emptyDescription="По выбранным фильтрам пока нет событий просмотров и охвата."
            >
              <AnalyticsLineChart
                data={data.timeline.flatMap((item) => [
                  { period: item.period, metric: 'Просмотры', value: item.views },
                  { period: item.period, metric: 'Охват', value: item.reach },
                ])}
                xField="period"
                yField="value"
                seriesField="metric"
                colorField="metric"
                smooth
                legend={{ position: 'top' }}
              />
            </AnalyticsChartCard>
          </Col>
        </Row>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <AnalyticsChartCard
            title="Вовлеченность по периодам"
            hasData={hasTimelineData}
            emptyDescription="Пока нет активности, из которой можно собрать динамику вовлечения."
          >
            <AnalyticsColumnChart
              data={data.timeline}
              xField="period"
              yField="engagement"
              color={colors.brand.primary}
              label={false}
              tooltip={{
                title: (datum) => `Период: ${datum.period}`,
                items: [
                  {
                    name: 'Вовлеченность',
                    field: 'engagement',
                    valueFormatter: (value) => value,
                  },
                ],
              }}
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
            <div className="overflow-x-auto">
              <Table
                rowKey={(item) => `${item.contentType}-${item.objectId}`}
                columns={topContentColumns}
                dataSource={data.topItems}
                pagination={false}
                scroll={{ x: 720 }}
                locale={{ emptyText: 'Для выбранных фильтров пока нет событий аналитики.' }}
              />
            </div>
          </Flex>
        </Card>
      </div>

      <Tour {...tourProps} steps={tourSteps} />
    </Flex>
  );
};
