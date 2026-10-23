import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
const variants: Record<Variant, string> = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800 disabled:bg-slate-400',
  secondary: 'bg-white text-slate-900 border border-slate-400 hover:bg-slate-100 disabled:text-slate-500',
  danger: 'bg-red-700 text-white hover:bg-red-800 disabled:bg-slate-400',
  ghost: 'text-brand-700 hover:bg-brand-50 disabled:text-slate-500',
};

export const buttonClass = (variant: Variant = 'primary', extra?: string) =>
  cx(
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed',
    variants[variant],
    extra,
  );

export function Button({
  variant = 'primary',
  busy,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; busy?: boolean }) {
  return (
    <button type={type} className={buttonClass(variant, className)} disabled={disabled || busy} aria-busy={busy || undefined} {...rest}>
      {busy && <Spinner small />}
      {children}
    </button>
  );
}

export function Spinner({ small, label = 'Wird geladen …' }: { small?: boolean; label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className={cx('inline-block animate-spin rounded-full border-2 border-current border-t-transparent', small ? 'h-4 w-4' : 'h-6 w-6')}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function Loading() {
  return (
    <div className="flex justify-center py-12 text-brand-700">
      <Spinner />
    </div>
  );
}

const inputClass =
  'block w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-500 aria-[invalid=true]:border-red-700';

interface FieldWrapProps {
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}

function FieldWrap({ label, hint, error, required, children }: FieldWrapProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-800">
        {label}
        {required && <span aria-hidden="true" className="text-red-700"> *</span>}
      </label>
      {children({ id, describedBy, invalid: !!error })}
      {hint && (
        <p id={hintId} className="text-sm text-slate-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} className="text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

type Common = { label: string; hint?: ReactNode; error?: string };

export function Field({ label, hint, error, required, className, ...rest }: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldWrap label={label} hint={hint} error={error} required={required}>
      {({ id, describedBy, invalid }) => (
        <input id={id} aria-describedby={describedBy} aria-invalid={invalid} required={required} className={cx(inputClass, className)} {...rest} />
      )}
    </FieldWrap>
  );
}

export function TextArea({ label, hint, error, required, className, ...rest }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldWrap label={label} hint={hint} error={error} required={required}>
      {({ id, describedBy, invalid }) => (
        <textarea id={id} aria-describedby={describedBy} aria-invalid={invalid} required={required} className={cx(inputClass, className)} {...rest} />
      )}
    </FieldWrap>
  );
}

export function Select({
  label,
  hint,
  error,
  required,
  className,
  options,
  placeholder,
  ...rest
}: Common & SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[]; placeholder?: string }) {
  return (
    <FieldWrap label={label} hint={hint} error={error} required={required}>
      {({ id, describedBy, invalid }) => (
        <select id={id} aria-describedby={describedBy} aria-invalid={invalid} required={required} className={cx(inputClass, className)} {...rest}>
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </FieldWrap>
  );
}

export function Checkbox({ label, className, ...rest }: { label: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className={cx('flex items-start gap-2', className)}>
      <input id={id} type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-brand-700" {...rest} />
      <label htmlFor={id} className="text-sm text-slate-800">
        {label}
      </label>
    </div>
  );
}

const badgeTones = {
  neutral: 'bg-slate-200 text-slate-800',
  info: 'bg-brand-100 text-brand-800',
  success: 'bg-green-100 text-green-900',
  warning: 'bg-amber-100 text-amber-900',
  danger: 'bg-red-100 text-red-900',
};
export type Tone = keyof typeof badgeTones;

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', badgeTones[tone])}>{children}</span>;
}

const alertTones = {
  info: 'border-brand-600 bg-brand-50 text-brand-800',
  success: 'border-green-700 bg-green-50 text-green-900',
  warning: 'border-amber-600 bg-amber-50 text-amber-900',
  error: 'border-red-700 bg-red-50 text-red-900',
};

/** Statusmeldung; Fehler werden assertiv angesagt, alles andere höflich. */
export function Alert({ tone = 'info', title, children }: { tone?: keyof typeof alertTones; title?: string; children?: ReactNode }) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cx('rounded-lg border-l-4 p-3 text-sm', alertTones[tone])}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? 'mt-1' : undefined}>{children}</div>}
    </div>
  );
}

export function FormError({ error }: { error?: string | null }) {
  return <div aria-live="assertive">{error ? <Alert tone="error">{error}</Alert> : null}</div>;
}

export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {actions}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('rounded-xl border border-slate-200 bg-white p-4 shadow-sm', className)}>{children}</div>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">{children}</p>;
}

export { cx };
