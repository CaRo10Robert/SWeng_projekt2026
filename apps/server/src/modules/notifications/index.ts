import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import type { Locale } from '@campusmarkt/contracts';
import type { Tx } from '../../platform/db.js';
import type { MailPort } from '../../platform/ports/index.js';
import type { Module, ModuleDeps } from '../shared.js';
import { unsubscribeToken, verifyUnsubscribeToken } from './domain.js';
import { renderEmail, templateCategory, UNSUBSCRIBABLE, type EmailTemplate } from './templates.js';

export type { EmailTemplate } from './templates.js';

export type Recipient = { userId: string } | { address: string; locale?: Locale };

interface SendEmailJob {
  recipient: Recipient;
  template: EmailTemplate;
  params: Record<string, string>;
}

export interface NotificationsApi {
  /** Reiht eine E-Mail transaktional ein (Outbox, ADR-0005). Ohne `tx` sofort. */
  email(tx: Tx | undefined, recipient: Recipient, template: EmailTemplate, params: Record<string, string>): Promise<void>;
}

const SEND_EMAIL = 'send-email';

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Kleine HTML-Seite für die Abmeldung, ohne Skripte und externe Ressourcen; in der Sprache des Kontos (ADR-0016). */
const page = (lang: Locale, title: string, body: string) => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow">
<title>${escapeHtml(title)} – CampusMarkt HWG LU</title>
<style>body{font-family:system-ui,sans-serif;color:#1f2937;max-width:40rem;margin:4rem auto;padding:0 1rem;line-height:1.5}
h1{color:#0b4884}button{background:#0b4884;color:#fff;border:0;border-radius:6px;padding:10px 16px;font-size:1rem}
button:focus-visible,a:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}a{color:#0b4884}</style></head>
<body><main><h1>${escapeHtml(title)}</h1>${body}</main>
<p><a href="/">${lang === 'en' ? 'Home' : 'Zur Startseite'}</a> · <a href="/impressum">Impressum</a> · <a href="/datenschutz">${lang === 'en' ? 'Privacy' : 'Datenschutz'}</a></p></body></html>`;

const UNSUBSCRIBE_TEXTS = {
  de: {
    category: { newMessage: 'Benachrichtigungen über neue Nachrichten', listingExpiry: 'Erinnerungen an ablaufende Anzeigen' },
    invalidTitle: 'Link ungültig / Invalid link',
    invalid: '<p>Dieser Abmeldelink ist ungültig.</p><p lang="en">This unsubscribe link is invalid.</p>',
    confirmTitle: 'Benachrichtigungen abbestellen',
    confirm: (label: string) => `Möchtest du die ${label} abbestellen? Du kannst sie jederzeit im Profil wieder einschalten.`,
    button: 'Abbestellen',
    doneTitle: 'Abbestellt',
    done: (label: string) => `Die ${label} sind abbestellt.`,
  },
  en: {
    category: { newMessage: 'notifications about new messages', listingExpiry: 'reminders about expiring listings' },
    invalidTitle: 'Link ungültig / Invalid link',
    invalid: '<p>Dieser Abmeldelink ist ungültig.</p><p lang="en">This unsubscribe link is invalid.</p>',
    confirmTitle: 'Unsubscribe from notifications',
    confirm: (label: string) => `Do you want to unsubscribe from ${label}? You can switch them back on in your profile at any time.`,
    button: 'Unsubscribe',
    doneTitle: 'Unsubscribed',
    done: (label: string) => `You have unsubscribed from ${label}.`,
  },
} as const;

/** Modul notifications: Templates, Präferenzen, Versand über den MailPort. */
export function createNotificationsModule(deps: ModuleDeps, mail: MailPort): Module<NotificationsApi> {
  const { config } = deps;
  const api: NotificationsApi = {
    async email(tx, recipient, template, params) {
      const job: SendEmailJob = { recipient, template, params };
      if (tx) await tx.enqueue(SEND_EMAIL, job);
      else await deps.jobs.enqueue(SEND_EMAIL, job);
    },
  };

  async function handle(job: SendEmailJob) {
    let address: string;
    let locale: Locale = 'de';
    let params = job.params;
    let unsubscribeUrl: string | undefined;
    const category = templateCategory[job.template];
    if ('userId' in job.recipient) {
      const contact = await deps.modules.identity.getContact(job.recipient.userId);
      if (!contact) return;
      // Gesperrte Konten erhalten nur Pflichtmitteilungen, z. B. die Begründung der Sperre (DSA Art. 17)
      if (contact.status === 'suspended' && category !== 'service') return;
      if (category === 'newMessage' && !contact.notificationPrefs.newMessage) return;
      if (category === 'listingExpiry' && !contact.notificationPrefs.listingExpiry) return;
      address = contact.email;
      locale = contact.locale;
      params = { name: contact.displayName, ...params };
      if (category === 'newMessage' || category === 'listingExpiry') {
        const token = unsubscribeToken(config.unsubscribeSecret, job.recipient.userId, category);
        unsubscribeUrl = `${config.publicUrl}/api/v1/notifications/unsubscribe?token=${encodeURIComponent(token)}`;
      }
    } else {
      address = job.recipient.address;
      locale = job.recipient.locale ?? 'de';
    }
    const rendered = renderEmail(job.template, params, { publicUrl: config.publicUrl, locale, unsubscribeUrl });
    // RFC 2369/8058: One-Click-Abmeldung nur für abbestellbare Benachrichtigungen (REQ-OPS-010)
    const headers =
      unsubscribeUrl && UNSUBSCRIBABLE.has(category)
        ? { 'List-Unsubscribe': `<${unsubscribeUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }
        : undefined;
    await mail.send({ to: address, ...rendered, headers });
    deps.logger.info({ template: job.template }, 'E-Mail versendet');
  }

  const routes: FastifyPluginAsyncTypebox = async (app) => {
    const tags = ['notifications'];
    const query = Type.Object({ token: Type.String({ minLength: 10, maxLength: 300 }) });

    // GET ändert nichts (Link-Scanner in Mail-Programmen), sondern zeigt eine Bestätigung mit Formular
    app.get('/notifications/unsubscribe', { schema: { tags, security: [], querystring: query } }, async (req, reply) => {
      const parsed = verifyUnsubscribeToken(config.unsubscribeSecret, req.query.token);
      reply.type('text/html; charset=utf-8').header('cache-control', 'no-store');
      if (!parsed) return reply.status(404).send(page('de', UNSUBSCRIBE_TEXTS.de.invalidTitle, UNSUBSCRIBE_TEXTS.de.invalid));
      const lang = (await deps.modules.identity.getContact(parsed.userId))?.locale ?? 'de';
      const t = UNSUBSCRIBE_TEXTS[lang];
      return reply.send(
        page(
          lang,
          t.confirmTitle,
          `<p>${escapeHtml(t.confirm(t.category[parsed.category]))}</p>
<form method="post" action="/api/v1/notifications/unsubscribe?token=${encodeURIComponent(req.query.token)}">
<input type="hidden" name="List-Unsubscribe" value="One-Click"><button type="submit">${t.button}</button></form>`,
        ),
      );
    });

    // One-Click (RFC 8058): POST ohne Anmeldung und ohne CSRF-Header, geschützt durch die Signatur
    app.post('/notifications/unsubscribe', { schema: { tags, security: [], querystring: query } }, async (req, reply) => {
      const parsed = verifyUnsubscribeToken(config.unsubscribeSecret, req.query.token);
      reply.type('text/html; charset=utf-8').header('cache-control', 'no-store');
      if (!parsed || !(await deps.modules.identity.disableNotification(parsed.userId, parsed.category))) {
        return reply.status(404).send(page('de', UNSUBSCRIBE_TEXTS.de.invalidTitle, UNSUBSCRIBE_TEXTS.de.invalid));
      }
      const lang = (await deps.modules.identity.getContact(parsed.userId))?.locale ?? 'de';
      const t = UNSUBSCRIBE_TEXTS[lang];
      return reply.send(page(lang, t.doneTitle, `<p>${escapeHtml(t.done(t.category[parsed.category]))}</p>`));
    });
  };

  return {
    api,
    routes,
    async registerJobs(withWorkers) {
      // REQ-NOTI-005: max. 5 Versuche, exponentieller Backoff, danach Dead-Letter-Queue
      await deps.jobs.defineQueue(SEND_EMAIL, {
        retryLimit: 4,
        retryDelaySeconds: 10,
        retryBackoff: true,
        expireInSeconds: 60,
        deadLetter: true,
      });
      if (withWorkers) {
        // Zähler vorbelegen, damit increase() auch die erste Fehlerserie erkennt (RV-A-18)
        for (const outcome of ['ok', 'retry', 'dead']) deps.metrics.jobsProcessed.labels(SEND_EMAIL, outcome).inc(0);
        await deps.jobs.work<SendEmailJob>(SEND_EMAIL, async (job, ctx) => {
          try {
            await handle(job);
            deps.metrics.jobsProcessed.labels(SEND_EMAIL, 'ok').inc();
          } catch (error) {
            deps.metrics.jobsProcessed.labels(SEND_EMAIL, ctx.finalAttempt ? 'dead' : 'retry').inc();
            throw error;
          }
        }, { batchSize: 5 });
      }
    },
  };
}
