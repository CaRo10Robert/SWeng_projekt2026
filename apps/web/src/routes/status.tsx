import type { SystemStatus } from '@campusmarkt/contracts';
import { useSystemStatus } from '../api/ops';
import { errorMessage } from '../api/client';
import { Alert, Badge, Button, Loading, PageHeader } from '../components/ui';
import { formatDateTime } from '../lib/format';
import { useDocumentTitle } from '../lib/title';
import { t, tx, type MessageKey } from '../i18n';

const serviceLabels: Record<SystemStatus['services'][number]['id'], MessageKey> = {
  app: 'status.service.app',
  database: 'status.service.database',
  email: 'status.service.email',
  realtime: 'status.service.realtime',
};

const overallLabels: Record<SystemStatus['status'], { text: MessageKey; tone: 'success' | 'warning' | 'danger' }> = {
  operational: { text: 'status.overall.operational', tone: 'success' },
  degraded: { text: 'status.overall.degraded', tone: 'warning' },
  maintenance: { text: 'status.overall.maintenance', tone: 'danger' },
};

/** Öffentliche Statusseite (REQ-OPS-007): nur Zustände und Zeitpunkt, keine technischen Details. */
export function StatusPage() {
  const { data, isPending, isError, error, refetch, isFetching } = useSystemStatus();
  useDocumentTitle(t('error.systemStatus'));
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title={t('error.systemStatus')} />
      {isPending ? (
        <Loading />
      ) : isError ? (
        <Alert tone="error" title={t('status.loadFailed')}>
          {errorMessage(error)} {t('status.loadFailedHint')}
        </Alert>
      ) : (
        <>
          <section aria-labelledby="overall" className="space-y-2 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 id="overall" className="flex flex-wrap items-center gap-2 text-lg font-bold">
              {t('status.overall')} <Badge tone={overallLabels[data.status].tone}>{t(overallLabels[data.status].text)}</Badge>
            </h2>
            <p className="text-sm text-slate-600">
              {tx('status.checkedAt', { time: <time dateTime={data.checkedAt}>{formatDateTime(data.checkedAt)}</time> })}
            </p>
            {data.maintenance.active && (
              <Alert tone="warning" title={t('status.maintenanceRunning')}>
                {data.maintenance.until ? t('status.maintenanceUntil', { date: formatDateTime(data.maintenance.until) }) : t('status.maintenanceOpenEnd')}
              </Alert>
            )}
            {data.announcement && <Alert tone="info">{data.announcement.text}</Alert>}
          </section>
          <section aria-labelledby="services" className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 id="services" className="text-lg font-bold">
              {t('status.services')}
            </h2>
            <ul className="mt-3 divide-y divide-slate-200">
              {data.services.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                  <span>{t(serviceLabels[s.id])}</span>
                  <Badge tone={s.status === 'operational' ? 'success' : 'danger'}>
                    {s.status === 'operational' ? t('status.operational') : t('status.disrupted')}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
          <Button variant="secondary" busy={isFetching} onClick={() => void refetch()}>
            {t('common.refresh')}
          </Button>
        </>
      )}
    </div>
  );
}
