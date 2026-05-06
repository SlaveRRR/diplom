import './commands';

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
