import { Dayjs } from 'dayjs';

import { AnalyticsContentType, AnalyticsInterval, AnalyticsQueryParams } from '@types';

export const getParams = (
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
