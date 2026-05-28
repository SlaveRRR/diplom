import dayjs, { Dayjs } from 'dayjs';

import { AnalyticsDatePreset } from '@components/Analytics/types';

export const getPresetRange = (preset: Exclude<AnalyticsDatePreset, 'custom'>): [Dayjs, Dayjs] => {
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
