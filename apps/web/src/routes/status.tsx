import type { SystemStatus } from '@campusmarkt/contracts';
import { useSystemStatus } from '../api/ops';
import { errorMessage } from '../api/client';
import { Alert, Badge, Button, Loading, PageHeader } from '../components/ui';
import { formatDateTime } from '../lib/format';
import { useDocumentTitle } from '../lib/title';

const serviceLabels: Record<SystemStatus['services'][number]['id'], string> = {
  app: 'Website und Anwendung',
  database: 'Datenbank',
  email: 'E-Mail-Versand',
  realtime: 'Chat in Echtzeit',
};

const overallLabels: Record<SystemStatus['status'], { text: string; tone: 'success' | 'warning' | 'danger' }> = {
  operational: { text: 'Alle Dienste in Betrieb', tone: 'success' },
  degraded: { text: 'Teilweise gestört', tone: 'warning' },
  maintenance: { text: 'Wartungsarbeiten', tone: 'danger' },
};

/** Öffentliche Statusseite (REQ-OPS-007): nur Zustände und Zeitpunkt, keine technischen Details. */
export function StatusPage() {
  const { data, isPending, isError, error, refetch, isFetching } = useSystemStatus();
  useDocumentTitle('Systemstatus');
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="Systemstatus" />
      {isPending ? (
        <Loading />
      ) : isError ? (
        <Alert tone="error" title="Der Status konnte nicht abgerufen werden.">
          {errorMessage(error)} Wenn das länger anhält, ist CampusMarkt wahrscheinlich gestört.
        </Alert>
      ) : (
        <>
          <section aria-labelledby="overall" className="space-y-2 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 id="overall" className="flex flex-wrap items-center gap-2 text-lg font-bold">
              Gesamtstatus: <Badge tone={overallLabels[data.status].tone}>{overallLabels[data.status].text}</Badge>
            </h2>
            <p className="text-sm text-slate-600">
              Zuletzt geprüft: <time dateTime={data.checkedAt}>{formatDateTime(data.checkedAt)}</time>
            </p>
            {data.maintenance.active && (
              <Alert tone="warning" title="Wartung läuft">
                {data.maintenance.until ? `Voraussichtlich bis ${formatDateTime(data.maintenance.until)}.` : 'Ende noch offen.'}
              </Alert>
            )}
            {data.announcement && <Alert tone="info">{data.announcement.text}</Alert>}
          </section>
          <section aria-labelledby="services" className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 id="services" className="text-lg font-bold">
              Dienste
            </h2>
            <ul className="mt-3 divide-y divide-slate-200">
              {data.services.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                  <span>{serviceLabels[s.id]}</span>
                  <Badge tone={s.status === 'operational' ? 'success' : 'danger'}>
                    {s.status === 'operational' ? 'in Betrieb' : 'gestört'}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
          <Button variant="secondary" busy={isFetching} onClick={() => void refetch()}>
            Aktualisieren
          </Button>
        </>
      )}
    </div>
  );
}
