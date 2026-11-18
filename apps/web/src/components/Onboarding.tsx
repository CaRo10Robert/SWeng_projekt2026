import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Onboarding, OnboardingActionBody } from '@campusmarkt/contracts';
import { api } from '../api/client';
import { useMe } from '../api/auth';
import { Alert, Button } from './ui';
import { t } from '../i18n';

/** Zustand der ersten Schritte (REQ-UX-011); liegt im Konto, nicht im Browser-Speicher (REQ-LEGAL-010). */
export const useOnboarding = (enabled = true) =>
  useQuery({ queryKey: ['onboarding'], enabled, queryFn: () => api<Onboarding>('/me/onboarding') });

export function useOnboardingAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (action: OnboardingActionBody['action']) => api<Onboarding>('/me/onboarding', { method: 'POST', body: { action } }),
    onSuccess: (state) => qc.setQueryData(['onboarding'], state),
  });
}

/** Bereich „Erste Schritte“ oben auf der Startseite für Mitglieder (REQ-UX-011). */
export function OnboardingPanel() {
  const { data } = useOnboarding();
  const action = useOnboardingAction();
  const [allDone, setAllDone] = useState(false);
  const wasOpen = useRef(false);

  // Übergang „noch offen“ → „alles erledigt“ in dieser Sitzung: kurzer Hinweis statt stillem Verschwinden
  useEffect(() => {
    if (!data) return;
    const done = data.steps.profile && data.steps.firstListing && data.steps.safetyTips;
    if (data.visible) wasOpen.current = true;
    else if (wasOpen.current && done) setAllDone(true);
  }, [data]);

  if (allDone) {
    return (
      <Alert tone="success" title={t('onboarding.allDone')}>
        <Button variant="ghost" onClick={() => setAllDone(false)}>
          {t('common.close')}
        </Button>
      </Alert>
    );
  }
  if (!data?.visible) return null;

  const steps = [
    { key: 'profile', done: data.steps.profile, to: '/profile', label: t('onboarding.step.profile'), hint: t('onboarding.step.profileHint') },
    { key: 'listing', done: data.steps.firstListing, to: '/listings/new', label: t('onboarding.step.listing'), hint: t('onboarding.step.listingHint') },
    { key: 'tips', done: data.steps.safetyTips, to: '/hilfe', hash: 'sicher-handeln', label: t('onboarding.step.tips'), hint: t('onboarding.step.tipsHint') },
  ] as const;

  return (
    <section aria-labelledby="onboarding-title" className="space-y-3 rounded-xl border border-brand-100 bg-brand-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="onboarding-title" className="text-lg font-semibold text-brand-800">
            {t('onboarding.title')}
          </h2>
          <p className="text-sm text-slate-700">{t('onboarding.intro')}</p>
        </div>
        <Button variant="ghost" busy={action.isPending} onClick={() => action.mutate('dismiss')}>
          {t('onboarding.dismiss')}
        </Button>
      </div>
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={s.key} className="flex flex-wrap items-baseline gap-2 rounded-lg bg-white p-3 ring-1 ring-slate-200">
            <span aria-hidden="true" className="font-bold text-brand-700">
              {s.done ? '✓' : `${i + 1}.`}
            </span>
            <Link to={s.to} {...('hash' in s ? { hash: s.hash } : {})} className="font-medium text-brand-700 underline">
              {s.label}
            </Link>
            <span className={s.done ? 'text-sm font-semibold text-green-800' : 'text-sm text-slate-600'}>
              {s.done ? t('onboarding.done') : s.hint}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** In der Hilfe: Sicherheitstipps gelten als gelesen; „Erste Schritte anzeigen“ blendet den Bereich wieder ein. */
export function OnboardingHelpHook() {
  const { data: me } = useMe();
  const action = useOnboardingAction();
  const sent = useRef(false);
  useEffect(() => {
    if (me && !sent.current) {
      sent.current = true;
      action.mutate('tips_seen');
    }
  }, [me, action]);
  if (!me) return null;
  return (
    <p className="mb-4">
      <Button variant="secondary" busy={action.isPending && action.variables === 'show'} onClick={() => action.mutate('show')}>
        {t('onboarding.showAgain')}
      </Button>
      {action.isSuccess && action.variables === 'show' && <span className="ml-2 text-sm text-green-800">{t('onboarding.shownAgain')}</span>}
    </p>
  );
}
