import { analytics, mockAnalyticsApi, mockAuthenticatedShell } from '../support/mockApi';

describe('Analytics page', () => {
  it('renders analytics dashboard for authenticated author', () => {
    mockAuthenticatedShell();
    mockAnalyticsApi();

    cy.visitApp('/analytics', { authenticated: true });
    cy.wait(['@getCurrentUser', '@getAccount', '@getNotifications', '@getAnalytics']);

    cy.contains('Аналитика автора').should('be.visible');
    cy.passOnboarding(5);

    cy.contains('h2', 'Аналитика').should('be.visible');
    cy.contains('Скачать Excel').should('be.visible');
    cy.contains(String(analytics.topItems[0].title)).should('be.visible');
    cy.contains('12,450').should('be.visible');
  });
});
