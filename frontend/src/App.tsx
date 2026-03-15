import { FC } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AppProvider, ThemeProvider } from '@context';

import { Router } from './router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export const App: FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <ThemeProvider>
          <Router />
        </ThemeProvider>
      </AppProvider>
    </QueryClientProvider>
  );
};
