export const MONTHLY_RECAP_QUERY_KEY = 'user-monthly-recap';

export const recapStatisticCards = [
  {
    key: 'chaptersRead',
    title: 'Глав прочитано',
    className: 'recap-stat-card--chaptersRead',
  },
  {
    key: 'comicsStarted',
    title: 'Новых комиксов начато',
    className: 'recap-stat-card--comicsStarted',
  },
  {
    key: 'comicsFinished',
    title: 'Комиксов завершено',
    className: 'recap-stat-card--comicsFinished',
  },
  {
    key: 'readingDays',
    title: 'Дней с чтением',
    className: 'recap-stat-card--readingDays',
  },
  {
    key: 'favoritesAdded',
    title: 'Добавлено в избранное',
    className: 'recap-stat-card--favoritesAdded',
  },
  {
    key: 'commentsWritten',
    title: 'Комментариев написано',
    className: 'recap-stat-card--commentsWritten',
  },
  {
    key: 'achievementsUnlocked',
    title: 'Достижений открыто',
    className: 'recap-stat-card--achievementsUnlocked',
  },
  {
    key: 'publications',
    title: 'Публикаций вышло',
    className: 'recap-stat-card--publications',
  },
] as const;
