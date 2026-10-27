import nodemailer from 'nodemailer';
import type { MailMessage, MailPort } from '../ports/index.js';

export interface SmtpOptions {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  password?: string;
  from: string;
  replyTo?: string;
}

/** MailPort → SMTP (im Beispiel Mailpit, im Echtbetrieb ein Relay; REQ-NOTI-007). */
export function createSmtpMail(options: SmtpOptions): MailPort {
  const transport = nodemailer.createTransport({
    host: options.host,
    port: options.port,
    secure: options.secure,
    auth: options.user ? { user: options.user, pass: options.password } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  });

  return {
    async send(message: MailMessage) {
      await transport.sendMail({ from: options.from, replyTo: options.replyTo, ...message });
    },
    async verify() {
      try {
        return await transport.verify();
      } catch {
        return false;
      }
    },
  };
}
