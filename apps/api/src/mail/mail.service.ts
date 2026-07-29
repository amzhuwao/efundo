import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    if (host && user && pass) {
      const port = Number(this.config.get<string>('SMTP_PORT') ?? 587);
      const secure =
        this.config.get<string>('SMTP_SECURE') === 'true' || port === 465;
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
    } else {
      this.logger.warn(
        'SMTP not configured — password reset emails will be logged only',
      );
    }
  }

  async sendPasswordReset(to: string, resetUrl: string) {
    const from =
      this.config.get<string>('MAIL_FROM') ??
      this.config.get<string>('SMTP_USER') ??
      'noreply@efundo.org';

    const subject = 'Reset your eFundo password';
    const text = [
      'You requested a password reset for your eFundo account.',
      '',
      `Open this link to choose a new password (expires in 1 hour):`,
      resetUrl,
      '',
      'If you did not request this, you can ignore this email.',
    ].join('\n');
    const html = `
      <p>You requested a password reset for your eFundo account.</p>
      <p><a href="${resetUrl}">Reset your password</a></p>
      <p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
    `;

    if (!this.transporter) {
      this.logger.log(`Password reset for ${to}: ${resetUrl}`);
      return { delivered: false as const };
    }

    await this.transporter.sendMail({ from, to, subject, text, html });
    return { delivered: true as const };
  }
}
