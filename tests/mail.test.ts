import { describe, expect, it } from 'vitest';
import { MailService } from '../src/core/mail/mail-service.js';
import { MemoryMailAdapter } from '../src/core/mail/adapters/memory-mail-adapter.js';
import { Mailable } from '../src/core/mail/mailable.js';

describe('Mail Service', () => {
  it('sends direct message', async () => {
    const adapter = new MemoryMailAdapter();
    const service = new MailService(adapter);

    await service.send({
      to: 'test@example.com',
      subject: 'Hello',
      text: 'World',
    });

    expect(adapter.emails).toHaveLength(1);
    expect(adapter.emails[0].subject).toBe('Hello');
  });

  it('sends via mailable', async () => {
    const adapter = new MemoryMailAdapter();
    const service = new MailService(adapter);

    class WelcomeMail extends Mailable {
      build() {
        return {
          to: 'user@example.com',
          subject: 'Welcome',
          html: '<h1>Welcome!</h1>',
        };
      }
    }

    await service.send(new WelcomeMail());

    expect(adapter.emails).toHaveLength(1);
    expect(adapter.emails[0].subject).toBe('Welcome');
  });
});
