import * as allure from 'allure-js-commons';
import { QueryClientProvider as CoreQueryClientProvider, QueryClient } from '@tanstack/react-query';

import '@testing-library/jest-dom';

import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';

class MockWorker {
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent<{ success: true; file: File }>) => void) | null = null;

  postMessage(message: { file: File }) {
    queueMicrotask(() => {
      this.onmessage?.(
        new MessageEvent('message', {
          data: {
            success: true,
            file: message.file,
          },
        }),
      );
    });
  }

  terminate() {
    return undefined;
  }
}

Object.defineProperty(globalThis, 'Worker', {
  configurable: true,
  value: MockWorker,
  writable: true,
});

beforeAll(() => {
  vi.mock('antd');
  vi.mock('@ant-design/icons');
  vi.mock('react-router-dom');
  vi.mock('react-share');
  vi.mock('react-hook-form-antd');
});

beforeEach(async () => {
  await allure.parentSuite('Клиентские модульные тесты');
});

afterEach(() => {
  vi.resetAllMocks();
  cleanup();
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const QueryClientProvider = ({ children }) => (
  <CoreQueryClientProvider client={queryClient}>{children}</CoreQueryClientProvider>
);

export { QueryClientProvider };
