import { Dayjs } from 'dayjs';

import { AnalyticsDatePreset } from '../types';
import { getPresetRange } from '../utils';

export const PRESET_LABELS: Record<Exclude<AnalyticsDatePreset, 'custom'>, string> = {
  '7d': '7 дней',
  '30d': '30 дней',
  '90d': '90 дней',
  all: 'За всё время',
};

export const DEFAULT_PRESET: Exclude<AnalyticsDatePreset, 'custom'> = '30d';
export const DEFAULT_RANGE: [Dayjs, Dayjs] = getPresetRange(DEFAULT_PRESET);

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  under_review: 'На модерации',
  published: 'Опубликован',
  blocked: 'Заблокирован',
  revision: 'На доработке',
};
