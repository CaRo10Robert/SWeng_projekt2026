import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { vi } from 'vitest';
import { LocaleProvider } from '../i18n';

export interface FakeResponse {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
}

/** fetch-Attrappe: Antworten je „METHODE /pfad“ (ohne /api/v1); protokolliert alle Aufrufe. */
export function mockApi(routes: Record<string, FakeResponse | ((body: unknown) => FakeResponse)>) {
  const calls: { method: string; path: string; body: unknown }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const method = (init.method ?? 'GET').toUpperCase();
      const path = url.replace(/^.*\/api\/v1/, '');
      const body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
      calls.push({ method, path, body });
      const entry = routes[`${method} ${path}`] ?? routes[`${method} ${path.split('?')[0]}`];
      const res = typeof entry === 'function' ? entry(body) : (entry ?? { status: 404, body: { code: 'not_found' } });
      return new Response(res.body === undefined ? null : JSON.stringify(res.body), {
        status: res.status ?? 200,
        headers: { 'content-type': 'application/json', ...res.headers },
      });
    }),
  );
  return calls;
}

/** Rendert eine Komponente mit Router (Links), Query-Client und Sprachkontext wie in der App. */
export function renderApp(ui: ReactNode, { path = '/' }: { path?: string } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const rootRoute = createRootRoute({ component: () => <>{ui}</> });
  const routes = ['/', '/kontakt', '/hilfe', '/datenschutz', '/nutzungsbedingungen', '/impressum'].map((p) =>
    createRoute({ getParentRoute: () => rootRoute, path: p, component: () => null }),
  );
  const router = createRouter({ routeTree: rootRoute.addChildren(routes), history: createMemoryHistory({ initialEntries: [path] }) });
  const result = render(
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <RouterProvider router={router} />
      </LocaleProvider>
    </QueryClientProvider>,
  );
  return { ...result, queryClient, router };
}
