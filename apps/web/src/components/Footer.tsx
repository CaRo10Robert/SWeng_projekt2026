import { Link } from '@tanstack/react-router';

/** Pflichtlinks im Seitenfuß jeder Route (REQ-UX-006, DDG § 5: unmittelbar erreichbar und ständig verfügbar). */
export const footerLinks = [
  { to: '/impressum', label: 'Impressum' },
  { to: '/datenschutz', label: 'Datenschutz' },
  { to: '/nutzungsbedingungen', label: 'Nutzungsbedingungen' },
  { to: '/community-regeln', label: 'Community-Regeln' },
  { to: '/barrierefreiheit', label: 'Barrierefreiheit' },
  { to: '/kontakt', label: 'Kontakt' },
  { to: '/hilfe', label: 'Hilfe' },
  { to: '/status', label: 'Status' },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-6 text-sm text-slate-700 print:hidden">
      <div className="mx-auto max-w-6xl space-y-3">
        <nav aria-label="Rechtliches und Hilfe">
          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            {footerLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="rounded underline-offset-2 hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-center text-xs text-slate-600">
          CampusMarkt HWG LU · Muster im Rahmen einer Übungsaufgabe – kein Echtbetrieb
        </p>
      </div>
    </footer>
  );
}
