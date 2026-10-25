import { useEffect, useState, type FormEvent } from 'react';
import { Link } from '@tanstack/react-router';
import type { DecisionStatement, ModerationNotice } from '@campusmarkt/contracts';
import { useAppeal, useMarkNoticesRead, useNotices, useTokenAppeal, useTokenAppealInfo } from '../api/trust';
import { ApiError, errorMessage } from '../api/client';
import { Dialog } from '../components/Dialog';
import { Alert, Badge, Button, Card, EmptyState, FormError, Loading, PageHeader, TextArea } from '../components/ui';
import { appealStatusLabels, decisionConsequences, decisionLabels, MIN_APPEAL, ruleLabels, targetLabels } from '../lib/dsa';
import { formatDate, formatDateTime } from '../lib/format';
import { useDocumentTitle } from '../lib/title';

/** Begründung nach DSA Art. 17 Abs. 3: Maßnahme, Tatsachen, automatisierte Erkennung, Regel, Rechtsbehelf. */
export function DecisionDetails({ decision }: { decision: DecisionStatement }) {
  const rule = decision.ruleRef ? ruleLabels[decision.ruleRef] : null;
  return (
    <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[12rem_1fr]">
      <dt className="font-semibold">Betroffen</dt>
      <dd>
        {targetLabels[decision.targetType]}
        {decision.targetTitle ? ` „${decision.targetTitle}“` : ''}
      </dd>
      <dt className="font-semibold">Entscheidung</dt>
      <dd>
        {decisionLabels[decision.decision]} am {formatDateTime(decision.decidedAt)}. {decisionConsequences[decision.decision]}
      </dd>
      <dt className="font-semibold">Begründung</dt>
      <dd className="whitespace-pre-line">{decision.facts}</dd>
      {rule && (
        <>
          <dt className="font-semibold">Verletzte Regel</dt>
          <dd>
            <Link to={rule.href.split('#')[0] as '/'} hash={rule.href.split('#')[1]} className="text-brand-700 underline">
              {rule.label}
            </Link>
          </dd>
        </>
      )}
      <dt className="font-semibold">Erkennung</dt>
      <dd>
        {decision.automatedDetection
          ? 'Automatisch durch die Inhaltsprüfung erkannt, von einem Menschen entschieden.'
          : 'Auf Meldung hin von einem Menschen geprüft und entschieden.'}
      </dd>
    </dl>
  );
}

function AppealForm({ notice, onDone }: { notice: ModerationNotice; onDone: () => void }) {
  const appeal = useAppeal();
  const [reason, setReason] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    appeal.mutate({ decisionId: notice.decision.id, reason: reason.trim() }, { onSuccess: onDone });
  };
  const tooShort = reason.trim().length < MIN_APPEAL;
  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm">
        Ein anderes Mitglied des Moderationsteams prüft deinen Widerspruch. Du erhältst das Ergebnis als Mitteilung und per
        E-Mail.
      </p>
      <TextArea
        label="Warum ist die Entscheidung aus deiner Sicht falsch?"
        hint={`Mindestens ${MIN_APPEAL} Zeichen, höchstens 2.000.`}
        required
        minLength={MIN_APPEAL}
        maxLength={2000}
        rows={5}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <FormError error={appeal.isError ? errorMessage(appeal.error) : null} />
      <Button type="submit" busy={appeal.isPending} disabled={tooShort}>
        Widerspruch einlegen
      </Button>
    </form>
  );
}

function NoticeCard({ notice }: { notice: ModerationNotice }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const { appeal } = notice;
  const title =
    notice.kind === 'appeal_result'
      ? 'Ergebnis deines Widerspruchs'
      : notice.recipientRole === 'reporter'
        ? 'Ergebnis deiner Meldung'
        : 'Entscheidung der Moderation';
  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {!notice.readAt && <Badge tone="info">neu</Badge>}
        <span className="text-sm text-slate-600">{formatDateTime(notice.createdAt)}</span>
      </div>
      <DecisionDetails decision={notice.decision} />
      {appeal.status && (
        <Alert tone={appeal.status === 'reversed' ? 'success' : appeal.status === 'open' ? 'info' : 'warning'} title={`Widerspruch: ${appealStatusLabels[appeal.status]}`}>
          {appeal.outcomeReason}
        </Alert>
      )}
      {sent && <Alert tone="success">Dein Widerspruch ist eingegangen.</Alert>}
      {appeal.possible && !sent && (
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => setOpen(true)}>
            Widerspruch einlegen
          </Button>
          {appeal.deadline && <span className="text-sm text-slate-600">möglich bis {formatDate(appeal.deadline)}</span>}
        </div>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} title="Widerspruch einlegen">
        <AppealForm
          notice={notice}
          onDone={() => {
            setOpen(false);
            setSent(true);
          }}
        />
      </Dialog>
    </Card>
  );
}

