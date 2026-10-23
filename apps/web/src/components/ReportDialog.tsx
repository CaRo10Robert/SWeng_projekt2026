import { useState, type FormEvent } from 'react';
import type { ReportReason, ReportTargetType } from '@campusmarkt/contracts';
import { useCreateReport } from '../api/trust';
import { errorMessage } from '../api/client';
import { reasonLabels } from '../lib/format';
import { Dialog } from './Dialog';
import { Alert, Button, FormError, Select, TextArea } from './ui';

const reasons = (Object.keys(reasonLabels) as ReportReason[]).filter((r) => r !== 'auto_filter');

export function ReportDialog({
  open,
  onClose,
  targetType,
  targetId,
}: {
  open: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
}) {
  const report = useCreateReport();
  const [reason, setReason] = useState<ReportReason>('prohibited_item');
  const [details, setDetails] = useState('');

  const close = () => {
    report.reset();
    setDetails('');
    onClose();
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    report.mutate({ targetType, targetId, reason, details: details.trim() || undefined });
  };

  const title = { listing: 'Anzeige melden', message: 'Nachricht melden', user: 'Profil melden' }[targetType];

  return (
    <Dialog open={open} onClose={close} title={title}>
      {report.isSuccess ? (
        <div className="space-y-4">
          <Alert tone="success">Danke! Deine Meldung wird vom Moderationsteam geprüft.</Alert>
          <Button onClick={close}>Schließen</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Select
            label="Grund"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value as ReportReason)}
            options={reasons.map((r) => ({ value: r, label: reasonLabels[r] }))}
          />
          <TextArea label="Details (optional)" rows={3} maxLength={1000} value={details} onChange={(e) => setDetails(e.target.value)} />
          <FormError error={report.isError ? errorMessage(report.error) : null} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={close}>
              Abbrechen
            </Button>
            <Button type="submit" busy={report.isPending}>
              Meldung senden
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
