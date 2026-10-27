import { Link } from '@tanstack/react-router';
import { t, type MessageKey } from '../i18n';

/** Pflichtlinks im Seitenfuß jeder Route (REQ-UX-006, DDG § 5: unmittelbar erreichbar und ständig verfügbar). */
export const footerLinks = [
  { to: '/impressum', label: 'footer.imprint' },
  { to: '/datenschutz', label: 'footer.privacy' },
  { to: '/nutzungsbedingungen', label: 'footer.terms' },
  { to: '/community-regeln', label: 'footer.communityRules' },
  { to: '/barrierefreiheit', label: 'footer.accessibility' },
  { to: '/kontakt', label: 'footer.contact' },
  { to: '/hilfe', label: 'footer.help' },
  { to: '/status', label: 'footer.status' },
] as const satisfies readonly { to: string; label: MessageKey }[];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-6 text-sm text-slate-700 print:hidden">
      <div className="mx-auto max-w-6xl space-y-3">
        <nav aria-label={t('footer.navLabel')}>
          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            {footerLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="rounded underline-offset-2 hover:underline">
                  {t(l.label)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-center text-xs text-slate-600">{t('footer.sample')}</p>
      </div>
    </footer>
  );
}
