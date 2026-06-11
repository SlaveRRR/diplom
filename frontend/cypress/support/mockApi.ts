export const mockPublicApi = () => {
  cy.intercept({ method: 'GET', pathname: '/api/v1/comics/' }, { fixture: 'catalogComics.json' }).as(
    'getCatalogComics',
  );
  cy.intercept('GET', '**/api/v1/taxonomy*', { fixture: 'taxonomy.json' }).as('getTaxonomy');
  cy.intercept({ method: 'GET', pathname: '/api/v1/posts/' }, { fixture: 'blogPosts.json' }).as('getBlogPosts');
  cy.intercept({ method: 'GET', pathname: '/api/v1/posts/tags/' }, { fixture: 'blogTags.json' }).as('getBlogTags');
};

export const mockBlogPageApi = () => {
  cy.intercept({ method: 'GET', pathname: '/api/v1/posts/' }, { fixture: 'blogPosts.json' }).as('getBlogPosts');
  cy.intercept({ method: 'GET', pathname: '/api/v1/posts/tags/' }, { fixture: 'blogTags.json' }).as('getBlogTags');
};

export const mockHomeApi = () => {
  cy.intercept('GET', '**/api/v1/home/', { fixture: 'homeSelections.json' }).as('getHomeSelections');
};

export const mockAuthenticatedShell = () => {
  cy.intercept('GET', '**/api/v1/users/me/', { fixture: 'currentUser.json' }).as('getCurrentUser');
  cy.intercept('GET', '**/api/v1/account/', { fixture: 'account.json' }).as('getAccount');
  cy.intercept('GET', '**/api/v1/notifications/', { fixture: 'notifications.json' }).as('getNotifications');

  cy.intercept('POST', '**/api/v1/notifications/read/', {
    body: {
      data: { updatedCount: 1, unreadCount: 0 },
      error: null,
    },
  }).as('markNotificationsRead');

  cy.intercept('POST', '**/api/v1/notifications/delete/', {
    body: {
      data: { deletedCount: 1, unreadCount: 0 },
      error: null,
    },
  }).as('deleteNotifications');
};

export const mockComicDetailsApi = () => {
  cy.intercept('GET', '**/api/v1/comics/1/', { fixture: 'comicDetails.json' }).as('getComicDetails');
};

export const mockAnalyticsApi = () => {
  cy.intercept('GET', '**/api/v1/analytics/**', { fixture: 'analytics.json' }).as('getAnalytics');

  cy.intercept('GET', '**/api/v1/analytics/export/**', {
    statusCode: 200,
    headers: {
      'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
    body: 'mock-binary',
  }).as('exportAnalytics');
};

export const mockBlogCreateApi = () => {
  cy.intercept('GET', '**/api/v1/posts/tags/', { fixture: 'blogTags.json' }).as('getBlogTags');
  cy.intercept('GET', '**/api/v1/taxonomy*', { fixture: 'taxonomy.json' }).as('getTaxonomy');
  cy.intercept('POST', '**/api/v1/posts/upload-config/', { fixture: 'blogCreateUploadConfig.json' }).as(
    'getBlogUploadConfig',
  );
  cy.intercept('POST', '**/api/v1/posts/confirm/', { fixture: 'blogCreateConfirm.json' }).as('confirmBlogPost');
};

export const mockComicCreateApi = () => {
  cy.intercept('GET', '**/api/v1/taxonomy*', { fixture: 'taxonomy.json' }).as('getTaxonomy');
  cy.intercept('POST', '**/api/v1/comics/upload-config/', { fixture: 'comicCreateUploadConfig.json' }).as(
    'getComicUploadConfig',
  );
  cy.intercept('POST', '**/api/v1/comics/confirm/', { fixture: 'comicCreateConfirm.json' }).as('confirmComicCreation');
  cy.intercept('PUT', '**/comics/cover*', {
    statusCode: 200,
    body: '',
  }).as('uploadComicCover');
  cy.intercept('PUT', '**/comics/banner*', {
    statusCode: 200,
    body: '',
  }).as('uploadComicBanner');
  cy.intercept('PUT', '**/comics/page-1*', {
    statusCode: 200,
    body: '',
  }).as('uploadComicPage1');
};
