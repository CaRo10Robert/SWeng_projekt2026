import { useState, type FormEvent } from 'react';
import { Link } from '@tanstack/react-router';
import type { ModerationCase, ModerationDecisionType } from '@campusmarkt/contracts';
import { useDecide, useModerationCases } from '../api/trust';
import { errorMessage } from '../api/client';
import { PriceTag, StatusBadge } from '../components/ListingCard';
import { Alert, Badge, Button, Card, EmptyState, FormError, Loading, PageHeader, Select, TextArea, cx } from '../components/ui';
import { formatDateTime, reasonLabels } from '../lib/format';

const decisionLabels: Record<ModerationDecisionType, string> = {
  no_action: 'Keine Maßnahme',
  remove: 'Inhalt entfernen',
  warn: 'Verwarnen',
  ban: 'Konto sperren',
};
const targetLabels = { listing: 'Anzeige', message: 'Nachricht', user: 'Profil' };

function DecisionForm({ c }: { c: ModerationCase }) {
  const decide = useDecide();
  const [decision, setDecision] = useState<ModerationDecisionType>('no_action');
  const [reason, setReason] = useState('');
  const autoFilter = c.reports.some((r) => r.reason === 'auto_filter');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    decide.mutate({ id: c.id, body: { decision, reason: reason.trim() } });
  };

  return (
    <form onSubmit={submit} className="space-y-3 border-t border-slate-200 pt-3">
      {autoFilter && <Alert tone="info">Vom Wortfilter angehalten: „Keine Maßnahme“ gibt die Anzeige frei, „Inhalt entfernen“ lehnt sie ab.</Alert>}
      <Select
        label="Entscheidung"
        value={decision}
        onChange={(e) => setDecision(e.target.value as ModerationDecisionType)}
        options={(Object.keys(decisionLabels) as ModerationDecisionType[]).map((d) => ({
          value: d,
          label: autoFilter && d === 'no_action' ? 'Keine Maßnahme (freigeben)' : decisionLabels[d],
        }))}
      />
      <TextArea
        label="Begründung"
        hint="Wird an die Betroffenen gesendet und unveränderlich protokolliert (DSA Art. 17)."
        required
        minLength={5}
        maxLength={1000}
        rows={3}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <FormError error={decide.isError ? errorMessage(decide.error) : null} />
      <Button type="submit" busy={decide.isPending} disabled={reason.trim().length < 5}>
        Entscheidung speichern
      </Button>
    </form>
  );
}

function CaseCard({ c }: { c: ModerationCase }) {
  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="info">{targetLabels[c.targetType]}</Badge>
        {c.hidden && <Badge tone="warning">Vorläufig ausgeblendet</Badge>}
        <Badge>{c.reports.length} Meldung(en)</Badge>
        <span className="text-sm text-slate-600">seit {formatDateTime(c.createdAt)}</span>
      </div>
      {c.subject && (
        <p className="text-sm">
          Betroffen: <strong>{c.subject.displayName}</strong>
        </p>
      )}

      <ul className="space-y-1 text-sm">
        {c.reports.map((r) => (
          <li key={r.id} className="rounded bg-slate-50 p-2">
            <strong>{reasonLabels[r.reason]}</strong> · {formatDateTime(r.createdAt)}
            {r.details && <p className="mt-1 whitespace-pre-line text-slate-700">{r.details}</p>}
          </li>
        ))}
      </ul>

      {c.listing && (
        <div className="space-y-1 rounded-lg border border-slate-200 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/listings/$id" params={{ id: c.listing.id }} className="font-semibold text-brand-700 underline">
              {c.listing.title}
            </Link>
            <StatusBadge status={c.listing.status} />
            <PriceTag listing={c.listing} />
          </div>
          <p className="whitespace-pre-line text-sm text-slate-700">{c.listing.description}</p>
        </div>
      )}

      {c.messageContext && (
        <ol className="space-y-1 rounded-lg border border-slate-200 p-3 text-sm" aria-label="Nachrichtenkontext">
          {c.messageContext.map((m) => (
            <li key={m.id} className={cx('rounded p-2', m.id === c.targetId ? 'bg-amber-100 ring-2 ring-amber-500' : 'bg-slate-50')}>
              {m.id === c.targetId && <span className="sr-only">Gemeldete Nachricht: </span>}
              <span className="text-xs text-slate-600">
                {m.senderId === c.subject?.id ? c.subject.displayName : 'Gegenüber'} · {formatDateTime(m.createdAt)}
              </span>
              <p className="whitespace-pre-wrap">{m.body}</p>
            </li>
          ))}
        </ol>
      )}

      {c.status === 'open' && <DecisionForm c={c} />}
    </Card>
  );
}

export function ModerationPage() {
  const [status, setStatus] = useState<'open' | 'decided'>('open');
  const { data, isPending, isError, error } = useModerationCases(status);
  return (
    <div className="space-y-4">
      <PageHeader title="Moderation" />
      <div role="tablist" aria-label="Fälle filtern" className="flex gap-2">
        {(['open', 'decided'] as const).map((s) => (
          <button
            key={s}
            role="tab"
            type="button"
            aria-selected={status === s}
            onClick={() => setStatus(s)}
            className={cx('rounded-lg px-4 py-2 text-sm font-semibold', status === s ? 'bg-brand-700 text-white' : 'bg-white ring-1 ring-slate-300')}
          >
            {s === 'open' ? 'Offen' : 'Entschieden'}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {isPending ? (
          <Loading />
        ) : isError ? (
          <Alert tone="error">{errorMessage(error)}</Alert>
        ) : data.length === 0 ? (
          <EmptyState>{status === 'open' ? 'Keine offenen Fälle. 🎉' : 'Noch keine Entscheidungen.'}</EmptyState>
        ) : (
          <div className="space-y-4">
            {data.map((c) => (
              <CaseCard key={c.id} c={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
