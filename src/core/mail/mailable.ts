import type { MailMessage } from './mail-adapter.js';

export abstract class Mailable {
  abstract build(): MailMessage | Promise<MailMessage>;
}
