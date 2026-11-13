import { createServer, type AddressInfo, type Server } from 'node:net';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadConfig } from '../../config.js';
import { createSmtpMail } from './smtp-mail.js';

interface Received {
  auth?: string;
  from?: string;
  to: string[];
  data: string;
}

/**
 * Minimaler SMTP-Empfänger als alternatives Ziel (statt Mailpit). Kündigt AUTH PLAIN an, kein STARTTLS,
 * und zeichnet Umschlag, Anmeldung und Inhalt auf.
 */
function startSmtpServer(): Promise<{ server: Server; port: number; received: Received[] }> {
  const received: Received[] = [];
  const server = createServer((socket) => {
    let mail: Received = { to: [], data: '' };
    let inData = false;
    let buffer = '';
    socket.write('220 alternativ.example ESMTP Test\r\n');
    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      let idx: number;
      while ((idx = buffer.indexOf('\r\n')) >= 0) {
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        if (inData) {
          if (line === '.') {
            inData = false;
            received.push(mail);
            mail = { to: [], data: '', auth: mail.auth };
            socket.write('250 2.0.0 OK queued\r\n');
          } else {
            mail.data += `${line.startsWith('..') ? line.slice(1) : line}\n`;
          }
          continue;
        }
        const cmd = line.toUpperCase();
        if (cmd.startsWith('EHLO')) socket.write('250-alternativ.example\r\n250-AUTH PLAIN\r\n250 8BITMIME\r\n');
        else if (cmd.startsWith('HELO')) socket.write('250 alternativ.example\r\n');
        else if (cmd.startsWith('AUTH PLAIN')) {
          mail.auth = Buffer.from(line.slice('AUTH PLAIN '.length), 'base64').toString('utf8');
          socket.write('235 2.7.0 Authentication successful\r\n');
        } else if (cmd.startsWith('MAIL FROM:')) {
          mail.from = line.slice(10).replace(/[<>]/g, '').split(' ')[0];
          socket.write('250 2.1.0 OK\r\n');
        } else if (cmd.startsWith('RCPT TO:')) {
          mail.to.push(line.slice(8).replace(/[<>]/g, ''));
          socket.write('250 2.1.5 OK\r\n');
        } else if (cmd === 'DATA') {
          inData = true;
          socket.write('354 End data with <CR><LF>.<CR><LF>\r\n');
        } else if (cmd === 'QUIT') {
          socket.end('221 2.0.0 Bye\r\n');
        } else if (cmd === 'RSET' || cmd === 'NOOP') socket.write('250 OK\r\n');
        else socket.write('502 5.5.2 Command not implemented\r\n');
      }
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, port: (server.address() as AddressInfo).port, received })));
}

const SMTP_VARS = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASSWORD', 'MAIL_FROM'] as const;

describe('[AT-NOTI-007] Mailserver allein über Umgebungsvariablen austauschbar (REQ-NOTI-007)', () => {
  let smtp: Awaited<ReturnType<typeof startSmtpServer>>;
  const saved = Object.fromEntries(SMTP_VARS.map((k) => [k, process.env[k]]));

  beforeAll(async () => {
    smtp = await startSmtpServer();
  });
  afterAll(() => new Promise<void>((resolve) => smtp.server.close(() => resolve())));
  afterEach(() => {
    for (const k of SMTP_VARS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it('ohne Angaben zeigt die Konfiguration auf den lokalen Mail-Catcher (Mailpit, Port 1025)', () => {
    for (const k of SMTP_VARS) delete process.env[k];
    const { smtp: cfg } = loadConfig();
    expect(cfg).toMatchObject({ host: 'localhost', port: 1025, secure: false, user: undefined, password: undefined });
    expect(cfg.from).toContain('@');
  });

  it('Host, Port, Zugangsdaten und Absender aus der Umgebung: die Mail kommt beim alternativen Server an', async () => {
    Object.assign(process.env, {
      SMTP_HOST: '127.0.0.1',
      SMTP_PORT: String(smtp.port),
      SMTP_SECURE: 'false',
      SMTP_USER: 'relay-nutzer',
      SMTP_PASSWORD: 'relay-geheim',
      MAIL_FROM: 'Test-Absender <absender@alternativ.example>',
    });
    const mail = createSmtpMail(loadConfig().smtp);
    expect(await mail.verify()).toBe(true);
    await mail.send({ to: 'lea@studmail.hwg-lu.de', subject: 'Konfigurationstest', text: 'Hallo über das Relay', html: '<p>Hallo über das Relay</p>' });

    const last = smtp.received.at(-1)!;
    expect(last.from).toBe('absender@alternativ.example');
    expect(last.to).toEqual(['lea@studmail.hwg-lu.de']);
    expect(last.auth).toBe('\0relay-nutzer\0relay-geheim');
    expect(last.data).toMatch(/^From: "?Test-Absender"? <absender@alternativ\.example>$/m);
    expect(last.data).toMatch(/^Subject: Konfigurationstest$/m);
  });
});
