import { fixtureData } from '../support/fixtureData';
import { mockAuthenticatedShell } from '../support/mockApi';

describe('Notifications page', () => {
  it('отображает уведомления и позволяет отметить прочитанным', () => {
    mockAuthenticatedShell();

    cy.visitApp('/notifications', { authenticated: true });
    cy.wait(['@getCurrentUser', '@getAccount', '@getNotifications']);

    fixtureData('notifications.json').then((notifications) => {
      cy.contains('Уведомления').should('be.visible');
      cy.contains(notifications.items[0].message).should('be.visible');

      cy.contains(notifications.items[0].message)
        .closest('.ant-alert')
        .within(() => {
          cy.contains('Отметить прочитанным').should('be.visible').click();
        });

      cy.wait('@markNotificationsRead')
        .its('request.body')
        .should('deep.equal', {
          ids: [notifications.items[0].id],
        });

      cy.contains(notifications.items[0].message)
        .closest('.ant-alert')
        .within(() => {
          cy.contains('Прочитано').should('be.visible');
          cy.contains('Отметить прочитанным').should('not.exist');
        });
    });
  });

  it('не помечает уведомление прочитанным при ошибке сервера', () => {
    mockAuthenticatedShell();
    cy.intercept('POST', '**/api/v1/notifications/read/', {
      statusCode: 500,
      body: {
        data: null,
        error: { message: 'Ошибка обновления уведомлений.' },
      },
    }).as('markNotificationsReadFailed');

    cy.visitApp('/notifications', { authenticated: true });
    cy.wait(['@getCurrentUser', '@getAccount', '@getNotifications']);

    fixtureData('notifications.json').then((notifications) => {
      cy.contains(notifications.items[0].message)
        .closest('.ant-alert')
        .within(() => {
          cy.contains('Отметить прочитанным').click();
        });

      cy.wait('@markNotificationsReadFailed');

      cy.contains(notifications.items[0].message)
        .closest('.ant-alert')
        .within(() => {
          cy.contains('Отметить прочитанным').should('be.visible');
          cy.contains('Прочитано').should('not.exist');
        });
    });
  });

  it('не позволяет отметить выбранным уже прочитанное уведомление', () => {
    mockAuthenticatedShell();

    cy.visitApp('/notifications', { authenticated: true });
    cy.wait(['@getCurrentUser', '@getAccount', '@getNotifications']);

    fixtureData('notifications.json').then((notifications) => {
      cy.contains(notifications.items[1].message)
        .closest('.ant-list-item')
        .find('input[type="checkbox"]')
        .check({ force: true });

      cy.contains('button', 'Отметить выбранные').should('be.disabled');
    });
  });
});
