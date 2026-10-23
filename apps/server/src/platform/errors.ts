/** Fachlicher Fehler, der an der HTTP-Grenze als RFC-9457-Problem ausgeliefert wird. */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly errors?: { path: string; message: string }[],
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const notFound = (detail = 'Ressource nicht gefunden') => new AppError(404, 'not_found', detail);
export const forbidden = (detail = 'Keine Berechtigung') => new AppError(403, 'forbidden', detail);
export const unauthenticated = () => new AppError(401, 'unauthenticated', 'Bitte melde dich an.');
export const conflict = (code: string, detail: string) => new AppError(409, code, detail);
export const badRequest = (code: string, detail: string) => new AppError(400, code, detail);
export const unprocessable = (code: string, detail: string, errors?: { path: string; message: string }[]) =>
  new AppError(422, code, detail, errors);
export const rateLimited = (retryAfterSeconds: number) =>
  Object.assign(new AppError(429, 'rate_limited', 'Zu viele Anfragen. Bitte warte einen Moment.'), {
    retryAfterSeconds,
  });

/** Postgres-Unique-Verletzung (23505). */
export function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505';
}
