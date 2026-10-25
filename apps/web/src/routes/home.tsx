import { Link } from '@tanstack/react-router';
import { useMeta } from '../api/auth';
import { buttonClass } from '../components/ui';
import { useDocumentTitle } from '../lib/title';

const steps = [
  {
    title: 'Registrieren',
    text: 'Mit deiner Hochschul-E-Mail-Adresse. Ein Bestätigungslink stellt sicher, dass nur Hochschulangehörige mitmachen.',
  },
  {
    title: 'Anbieten oder finden',
    text: 'Bücher, Möbel, Technik oder Tauschangebote einstellen oder durchsuchen – kostenlos und ohne Werbung.',
  },
  {
    title: 'Auf dem Campus übergeben',
    text: 'Per Chat verabreden und persönlich an einem bekannten Ort auf dem Campus übergeben.',
  },
];

/** Startseite für Gäste (REQ-UX-004): erklärt Nutzen, Zugang und Ablauf, zeigt keine Anzeigen oder Bilder (Q-1). */
export function HomePage() {
  const { data: meta } = useMeta();
  const domains = meta?.allowedDomains ?? ['hwg-lu.de', 'studmail.hwg-lu.de'];
  useDocumentTitle('Willkommen');
  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <section aria-labelledby="home-title" className="space-y-4 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200 sm:p-10">
        <h1 id="home-title" className="text-3xl font-bold text-brand-800 sm:text-4xl">
          Kaufen, verkaufen und tauschen – direkt auf dem Campus
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-700">
          CampusMarkt ist der Marktplatz der Hochschule für Wirtschaft und Gesellschaft Ludwigshafen: von Mitgliedern für
          Mitglieder, ohne Versand und ohne Fremde.
        </p>
        <p className="mx-auto max-w-2xl rounded-lg bg-brand-50 px-4 py-3 text-brand-800">
          <strong>Nur für Hochschulangehörige</strong> mit einer Adresse{' '}
          {domains.map((d, i) => (
            <span key={d}>
              {i > 0 && (i === domains.length - 1 ? ' oder ' : ', ')}
              <code className="font-mono">@{d}</code>
            </span>
          ))}
          .
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/register" className={buttonClass('primary', 'px-6')}>
            Registrieren
          </Link>
          <Link to="/login" search={{}} className={buttonClass('secondary', 'px-6')}>
            Anmelden
          </Link>
        </div>
      </section>

      <section aria-labelledby="steps-title" className="space-y-4">
        <h2 id="steps-title" className="text-2xl font-bold">
          So funktioniert es
        </h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-3 font-semibold">
                <span className="sr-only">Schritt {i + 1}: </span>
                {s.title}
              </h3>
              <p className="mt-1 text-sm text-slate-700">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="safety-title" className="space-y-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 id="safety-title" className="text-xl font-bold">
          Sicher handeln
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-slate-700">
          <li>Übergib Dinge persönlich an belebten Orten auf dem Campus und prüfe die Ware vor dem Bezahlen.</li>
          <li>Zahle nie im Voraus und folge keinen Links zu fremden Bezahl- oder Versandseiten.</li>
          <li>Deine E-Mail-Adresse bleibt verborgen, bis ihr beide der Kontaktfreigabe zustimmt.</li>
          <li>Verdächtige Anzeigen oder Nachrichten kannst du jederzeit melden.</li>
        </ul>
        <p>
          <Link to="/hilfe" hash="welche-betrugsmaschen-gibt-es" className="text-brand-700 underline">
            Mehr zu Betrugsmaschen und sicherer Übergabe
          </Link>
        </p>
      </section>
    </div>
  );
}
