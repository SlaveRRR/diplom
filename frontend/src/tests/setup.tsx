import { QueryClientProvider as CoreQueryClientProvider, QueryClient } from '@tanstack/react-query';

import '@testing-library/jest-dom';

import { afterEach } from 'vitest';
import { cleanup, render } from '@testing-library/react';

beforeAll(() => {
  vi.mock('antd');
  vi.mock('@ant-design/icons');
  vi.mock('react-router-dom');
  vi.mock('react-share');
  vi.mock('react-hook-form-antd');
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

function customRender(ui: React.ReactElement, options = {}) {
  return render(ui, {
    wrapper: ({ children }) => children,
    ...options,
  });
}

export { customRender, QueryClientProvider };
