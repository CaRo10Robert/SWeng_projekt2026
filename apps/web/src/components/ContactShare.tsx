import { useEffect, useId, useRef, useState } from 'react';
import type { ConversationSummary } from '@campusmarkt/contracts';
import { useContactAction } from '../api/messaging';
import { ApiError, errorMessage } from '../api/client';
import { Dialog } from './Dialog';
import { Button, FormError } from './ui';
import { formatDateTime } from '../lib/format';

const errorText = (err: unknown) => {
  if (err instanceof ApiError) {
    if (err.code === 'contact_not_possible') return 'Kontakt nicht möglich.';
    if (err.code === 'contact_request_limit') return 'Eine erneute Anfrage ist derzeit nicht möglich.';
    if (err.code === 'invalid_contact_action') return 'Diese Aktion ist gerade nicht möglich. Der aktuelle Stand wird geladen.';
  }
  return errorMessage(err);
};

/** Kontaktdaten erst nach beidseitiger Zustimmung (REQ-CHAT-010, UC-25, Fallstudie FS-C1). */
export function ContactShare({ conversation }: { conversation: ConversationSummary }) {
  const action = useContactAction(conversation.id);
  const [confirm, setConfirm] = useState(false);
  const headingId = useId();
  const statusRef = useRef<HTMLParagraphElement>(null);
  const { contact, counterpart, blocked } = conversation;
  const name = counterpart.displayName;
  const open = contact.mine !== 'granted' && contact.theirs === 'granted';

  const status = (() => {
    if (contact.counterpartEmail) return `Kontaktdaten ausgetauscht. Die Hochschul-E-Mail-Adresse von ${name} wird angezeigt.`;
    if (contact.mine === 'granted') return `Du hast zugestimmt. Warte auf Zustimmung von ${name}.`;
    // Gegenüber blockiert, gesperrt oder gelöscht (keine Sperrfrist, Anfragen übrig)
    if (!contact.canGrant && !contact.retryAfter && contact.requestsLeft > 0) return 'Kontakt nicht möglich.';
    if (contact.theirs === 'granted') return `${name} möchte Kontaktdaten austauschen.`;
    if (contact.mine === 'declined') return `${name} möchte keine Kontaktdaten austauschen.`;
    return 'Kontaktdaten werden erst sichtbar, wenn ihr beide zustimmt.';
  })();

  // Statusänderungen ansagen, nicht aber den Anfangszustand
  const [announcement, setAnnouncement] = useState('');
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setAnnouncement(status);
  }, [status]);

  // Alte Fehlermeldung verwerfen, sobald sich der Zustand (z. B. per WebSocket) ändert
  const { reset } = action;
  useEffect(() => reset(), [contact.mine, contact.theirs, reset]);

  if (blocked) return null;

  // Die auslösende Schaltfläche verschwindet nach der Aktion; Fokus auf die Statuszeile statt auf body (WCAG 2.4.3)
  const run = (a: 'grant' | 'withdraw' | 'decline') =>
    action.mutate({ action: a }, { onSettled: () => requestAnimationFrame(() => statusRef.current?.focus()) });

  return (
    <section aria-labelledby={headingId} className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
      <h2 id={headingId} className="text-sm font-bold">
        Kontaktdaten
      </h2>
      <p ref={statusRef} tabIndex={-1} className="text-sm text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">
        {status}
      </p>
      {contact.counterpartEmail && (
        <p className="text-sm">
          <a href={`mailto:${contact.counterpartEmail}`} className="font-medium text-brand-700 underline">
            {contact.counterpartEmail}
          </a>
        </p>
      )}
      {(contact.mine === 'declined' || contact.mine === 'withdrawn') && !contact.canGrant && (contact.retryAfter || contact.requestsLeft === 0) && (
        <p className="text-xs text-slate-600">
          {contact.retryAfter
            ? `Eine erneute Anfrage ist ab ${formatDateTime(contact.retryAfter)} möglich.`
            : 'Weitere Anfragen sind in dieser Unterhaltung nicht möglich.'}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {open && contact.canGrant && (
          <Button busy={action.isPending} onClick={() => setConfirm(true)}>
            Zustimmen
          </Button>
        )}
        {open && (
          <Button variant="secondary" busy={action.isPending} onClick={() => run('decline')}>
            Ablehnen
          </Button>
        )}
        {contact.mine !== 'granted' && contact.theirs !== 'granted' && contact.canGrant && (
          <Button variant="secondary" busy={action.isPending} onClick={() => setConfirm(true)}>
            Kontaktdaten teilen
          </Button>
        )}
        {contact.mine === 'granted' && (
          <Button variant="ghost" busy={action.isPending} onClick={() => run('withdraw')}>
            {contact.counterpartEmail ? 'Zustimmung widerrufen' : 'Zustimmung zurückziehen'}
          </Button>
        )}
      </div>
      {contact.mine !== 'granted' && contact.theirs !== 'granted' && contact.canGrant && contact.requestsLeft < 3 && (
        <p className="text-xs text-slate-600">Noch {contact.requestsLeft} Anfrage(n) in dieser Unterhaltung möglich.</p>
      )}
      <FormError error={action.isError ? errorText(action.error) : null} />
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <Dialog open={confirm} onClose={() => setConfirm(false)} title="Kontaktdaten teilen?">
        <p className="text-sm text-slate-700">
          Deine Hochschul-E-Mail-Adresse wird erst sichtbar, wenn ihr beide zustimmt. Einmal angezeigte Adressen lassen sich nicht
          zurückholen.
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirm(false)}>
            Abbrechen
          </Button>
          <Button
            busy={action.isPending}
            onClick={() => {
              setConfirm(false);
              run('grant');
            }}
          >
            {contact.theirs === 'granted' ? 'Zustimmen' : 'Teilen'}
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
