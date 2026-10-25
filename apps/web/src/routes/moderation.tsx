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
import { t, tx, type MessageKey } from '../i18n';

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
        {length < MIN_REASON ? t('mod.charsMissing', { n: MIN_REASON - length }) : t('mod.charsOf', { n: length, max: 1000 })}
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
      {autoFilter && <Alert tone="info">{t('mod.autoFilterHint')}</Alert>}
      <Select
        label={t('dsa.decisionLabel')}
        value={decision}
        onChange={(e) => setDecision(e.target.value as ModerationDecisionType)}
        options={(Object.keys(decisionLabels) as ModerationDecisionType[]).map((d) => ({
          value: d,
          label: autoFilter && d === 'no_action' ? t('mod.noActionRelease') : decisionLabels[d],
        }))}
      />
      {needsRule && (
        <Select
          label={t('dsa.violatedRule')}
          required
          value={ruleRef}
          onChange={(e) => setRuleRef(e.target.value as ModerationRule)}
          placeholder={t('form.pleaseChoose')}
          options={(Object.keys(ruleLabels) as ModerationRule[]).map((r) => ({ value: r, label: ruleLabels[r].label }))}
        />
      )}
      <ReasonField
        label={t('mod.reasonLabel')}
        hint={t('mod.reasonHint')}
        value={reason}
        onChange={setReason}
      />
      <fieldset className="space-y-2 rounded-lg border border-slate-300 p-3">
        <legend className="px-1 text-sm font-semibold">{t('mod.suspicion.legend')}</legend>
        <Select
          label={t('mod.suspicion.label')}
          hint={t('mod.suspicion.hint')}
          value={suspicion}
          onChange={(e) => setSuspicion(e.target.value as CriminalSuspicion)}
          options={(Object.keys(suspicionLabels) as CriminalSuspicion[]).map((v) => ({ value: v, label: suspicionLabels[v] }))}
        />
        {suspicion !== 'none' && (
          <ReasonField
            label={t('mod.suspicion.reasonLabel')}
            hint={t('mod.suspicion.reasonHint')}
            value={suspicionReason}
            onChange={setSuspicionReason}
          />
        )}
      </fieldset>
      <FormError error={decide.isError ? errorMessage(decide.error) : null} />
      <Button type="submit" busy={decide.isPending} disabled={invalid}>
        {t('mod.saveDecision')}
      </Button>
    </form>
  );
}

