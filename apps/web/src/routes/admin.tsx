import { useState } from 'react';
import type { Role } from '@campusmarkt/contracts';
import { useMe, useMeta } from '../api/auth';
import { useAdminUsers, useAudit, useJobs, useRunDueJobs, useSetRole } from '../api/trust';
import { errorMessage } from '../api/client';
import { Alert, Button, Card, EmptyState, FormError, Loading, PageHeader, cx } from '../components/ui';
import { formatDate, formatDateTime, roleLabels } from '../lib/format';
import { Dac7, EvidenceHolds, Operations } from './admin-ops';
import { t, type MessageKey } from '../i18n';

const roles: Role[] = ['member', 'moderator', 'admin'];

function Users() {
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const { data: me } = useMe();
  const { data, isPending, isError, error } = useAdminUsers(query);
  const setRole = useSetRole();
  return (
    <div className="space-y-3">
      <form
        role="search"
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(q.trim());
        }}
      >
        <label htmlFor="user-q" className="sr-only">
          {t('admin.users.search')}
        </label>
        <input id="user-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('admin.users.placeholder')} className="flex-1 rounded-lg border border-slate-400 px-3 py-2" />
        <Button type="submit">{t('common.search')}</Button>
      </form>
      <FormError error={setRole.isError ? errorMessage(setRole.error) : null} />
      {isPending ? (
        <Loading />
      ) : isError ? (
        <Alert tone="error">{errorMessage(error)}</Alert>
      ) : data.length === 0 ? (
        <EmptyState>{t('admin.users.none')}</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{t('admin.users.caption')}</caption>
            <thead className="border-b border-slate-300">
              <tr>
                <th scope="col" className="p-2">{t('admin.col.name')}</th>
                <th scope="col" className="p-2">{t('admin.col.email')}</th>
                <th scope="col" className="p-2">{t('admin.col.status')}</th>
                <th scope="col" className="p-2">{t('admin.col.since')}</th>
                <th scope="col" className="p-2">{t('admin.col.role')}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr key={u.id} className="border-b border-slate-200">
                  <td className="p-2">{u.displayName}</td>
                  <td className="p-2 break-all">{u.email}</td>
                  <td className="p-2">{u.status}</td>
                  <td className="p-2">{formatDate(u.createdAt)}</td>
                  <td className="p-2">
                    <label className="sr-only" htmlFor={`role-${u.id}`}>
                      {t('admin.users.roleOf', { name: u.displayName })}
                    </label>
                    <select
                      id={`role-${u.id}`}
                      value={u.role}
                      disabled={u.id === me?.id || setRole.isPending}
                      onChange={(e) => setRole.mutate({ id: u.id, role: e.target.value as Role })}
                      className="rounded border border-slate-400 bg-white px-2 py-1"
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {roleLabels[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Audit() {
  const { data, isPending, isError, error } = useAudit();
  if (isPending) return <Loading />;
  if (isError) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data.length) return <EmptyState>{t('admin.audit.empty')}</EmptyState>;
  return (
    <ol className="divide-y divide-slate-200 text-sm">
      {data.map((a) => (
        <li key={a.id} className="py-2">
          <p>
            <time className="text-slate-600">{formatDateTime(a.createdAt)}</time> · <strong>{a.actorName ?? t('admin.audit.system')}</strong> · {a.action}
          </p>
          <p className="text-slate-600">
            {a.targetType}
            {a.targetId && ` ${a.targetId}`}
            {Object.keys(a.details).length > 0 && ` · ${JSON.stringify(a.details)}`}
          </p>
        </li>
      ))}
    </ol>
  );
}

function Jobs() {
  const { data: meta } = useMeta();
  const { data, isPending, isError, error } = useJobs();
  const run = useRunDueJobs();
  return (
    <div className="space-y-3">
      {meta?.demoMode && (
        <div className="space-y-2">
          <Button onClick={() => run.mutate()} busy={run.isPending}>
            {t('admin.jobs.runDue')}
          </Button>
          <p className="text-sm text-slate-600">{t('admin.jobs.runDueHint')}</p>
          <div aria-live="polite">{run.isSuccess && <Alert tone="success">{run.data.message}</Alert>}</div>
          <FormError error={run.isError ? errorMessage(run.error) : null} />
        </div>
      )}
      {isPending ? (
        <Loading />
      ) : isError ? (
        <Alert tone="error">{errorMessage(error)}</Alert>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{t('admin.jobs.caption')}</caption>
              <thead className="border-b border-slate-300">
                <tr>
                  <th scope="col" className="p-2">{t('admin.jobs.queue')}</th>
                  <th scope="col" className="p-2">{t('admin.jobs.queued')}</th>
                  <th scope="col" className="p-2">{t('admin.jobs.active')}</th>
                  <th scope="col" className="p-2">{t('admin.jobs.failed')}</th>
                  <th scope="col" className="p-2">{t('admin.jobs.completed')}</th>
                </tr>
              </thead>
              <tbody>
                {data.queues.map((q) => (
                  <tr key={q.name} className="border-b border-slate-200">
                    <td className="p-2 font-mono">{q.name}</td>
                    <td className="p-2">{q.queued}</td>
                    <td className="p-2">{q.active}</td>
                    <td className={cx('p-2', q.failed > 0 && 'font-bold text-red-700')}>{q.failed}</td>
                    <td className="p-2">{q.completed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 className="font-semibold">{t('admin.jobs.deadLetter')}</h3>
          {data.deadLetters.length === 0 ? (
            <EmptyState>{t('admin.jobs.noDeadLetters')}</EmptyState>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.deadLetters.map((d) => (
                <li key={d.id} className="rounded bg-red-50 p-2">
                  <span className="font-mono">{d.name}</span> · {formatDateTime(d.createdOn)}
                  <pre className="mt-1 overflow-x-auto text-xs">{JSON.stringify(d.data, null, 2)}</pre>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

const tabs = {
  users: 'admin.tab.users',
  audit: 'admin.tab.audit',
  jobs: 'admin.tab.jobs',
  operations: 'admin.tab.operations',
  dac7: 'admin.tab.dac7',
  evidence: 'admin.tab.evidence',
} as const satisfies Record<string, MessageKey>;

export function AdminPage() {
  const [tab, setTab] = useState<keyof typeof tabs>('users');
  return (
    <div className="space-y-4">
      <PageHeader title={t('admin.title')} />
      <div role="tablist" aria-label={t('admin.tabs')} className="flex flex-wrap gap-2">
        {(Object.keys(tabs) as (keyof typeof tabs)[]).map((key) => (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cx('rounded-lg px-4 py-2 text-sm font-semibold', tab === key ? 'bg-brand-700 text-white' : 'bg-white ring-1 ring-slate-300')}
          >
            {t(tabs[key])}
          </button>
        ))}
      </div>
      <Card>
        <div role="tabpanel">
          {tab === 'users' && <Users />}
          {tab === 'audit' && <Audit />}
          {tab === 'jobs' && <Jobs />}
          {tab === 'operations' && <Operations />}
          {tab === 'dac7' && <Dac7 />}
          {tab === 'evidence' && <EvidenceHolds />}
        </div>
      </Card>
    </div>
  );
}
