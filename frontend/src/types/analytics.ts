export type AnalyticsContentType = 'all' | 'comic' | 'post';
export type AnalyticsInterval = 'day' | 'week' | 'month';

export interface AnalyticsMetric {
  value: number;
  delta: number;
}

export interface AnalyticsSummary {
  views: AnalyticsMetric;
  reach: AnalyticsMetric;
  comments: AnalyticsMetric;
  likes: AnalyticsMetric;
  favorites: AnalyticsMetric;
  publications: AnalyticsMetric;
  engagement: AnalyticsMetric;
  engagementRate: AnalyticsMetric;
}

export interface AnalyticsTimelinePoint {
  period: string;
  views: number;
  reach: number;
  comments: number;
  likes: number;
  favorites: number;
  publications: number;
  engagement: number;
}

export interface AnalyticsTopItem {
  contentType: 'comic' | 'post';
  objectId: number;
  title: string;
  views: number;
  reach: number;
  comments: number;
  likes: number;
  favorites: number;
  publications: number;
  engagement: number;
}

export interface AnalyticsFilterItem {
  id: number;
  title: string;
  contentType: 'comic' | 'post';
  status: string;
}

export interface AnalyticsTotalsByContentTypeItem {
  views: number;
  reach: number;
  comments: number;
  likes: number;
  favorites: number;
  publications: number;
  engagement: number;
  engagementRate: number;
}

export interface AnalyticsResponse {
  filters: {
    contentType: AnalyticsContentType;
    itemId: number | null;
    dateFrom: string;
    dateTo: string;
    interval: AnalyticsInterval;
  };
  summary: AnalyticsSummary;
  totalsByContentType: Record<'comic' | 'post', AnalyticsTotalsByContentTypeItem>;
  timeline: AnalyticsTimelinePoint[];
  topItems: AnalyticsTopItem[];
  availableItems: AnalyticsFilterItem[];
}

export interface AnalyticsQueryParams {
  contentType: AnalyticsContentType;
  itemId?: number | null;
  dateFrom: string;
  dateTo: string;
  interval: AnalyticsInterval;
}
