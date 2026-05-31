import { Skeleton } from 'antd';
import { lazy, Suspense } from 'react';

const LazyLineChart = lazy(() =>
  import('@ant-design/plots/es/components/line').then(({ default: Line }) => ({ default: Line })),
);

const LazyColumnChart = lazy(() =>
  import('@ant-design/plots/es/components/column').then(({ default: Column }) => ({ default: Column })),
);

const ChartLoader = () => (
  <div className="min-h-[320px] space-y-4">
    <div className="grid grid-cols-4 gap-3">
      <Skeleton.Button active block className="!h-8" />
      <Skeleton.Button active block className="!h-8" />
      <Skeleton.Button active block className="!h-8" />
      <Skeleton.Button active block className="!h-8" />
    </div>
    <div className="rounded-2xl border border-[#f0f0f0] p-4">
      <Skeleton active title={false} paragraph={{ rows: 10 }} />
    </div>
  </div>
);

type LazyChartProps = Record<string, unknown>;

export const AnalyticsLineChart = (props: LazyChartProps) => (
  <Suspense fallback={<ChartLoader />}>
    <LazyLineChart {...props} />
  </Suspense>
);

export const AnalyticsColumnChart = (props: LazyChartProps) => (
  <Suspense fallback={<ChartLoader />}>
    <LazyColumnChart {...props} />
  </Suspense>
);
