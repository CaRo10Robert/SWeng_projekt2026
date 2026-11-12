import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { ApiError, isMaintenance } from './api/client';
import { AppErrorBoundary } from './components/ErrorPages';
import { initTheme } from './lib/theme';
import { createAppRouter } from './router';
import { initialLocale, loadMessages, LocaleProvider } from './i18n';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      // Client-Fehler (4xx, auch 429) und Wartung nicht wiederholen, nur Netz-/Serverfehler
      retry: (count, err) => !(err instanceof ApiError && (err.status < 500 || isMaintenance(err))) && count < 2,
    },
  },
});

const router = createAppRouter(queryClient);

// Farbschema übernehmen und Änderungen der Systemeinstellung folgen (das Inline-Skript in index.html hat es schon gesetzt)
initTheme();

// Texte der Startsprache vor dem ersten Rendern laden (Englisch liegt in einem eigenen Chunk)
void loadMessages(initialLocale()).then(() =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppErrorBoundary>
        <LocaleProvider>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </LocaleProvider>
      </AppErrorBoundary>
    </StrictMode>,
  ),
);
