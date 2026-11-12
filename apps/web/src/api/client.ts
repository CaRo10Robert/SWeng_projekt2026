import type { Problem } from '@campusmarkt/contracts';
import { currentLocale, t, tMaybe } from '../i18n';

export const API_BASE = '/api/v1';
export const CSRF_HEADER = 'x-campusmarkt-csrf';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    readonly detail: string | undefined,
    readonly errors: { path: string; message: string }[] = [],
    /** Request-ID des Servers zum Melden eines Fehlers (REQ-UX-003). */
    readonly requestId?: string,
    /** Sekunden aus `Retry-After`, z. B. im Wartungsmodus (REQ-OPS-006). */
    readonly retryAfter?: number,
  ) {
    super(detail ?? `HTTP ${status}`);
    this.name = 'ApiError';
  }
}

/** Netzwerkfehler (kein HTTP-Status) – unterscheidbar von Serverfehlern. */
export class NetworkError extends Error {
  constructor() {
    super(t('error.network'));
    this.name = 'NetworkError';
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  method?: Method;
  body?: unknown;
  signal?: AbortSignal;
}

export async function api<T>(path: string, { method = 'GET', body, signal }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (method !== 'GET') headers[CSRF_HEADER] = '1';
  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers['content-type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(API_BASE + path, { method, headers, body: payload, signal, credentials: 'same-origin' });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new NetworkError();
  }

  if (res.status === 204) return undefined as T;
  const isJson = (res.headers.get('content-type') ?? '').includes('json');
  const data: unknown = isJson ? await res.json().catch(() => undefined) : undefined;
  if (!res.ok) {
    const p = (data ?? {}) as Partial<Problem>;
    const retryAfter = parseRetryAfter(res.headers.get('retry-after'));
    const error = new ApiError(res.status, p.code, p.detail ?? p.title, p.errors ?? [], p.requestId, retryAfter);
    for (const listener of errorListeners) listener(error);
    throw error;
  }
  return data as T;
}

type ErrorListener = (error: ApiError) => void;
const errorListeners = new Set<ErrorListener>();

/** Globale Reaktion auf bestimmte Fehler (z. B. `terms_required`, `maintenance`), unabhängig vom Aufrufer. */
export function onApiError(listener: ErrorListener): () => void {
  errorListeners.add(listener);
  return () => errorListeners.delete(listener);
}

/** `Retry-After` als Sekunden (RFC 9110: Sekundenzahl oder HTTP-Datum); ungültig oder vergangen → undefined. */
export function parseRetryAfter(header: string | null, now = Date.now()): number | undefined {
  if (!header) return undefined;
  const value = header.trim();
  if (/^\d+$/.test(value)) return Number(value) || undefined;
  const at = Date.parse(value);
  if (Number.isNaN(at)) return undefined;
  const seconds = Math.ceil((at - now) / 1000);
  return seconds > 0 ? seconds : undefined;
}

/** Hinweis auf die Wartezeit nach 429 bzw. 503 (REQ-UX-009): Sekunden unter zwei Minuten, sonst Minuten. */
export function retryHint(seconds: number | undefined): string {
  if (!seconds) return t('error.retryLater');
  return seconds < 120 ? t('error.retryInSeconds', { seconds }) : t('error.retryInMinutes', { minutes: Math.ceil(seconds / 60) });
}

export const isMaintenance = (err: unknown): err is ApiError =>
  err instanceof ApiError && err.status === 503 && err.code === 'maintenance';

export function qs(params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

/**
 * Verständliche Fehlermeldung in der gewählten Sprache: zuerst über den Fehlercode des Servers (`apiError.<code>`),
 * sonst der Text des Servers (Deutsch), sonst ein allgemeiner Hinweis (ADR-0016).
 */
export function errorMessage(err: unknown, fallback?: string): string {
  if (err instanceof ApiError) {
    // 429 (REQ-UX-009): eigener Text des Fehlercodes, sonst der allgemeine; dazu die Wartezeit aus Retry-After
    if (err.status === 429) {
      const specific = err.code && err.code !== 'rate_limited' ? tMaybe(`apiError.${err.code}`) : undefined;
      return `${specific ?? t('apiError.rate_limited')} ${retryHint(err.retryAfter)}`;
    }
    if (err.status === 503 && err.code === 'maintenance') return t('apiError.maintenance');
    const translated = err.code ? tMaybe(`apiError.${err.code}`) : undefined;
    if (translated && currentLocale() !== 'de') return translated;
    return err.detail ?? translated ?? fallback ?? t('error.generic');
  }
  if (err instanceof NetworkError) return t('error.network');
  return fallback ?? t('error.generic');
}
