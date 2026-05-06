const wrapResponse = <T>(data: T) => ({
  data,
  error: null,
});

export const catalogComics = [
  {
    id: 1,
    title: 'Лунная башня',
    description: 'История о молодой команде, которая исследует древний маяк между мирами.',
    cover: 'https://placehold.co/480x640',
    coverUrl: 'https://placehold.co/480x640',
    ageRating: '16+',
    author: 'Aster',
    genreId: 1,
    genre: 'Фэнтези',
    tagIds: [11, 12],
    tags: ['Магия', 'Приключение'],
    rating: 4.8,
    reviews: 124,
    likesCount: 820,
    readersCount: 5100,
    status: 'published',
    isNew: true,
    isTrending: true,
  },
  {
    id: 2,
    title: 'Техно-ветер',
    description: 'Неоновый мегаполис и история курьера, попавшего в корпоративный заговор.',
    cover: 'https://placehold.co/480x640?text=Tech',
    coverUrl: 'https://placehold.co/480x640?text=Tech',
    ageRating: '18+',
    author: 'Nova',
    genreId: 2,
    genre: 'Киберпанк',
    tagIds: [13],
    tags: ['Будущее'],
    rating: 4.3,
    reviews: 87,
    likesCount: 410,
    readersCount: 2990,
    status: 'published',
    isNew: false,
    isTrending: true,
  },
];

export const taxonomy = {
  genres: [
    { value: 1, label: 'Фэнтези', description: 'Миры, магия и приключения.' },
    { value: 2, label: 'Киберпанк', description: 'Технологии, город и антиутопии.' },
  ],
  tags: [
    { value: 11, label: 'Магия', description: 'Колдовство, артефакты и древние силы.' },
    { value: 12, label: 'Приключение', description: 'Путешествия и движение сюжета.' },
    { value: 13, label: 'Будущее', description: 'Техно-миры, сети и корпорации.' },
  ],
  ageRatings: [
    { value: '12+', label: '12+' },
    { value: '16+', label: '16+' },
    { value: '18+', label: '18+' },
  ],
};

export const blogTags = [
  { id: 201, name: 'Редакция', slug: 'editorial', description: 'Материалы редакции.' },
  { id: 202, name: 'Процесс', slug: 'process', description: 'Заметки о создании.' },
];

export const blogPosts = [
  {
    id: 11,
    title: 'Как мы рисовали пролог',
    excerpt: 'Разбираем пайплайн от сценария до первой опубликованной главы.',
    cover: 'https://placehold.co/800x480?text=Blog+1',
    coverUrl: 'https://placehold.co/800x480?text=Blog+1',
    ageRating: '16+',
    tags: [blogTags[0], blogTags[1]],
    author: { id: 7, username: 'editor', avatar: null, role: 'author' },
    commentsCount: 14,
    publishedAt: '2026-04-21T12:00:00Z',
  },
  {
    id: 12,
    title: 'Темы взрослого контента в авторских историях',
    excerpt: 'Материал о том, как маркировать и подавать 18+ публикации на платформе.',
    cover: 'https://placehold.co/800x480?text=Blog+2',
    coverUrl: 'https://placehold.co/800x480?text=Blog+2',
    ageRating: '18+',
    tags: [blogTags[0]],
    author: { id: 8, username: 'curator', avatar: null, role: 'author' },
    commentsCount: 6,
    publishedAt: '2026-04-20T12:00:00Z',
  },
];

