# Mail API

O V12 oferece uma camada simples de envio de e-mail baseada em:

- `MailService`
- `Mailable`
- `MailAdapter`
- `MemoryMailAdapter`
- `SmtpMailAdapter`

## `MailService`

O `MailService` injeta o token `'MailAdapter'` e aceita tanto mensagem direta quanto instâncias de `Mailable`.

## Exemplo com mensagem direta

```ts
import { MailService } from '@eddiecbrl/v12';

class WelcomeController {
  static inject = [MailService] as const;

  constructor(private readonly mail: MailService) {}

  async signup() {
    await this.mail.send({
      to: 'user@example.com',
      subject: 'Bem-vindo!',
      text: 'Olá, seu cadastro foi realizado.',
      html: '<h1>Bem-vindo!</h1>',
    });
  }
}
```

## `Mailable`

Para e-mails mais organizados, use `Mailable`.

```ts
import { Mailable } from '@eddiecbrl/v12';

export class WelcomeMail extends Mailable {
  constructor(private readonly user: { email: string; name: string }) {
    super();
  }

  build() {
    return {
      to: this.user.email,
      subject: 'Bem-vindo ao V12',
      html: `<h1>Olá ${this.user.name}</h1>`,
    };
  }
}
```

Uso:

```ts
await mailService.send(new WelcomeMail(user));
```

## `MailMessage`

O formato base é:

```ts
type MailMessage = {
  to: string | string[];
  from?: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: any[];
}
```

## `MemoryMailAdapter`

Bom para testes e desenvolvimento.

```ts
import { MailService, MemoryMailAdapter } from '@eddiecbrl/v12';

const adapter = new MemoryMailAdapter();
const service = new MailService(adapter);

await service.send({
  to: 'test@example.com',
  subject: 'Hello',
  text: 'World',
});

console.log(adapter.emails);
```

Ele guarda tudo em `emails: MailMessage[]`.

## `SmtpMailAdapter`

Usa Nodemailer por baixo.

```ts
import { SmtpMailAdapter } from '@eddiecbrl/v12';

const adapter = new SmtpMailAdapter({
  host: 'smtp.example.com',
  port: 587,
  auth: {
    user: 'user',
    pass: 'pass',
  },
  from: 'noreply@example.com',
});
```

## Registrando no container

```ts
import {
  createApp,
  MailService,
  SmtpMailAdapter,
} from '@eddiecbrl/v12';

const app = await createApp({
  providers: [
    {
      provide: 'MailAdapter',
      useValue: new SmtpMailAdapter({
        host: 'smtp.example.com',
        port: 587,
        auth: { user: '...', pass: '...' },
        from: 'noreply@example.com',
      }),
    },
    MailService,
  ],
});
```

## Exemplo em service

```ts
class UsersService {
  static inject = [MailService] as const;

  constructor(private readonly mail: MailService) {}

  async sendWelcome(user: { email: string; name: string }) {
    await this.mail.send(new WelcomeMail(user));
  }
}
```

## Boas práticas

- use `MemoryMailAdapter` em testes
- encapsule e-mails importantes em `Mailable`
- centralize o adapter no bootstrap
- deixe `from` padrão no adapter SMTP quando fizer sentido

## Links relacionados

- [Testing API](/api/testing)
- [CLI](/api/cli)
