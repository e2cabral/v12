import type { MailAdapter, MailMessage } from './mail-adapter.js';
import { Mailable } from './mailable.js';

export class MailService {
  static inject = ['MailAdapter'] as const;

  constructor(private readonly adapter: MailAdapter) {}

  async send(message: MailMessage | Mailable) {
    const finalMessage = message instanceof Mailable ? await message.build() : message;
    return this.adapter.send(finalMessage);
  }
}
