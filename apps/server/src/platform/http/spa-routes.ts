/**
 * Gültige Routen der SPA (apps/web/src/router.tsx). Der Server liefert für diese Pfade `index.html` mit 200,
 * für alle anderen Seitenaufrufe `index.html` mit 404, damit Crawler, Monitoring und Browser den Fehler
 * erkennen (REQ-UX-003, architektur.md §8.10).
 *
 * Die Liste wird gepflegt statt generiert: Der Router ist TypeScript-Code mit Parametern (`$id`), eine
 * Generierung bräuchte einen eigenen Build-Schritt. Der Unit-Test `spa-routes.test.ts` liest router.tsx und
 * schlägt fehl, sobald dort eine Route ohne Eintrag hier hinzukommt.
 */
export const LEGAL_PAGES = [
  '/impressum',
  '/datenschutz',
  '/nutzungsbedingungen',
  '/community-regeln',
  '/barrierefreiheit',
  '/kontakt',
  '/hilfe',
] as const;

const PATTERNS: RegExp[] = [
  /^\/$/,
  /^\/(login|register|verify|forgot-password|reset-password)$/,
  /^\/(impressum|datenschutz|nutzungsbedingungen|community-regeln|barrierefreiheit|kontakt|hilfe|status|widerspruch)$/,
  /^\/listings\/new$/,
  /^\/listings\/[A-Za-z0-9-]+(\/edit)?$/,
  /^\/me\/(listings|favorites|notices)$/,
  /^\/messages(\/[A-Za-z0-9-]+)?$/,
  /^\/(profile|moderation|admin)$/,
];

/** Pfad ohne Query und ohne abschließenden Schrägstrich (außer „/“). */
export function normalizePath(url: string): string {
  const path = url.split('?')[0]!.split('#')[0]!;
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

export function isKnownSpaPath(url: string): boolean {
  const path = normalizePath(url);
  return PATTERNS.some((p) => p.test(path));
}

export function isLegalPage(url: string): boolean {
  return (LEGAL_PAGES as readonly string[]).includes(normalizePath(url));
}
