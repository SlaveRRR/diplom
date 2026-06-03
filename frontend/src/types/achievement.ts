export type UserAchievementStats = {
  chaptersReadCount: number;
  comicsStartedCount: number;
  comicsFinishedCount: number;
  favoriteComicsCount: number;
  commentsCount: number;
  readingStreakDays: number;
  longestReadingStreakDays: number;
  publishedComicsCount: number;
  publishedChaptersCount: number;
};

export type UserAchievementProgressItem = {
  code: string;
  title: string;
  description: string;
  target: number;
  currentValue: number;
  achieved: boolean;
  awardedAt: string | null;
};

export type UserAchievementsResponse = {
  stats: UserAchievementStats;
  achievements: UserAchievementProgressItem[];
};
