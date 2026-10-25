import { useState, type FormEvent } from 'react';
import { Link } from '@tanstack/react-router';
import type { Appeal, CriminalSuspicion, ModerationCase, ModerationDecisionType, ModerationRule } from '@campusmarkt/contracts';
import { useAppeals, useDecide, useDecideAppeal, useModerationCases } from '../api/trust';
import { ApiError, errorMessage } from '../api/client';
import { PriceTag, StatusBadge } from '../components/ListingCard';
import { Alert, Badge, Button, Card, EmptyState, FormError, Loading, PageHeader, Select, TextArea, cx } from '../components/ui';
import { DecisionDetails } from './notices';
import { appealStatusLabels, decisionLabels, MIN_REASON, ruleLabels, suspicionLabels, targetLabels } from '../lib/dsa';
import { formatDateTime, reasonLabels } from '../lib/format';
import { useDocumentTitle } from '../lib/title';

function ReasonField({ value, onChange, label, hint }: { value: string; onChange: (v: string) => void; label: string; hint: string }) {
  const length = value.trim().length;
  return (
    <div>
      <TextArea
        label={label}
        hint={hint}
        required
        minLength={MIN_REASON}
        maxLength={1000}
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className={cx('mt-1 text-xs', length < MIN_REASON ? 'text-slate-600' : 'text-green-800')} aria-live="polite">
        {length < MIN_REASON ? `Noch ${MIN_REASON - length} Zeichen bis zum Minimum` : `${length} von 1.000 Zeichen`}
      </p>
    </div>
  );
}

/** Entscheidung mit Begründung nach DSA Art. 17 und Kennzeichnung nach Art. 18 (REQ-LEGAL-006/008). */
function DecisionForm({ c }: { c: ModerationCase }) {
  const decide = useDecide();
  const [decision, setDecision] = useState<ModerationDecisionType>('no_action');
  const [ruleRef, setRuleRef] = useState<ModerationRule | ''>('');
  const [reason, setReason] = useState('');
  const [suspicion, setSuspicion] = useState<CriminalSuspicion>('none');
  const [suspicionReason, setSuspicionReason] = useState('');
  const autoFilter = c.reports.some((r) => r.reason === 'auto_filter');
  const needsRule = decision !== 'no_action';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    decide.mutate({
      id: c.id,
      body: {
        decision,
        reason: reason.trim(),
        ...(needsRule && ruleRef ? { ruleRef } : {}),
        ...(suspicion !== 'none' ? { criminalSuspicion: suspicion, criminalSuspicionReason: suspicionReason.trim() } : {}),
      },
    });
  };

  const invalid =
    reason.trim().length < MIN_REASON || (needsRule && !ruleRef) || (suspicion !== 'none' && suspicionReason.trim().length < MIN_REASON);

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
      {needsRule && (
        <Select
          label="Verletzte Regel"
          required
          value={ruleRef}
          onChange={(e) => setRuleRef(e.target.value as ModerationRule)}
          placeholder="Bitte wählen"
          options={(Object.keys(ruleLabels) as ModerationRule[]).map((r) => ({ value: r, label: ruleLabels[r].label }))}
        />
      )}
      <ReasonField
        label="Begründung (Tatsachen und Umstände)"
        hint="Geht an Betroffene und Meldende und wird unveränderlich protokolliert (DSA Art. 17). Keine Namen von Meldenden."
        value={reason}
        onChange={setReason}
      />
      <fieldset className="space-y-2 rounded-lg border border-slate-300 p-3">
        <legend className="px-1 text-sm font-semibold">Verdacht auf eine Straftat (DSA Art. 18)</legend>
        <Select
          label="Kennzeichnung"
          hint="Nur intern: erscheint nie in Mitteilungen an Betroffene. Löst die Beweissicherung und eine Nachricht an die Administration aus."
          value={suspicion}
          onChange={(e) => setSuspicion(e.target.value as CriminalSuspicion)}
          options={(Object.keys(suspicionLabels) as CriminalSuspicion[]).map((v) => ({ value: v, label: suspicionLabels[v] }))}
        />
        {suspicion !== 'none' && (
          <ReasonField
            label="Begründung des Verdachts"
            hint="Welche Tatsachen begründen den Verdacht? Pflicht bei jeder Kennzeichnung."
            value={suspicionReason}
            onChange={setSuspicionReason}
          />
        )}
      </fieldset>
      <FormError error={decide.isError ? errorMessage(decide.error) : null} />
      <Button type="submit" busy={decide.isPending} disabled={invalid}>
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

