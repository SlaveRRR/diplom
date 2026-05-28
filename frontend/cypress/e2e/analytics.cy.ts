import { fixtureData } from '../support/fixtureData';
import { mockAnalyticsApi, mockAuthenticatedShell } from '../support/mockApi';

describe('Analytics page', () => {
  it('отображает дашборд аналитики для автора', () => {
    mockAuthenticatedShell();
    mockAnalyticsApi();

    cy.visitApp('/analytics', { authenticated: true });
    cy.wait(['@getCurrentUser', '@getAccount', '@getNotifications', '@getAnalytics']);

    cy.contains('Аналитика автора').should('be.visible');
    cy.passOnboarding(5);

    fixtureData('analytics.json').then((analytics) => {
      cy.contains('h2', 'Аналитика').should('be.visible');
      cy.contains('Скачать Excel').should('be.visible');
      cy.contains(String(analytics.topItems[0].title)).should('be.visible');
      cy.contains('12,450').should('be.visible');
    });
  });

  it('оставляет пользователя на странице при ошибке экспорта отчета', () => {
    mockAuthenticatedShell();
    mockAnalyticsApi();
    cy.intercept(
      {
        method: 'GET',
        pathname: '/api/v1/analytics/export/',
      },
      {
        statusCode: 500,
        body: {
          data: null,
          error: { message: 'Не удалось сформировать отчет.' },
        },
      },
    ).as('exportAnalyticsFailed');

    cy.visitApp('/analytics', { authenticated: true });
    cy.wait(['@getCurrentUser', '@getAccount', '@getNotifications', '@getAnalytics']);
    cy.passOnboarding(5);

    cy.contains('button', 'Скачать Excel').click();
    cy.wait('@exportAnalyticsFailed');

    cy.location('pathname').should('eq', '/analytics');
    cy.contains('h2', 'Аналитика').should('be.visible');
    cy.contains('button', 'Скачать Excel').should('not.be.disabled');
  });
});
