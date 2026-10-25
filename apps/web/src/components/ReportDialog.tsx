import { useState, type FormEvent } from 'react';
import type { ReportReason, ReportTargetType } from '@campusmarkt/contracts';
import { useCreateReport } from '../api/trust';
import { errorMessage } from '../api/client';
import { reasonLabels } from '../lib/format';
import { Dialog } from './Dialog';
import { Alert, Button, FormError, Select, TextArea } from './ui';
import { t } from '../i18n';

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

  const title = { listing: t('report.titleListing'), message: t('report.titleMessage'), user: t('report.titleUser') }[targetType];

  return (
    <Dialog open={open} onClose={close} title={title}>
      {report.isSuccess ? (
        <div className="space-y-4">
          <Alert tone="success">{t('report.thanks')}</Alert>
          <Button onClick={close}>{t('common.close')}</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Select
            label={t('report.reason')}
            required
            value={reason}
            onChange={(e) => setReason(e.target.value as ReportReason)}
            options={reasons.map((r) => ({ value: r, label: reasonLabels[r] }))}
          />
          <TextArea label={t('report.details')} rows={3} maxLength={1000} value={details} onChange={(e) => setDetails(e.target.value)} />
          <FormError error={report.isError ? errorMessage(report.error) : null} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={close}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" busy={report.isPending}>
              {t('report.submit')}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
