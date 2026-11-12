import { describe, expect, it } from 'vitest';
import { mockApi } from '../test/render';
import { api, ApiError, errorMessage, parseRetryAfter, retryHint } from './client';
import { t } from '../i18n';

describe('[AT-UX-009-2] API-Client: 429 mit Wartezeit aus Retry-After (REQ-UX-009)', () => {
  it('liefert ApiError mit Status, Code und Sekunden aus Retry-After', async () => {
    mockApi({ 'GET /listings': { status: 429, body: { code: 'rate_limited', title: 'Zu viele Anfragen' }, headers: { 'retry-after': '42' } } });
    const error = await api('/listings').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 429, code: 'rate_limited', retryAfter: 42 });
    expect(errorMessage(error)).toBe(`${t('apiError.rate_limited')} ${t('error.retryInSeconds', { seconds: 42 })}`);
  });

  it('ohne Retry-After: allgemeiner Hinweis', () => {
    expect(errorMessage(new ApiError(429, 'rate_limited', undefined))).toBe(`${t('apiError.rate_limited')} ${t('error.retryLater')}`);
  });

  it('eigener Code mit 429 behält seinen Text und bekommt die Wartezeit', () => {
    const error = new ApiError(429, 'contact_request_limit', undefined, [], undefined, 600);
    expect(errorMessage(error)).toBe(`${t('apiError.contact_request_limit')} ${t('error.retryInMinutes', { minutes: 10 })}`);
  });

  it.each([
    [null, undefined],
    ['', undefined],
    ['0', undefined],
    ['30', 30],
    [' 120 ', 120],
    ['Wed, 12 Nov 2026 20:00:30 GMT', 30],
    ['Wed, 12 Nov 2026 19:59:00 GMT', undefined],
    ['bald', undefined],
  ])('Retry-After %j → %j Sekunden (Sekundenzahl oder HTTP-Datum, RFC 9110)', (header, seconds) => {
    expect(parseRetryAfter(header, Date.parse('2026-11-12T20:00:00Z'))).toBe(seconds);
  });

  it('Wartezeit unter zwei Minuten in Sekunden, sonst aufgerundet in Minuten', () => {
    expect(retryHint(59)).toBe(t('error.retryInSeconds', { seconds: 59 }));
    expect(retryHint(121)).toBe(t('error.retryInMinutes', { minutes: 3 }));
  });
});
