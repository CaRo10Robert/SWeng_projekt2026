import { useState, type FormEvent } from 'react';
import { useDac7, useEvidenceHolds, useReleaseHold, dac7CsvUrl } from '../api/trust';
import { useSetAnnouncement, useSetMaintenance, useSystemStatus } from '../api/ops';
import { ApiError, errorMessage } from '../api/client';
import { Alert, Badge, Button, buttonClass, EmptyState, Field, FormError, Loading, Select, TextArea } from '../components/ui';
import { formatDateTime, formatMoney } from '../lib/format';
import { targetLabels } from '../lib/dsa';
import { t } from '../i18n';

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
      <p className="text-sm text-slate-700">{t('dac7.intro')}</p>
      <div className="flex flex-wrap items-end gap-3">
        <Select
          label={t('dac7.year')}
          value={String(year)}
          onChange={(e) => setYear(Number(e.target.value))}
          options={years.map((y) => ({ value: String(y), label: String(y) }))}
        />
        <a href={dac7CsvUrl(year)} download={`dac7-${year}.csv`} className={buttonClass('secondary')}>
          {t('dac7.csv')}
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
            <EmptyState>{t('dac7.none', { year: data.year })}</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">{t('dac7.caption', { year: data.year })}</caption>
                <thead className="border-b border-slate-300">
                  <tr>
                    <th scope="col" className="p-2">{t('admin.col.name')}</th>
                    <th scope="col" className="p-2 text-right">{t('dac7.sales')}</th>
                    <th scope="col" className="p-2 text-right">{t('dac7.amount')}</th>
                    <th scope="col" className="p-2">{t('dac7.quarters')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sellers.map((s) => (
                    <tr key={s.userId} className="border-b border-slate-200 align-top">
                      <td className="p-2">{s.displayName}</td>
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
          {t('ops.maintenance.title')}
        </h3>
        <p className="flex items-center gap-2 text-sm">
          {t('ops.current')}{' '}
          {status.maintenance.active ? (
            <Badge tone="danger">
              {status.maintenance.until
                ? t('ops.activeUntil', { date: formatDateTime(status.maintenance.until) })
                : t('ops.active')}
            </Badge>
          ) : (
            <Badge tone="success">{t('ops.off')}</Badge>
          )}
        </p>
        <p className="text-sm text-slate-700">{t('ops.maintenance.text')}</p>
        {!status.maintenance.active && (
          <Field label={t('ops.maintenance.until')} type="datetime-local" value={until} onChange={(e) => setUntil(e.target.value)} />
        )}
        <div aria-live="polite">
          <FormError
            error={
              envLocked
                ? t('apiError.maintenance_env')
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
          {status.maintenance.active ? t('ops.maintenance.stop') : t('ops.maintenance.start')}
        </Button>
      </section>

      <section aria-labelledby="ops-announcement" className="space-y-3">
        <h3 id="ops-announcement" className="text-lg font-semibold">
          {t('notice.announcement')}
        </h3>
        {status.announcement ? (
          <Alert tone="info" title={t('ops.announcement.current')}>
            {status.announcement.text}
          </Alert>
        ) : (
          <p className="text-sm text-slate-700">{t('ops.announcement.none')}</p>
        )}
        <form onSubmit={saveAnnouncement} className="space-y-3">
          <TextArea
            label={t('ops.announcement.text')}
            hint={t('ops.announcement.hint')}
            required
            minLength={3}
            maxLength={300}
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('ops.announcement.from')} type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            <Field label={t('ops.announcement.to')} type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </div>
          <FormError error={announcement.isError ? errorMessage(announcement.error) : null} />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" busy={announcement.isPending} disabled={text.trim().length < 3}>
              {t('ops.announcement.save')}
            </Button>
            {status.announcement && (
              <Button variant="secondary" onClick={() => announcement.mutate(null)}>
                {t('ops.announcement.remove')}
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
      <p className="text-sm text-slate-700">{t('evidence.intro')}</p>
      <FormError error={release.isError ? errorMessage(release.error) : null} />
      {data.length === 0 ? (
        <EmptyState>{t('evidence.none')}</EmptyState>
      ) : (
        <ul className="space-y-2">
          {data.map((h) => (
            <li key={h.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-3 text-sm ring-1 ring-slate-200">
              <span className="space-x-2">
                <Badge tone={h.urgent ? 'danger' : 'warning'}>{h.urgent ? t('evidence.danger') : t('evidence.suspicion')}</Badge>
                <span>
                  {targetLabels[h.targetType]} <span className="font-mono text-xs">{h.targetId}</span>
                </span>
                <span className="text-slate-600">
                  {t('evidence.period', { from: formatDateTime(h.createdAt), until: formatDateTime(h.heldUntil) })}
                </span>
              </span>
              {h.releasedAt ? (
                <Badge>{t('evidence.released', { date: formatDateTime(h.releasedAt) })}</Badge>
              ) : (
                <Button variant="secondary" busy={release.isPending && release.variables === h.id} onClick={() => release.mutate(h.id)}>
                  {t('evidence.release')}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
