import {
  mockAnalyticsApi,
  mockAuthenticatedShell,
  mockBlogPageApi,
  mockComicDetailsApi,
  mockHomeApi,
  mockPublicApi,
} from '../support/mockApi';

describe('Lighthouse audits', () => {
  it('проверяет главную страницу', () => {
    mockHomeApi();

    cy.visitApp('/');
    cy.wait('@getHomeSelections');
    cy.lighthouse();
  });

  it('проверяет страницу блога', () => {
    mockBlogPageApi();

    cy.visitApp('/blog');
    cy.wait(['@getBlogPosts', '@getBlogTags']);
    cy.lighthouse();
  });

  it('проверяет каталог', () => {
    mockPublicApi();

    cy.visitApp('/catalog');
    cy.wait(['@getCatalogComics', '@getTaxonomy']);
    cy.lighthouse();
  });

  it('проверяет страницу комикса', () => {
    mockComicDetailsApi();

    cy.visitApp('/comics/1');
    cy.wait('@getComicDetails');
    cy.lighthouse();
  });

  it('проверяет страницу аналитики', () => {
    mockAuthenticatedShell();
    mockAnalyticsApi();

    cy.visitApp('/analytics', { authenticated: true });
    cy.wait(['@getCurrentUser', '@getAccount', '@getNotifications', '@getAnalytics']);
    cy.lighthouse();
  });

  it('проверяет страницу уведомлений', () => {
    mockAuthenticatedShell();

    cy.visitApp('/notifications', { authenticated: true });
    cy.wait(['@getCurrentUser', '@getAccount', '@getNotifications']);
    cy.lighthouse();
  });
});
