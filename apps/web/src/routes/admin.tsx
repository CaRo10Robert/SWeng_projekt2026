import { useState } from 'react';
import type { Role } from '@campusmarkt/contracts';
import { useMe, useMeta } from '../api/auth';
import { useAdminUsers, useAudit, useJobs, useRunDueJobs, useSetRole } from '../api/trust';
import { errorMessage } from '../api/client';
import { Alert, Button, Card, EmptyState, FormError, Loading, PageHeader, cx } from '../components/ui';
import { formatDate, formatDateTime, roleLabels } from '../lib/format';

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
          Nutzer suchen
        </label>
        <input id="user-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name oder E-Mail" className="flex-1 rounded-lg border border-slate-400 px-3 py-2" />
        <Button type="submit">Suchen</Button>
      </form>
      <FormError error={setRole.isError ? errorMessage(setRole.error) : null} />
      {isPending ? (
        <Loading />
      ) : isError ? (
        <Alert tone="error">{errorMessage(error)}</Alert>
      ) : data.length === 0 ? (
        <EmptyState>Keine Nutzer gefunden.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Nutzerliste</caption>
            <thead className="border-b border-slate-300">
              <tr>
                <th scope="col" className="p-2">Name</th>
                <th scope="col" className="p-2">E-Mail</th>
                <th scope="col" className="p-2">Status</th>
                <th scope="col" className="p-2">Seit</th>
                <th scope="col" className="p-2">Rolle</th>
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
                      Rolle von {u.displayName}
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
  if (!data.length) return <EmptyState>Noch keine Einträge.</EmptyState>;
  return (
    <ol className="divide-y divide-slate-200 text-sm">
      {data.map((a) => (
        <li key={a.id} className="py-2">
          <p>
            <time className="text-slate-600">{formatDateTime(a.createdAt)}</time> · <strong>{a.actorName ?? 'System'}</strong> · {a.action}
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
            Fällige Jobs jetzt ausführen
          </Button>
          <p className="text-sm text-slate-600">Demo-Modus: löst Ablauf von Anzeigen, Erinnerungen, Re-Verifikation und Löschfristen sofort aus.</p>
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
              <caption className="sr-only">Job-Queues</caption>
              <thead className="border-b border-slate-300">
                <tr>
                  <th scope="col" className="p-2">Queue</th>
                  <th scope="col" className="p-2">Wartend</th>
                  <th scope="col" className="p-2">Aktiv</th>
                  <th scope="col" className="p-2">Fehlgeschlagen</th>
                  <th scope="col" className="p-2">Erledigt</th>
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
          <h3 className="font-semibold">Dead-Letter-Queue</h3>
          {data.deadLetters.length === 0 ? (
            <EmptyState>Keine endgültig fehlgeschlagenen Jobs.</EmptyState>
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

const tabs = { users: 'Nutzer & Rollen', audit: 'Audit-Log', jobs: 'Jobs' } as const;

export function AdminPage() {
  const [tab, setTab] = useState<keyof typeof tabs>('users');
  return (
    <div className="space-y-4">
      <PageHeader title="Administration" />
      <div role="tablist" aria-label="Bereiche" className="flex flex-wrap gap-2">
        {(Object.keys(tabs) as (keyof typeof tabs)[]).map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cx('rounded-lg px-4 py-2 text-sm font-semibold', tab === t ? 'bg-brand-700 text-white' : 'bg-white ring-1 ring-slate-300')}
          >
            {tabs[t]}
          </button>
        ))}
      </div>
      <Card>
        <div role="tabpanel">
          {tab === 'users' && <Users />}
          {tab === 'audit' && <Audit />}
          {tab === 'jobs' && <Jobs />}
        </div>
      </Card>
    </div>
  );
}