/** Mitteilungen der Moderation mit Begründung und Widerspruch (REQ-LEGAL-006/007, UC-35). */
export function NoticesPage() {
  const { data, isPending, isError, error } = useNotices();
  const markRead = useMarkNoticesRead();
  useDocumentTitle('Mitteilungen');
  const unread = data?.some((n) => !n.readAt) ?? false;

  // Beim Öffnen als gelesen markieren; die Kennzeichnung „neu“ bleibt bis zum nächsten Abruf sichtbar
  useEffect(() => {
    if (unread && !markRead.isPending && !markRead.isSuccess) markRead.mutate();
  }, [unread, markRead]);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="Mitteilungen" />
      <p className="text-sm text-slate-700">
        Hier findest du Entscheidungen der Moderation zu deinen Inhalten und Meldungen mit Begründung. Gegen eine
        Entscheidung kannst du innerhalb von sechs Monaten Widerspruch einlegen (
        <Link to="/nutzungsbedingungen" hash="8-melden-moderation-und-widerspruch" className="text-brand-700 underline">
          Nutzungsbedingungen 8
        </Link>
        ).
      </p>
      {isPending ? (
        <Loading />
      ) : isError ? (
        <Alert tone="error">{errorMessage(error)}</Alert>
      ) : data.length === 0 ? (
        <EmptyState>Keine Mitteilungen.</EmptyState>
      ) : (
        <div className="space-y-4">
          {data.map((n) => (
            <NoticeCard key={n.id} notice={n} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Widerspruch über den Einmal-Link aus der E-Mail, ohne Anmeldung (gesperrte Konten, REQ-LEGAL-007). */
export function TokenAppealPage({ token }: { token?: string }) {
  const info = useTokenAppealInfo(token);
  const submit = useTokenAppeal();
  const [reason, setReason] = useState('');
  useDocumentTitle('Widerspruch');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (token) submit.mutate({ token, reason: reason.trim() });
  };

  const tokenProblem = (err: unknown) => {
    if (err instanceof ApiError && (err.code === 'token_used' || err.code === 'token_expired')) {
      return err.code === 'token_used'
        ? 'Dieser Link wurde bereits verwendet. Ein Widerspruch ist eingegangen.'
        : 'Dieser Link ist abgelaufen. Die Widerspruchsfrist von sechs Monaten ist vorbei.';
    }
    return errorMessage(err, 'Der Link ist ungültig.');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="Widerspruch gegen eine Entscheidung" />
      {!token ? (
        <Alert tone="error">Der Link ist unvollständig. Bitte öffne ihn direkt aus der E-Mail.</Alert>
      ) : info.isPending ? (
        <Loading />
      ) : info.isError ? (
        <Alert tone="error">{tokenProblem(info.error)}</Alert>
      ) : submit.isSuccess ? (
        <Alert tone="success" title="Dein Widerspruch ist eingegangen.">
          Ein anderes Mitglied des Moderationsteams prüft ihn. Das Ergebnis erhältst du per E-Mail.
        </Alert>
      ) : (
        <Card className="space-y-4">
          <DecisionDetails decision={info.data.decision} />
          <p className="text-sm text-slate-600">Widerspruch möglich bis {formatDate(info.data.deadline)}. Der Link gilt nur einmal.</p>
          <form onSubmit={onSubmit} className="space-y-3">
            <TextArea
              label="Warum ist die Entscheidung aus deiner Sicht falsch?"
              hint={`Mindestens ${MIN_APPEAL} Zeichen, höchstens 2.000.`}
              required
              minLength={MIN_APPEAL}
              maxLength={2000}
              rows={5}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <FormError error={submit.isError ? tokenProblem(submit.error) : null} />
            <Button type="submit" busy={submit.isPending} disabled={reason.trim().length < MIN_APPEAL}>
              Widerspruch einlegen
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
