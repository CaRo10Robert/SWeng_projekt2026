import { useState, type FormEvent } from 'react';
import { useDac7, useEvidenceHolds, useReleaseHold, dac7CsvUrl } from '../api/trust';
import { useSetAnnouncement, useSetMaintenance, useSystemStatus } from '../api/ops';
import { ApiError, errorMessage } from '../api/client';
import { Alert, Badge, Button, buttonClass, EmptyState, Field, FormError, Loading, Select, TextArea } from '../components/ui';
import { formatDateTime, formatMoney } from '../lib/format';
import { targetLabels } from '../lib/dsa';

/** `datetime-local` (lokale Zeit) ↔ ISO-Zeitstempel. */
const toIso = (local: string) => (local ? new Date(local).toISOString() : null);

// ------------------------------------------------------------------ DAC7 (REQ-LEGAL-009, Q-26)

export function Dac7() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { data, isPending, isError, error } = useDac7(year);
  const years = [currentYear, currentYear - 1, currentYear - 2].filter((y) => y >= 2023);
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-700">
        Verkäufer mit mindestens 30 abgeschlossenen Verkäufen oder 2.000 € Umsatz im Kalenderjahr sind nach dem
        Plattformen-Steuertransparenzgesetz meldepflichtig. Die Auswertung bereitet die Meldung vor; sie wird im Beispiel nicht
        übermittelt. Jeder Abruf wird protokolliert.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <Select
          label="Kalenderjahr"
          value={String(year)}
          onChange={(e) => setYear(Number(e.target.value))}
          options={years.map((y) => ({ value: String(y), label: String(y) }))}
        />
        <a href={dac7CsvUrl(year)} download={`dac7-${year}.csv`} className={buttonClass('secondary')}>
          Als CSV herunterladen
        </a>
      </div>
      {isPending ? (
        <Loading />
      ) : isError ? (
        <Alert tone="error">{errorMessage(error)}</Alert>
      ) : (
        <>
          {data.note && <Alert tone="info">{data.note}</Alert>}
          {data.sellers.length === 0 ? (
            <EmptyState>Keine meldepflichtigen Verkäufer im Jahr {data.year}.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Meldepflichtige Verkäufer {data.year}</caption>
                <thead className="border-b border-slate-300">
                  <tr>
                    <th scope="col" className="p-2">Name</th>
                    <th scope="col" className="p-2">E-Mail</th>
                    <th scope="col" className="p-2 text-right">Verkäufe</th>
                    <th scope="col" className="p-2 text-right">Umsatz</th>
                    <th scope="col" className="p-2">Quartale (Verkäufe / Umsatz)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sellers.map((s) => (
                    <tr key={s.userId} className="border-b border-slate-200 align-top">
                      <td className="p-2">{s.displayName}</td>
                      <td className="p-2 break-all">{s.email}</td>
                      <td className="p-2 text-right">{s.sales}</td>
                      <td className="p-2 text-right">{formatMoney(s.amountCents)}</td>
                      <td className="p-2">
                        {s.quarters.map((q) => `Q${q.quarter}: ${q.sales} / ${formatMoney(q.amountCents)}`).join(' · ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ Wartung und Ankündigung (REQ-OPS-006)

export function Operations() {
  const { data: status, isPending } = useSystemStatus();
  const maintenance = useSetMaintenance();
  const announcement = useSetAnnouncement();
  const [until, setUntil] = useState('');
  const [text, setText] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  if (isPending || !status) return <Loading />;
  const envLocked = maintenance.error instanceof ApiError && maintenance.error.code === 'maintenance_env';

  const saveAnnouncement = (e: FormEvent) => {
    e.preventDefault();
    announcement.mutate({ text: text.trim(), startsAt: toIso(startsAt), endsAt: toIso(endsAt) });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section aria-labelledby="ops-maintenance" className="space-y-3">
        <h3 id="ops-maintenance" className="text-lg font-semibold">
          Wartungsmodus
        </h3>
        <p className="flex items-center gap-2 text-sm">
          Aktuell:{' '}
          {status.maintenance.active ? (
            <Badge tone="danger">aktiv{status.maintenance.until ? ` bis ${formatDateTime(status.maintenance.until)}` : ''}</Badge>
          ) : (
            <Badge tone="success">aus</Badge>
          )}
        </p>
        <p className="text-sm text-slate-700">
          Im Wartungsmodus antworten Seiten und API mit 503; Status, Gesundheitsprüfung, Rechtsseiten und die Administration bleiben
          erreichbar.
        </p>
        {!status.maintenance.active && (
          <Field label="Voraussichtliches Ende (optional)" type="datetime-local" value={until} onChange={(e) => setUntil(e.target.value)} />
        )}
        <div aria-live="polite">
          <FormError
            error={
              envLocked
                ? 'Der Wartungsmodus ist über die Konfiguration (MAINTENANCE_MODE) gesetzt und lässt sich hier nicht ändern.'
                : maintenance.isError
                  ? errorMessage(maintenance.error)
                  : null
            }
          />
        </div>
        <Button
          variant={status.maintenance.active ? 'secondary' : 'danger'}
          busy={maintenance.isPending}
          onClick={() => maintenance.mutate({ on: !status.maintenance.active, until: status.maintenance.active ? null : toIso(until) })}
        >
          {status.maintenance.active ? 'Wartungsmodus beenden' : 'Wartungsmodus einschalten'}
        </Button>
      </section>

      <section aria-labelledby="ops-announcement" className="space-y-3">
        <h3 id="ops-announcement" className="text-lg font-semibold">
          Ankündigung
        </h3>
        {status.announcement ? (
          <Alert tone="info" title="Aktuelle Ankündigung">
            {status.announcement.text}
          </Alert>
        ) : (
          <p className="text-sm text-slate-700">Keine aktive Ankündigung.</p>
        )}
        <form onSubmit={saveAnnouncement} className="space-y-3">
          <TextArea
            label="Text"
            hint="Erscheint als Hinweis oben auf jeder Seite, 3 bis 300 Zeichen."
            required
            minLength={3}
            maxLength={300}
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Anzeigen ab (optional)" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            <Field label="Anzeigen bis (optional)" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </div>
          <FormError error={announcement.isError ? errorMessage(announcement.error) : null} />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" busy={announcement.isPending} disabled={text.trim().length < 3}>
              Ankündigung speichern
            </Button>
            {status.announcement && (
              <Button variant="secondary" onClick={() => announcement.mutate(null)}>
                Ankündigung entfernen
              </Button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}

// ------------------------------------------------------------------ Beweissicherung (REQ-LEGAL-008)

export function EvidenceHolds() {
  const { data, isPending, isError, error } = useEvidenceHolds();
  const release = useReleaseHold();
  if (isPending) return <Loading />;
  if (isError) return <Alert tone="error">{errorMessage(error)}</Alert>;
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-700">
        Bei Verdacht auf eine Straftat bleiben die betroffenen Inhalte höchstens sechs Monate gesichert, auch wenn sie sonst gelöscht
        würden. Gib sie frei, sobald sie nicht mehr gebraucht werden.
      </p>
      <FormError error={release.isError ? errorMessage(release.error) : null} />
      {data.length === 0 ? (
        <EmptyState>Keine Beweissicherungen.</EmptyState>
      ) : (
        <ul className="space-y-2">
          {data.map((h) => (
            <li key={h.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-3 text-sm ring-1 ring-slate-200">
              <span className="space-x-2">
                <Badge tone={h.urgent ? 'danger' : 'warning'}>{h.urgent ? 'Gefahr' : 'Verdacht'}</Badge>
                <span>
                  {targetLabels[h.targetType]} <span className="font-mono text-xs">{h.targetId}</span>
                </span>
                <span className="text-slate-600">
                  seit {formatDateTime(h.createdAt)}, gesichert bis {formatDateTime(h.heldUntil)}
                </span>
              </span>
              {h.releasedAt ? (
                <Badge>freigegeben {formatDateTime(h.releasedAt)}</Badge>
              ) : (
                <Button variant="secondary" busy={release.isPending && release.variables === h.id} onClick={() => release.mutate(h.id)}>
                  Freigeben
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
