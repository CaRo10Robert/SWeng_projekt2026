import type { Tx } from '../../platform/db.js';
import type { MailPort } from '../../platform/ports/index.js';
import type { Module, ModuleDeps } from '../shared.js';
import { renderEmail, templateCategory, type EmailTemplate } from './templates.js';

export type { EmailTemplate } from './templates.js';

export type Recipient = { userId: string } | { address: string };

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

/** Modul notifications: Templates, Präferenzen, Versand über den MailPort. */
export function createNotificationsModule(deps: ModuleDeps, mail: MailPort): Module<NotificationsApi> {
  const api: NotificationsApi = {
    async email(tx, recipient, template, params) {
      const job: SendEmailJob = { recipient, template, params };
      if (tx) await tx.enqueue(SEND_EMAIL, job);
      else await deps.jobs.enqueue(SEND_EMAIL, job);
    },
  };

  async function handle(job: SendEmailJob) {
    let address: string;
    let params = job.params;
    if ('userId' in job.recipient) {
      const contact = await deps.modules.identity.getContact(job.recipient.userId);
      if (!contact || contact.status === 'suspended') return;
      const category = templateCategory[job.template];
      if (category === 'newMessage' && !contact.notificationPrefs.newMessage) return;
      if (category === 'listingExpiry' && !contact.notificationPrefs.listingExpiry) return;
      address = contact.email;
      params = { name: contact.displayName, ...params };
    } else {
      address = job.recipient.address;
    }
    const rendered = renderEmail(job.template, params);
    await mail.send({ to: address, ...rendered });
    deps.logger.info({ template: job.template }, 'E-Mail versendet');
  }

  return {
    api,
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
        await deps.jobs.work<SendEmailJob>(SEND_EMAIL, async (job) => {
          try {
            await handle(job);
            deps.metrics.jobsProcessed.labels(SEND_EMAIL, 'ok').inc();
          } catch (error) {
            deps.metrics.jobsProcessed.labels(SEND_EMAIL, 'error').inc();
            throw error;
          }
        }, { batchSize: 5 });
      }
    },
  };
}
