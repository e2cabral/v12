# Mail API

O V12 simplifica o envio de e-mails através do `MailService` e da classe base `Mailable`, suportando diferentes adaptadores.

## MailService

O `MailService` é o ponto de entrada para enviar e-mails.

```ts
import { MailService } from 'v12';

class WelcomeController {
  constructor(private mail: MailService) {}

  async signup() {
    await this.mail.send({
      to: 'user@example.com',
      subject: 'Bem-vindo!',
      text: 'Olá, seu cadastro foi realizado.',
      html: '<h1>Bem-vindo!</h1>'
    });
  }
}
```

## Mailable

Para e-mails mais complexos, use a classe `Mailable`. Ela permite organizar a lógica de construção do e-mail de forma coesa.

```ts
import { Mailable } from 'v12';

export class WelcomeEmail extends Mailable {
  constructor(private user: any) {
    super();
  }

  async build() {
    return {
      to: this.user.email,
      subject: 'Bem-vindo ao V12',
      html: `Olá ${this.user.name}, obrigado por se cadastrar!`
    };
  }
}

// No controller:
await mailService.send(new WelcomeEmail(user));
```

## Adaptadores

O V12 suporta:

- `SmtpMailAdapter`: Envio via SMTP (Nodemailer).
- `MemoryMailAdapter`: Armazena e-mails em um array na memória (ideal para testes).

## Configuração

```ts
import { createApp, MailService, SmtpMailAdapter } from 'v12';

const app = await createApp({
  providers: [
    {
      provide: 'MailAdapter',
      useValue: new SmtpMailAdapter({
        host: 'smtp.example.com',
        port: 587,
        auth: { user: '...', pass: '...' }
      })
    },
    MailService
  ]
});
```

## Links relacionados

- [createApp](/api/create-app)
- [CLI](/api/cli)