function CaseCard({ c }: { c: ModerationCase }) {
  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="info">{targetLabels[c.targetType]}</Badge>
        {c.hidden && <Badge tone="warning">{t('mod.hidden')}</Badge>}
        <Badge>{t('mod.reports', { count: c.reports.length })}</Badge>
        <span className="text-sm text-slate-600">{t('profile.blockedSince', { date: formatDateTime(c.createdAt) })}</span>
      </div>
      {c.subject && (
        <p className="text-sm">
          {tx('mod.subject', { name: <strong>{c.subject.displayName}</strong> })}
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
        <ol className="space-y-1 rounded-lg border border-slate-200 p-3 text-sm" aria-label={t('mod.messageContext')}>
          {c.messageContext.map((m) => (
            <li key={m.id} className={cx('rounded p-2', m.id === c.targetId ? 'bg-amber-100 ring-2 ring-amber-500' : 'bg-slate-50')}>
              {m.id === c.targetId && <span className="sr-only">{t('mod.reportedMessage')} </span>}
              <span className="text-xs text-slate-600">
                {m.senderId === c.subject?.id ? c.subject.displayName : t('mod.counterpart')} · {formatDateTime(m.createdAt)}
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
        <Badge tone="info">{t('appeal.docTitle')}</Badge>
        <Badge>{appeal.appellantRole === 'subject' ? t('mod.appeal.bySubject') : t('mod.appeal.byReporter')}</Badge>
        <span className="text-sm text-slate-600">{t('mod.appeal.received', { date: formatDateTime(appeal.createdAt) })}</span>
        {appeal.status !== 'open' && <Badge tone="neutral">{appealStatusLabels[appeal.status]}</Badge>}
      </div>
      {appeal.subject && (
        <p className="text-sm">
          {tx('mod.subject', { name: <strong>{appeal.subject.displayName}</strong> })}
        </p>
      )}
      <section aria-label={t('mod.appeal.original')} className="rounded-lg bg-slate-50 p-3">
        <DecisionDetails decision={appeal.decision} />
      </section>
      <div>
        <h3 className="text-sm font-semibold">{t('mod.appeal.reason')}</h3>
        <p className="mt-1 whitespace-pre-line text-sm">{appeal.reason}</p>
      </div>
      {appeal.status !== 'open' ? (
        appeal.outcomeReason && <p className="text-sm text-slate-700">{t('mod.appeal.outcome', { text: appeal.outcomeReason })}</p>
      ) : !appeal.canDecide ? (
        <Alert tone="warning" title={t('mod.fourEyes.title')}>
          {t('mod.fourEyes.text')}
        </Alert>
      ) : (
        <form onSubmit={submit} className="space-y-3 border-t border-slate-200 pt-3">
          <fieldset className="space-y-1">
            <legend className="text-sm font-semibold">{t('mod.appeal.result')}</legend>
            {(['upheld', 'reversed'] as const).map((o) => (
              <label key={o} className="flex items-center gap-2 text-sm">
                <input type="radio" name={`outcome-${appeal.id}`} value={o} checked={outcome === o} onChange={() => setOutcome(o)} className="h-4 w-4 accent-brand-700" />
                {o === 'upheld' ? t('mod.appeal.uphold') : t('mod.appeal.reverse')}
              </label>
            ))}
          </fieldset>
          <ReasonField label={t('mod.appeal.outcomeReason')} hint={t('mod.appeal.outcomeHint')} value={reason} onChange={setReason} />
          <FormError
            error={
              fourEyes
                ? t('mod.fourEyes.error')
                : decide.isError
                  ? errorMessage(decide.error)
                  : null
            }
          />
          <Button type="submit" busy={decide.isPending} disabled={reason.trim().length < MIN_REASON}>
            {t('mod.appeal.decide')}
          </Button>
        </form>
      )}
    </Card>
  );
}

const sections = {
  open: 'mod.section.open',
  decided: 'mod.section.decided',
  appeals: 'mod.section.appeals',
  appealsDecided: 'mod.section.appealsDecided',
} as const satisfies Record<string, MessageKey>;
type Section = keyof typeof sections;

function CaseList({ status }: { status: 'open' | 'decided' }) {
  const { data, isPending, isError, error } = useModerationCases(status);
  if (isPending) return <Loading />;
  if (isError) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (data.length === 0) return <EmptyState>{status === 'open' ? t('mod.empty.open') : t('mod.empty.decided')}</EmptyState>;
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
  if (data.length === 0) return <EmptyState>{status === 'open' ? t('mod.empty.appealsOpen') : t('mod.empty.appealsDecided')}</EmptyState>;
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
  useDocumentTitle(t('nav.moderation'));
  return (
    <div className="space-y-4">
      <PageHeader title={t('nav.moderation')} />
      <p className="text-sm text-slate-700">
        {tx('mod.intro', {
          min: MIN_REASON,
          link: (chunks) => (
            <Link to="/community-regeln" className="text-brand-700 underline">
              {chunks}
            </Link>
          ),
        })}
      </p>
      <div role="tablist" aria-label={t('mod.tabs')} className="flex flex-wrap gap-2">
        {(Object.keys(sections) as Section[]).map((s) => (
          <button
            key={s}
            role="tab"
            type="button"
            aria-selected={section === s}
            onClick={() => setSection(s)}
            className={cx('rounded-lg px-4 py-2 text-sm font-semibold', section === s ? 'bg-brand-700 text-white' : 'bg-white ring-1 ring-slate-300')}
          >
            {t(sections[s])}
          </button>
        ))}
      </div>
      <div role="tabpanel" aria-label={t(sections[section])}>
        {section === 'open' && <CaseList status="open" />}
        {section === 'decided' && <CaseList status="decided" />}
        {section === 'appeals' && <AppealList status="open" />}
        {section === 'appealsDecided' && <AppealList status="decided" />}
      </div>
    </div>
  );
}
