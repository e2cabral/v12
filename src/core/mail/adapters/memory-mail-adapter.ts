import type { MailAdapter, MailMessage } from '../mail-adapter.js';

export class MemoryMailAdapter implements MailAdapter {
  public emails: MailMessage[] = [];

  async send(message: MailMessage) {
    this.emails.push(message);
  }

  clear() {
    this.emails = [];
  }
}
