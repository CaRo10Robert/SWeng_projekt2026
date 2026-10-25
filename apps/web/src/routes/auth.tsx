import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useRouter, useSearch } from '@tanstack/react-router';
import { ApiError, errorMessage } from '../api/client';
import {
  useLogin,
  useMe,
  useMeta,
  useRegister,
  useResendVerification,
  useResetConfirm,
  useResetRequest,
  useVerify,
} from '../api/auth';
import { Alert, Button, Card, Checkbox, Field, FormError, Loading } from '../components/ui';
import { currentLocale, t, tx, type MessageKey } from '../i18n';

const MAILPIT_URL = 'http://localhost:8025';
const DEMO_PASSWORD = 'CampusMarkt-Demo-2026';
const demoAccounts = [
  { email: 'lea@studmail.hwg-lu.de', role: 'auth.demo.roleStudent' },
  { email: 'ben@studmail.hwg-lu.de', role: 'auth.demo.roleStudent' },
  { email: 'mod@hwg-lu.de', role: 'auth.demo.roleModerator' },
  { email: 'admin@hwg-lu.de', role: 'auth.demo.roleAdmin' },
] as const satisfies readonly { email: string; role: MessageKey }[];

function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-bold">{title}</h1>
      <Card className="space-y-4">{children}</Card>
    </div>
  );
}

function MailpitHint() {
  const { data: meta } = useMeta();
  if (!meta?.demoMode) return null;
  return (
    <Alert tone="info" title={t('auth.demo.mode')}>
      {t('auth.demo.allMails')}{' '}
      <a href={MAILPIT_URL} target="_blank" rel="noreferrer" className="font-semibold underline">
        {MAILPIT_URL}
      </a>
    </Alert>
  );
}

function isSafeRedirect(path: string | undefined): path is string {
  return !!path && path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/login');
}

export function LoginPage() {
  const { redirect } = useSearch({ from: '/login' });
  const router = useRouter();
  const navigate = useNavigate();
  const { data: meta } = useMeta();
  const { data: me } = useMe();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (me && !login.isSuccess) void navigate({ to: '/' });
  }, [me, login.isSuccess, navigate]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate(
      { email, password },
      {
        onSuccess: (result) => {
          if (result.deletionCancelled) void navigate({ to: '/profile' });
          else if (isSafeRedirect(redirect)) router.history.push(redirect);
          else void navigate({ to: '/' });
        },
      },
    );
  };

  const loginError = login.isError
    ? login.error instanceof ApiError && login.error.code === 'invalid_credentials'
      ? t('apiError.invalid_credentials')
      : errorMessage(login.error)
    : null;

  return (
    <AuthShell title={t('auth.login.title')}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label={t('auth.email')} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label={t('auth.password')} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <FormError error={loginError} />
        <Button type="submit" className="w-full" busy={login.isPending}>
          {t('auth.login.submit')}
        </Button>
      </form>
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <Link to="/register" className="text-brand-700 underline">
          {t('auth.login.createAccount')}
        </Link>
        <Link to="/forgot-password" className="text-brand-700 underline">
          {t('auth.login.forgot')}
        </Link>
      </div>
      {meta?.demoMode && (
        <section aria-labelledby="demo-heading" className="space-y-2 rounded-lg bg-slate-100 p-3 text-sm">
          <h2 id="demo-heading" className="font-semibold">
            {t('auth.demo.accounts')}
          </h2>
          <p>
            {t('auth.demo.passwordForAll')} <code className="rounded bg-white px-1">{DEMO_PASSWORD}</code>
          </p>
          <ul className="space-y-1">
            {demoAccounts.map((a) => (
              <li key={a.email}>
                <button
                  type="button"
                  className="text-left text-brand-700 underline"
                  onClick={() => {
                    setEmail(a.email);
                    setPassword(DEMO_PASSWORD);
                  }}
                >
                  {a.email}
                </button>{' '}
                – {t(a.role)}
              </li>
            ))}
          </ul>
          <p>
            {t('auth.demo.mailsInMailpit')}{' '}
            <a href={MAILPIT_URL} target="_blank" rel="noreferrer" className="font-semibold underline">
              {MAILPIT_URL}
            </a>
          </p>
        </section>
      )}
    </AuthShell>
  );
}

