import nodemailer from 'nodemailer';
import type { MailAdapter, MailMessage } from '../mail-adapter.js';

export type SmtpConfig = {
  host: string;
  port: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  from?: string;
};

export class SmtpMailAdapter implements MailAdapter {
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: SmtpConfig) {
    this.transporter = nodemailer.createTransport(config);
  }

  async send(message: MailMessage) {
    await this.transporter.sendMail({
      from: message.from || this.config.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      attachments: message.attachments,
    });
  }
}
