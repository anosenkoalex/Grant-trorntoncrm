import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Socket, createConnection } from 'node:net';
import { connect as createTlsConnection } from 'node:tls';

interface AssignmentEmailPayload {
  fullName: string | null;
  email: string;
  workplaceCode: string;
  workplaceName: string | null;
  startsAt: Date;
  endsAt: Date | null;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly host?: string;
  private readonly port?: number;
  private readonly user?: string;
  private readonly pass?: string;
  private readonly from: string;
  private readonly appUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.host = this.configService.get<string>('SMTP_HOST') ?? undefined;
    this.port = this.configService.get<number>('SMTP_PORT') ?? undefined;
    this.user = this.configService.get<string>('SMTP_USER') ?? undefined;
    this.pass = this.configService.get<string>('SMTP_PASS') ?? undefined;
    this.from =
      this.configService.get<string>('MAIL_FROM') ?? 'no-reply@armico.local';
    this.appUrl = this.configService.get<string>('APP_URL') ?? '';

    if (!this.host || !this.port || !this.user || !this.pass) {
      this.logger.warn(
        'SMTP настройки заданы не полностью. Отправка email будет недоступна.',
      );
    }
  }

  private get isConfigured() {
    return Boolean(this.host && this.port && this.user && this.pass);
  }

  /**
   * Статус email-шлюза
   */
  getSettings() {
    return {
      enabled: this.isConfigured,
      host: this.host ?? null,
      port: this.port ?? null,
      user: this.user ?? null,
      from: this.from,
    };
  }

  private async createSocket(): Promise<Socket> {
    if (!this.host || !this.port) {
      throw new ServiceUnavailableException(
        'Отправка email пока не настроена (SMTP-шлюз не подключен)',
      );
    }

    const useTls = this.port === 465;

    return new Promise((resolve, reject) => {
      let resolved = false;
      let socket: Socket;

      const cleanup = () => {
        socket.removeListener('error', handleError);
      };

      const handleError = (error: Error) => {
        if (!resolved) {
          reject(error);
        }
      };

      const handleConnect = () => {
        resolved = true;
        cleanup();
        resolve(socket);
      };

      if (useTls) {
        socket = createTlsConnection(
          {
            host: this.host ?? 'localhost',
            port: this.port ?? 465,
            rejectUnauthorized: false,
          },
          handleConnect,
        );
      } else {
        socket = createConnection(
          this.port ?? 25,
          this.host ?? 'localhost',
          handleConnect,
        );
      }

      socket.once('error', handleError);
    });
  }

  private readResponse(socket: Socket): Promise<string> {
    return new Promise((resolve, reject) => {
      let data = '';

      const handleData = (chunk: Buffer) => {
        data += chunk.toString('utf-8');
        const lines = data.split(/\r?\n/).filter(Boolean);
        if (lines.length === 0) return;

        const lastLine = lines[lines.length - 1];
        if (/^\d{3} /.test(lastLine)) {
          cleanup();
          resolve(data);
        }
      };

      const handleError = (error: Error) => {
        cleanup();
        reject(error);
      };

      const handleClose = () => {
        cleanup();
        reject(new Error('SMTP connection closed unexpectedly'));
      };

      const cleanup = () => {
        socket.off('data', handleData);
        socket.off('error', handleError);
        socket.off('close', handleClose);
      };

      socket.on('data', handleData);
      socket.once('error', handleError);
      socket.once('close', handleClose);
    });
  }

  private async sendCommand(socket: Socket, command: string) {
    socket.write(`${command}\r\n`);
    return this.readResponse(socket);
  }

  private ensureResponse(response: string, allowed: number[], stage: string) {
    const lines = response.trim().split(/\r?\n/);
    const lastLine = lines[lines.length - 1] ?? '';
    const code = Number(lastLine.slice(0, 3));

    if (!allowed.includes(code)) {
      throw new Error(`SMTP ${stage} failed: ${lastLine}`);
    }
  }

  private encodeSubject(subject: string) {
    return `=?UTF-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`;
  }

  /**
   * ⚠️ СТАРЫЙ текстовый билдер — ОСТАВЛЕН БЕЗ ИЗМЕНЕНИЙ
   */
  private buildAssignmentMessage(payload: AssignmentEmailPayload) {
    const formatter = new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const startsAt = formatter.format(payload.startsAt);
    const endsAt = payload.endsAt
      ? formatter.format(payload.endsAt)
      : 'бессрочно';

    const loginUrl = this.appUrl
      ? `${this.appUrl.replace(/\/$/, '')}/login`
      : '';

    const greetingName = payload.fullName?.trim() || payload.email;
    const workplaceName = payload.workplaceName?.trim()
      ? ` — ${payload.workplaceName.trim()}`
      : '';

    const lines = [
      `Здравствуйте, ${greetingName}!`,
      '',
      `Вас назначили на рабочее место ${payload.workplaceCode}${workplaceName}.`,
      `Период: ${startsAt} — ${endsAt}.`,
    ];

    if (loginUrl) {
      lines.push('', 'Ссылка для входа в CRM:', loginUrl);
    }

    lines.push('', 'Это письмо отправлено автоматически.');

    const textBody = lines.join('\n');
    const encodedSubject = this.encodeSubject('Новое назначение в Armico');

    const headers = [
      `From: ${this.from}`,
      `To: ${payload.email}`,
      `Date: ${new Date().toUTCString()}`,
      `Subject: ${encodedSubject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: 8bit',
    ];

    return `${headers.join('\r\n')}\r\n\r\n${textBody.replace(
      /\r?\n/g,
      '\r\n',
    )}`;
  }

  /**
   * ✅ НОВЫЙ HTML-билдер (Grant Thornton)
   */
  private buildAssignmentHtml(payload: AssignmentEmailPayload) {
    const formatter = new Intl.DateTimeFormat('ru-RU');
    const startsAt = formatter.format(payload.startsAt);
    const endsAt = payload.endsAt
      ? formatter.format(payload.endsAt)
      : 'бессрочно';

    const loginUrl = this.appUrl
      ? `${this.appUrl.replace(/\/$/, '')}/login`
      : '#';

    const greetingName = payload.fullName?.trim() || payload.email;
    const workplaceName = payload.workplaceName
      ? ` — ${payload.workplaceName}`
      : '';

    return `
<!doctype html>
<html lang="ru">
  <body style="font-family:Arial,sans-serif;background:#f5f6f8;padding:24px;">
    <div style="max-width:600px;margin:auto;background:#ffffff;padding:24px;border-radius:8px;">
      <h2 style="margin-top:0;color:#1f2937;">Новое назначение в Grant Thornton</h2>
      <p>Здравствуйте, <strong>${greetingName}</strong>!</p>
      <p>
        Вас назначили на рабочее место
        <strong>${payload.workplaceCode}${workplaceName}</strong>.
      </p>
      <p>Период: <strong>${startsAt} — ${endsAt}</strong></p>

      <div style="margin:32px 0;text-align:center;">
        <a
          href="${loginUrl}"
          style="
            display:inline-block;
            padding:14px 24px;
            background:#0B5ED7;
            color:#ffffff;
            text-decoration:none;
            border-radius:6px;
            font-weight:600;
          "
        >
          Войти в CRM
        </a>
      </div>

      <p style="color:#6b7280;font-size:13px;">
        Это письмо отправлено автоматически.
      </p>
    </div>
  </body>
</html>
`;
  }

  /**
   * Универсальный билдер простого текстового письма
   */
  private buildPlainTextMessage(to: string, subject: string, body: string) {
    const encodedSubject = this.encodeSubject(subject);

    const headers = [
      `From: ${this.from}`,
      `To: ${to}`,
      `Date: ${new Date().toUTCString()}`,
      `Subject: ${encodedSubject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: 8bit',
    ];

    return `${headers.join('\r\n')}\r\n\r\n${body.replace(/\r?\n/g, '\r\n')}`;
  }

  /**
   * Низкоуровневая отправка письма по SMTP
   */
  private async sendRawMail(to: string, rawMessage: string) {
    if (!this.isConfigured) {
      throw new ServiceUnavailableException(
        'Отправка email пока не настроена (SMTP-шлюз не подключен)',
      );
    }

    const socket = await this.createSocket();

    try {
      this.ensureResponse(await this.readResponse(socket), [220], 'GREETING');
      this.ensureResponse(
        await this.sendCommand(socket, `EHLO ${this.host ?? 'localhost'}`),
        [250],
        'EHLO',
      );
      this.ensureResponse(
        await this.sendCommand(socket, 'AUTH LOGIN'),
        [334],
        'AUTH LOGIN',
      );
      this.ensureResponse(
        await this.sendCommand(
          socket,
          Buffer.from(this.user ?? '').toString('base64'),
        ),
        [334],
        'AUTH LOGIN USER',
      );
      this.ensureResponse(
        await this.sendCommand(
          socket,
          Buffer.from(this.pass ?? '').toString('base64'),
        ),
        [235],
        'AUTH LOGIN PASS',
      );
      this.ensureResponse(
        await this.sendCommand(socket, `MAIL FROM:<${this.from}>`),
        [250],
        'MAIL FROM',
      );
      this.ensureResponse(
        await this.sendCommand(socket, `RCPT TO:<${to}>`),
        [250, 251],
        'RCPT TO',
      );
      this.ensureResponse(
        await this.sendCommand(socket, 'DATA'),
        [354],
        'DATA',
      );

      socket.write(`${rawMessage}\r\n.\r\n`);
      this.ensureResponse(await this.readResponse(socket), [250], 'SEND');
      await this.sendCommand(socket, 'QUIT');
    } catch (e) {
      this.logger.error('SMTP error', e as Error);
      throw new ServiceUnavailableException('Не удалось отправить email');
    } finally {
      socket.end();
    }
  }

  /**
   * 🔔 Уведомление о назначении
   * ⚠️ ТЕПЕРЬ: HTML + Grant Thornton
   */
  async sendAssignmentNotification(payload: AssignmentEmailPayload) {
    const html = this.buildAssignmentHtml(payload);
    await this.sendHtmlEmail(
      payload.email,
      'Новое назначение в Grant Thornton',
      html,
    );
  }

  /**
   * Тестовое письмо
   */
  async sendTestEmail(email: string, text?: string) {
    const message = this.buildPlainTextMessage(
      email,
      'Тестовое письмо из Armico',
      text || 'SMTP работает',
    );
    await this.sendRawMail(email, message);
  }

  /**
   * HTML-письмо (универсальное)
   */
  async sendHtmlEmail(to: string, subject: string, html: string) {
    const encodedSubject = this.encodeSubject(subject);

    const headers = [
      `From: ${this.from}`,
      `To: ${to}`,
      `Date: ${new Date().toUTCString()}`,
      `Subject: ${encodedSubject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: 8bit',
    ];

    const raw = `${headers.join('\r\n')}\r\n\r\n${html}`;
    await this.sendRawMail(to, raw);
  }
}