/** Widerspruch prüfen nach dem Vier-Augen-Prinzip (UC-36, REQ-LEGAL-007). */
function AppealCard({ appeal }: { appeal: Appeal }) {
  const decide = useDecideAppeal();
  const [outcome, setOutcome] = useState<'upheld' | 'reversed'>('upheld');
  const [reason, setReason] = useState('');
  const fourEyes = decide.error instanceof ApiError && decide.error.code === 'four_eyes';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    decide.mutate({ id: appeal.id, body: { outcome, reason: reason.trim() } });
  };

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="info">Widerspruch</Badge>
        <Badge>{appeal.appellantRole === 'subject' ? 'von Betroffenen' : 'von Meldenden'}</Badge>
        <span className="text-sm text-slate-600">eingegangen {formatDateTime(appeal.createdAt)}</span>
        {appeal.status !== 'open' && <Badge tone="neutral">{appealStatusLabels[appeal.status]}</Badge>}
      </div>
      {appeal.subject && (
        <p className="text-sm">
          Betroffen: <strong>{appeal.subject.displayName}</strong>
        </p>
      )}
      <section aria-label="Ursprüngliche Entscheidung" className="rounded-lg bg-slate-50 p-3">
        <DecisionDetails decision={appeal.decision} />
      </section>
      <div>
        <h3 className="text-sm font-semibold">Begründung des Widerspruchs</h3>
        <p className="mt-1 whitespace-pre-line text-sm">{appeal.reason}</p>
      </div>
      {appeal.status !== 'open' ? (
        appeal.outcomeReason && <p className="text-sm text-slate-700">Ergebnis: {appeal.outcomeReason}</p>
      ) : !appeal.canDecide ? (
        <Alert tone="warning" title="Vier-Augen-Prinzip">
          Du hast die ursprüngliche Entscheidung getroffen. Ein anderes Mitglied des Moderationsteams muss den Widerspruch prüfen.
        </Alert>
      ) : (
        <form onSubmit={submit} className="space-y-3 border-t border-slate-200 pt-3">
          <fieldset className="space-y-1">
            <legend className="text-sm font-semibold">Ergebnis</legend>
            {(['upheld', 'reversed'] as const).map((o) => (
              <label key={o} className="flex items-center gap-2 text-sm">
                <input type="radio" name={`outcome-${appeal.id}`} value={o} checked={outcome === o} onChange={() => setOutcome(o)} className="h-4 w-4 accent-brand-700" />
                {o === 'upheld' ? 'Zurückweisen – Entscheidung bleibt bestehen' : 'Stattgeben – Maßnahme wird zurückgenommen'}
              </label>
            ))}
          </fieldset>
          <ReasonField label="Begründung des Ergebnisses" hint="Geht an die Person, die widersprochen hat, und wird protokolliert." value={reason} onChange={setReason} />
          <FormError
            error={
              fourEyes
                ? 'Diesen Widerspruch darf nur ein anderes Mitglied des Moderationsteams entscheiden.'
                : decide.isError
                  ? errorMessage(decide.error)
                  : null
            }
          />
          <Button type="submit" busy={decide.isPending} disabled={reason.trim().length < MIN_REASON}>
            Widerspruch entscheiden
          </Button>
        </form>
      )}
    </Card>
  );
}

const sections = { open: 'Offene Fälle', decided: 'Entschiedene Fälle', appeals: 'Widersprüche', appealsDecided: 'Entschiedene Widersprüche' } as const;
type Section = keyof typeof sections;

function CaseList({ status }: { status: 'open' | 'decided' }) {
  const { data, isPending, isError, error } = useModerationCases(status);
  if (isPending) return <Loading />;
  if (isError) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (data.length === 0) return <EmptyState>{status === 'open' ? 'Keine offenen Fälle. 🎉' : 'Noch keine Entscheidungen.'}</EmptyState>;
  return (
    <div className="space-y-4">
      {data.map((c) => (
        <CaseCard key={c.id} c={c} />
      ))}
    </div>
  );
}

function AppealList({ status }: { status: 'open' | 'decided' }) {
  const { data, isPending, isError, error } = useAppeals(status);
  if (isPending) return <Loading />;
  if (isError) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (data.length === 0) return <EmptyState>{status === 'open' ? 'Keine offenen Widersprüche.' : 'Noch keine entschiedenen Widersprüche.'}</EmptyState>;
  return (
    <div className="space-y-4">
      {data.map((a) => (
        <AppealCard key={a.id} appeal={a} />
      ))}
    </div>
  );
}

export function ModerationPage() {
  const [section, setSection] = useState<Section>('open');
  useDocumentTitle('Moderation');
  return (
    <div className="space-y-4">
      <PageHeader title="Moderation" />
      <p className="text-sm text-slate-700">
        Entscheidungen brauchen eine Regel und eine Begründung (mindestens {MIN_REASON} Zeichen); Betroffene und Meldende werden
        benachrichtigt und können widersprechen. Vorlagen und Ablauf:{' '}
        <Link to="/community-regeln" className="text-brand-700 underline">
          Community-Regeln
        </Link>
        .
      </p>
      <div role="tablist" aria-label="Bereiche der Moderation" className="flex flex-wrap gap-2">
        {(Object.keys(sections) as Section[]).map((s) => (
          <button
            key={s}
            role="tab"
            type="button"
            aria-selected={section === s}
            onClick={() => setSection(s)}
            className={cx('rounded-lg px-4 py-2 text-sm font-semibold', section === s ? 'bg-brand-700 text-white' : 'bg-white ring-1 ring-slate-300')}
          >
            {sections[s]}
          </button>
        ))}
      </div>
      <div role="tabpanel" aria-label={sections[section]}>
        {section === 'open' && <CaseList status="open" />}
        {section === 'decided' && <CaseList status="decided" />}
        {section === 'appeals' && <AppealList status="open" />}
        {section === 'appealsDecided' && <AppealList status="decided" />}
      </div>
    </div>
  );
}