export const comicDetails = {
  id: 1,
  title: 'Лунная башня',
  description: 'История о молодой команде, которая исследует древний маяк между мирами.',
  cover: 'https://placehold.co/480x640',
  coverUrl: 'https://placehold.co/480x640',
  banner: 'https://placehold.co/1280x720',
  bannerUrl: 'https://placehold.co/1280x720',
  status: 'published',
  ageRating: '16+',
  genre: { id: 1, name: 'Фэнтези', slug: 'fantasy', description: 'Миры, магия и приключения.' },
  tags: [
    { id: 11, name: 'Магия', slug: 'magic', description: 'Колдовство и артефакты.' },
    { id: 12, name: 'Приключение', slug: 'adventure', description: 'Путешествия.' },
  ],
  author: { id: 7, username: 'Aster', avatar: null, role: 'author' },
  likesCount: 820,
  isLiked: false,
  favoritesCount: 304,
  isFavorite: false,
  averageRating: 4.8,
  ratingsCount: 124,
  userRating: null,
  commentsCount: 2,
  readersCount: 5100,
  chaptersCount: 2,
  chapters: [
    {
      id: 101,
      title: 'Глава 1. Свет над водой',
      description: 'Первая глава',
      chapterNumber: 1,
      pageCount: 18,
      pageKeys: ['https://placehold.co/300x420?text=Page+1'],
      previewUrl: 'https://placehold.co/300x420?text=Preview+1',
      likesCount: 102,
      commentsCount: 7,
      viewsCount: 1550,
      publishedAt: '2026-04-01T12:00:00Z',
    },
    {
      id: 102,
      title: 'Глава 2. Тонкая грань',
      description: 'Вторая глава',
      chapterNumber: 2,
      pageCount: 22,
      pageKeys: ['https://placehold.co/300x420?text=Page+2'],
      previewUrl: 'https://placehold.co/300x420?text=Preview+2',
      likesCount: 88,
      commentsCount: 4,
      viewsCount: 1270,
      publishedAt: '2026-04-11T12:00:00Z',
    },
  ],
  comments: [
    {
      id: 1,
      text: 'Очень сильное открытие истории.',
      createdAt: '2026-04-11T10:00:00Z',
      replyToId: null,
      author: { id: 99, username: 'reader_one', avatar: null, role: 'reader' },
    },
    {
      id: 2,
      text: 'Жду продолжение второй главы.',
      createdAt: '2026-04-12T10:00:00Z',
      replyToId: null,
      author: { id: 100, username: 'reader_two', avatar: null, role: 'reader' },
    },
  ],
  continueReading: null,
};

export const currentUser = {
  id: 7,
  username: 'aster',
  email: 'aster@example.com',
  avatar: null,
  role: 'author',
};

export const account = {
  id: 7,
  username: 'aster',
  email: 'aster@example.com',
  avatar: null,
  role: 'author',
  firstName: 'Aster',
  lastName: 'Moon',
  followersCount: 12,
  followingCount: 8,
  comics: [
    { id: 1, title: 'Лунная башня', status: 'published' },
    { id: 2, title: 'Техно-ветер', status: 'under_review' },
  ],
  posts: [{ id: 11, title: 'Как мы рисовали пролог', status: 'published' }],
};

export const notifications = {
  unreadCount: 1,
  items: [
    {
      id: 501,
      message: 'Ваш комикс опубликован и уже доступен читателям.',
      link: '/comics/1',
      type: 'success',
      isRead: false,
      createdAt: '2026-04-25T12:00:00Z',
      readAt: null,
    },
    {
      id: 502,
      message: 'Пост отправлен на доработку. Проверьте комментарий модератора.',
      link: '/blog/11/edit',
      type: 'warning',
      isRead: true,
      createdAt: '2026-04-24T12:00:00Z',
      readAt: '2026-04-24T13:00:00Z',
    },
  ],
};

