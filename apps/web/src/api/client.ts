import type { Problem } from '@campusmarkt/contracts';

export const API_BASE = '/api/v1';
export const CSRF_HEADER = 'x-campusmarkt-csrf';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    readonly detail: string | undefined,
    readonly errors: { path: string; message: string }[] = [],
  ) {
    super(detail ?? `Fehler ${status}`);
    this.name = 'ApiError';
  }
}

/** Netzwerkfehler (kein HTTP-Status) – unterscheidbar von Serverfehlern. */
export class NetworkError extends Error {
  constructor() {
    super('Keine Verbindung zum Server.');
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
    throw new ApiError(res.status, p.code, p.detail ?? p.title, p.errors ?? []);
  }
  return data as T;
}

export function qs(params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export function errorMessage(err: unknown, fallback = 'Es ist ein Fehler aufgetreten.'): string {
  if (err instanceof ApiError) {
    if (err.status === 429) return 'Zu viele Anfragen. Bitte warte einen Moment und versuche es erneut.';
    return err.detail ?? fallback;
  }
  if (err instanceof NetworkError) return err.message;
  return fallback;
}
