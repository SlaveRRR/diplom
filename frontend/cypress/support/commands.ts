/* eslint-disable @typescript-eslint/no-namespace */
/// <reference types="cypress" />

type VisitAppOptions = {
  authenticated?: boolean;
};

const buildAccessToken = () => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }));

  return `${header}.${payload}.signature`;
};

Cypress.Commands.add('visitApp', (path: string, options: VisitAppOptions = {}) => {
  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.clear();
      win.sessionStorage.clear();
      win.localStorage.setItem('adult-content-confirmed', 'true');

      if (options.authenticated) {
        win.localStorage.setItem('token', buildAccessToken());
      }
    },
  });
});

Cypress.Commands.add('passOnboarding', (maxSteps = 10) => {
  const walk = (stepsLeft: number) => {
    if (stepsLeft <= 0) {
      return;
    }

    cy.get('body').then(($body) => {
      const hasTour = $body.find('.ant-tour').length > 0;

      if (!hasTour) {
        return;
      }

      cy.get('.ant-tour').should('be.visible');

      const $primaryButton = $body.find('.ant-tour .ant-tour-buttons .ant-btn-primary').first();

      if ($primaryButton.length) {
        cy.wrap($primaryButton).click({ force: true });
        cy.wait(50);
        walk(stepsLeft - 1);
        return;
      }

      const $closeButton = $body.find('.ant-tour .ant-tour-close').first();

      if ($closeButton.length) {
        cy.wrap($closeButton).click({ force: true });
      }
    });
  };

  walk(maxSteps);
});

declare global {
  namespace Cypress {
    interface Chainable {
      visitApp(path: string, options?: VisitAppOptions): Chainable<void>;
      passOnboarding(maxSteps?: number): Chainable<void>;
    }
  }
}

export {};