export const analytics = {
  filters: {
    contentType: 'all',
    itemId: null,
    dateFrom: '2026-04-01',
    dateTo: '2026-04-30',
    interval: 'day',
  },
  summary: {
    views: { value: 12450, delta: 340 },
    reach: { value: 8200, delta: 210 },
    comments: { value: 98, delta: 12 },
    likes: { value: 560, delta: 45 },
    favorites: { value: 173, delta: 19 },
    publications: { value: 3, delta: 1 },
    engagement: { value: 831, delta: 64 },
    engagementRate: { value: 10.13, delta: 0.52 },
  },
  totalsByContentType: {
    comic: {
      views: 9800,
      reach: 6400,
      comments: 73,
      likes: 510,
      favorites: 173,
      publications: 2,
      engagement: 756,
      engagementRate: 11.81,
    },
    post: {
      views: 2650,
      reach: 1800,
      comments: 25,
      likes: 50,
      favorites: 0,
      publications: 1,
      engagement: 75,
      engagementRate: 4.17,
    },
  },
  timeline: [
    {
      period: '2026-04-01',
      views: 1200,
      reach: 800,
      comments: 10,
      likes: 40,
      favorites: 11,
      publications: 1,
      engagement: 61,
    },
    {
      period: '2026-04-08',
      views: 2400,
      reach: 1610,
      comments: 18,
      likes: 100,
      favorites: 28,
      publications: 0,
      engagement: 146,
    },
    {
      period: '2026-04-15',
      views: 3100,
      reach: 2050,
      comments: 24,
      likes: 170,
      favorites: 51,
      publications: 1,
      engagement: 245,
    },
    {
      period: '2026-04-22',
      views: 5750,
      reach: 3740,
      comments: 46,
      likes: 250,
      favorites: 83,
      publications: 1,
      engagement: 379,
    },
  ],
  topItems: [
    {
      contentType: 'comic',
      objectId: 1,
      title: 'Лунная башня',
      views: 6400,
      reach: 4100,
      comments: 55,
      likes: 320,
      favorites: 101,
      publications: 1,
      engagement: 476,
    },
    {
      contentType: 'post',
      objectId: 11,
      title: 'Как мы рисовали пролог',
      views: 2650,
      reach: 1800,
      comments: 25,
      likes: 50,
      favorites: 0,
      publications: 1,
      engagement: 75,
    },
  ],
  availableItems: [
    { id: 1, title: 'Лунная башня', contentType: 'comic', status: 'published' },
    { id: 2, title: 'Техно-ветер', contentType: 'comic', status: 'under_review' },
    { id: 11, title: 'Как мы рисовали пролог', contentType: 'post', status: 'published' },
  ],
};

export const mockPublicApi = () => {
  cy.intercept('GET', '**/api/v1/comics/', wrapResponse(catalogComics)).as('getCatalogComics');
  cy.intercept('GET', '**/api/v1/taxonomy*', wrapResponse(taxonomy)).as('getTaxonomy');
  cy.intercept('GET', '**/api/v1/posts/', wrapResponse(blogPosts)).as('getBlogPosts');
  cy.intercept('GET', '**/api/v1/posts/tags/', wrapResponse(blogTags)).as('getBlogTags');
};

export const mockAuthenticatedShell = () => {
  cy.intercept('GET', '**/api/v1/users/me/', wrapResponse(currentUser)).as('getCurrentUser');
  cy.intercept('GET', '**/api/v1/account/', wrapResponse(account)).as('getAccount');
  cy.intercept('GET', '**/api/v1/notifications/', wrapResponse(notifications)).as('getNotifications');
  cy.intercept('POST', '**/api/v1/notifications/read/', wrapResponse({ updatedCount: 1, unreadCount: 0 })).as(
    'markNotificationsRead',
  );
  cy.intercept('POST', '**/api/v1/notifications/delete/', wrapResponse({ deletedCount: 1, unreadCount: 0 })).as(
    'deleteNotifications',
  );
};

export const mockComicDetailsApi = () => {
  cy.intercept('GET', '**/api/v1/comics/1/', wrapResponse(comicDetails)).as('getComicDetails');
};

export const mockAnalyticsApi = () => {
  cy.intercept(
    {
      method: 'GET',
      pathname: '/api/v1/analytics/',
    },
    wrapResponse(analytics),
  ).as('getAnalytics');

  cy.intercept(
    {
      method: 'GET',
      pathname: '/api/v1/analytics/export/',
    },
    {
      statusCode: 200,
      headers: {
        'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      body: 'mock-binary',
    },
  ).as('exportAnalytics');
};
