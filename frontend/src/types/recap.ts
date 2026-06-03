export type MonthlyRecapPeriod = {
  year: number;
  month: number;
  title: string;
  isCurrentMonth: boolean;
};

export type MonthlyRecapSummary = {
  chaptersRead: number;
  comicsStarted: number;
  comicsFinished: number;
  readingDays: number;
  favoritesAdded: number;
  commentsWritten: number;
  achievementsUnlocked: number;
  publications: number;
};

export type MonthlyRecapNamedStat = {
  name: string;
  value: number;
};

export type MonthlyRecapTopComic = {
  id: number;
  title: string;
  genre: string;
  chaptersRead: number;
};

export type MonthlyRecapTopPost = {
  id: number;
  title: string;
  reads: number;
};

export type MonthlyRecapAchievement = {
  code: string;
  title: string;
  awardedAt: string;
};

export type UserMonthlyRecapResponse = {
  period: MonthlyRecapPeriod;
  summary: MonthlyRecapSummary;
  topComic: MonthlyRecapTopComic | null;
  topPost: MonthlyRecapTopPost | null;
  topGenres: MonthlyRecapNamedStat[];
  topTags: MonthlyRecapNamedStat[];
  achievementsUnlocked: MonthlyRecapAchievement[];
  generatedAt: string;
  isFinalized: boolean;
};