export function RegisterPage() {
  const { data: meta } = useMeta();
  const register = useRegister();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [accept, setAccept] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  const domains = meta?.allowedDomains ?? [];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setClientError(null);
    const domain = email.trim().toLowerCase().split('@')[1] ?? '';
    if (domains.length && !domains.includes(domain)) {
      setClientError(t('auth.register.useDomain', { domains: domains.map((d) => '@' + d).join(t('common.or')) }));
      return;
    }
    if (password.length < 12) {
      setClientError(t('auth.passwordTooShort'));
      return;
    }
    if (!accept || !meta) {
      setClientError(t('auth.register.acceptRequired'));
      return;
    }
    register.mutate({ email: email.trim(), password, displayName: displayName.trim(), acceptTerms: true, termsVersion: meta.termsVersion, locale: currentLocale() });
  };

  if (register.isSuccess) {
    return (
      <AuthShell title={t('auth.register.almostDone')}>
        <Alert tone="success" title={t('auth.register.confirmTitle')}>
          {t('auth.register.confirmText')}
        </Alert>
        <MailpitHint />
        <Link to="/login" search={{}} className="text-brand-700 underline">
          {t('auth.toLogin')}
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t('auth.register.title')}>
      <p className="text-sm text-slate-700">
        {t('auth.register.intro')}{' '}
        {domains.map((d, i) => (
          <span key={d}>
            {i > 0 && t('common.or')}
            <strong>@{d}</strong>
          </span>
        ))}
        .
      </p>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label={t('auth.email')} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field
          label={t('auth.displayName')}
          hint={t('auth.displayNameHint')}
          required
          minLength={2}
          maxLength={40}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <Field
          label={t('auth.password')}
          type="password"
          autoComplete="new-password"
          hint={t('auth.passwordHint')}
          required
          minLength={12}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Checkbox
          checked={accept}
          onChange={(e) => setAccept(e.target.checked)}
          label={
            // Neuer Tab, damit bereits eingegebene Daten erhalten bleiben (REQ-LEGAL-002/003)
            tx('auth.register.acceptLabel', {
              version: meta?.termsVersion ?? '…',
              terms: (chunks) => (
                <Link to="/nutzungsbedingungen" target="_blank" rel="noopener" className="text-brand-700 underline">
                  {chunks}
                  <span className="sr-only"> {t('common.opensNewTab')}</span>
                </Link>
              ),
              privacy: (chunks) => (
                <Link to="/datenschutz" target="_blank" rel="noopener" className="text-brand-700 underline">
                  {chunks}
                  <span className="sr-only"> {t('common.opensNewTab')}</span>
                </Link>
              ),
            })
          }
        />
        <FormError error={clientError ?? (register.isError ? errorMessage(register.error) : null)} />
        <Button type="submit" className="w-full" busy={register.isPending}>
          {t('auth.register.submit')}
        </Button>
      </form>
      <Link to="/login" search={{}} className="text-sm text-brand-700 underline">
        {t('auth.register.haveAccount')}
      </Link>
    </AuthShell>
  );
}

function ResendForm() {
  const resend = useResendVerification();
  const [email, setEmail] = useState('');
  if (resend.isSuccess) return <Alert tone="success">{t('auth.verify.resent')}</Alert>;
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        resend.mutate(email.trim());
      }}
    >
      <Field label={t('auth.email')} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <FormError error={resend.isError ? errorMessage(resend.error) : null} />
      <Button type="submit" variant="secondary" busy={resend.isPending}>
        {t('auth.verify.resend')}
      </Button>
    </form>
  );
}

export function VerifyPage() {
  const { token } = useSearch({ from: '/verify' });
  const verify = useVerify();
  const navigate = useNavigate();
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    verify.mutate(token, {
      onSuccess: () => void navigate({ to: '/' }),
      onError: (err) => {
        if (err instanceof ApiError && err.code === 'token_used') void navigate({ to: '/login', search: {} });
      },
    });
  }, [token, verify, navigate]);

  if (!token) {
    return (
      <AuthShell title={t('auth.verify.title')}>
        <Alert tone="error">{t('auth.linkIncomplete')}</Alert>
        <ResendForm />
      </AuthShell>
    );
  }

  if (verify.isError) {
    const code = verify.error instanceof ApiError ? verify.error.code : undefined;
    return (
      <AuthShell title={t('auth.verify.title')}>
        <Alert tone="error" title={code === 'token_expired' ? t('auth.verify.expiredTitle') : t('auth.verify.invalidTitle')}>
          {code === 'token_expired' ? t('auth.verify.expiredText') : t('auth.verify.invalidText')}
        </Alert>
        <ResendForm />
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t('auth.verify.title')}>
      <Loading />
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const reset = useResetRequest();
  const [email, setEmail] = useState('');
  return (
    <AuthShell title={t('auth.forgot.title')}>
      {reset.isSuccess ? (
        <>
          <Alert tone="success">{t('auth.forgot.sent')}</Alert>
          <MailpitHint />
        </>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            reset.mutate(email.trim());
          }}
        >
          <Field label={t('auth.email')} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <FormError error={reset.isError ? errorMessage(reset.error) : null} />
          <Button type="submit" className="w-full" busy={reset.isPending}>
            {t('auth.forgot.submit')}
          </Button>
        </form>
      )}
      <Link to="/login" search={{}} className="text-sm text-brand-700 underline">
        {t('auth.toLogin')}
      </Link>
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const { token } = useSearch({ from: '/reset-password' });
  const confirm = useResetConfirm();
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [clientError, setClientError] = useState<string | null>(null);

  if (confirm.isSuccess) {
    return (
      <AuthShell title={t('auth.reset.doneTitle')}>
        <Alert tone="success">{t('auth.reset.doneText')}</Alert>
        <Link to="/login" search={{}} className="text-brand-700 underline">
          {t('auth.toLogin')}
        </Link>
      </AuthShell>
    );
  }

  const serverError = confirm.isError
    ? confirm.error instanceof ApiError && confirm.error.code === 'token_invalid'
      ? t('auth.reset.invalidLink')
      : errorMessage(confirm.error)
    : null;

  return (
    <AuthShell title={t('auth.reset.title')}>
      {!token ? (
        <Alert tone="error">{t('auth.linkIncomplete')}</Alert>
      ) : (
        <form
          className="space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            setClientError(null);
            if (password.length < 12) return setClientError(t('auth.passwordTooShort'));
            if (password !== repeat) return setClientError(t('auth.reset.mismatch'));
            confirm.mutate({ token, password });
          }}
        >
          <Field label={t('auth.reset.newPassword')} type="password" autoComplete="new-password" hint={t('auth.reset.minHint')} required value={password} onChange={(e) => setPassword(e.target.value)} />
          <Field label={t('auth.reset.repeat')} type="password" autoComplete="new-password" required value={repeat} onChange={(e) => setRepeat(e.target.value)} />
          <FormError error={clientError ?? serverError} />
          <Button type="submit" className="w-full" busy={confirm.isPending}>
            {t('auth.reset.submit')}
          </Button>
        </form>
      )}
      <Link to="/forgot-password" className="text-sm text-brand-700 underline">
        {t('auth.reset.newLink')}
      </Link>
    </AuthShell>
  );
}
