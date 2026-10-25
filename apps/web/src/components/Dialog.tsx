import { useEffect, useId, useRef, type ReactNode } from 'react';
import { t } from '../i18n';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/** Modaler Dialog auf Basis von <dialog>: Fokusfalle, Escape und Backdrop kommen vom Browser. */
export function Dialog({ open, onClose, title, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-xl p-0 shadow-xl"
    >
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-bold">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-600 hover:bg-slate-100" aria-label={t('dialog.close')}>
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        {open && children}
      </div>
    </dialog>
  );
}
