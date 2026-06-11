import 'allure-cypress';
import 'cypress-lighthouse-plugin/commands';

import * as allure from 'allure-js-commons';

import './commands';

beforeEach(() => {
  if (Cypress.spec.relative.endsWith('lighthouse.cy.ts')) {
    allure.parentSuite('Аудит клиентских страниц');
    allure.suite('Lighthouse');
    return;
  }

  allure.parentSuite('Сквозное тестирование');
});

Cypress.on('window:before:load', (win) => {
  class MockWebSocket {
    readyState = 1;
    onopen: ((event: Event) => void) | null = null;
    onclose: ((event: CloseEvent) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;

    constructor() {
      setTimeout(() => {
        this.onopen?.(new Event('open'));
      }, 0);
    }

    addEventListener() {}
    removeEventListener() {}
    send() {}
    close() {
      this.readyState = 3;
    }
  }

  Object.defineProperty(win, 'WebSocket', {
    writable: true,
    value: MockWebSocket,
  });

  Object.defineProperty(win, 'confirm', {
    writable: true,
    value: () => false,
  });
});
