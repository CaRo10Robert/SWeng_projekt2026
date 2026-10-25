import { useEffect, useState, useSyncExternalStore } from 'react';
import { Link } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import type { Me } from '@campusmarkt/contracts';
import { meQuery, useAcceptTerms, useMe, useMeta } from '../api/auth';
import { errorMessage, isMaintenance, onApiError } from '../api/client';
import { useSystemStatus } from '../api/ops';
import { formatDateTime } from '../lib/format';
import { Dialog } from './Dialog';
import { Button, FormError } from './ui';
import { t } from '../i18n';

// ------------------------------------------------------------------ Globale Fehlerreaktionen

let maintenanceRetryAfter: number | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Wartungsmodus während der Sitzung erkannt (503 `maintenance`), Wert = Retry-After in Sekunden. */
export const useMaintenanceSignal = () => useSyncExternalStore(subscribe, () => maintenanceRetryAfter);

/**
 * Verbindet API-Fehler mit der Oberfläche: `terms_required` öffnet den Zustimmungsdialog,
 * `maintenance` zeigt den Wartungshinweis (REQ-LEGAL-003, REQ-OPS-006).
 */
export function useGlobalApiErrors() {
  const qc = useQueryClient();
  useEffect(
    () =>
      onApiError((err) => {
        if (err.code === 'terms_required') {
          qc.setQueryData<Me | null>(meQuery.queryKey, (me) => (me ? { ...me, termsRequired: true } : me));
          window.dispatchEvent(new Event('campusmarkt:terms-required'));
        }
        if (isMaintenance(err)) {
          maintenanceRetryAfter = err.retryAfter ?? 0;
          emit();
        }
      }),
    [qc],
  );
}

// ------------------------------------------------------------------ Ankündigung (REQ-OPS-006)

export function AnnouncementBanner() {
  const { data } = useSystemStatus();
  // Schließen gilt nur für die aktuelle Seite im Speicher: keine Speicherung auf dem Endgerät (REQ-LEGAL-010)
  const [dismissed, setDismissed] = useState<string | null>(null);
  const a = data?.announcement;
  if (!a) return null;
  const now = Date.now();
  if ((a.startsAt && Date.parse(a.startsAt) > now) || (a.endsAt && Date.parse(a.endsAt) < now)) return null;
  if (dismissed === a.text) return null;
  return (
    <div role="region" aria-label={t('notice.announcement')} className="border-b border-amber-300 bg-amber-50 print:hidden">
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-3 px-4 py-2 text-sm text-amber-950">
        <p>
          <strong>{t('notice.announcementPrefix')} </strong>
          {a.text}
          {a.endsAt && <span> {t('notice.announcementUntil', { date: formatDateTime(a.endsAt) })}</span>}
        </p>
        <button
          type="button"
          onClick={() => setDismissed(a.text)}
          className="shrink-0 rounded px-2 py-0.5 font-medium underline"
          aria-label={t('notice.hideAnnouncement')}
        >
          {t('notice.hide')}
        </button>
      </div>
    </div>
  );
}

export function MaintenanceBanner() {
  const retryAfter = useMaintenanceSignal();
  if (retryAfter === null) return null;
  const minutes = retryAfter > 0 ? Math.ceil(retryAfter / 60) : null;
  return (
    <div role="alert" className="border-b border-red-300 bg-red-50 px-4 py-2 text-center text-sm text-red-900">
      {minutes ? t('notice.maintenanceFor', { minutes }) : t('notice.maintenance')}{' '}
      <Link to="/status" className="font-medium underline">
        {t('notice.toStatus')}
      </Link>
    </div>
  );
}

// ------------------------------------------------------------------ Erneute Zustimmung (REQ-LEGAL-003)

export function TermsDialog() {
  const { data: me } = useMe();
  const { data: meta } = useMeta();
  const accept = useAcceptTerms();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const reopen = () => setOpen(true);
    window.addEventListener('campusmarkt:terms-required', reopen);
    return () => window.removeEventListener('campusmarkt:terms-required', reopen);
  }, []);

  if (!me?.termsRequired || !meta) return null;
  return (
    <Dialog open={open} onClose={() => setOpen(false)} title={t('terms.dialogTitle')}>
      <div className="space-y-3 text-sm">
        <p>
          {me.termsAcceptedVersion
            ? t('terms.changedSince', { version: meta.termsVersion, previous: me.termsAcceptedVersion })
            : t('terms.changed', { version: meta.termsVersion })}
        </p>
        <ul className="list-disc pl-5">
          <li>
            <Link to="/nutzungsbedingungen" target="_blank" rel="noopener" className="text-brand-700 underline">
              {t('terms.readTerms')}
            </Link>
          </li>
          <li>
            <Link to="/datenschutz" target="_blank" rel="noopener" className="text-brand-700 underline">
              {t('terms.readPrivacy')}
            </Link>
          </li>
        </ul>
        <FormError error={accept.isError ? errorMessage(accept.error) : null} />
        <div className="flex flex-wrap gap-2">
          <Button busy={accept.isPending} onClick={() => accept.mutate(meta.termsVersion, { onSuccess: () => setOpen(false) })}>
            {t('terms.accept')}
          </Button>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            {t('terms.later')}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
