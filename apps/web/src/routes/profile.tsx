import { useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { Me } from '@campusmarkt/contracts';
import { useDeleteAccount, useMe, useMeta, useUpdateMe } from '../api/auth';
import { useBlocks, useSetBlock } from '../api/trust';
import { API_BASE, errorMessage } from '../api/client';
import { Dialog } from '../components/Dialog';
import { Alert, Button, Card, Checkbox, EmptyState, Field, FormError, Loading, PageHeader } from '../components/ui';
import { formatDate, roleLabels, userTypeLabels } from '../lib/format';

function ProfileForm({ me }: { me: Me }) {
  const { data: meta } = useMeta();
  const update = useUpdateMe();
  const [displayName, setDisplayName] = useState(me.displayName);
  const [studyProgram, setStudyProgram] = useState(me.studyProgram ?? '');
  const [locations, setLocations] = useState(me.preferredLocationIds);
  const [prefs, setPrefs] = useState(me.notificationPrefs);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    update.mutate({
      displayName: displayName.trim(),
      studyProgram: studyProgram.trim() || null,
      preferredLocationIds: locations,
      notificationPrefs: prefs,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Anzeigename" required minLength={2} maxLength={40} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      <Field label="Studiengang (optional)" maxLength={80} value={studyProgram} onChange={(e) => setStudyProgram(e.target.value)} />
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-800">Bevorzugte Übergabeorte</legend>
        {meta?.locations.map((l) => (
          <Checkbox
            key={l.id}
            label={l.name}
            checked={locations.includes(l.id)}
            onChange={() => setLocations((prev) => (prev.includes(l.id) ? prev.filter((x) => x !== l.id) : [...prev, l.id]))}
          />
        ))}
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-800">E-Mail-Benachrichtigungen</legend>
        <Checkbox label="Neue Chat-Nachrichten (gebündelt, ohne Inhalt)" checked={prefs.newMessage} onChange={(e) => setPrefs({ ...prefs, newMessage: e.target.checked })} />
        <Checkbox label="Erinnerung vor Ablauf meiner Anzeigen" checked={prefs.listingExpiry} onChange={(e) => setPrefs({ ...prefs, listingExpiry: e.target.checked })} />
        <p className="text-sm text-slate-600">Sicherheitsrelevante E-Mails (z. B. Passwort-Reset) werden immer gesendet.</p>
      </fieldset>
      <div aria-live="polite">{update.isSuccess && <Alert tone="success">Gespeichert.</Alert>}</div>
      <FormError error={update.isError ? errorMessage(update.error) : null} />
      <Button type="submit" busy={update.isPending}>
        Speichern
      </Button>
    </form>
  );
}

function BlockedUsers() {
  const { data, isPending } = useBlocks();
  const setBlock = useSetBlock();
  if (isPending) return <Loading />;
  if (!data?.length) return <EmptyState>Du hast niemanden blockiert.</EmptyState>;
  return (
    <ul className="divide-y divide-slate-200">
      {data.map((b) => (
        <li key={b.userId} className="flex items-center justify-between gap-2 py-2">
          <span>
            {b.displayName} <span className="text-sm text-slate-600">seit {formatDate(b.blockedAt)}</span>
          </span>
          <Button variant="secondary" busy={setBlock.isPending && setBlock.variables?.userId === b.userId} onClick={() => setBlock.mutate({ userId: b.userId, blocked: false })}>
            Entsperren
          </Button>
        </li>
      ))}
    </ul>
  );
}

function DeleteAccount() {
  const del = useDeleteAccount();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  return (
    <>
      <p className="text-sm text-slate-700">
        Nach dem Löschantrag wirst du abgemeldet. Dein Konto wird 14 Tage lang aufbewahrt; meldest du dich in dieser Zeit wieder an, wird die Löschung abgebrochen. Danach werden deine Daten endgültig gelöscht.
      </p>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Konto löschen
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Konto wirklich löschen?">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            del.mutate({ password }, { onSuccess: () => void navigate({ to: '/login', search: {} }) });
          }}
        >
          <p>Bitte bestätige mit deinem Passwort. Deine Anzeigen werden sofort ausgeblendet.</p>
          <Field label="Passwort" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <FormError error={del.isError ? errorMessage(del.error) : null} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" variant="danger" busy={del.isPending} disabled={!password}>
              Endgültig beantragen
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

export function ProfilePage() {
  const { data: me } = useMe();
  if (!me) return <Loading />;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Profil" />
      {me.deletionCancelled && <Alert tone="success">Willkommen zurück! Die geplante Löschung deines Kontos wurde abgebrochen.</Alert>}
      <Card className="space-y-1">
        <p className="font-semibold">{me.email}</p>
        <p className="text-sm text-slate-600">
          {userTypeLabels[me.userType]} · {roleLabels[me.role]} · Mitglied seit {formatDate(me.createdAt)}
        </p>
        <p className="text-sm text-slate-600">Deine E-Mail-Adresse ist für andere Mitglieder nie sichtbar.</p>
      </Card>
      <Card>
        <h2 className="mb-3 text-lg font-semibold">Profildaten</h2>
        <ProfileForm me={me} />
      </Card>
      <Card>
        <h2 className="mb-3 text-lg font-semibold">Blockierte Mitglieder</h2>
        <BlockedUsers />
      </Card>
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">Meine Daten</h2>
        <p className="text-sm text-slate-700">Lade alle Daten herunter, die wir über dich speichern (JSON, Art. 15 und 20 DSGVO).</p>
        <a href={`${API_BASE}/me/export`} download className="inline-flex min-h-11 items-center rounded-lg border border-slate-400 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100">
          Daten exportieren
        </a>
      </Card>
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">Konto löschen</h2>
        <DeleteAccount />
      </Card>
    </div>
  );
}
