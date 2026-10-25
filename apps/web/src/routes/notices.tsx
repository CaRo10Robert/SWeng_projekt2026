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
import { t, tx } from '../i18n';

/** Begründung nach DSA Art. 17 Abs. 3: Maßnahme, Tatsachen, automatisierte Erkennung, Regel, Rechtsbehelf. */
export function DecisionDetails({ decision }: { decision: DecisionStatement }) {
  const rule = decision.ruleRef ? ruleLabels[decision.ruleRef] : null;
  return (
    <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[12rem_1fr]">
      <dt className="font-semibold">{t('dsa.affected')}</dt>
      <dd>
        {targetLabels[decision.targetType]}
        {decision.targetTitle ? ` ${t('common.quoted', { text: decision.targetTitle })}` : ''}
      </dd>
      <dt className="font-semibold">{t('dsa.decisionLabel')}</dt>
      <dd>
        {t('dsa.decidedOn', { decision: decisionLabels[decision.decision], date: formatDateTime(decision.decidedAt) })}{' '}
        {decisionConsequences[decision.decision]}
      </dd>
      <dt className="font-semibold">{t('dsa.reason')}</dt>
      <dd className="whitespace-pre-line">{decision.facts}</dd>
      {rule && (
        <>
          <dt className="font-semibold">{t('dsa.violatedRule')}</dt>
          <dd>
            <Link to={rule.href.split('#')[0] as '/'} hash={rule.href.split('#')[1]} className="text-brand-700 underline">
              {rule.label}
            </Link>
          </dd>
        </>
      )}
      <dt className="font-semibold">{t('dsa.detection')}</dt>
      <dd>
        {decision.automatedDetection ? t('dsa.detection.automated') : t('dsa.detection.report')}
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
      <p className="text-sm">{t('appeal.intro')}</p>
      <TextArea
        label={t('appeal.reasonLabel')}
        hint={t('appeal.reasonHint', { min: MIN_APPEAL, max: 2000 })}
        required
        minLength={MIN_APPEAL}
        maxLength={2000}
        rows={5}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <FormError error={appeal.isError ? errorMessage(appeal.error) : null} />
      <Button type="submit" busy={appeal.isPending} disabled={tooShort}>
        {t('appeal.submit')}
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
      ? t('notices.title.appealResult')
      : notice.recipientRole === 'reporter'
        ? t('notices.title.reportResult')
        : t('notices.title.decision');
  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {!notice.readAt && <Badge tone="info">{t('notices.new')}</Badge>}
        <span className="text-sm text-slate-600">{formatDateTime(notice.createdAt)}</span>
      </div>
      <DecisionDetails decision={notice.decision} />
      {appeal.status && (
        <Alert tone={appeal.status === 'reversed' ? 'success' : appeal.status === 'open' ? 'info' : 'warning'} title={t('notices.appealStatus', { status: appealStatusLabels[appeal.status] })}>
          {appeal.outcomeReason}
        </Alert>
      )}
      {sent && <Alert tone="success">{t('appeal.received')}</Alert>}
      {appeal.possible && !sent && (
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => setOpen(true)}>
            {t('appeal.submit')}
          </Button>
          {appeal.deadline && <span className="text-sm text-slate-600">{t('appeal.possibleUntil', { date: formatDate(appeal.deadline) })}</span>}
        </div>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} title={t('appeal.submit')}>
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
  useDocumentTitle(t('nav.notices'));
  const unread = data?.some((n) => !n.readAt) ?? false;

  // Beim Öffnen als gelesen markieren; die Kennzeichnung „neu“ bleibt bis zum nächsten Abruf sichtbar
  useEffect(() => {
    if (unread && !markRead.isPending && !markRead.isSuccess) markRead.mutate();
  }, [unread, markRead]);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title={t('nav.notices')} />
      <p className="text-sm text-slate-700">
        {tx('notices.intro', {
          link: (chunks) => (
            <Link to="/nutzungsbedingungen" hash="8-melden-moderation-und-widerspruch" className="text-brand-700 underline">
              {chunks}
            </Link>
          ),
        })}
      </p>
      {isPending ? (
        <Loading />
      ) : isError ? (
        <Alert tone="error">{errorMessage(error)}</Alert>
      ) : data.length === 0 ? (
        <EmptyState>{t('notices.empty')}</EmptyState>
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
  useDocumentTitle(t('appeal.docTitle'));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (token) submit.mutate({ token, reason: reason.trim() });
  };

  const tokenProblem = (err: unknown) => {
    if (err instanceof ApiError && (err.code === 'token_used' || err.code === 'token_expired')) {
      return err.code === 'token_used'
        ? t('appeal.token.used')
        : t('appeal.token.expired');
    }
    return errorMessage(err, t('appeal.token.invalid'));
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title={t('appeal.token.title')} />
      {!token ? (
        <Alert tone="error">{t('appeal.token.incomplete')}</Alert>
      ) : info.isPending ? (
        <Loading />
      ) : info.isError ? (
        <Alert tone="error">{tokenProblem(info.error)}</Alert>
      ) : submit.isSuccess ? (
        <Alert tone="success" title={t('appeal.received')}>
          {t('appeal.token.receivedText')}
        </Alert>
      ) : (
        <Card className="space-y-4">
          <DecisionDetails decision={info.data.decision} />
          <p className="text-sm text-slate-600">{t('appeal.token.deadline', { date: formatDate(info.data.deadline) })}</p>
          <form onSubmit={onSubmit} className="space-y-3">
            <TextArea
              label={t('appeal.reasonLabel')}
              hint={t('appeal.reasonHint', { min: MIN_APPEAL, max: 2000 })}
              required
              minLength={MIN_APPEAL}
              maxLength={2000}
              rows={5}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <FormError error={submit.isError ? tokenProblem(submit.error) : null} />
            <Button type="submit" busy={submit.isPending} disabled={reason.trim().length < MIN_APPEAL}>
              {t('appeal.submit')}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
