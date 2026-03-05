import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Mail service for sending invitation emails via Nodemailer.
 * @see https://nodemailer.com/
 *
 * Configure Mailtrap SMTP (Email Testing): set MAILTRAP_SMTP_HOST, MAILTRAP_SMTP_PORT,
 * MAILTRAP_SMTP_USER, MAILTRAP_SMTP_PASS (from Mailtrap inbox → SMTP Settings).
 * If you see "535 Too many failed login attempts", wait 15–60 min or regenerate credentials in Mailtrap.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transport: Transporter | null = null;

  constructor(private config: ConfigService) {
    const host = this.config.get<string>('MAILTRAP_SMTP_HOST');
    const portRaw = this.config.get<string>('MAILTRAP_SMTP_PORT');
    const port = portRaw ? parseInt(portRaw, 10) : 2525;
    const user = this.config.get<string>('MAILTRAP_SMTP_USER');
    const pass = this.config.get<string>('MAILTRAP_SMTP_PASS');

    if (host && user && pass) {
      this.transport = nodemailer.createTransport({
        host,
        port: Number.isNaN(port) ? 2525 : port,
        secure: false,
        auth: { user, pass },
      });
      this.logger.log(
        `Mail SMTP configured: ${host}:${Number.isNaN(port) ? 2525 : port}`
      );
    } else {
      this.logger.warn(
        'Mail not configured. Set MAILTRAP_SMTP_HOST, MAILTRAP_SMTP_USER, MAILTRAP_SMTP_PASS in .env'
      );
    }
  }

  /**
   * Sends the invitation email. Returns { sent: false } on failure (logs error; does not throw).
   */
  async sendInvitation(params: {
    to: string;
    orgName: string;
    role: string;
    acceptUrl: string;
    expiresAt: Date;
  }): Promise<{ sent: boolean }> {
    if (!this.transport) {
      this.logger.warn(
        'sendInvitation skipped: no transport (SMTP not configured).'
      );
      return { sent: false };
    }

    const fromName =
      this.config.get<string>('MAIL_FROM_NAME') || 'Secure Task Management';
    const fromEmail =
      this.config.get<string>('MAIL_FROM') || 'noreply@sandbox.mailtrap.io';

    const text = `You have been invited to join "${params.orgName}" as ${
      params.role
    }. Accept here: ${
      params.acceptUrl
    } (expires ${params.expiresAt.toISOString()}).`;
    const html = `<p>You have been invited to join <strong>${
      params.orgName
    }</strong> as <strong>${params.role}</strong>.</p><p><a href="${
      params.acceptUrl
    }">Accept invitation</a></p><p>Link expires ${params.expiresAt.toISOString()}.</p>`;

    try {
      const info = await this.transport.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: params.to,
        subject: `Invitation to ${params.orgName}`,
        text,
        html,
      });
      this.logger.log(
        `Invitation email sent to ${params.to} (messageId: ${
          info.messageId ?? 'n/a'
        }).`
      );
      return { sent: true };
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      const code = err?.code ?? err?.responseCode;
      this.logger.error(
        `Invitation email failed to ${params.to}: ${msg}${
          code ? ` [${code}]` : ''
        }. Invite was still created.`
      );
      return { sent: false };
    }
  }
}
