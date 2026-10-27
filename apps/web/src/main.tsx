import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { ApiError } from './api/client';
import { createAppRouter } from './router';
import { initialLocale, loadMessages, LocaleProvider } from './i18n';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      // Client-Fehler (4xx) nicht wiederholen, nur Netz-/Serverfehler
      retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 2,
    },
  },
});

const router = createAppRouter(queryClient);

// Texte der Startsprache vor dem ersten Rendern laden (Englisch liegt in einem eigenen Chunk)
void loadMessages(initialLocale()).then(() =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <LocaleProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </LocaleProvider>
    </StrictMode>,
  ),
);
