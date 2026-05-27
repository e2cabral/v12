# Implementação de Webhooks

Webhooks pedem três coisas: resposta rápida, validação de origem e idempotência. Este cookbook monta esse fluxo no V12.

## 1. Endpoint mínimo

```ts
import { createRouter } from '@eddiecbrl/v12';

const router = createRouter();

router.post('/stripe', {
  handler: async ({ request, container }) => {
    const events = container.resolve('EventBus');
    events.emit('webhook.stripe.received', request.body);

    return { received: true };
  },
});
```

Aqui a rota responde rápido e delega o processamento para um evento.

## 2. Validando assinatura

```ts
import crypto from 'node:crypto';
import { UnauthorizedError } from '@eddiecbrl/v12';

const stripeWebhookGuard = async ({ request }: any) => {
  const signature = request.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET!;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(request.body))
    .digest('hex');

  if (signature !== expectedSignature) {
    throw new UnauthorizedError('Invalid webhook signature');
  }
};

router.post('/stripe', {
  middlewares: [stripeWebhookGuard],
  handler: async ({ request, container }) => {
    const events = container.resolve('EventBus');
    events.emit('webhook.stripe.received', request.body);
    return { received: true };
  },
});
```

## 3. Processamento assíncrono com fila

Quando o webhook dispara trabalho pesado:

```ts
router.post('/payment-confirmed', {
  handler: async ({ request, container }) => {
    const queue = container.resolve(QueueService);

    await queue.add('payments', 'process-webhook', request.body);

    return { queued: true };
  },
});
```

## 4. Idempotência

É comum o provedor reenviar o mesmo evento.

```ts
export class WebhookService {
  static inject = [WebhookLogsRepository] as const;

  constructor(private readonly logs: WebhookLogsRepository) {}

  async handle(payload: any) {
    const eventId = payload.id;

    const alreadyProcessed = await this.logs.findByEventId(eventId);
    if (alreadyProcessed) {
      return;
    }

    await this.processPayment(payload);
    await this.logs.markProcessed(eventId);
  }

  async processPayment(payload: any) {
    // regra de negócio
  }
}
```

## 5. Event-driven after webhook

Você também pode conectar isso com `module.events`:

```ts
export const PaymentsModule = defineModule({
  name: 'payments',
  events: [
    {
      event: 'webhook.stripe.received',
      handler: async (payload) => {
        console.log('process webhook', payload);
      },
    },
  ],
});
```

## 6. Boas práticas

- responda rápido
- valide assinatura sempre
- torne o processamento idempotente
- envie tarefas pesadas para fila ou evento
- registre logs do webhook recebido

## Links relacionados

- [Security API](/api/security)
- [Events API](/api/events)
- [Queue API](/api/queue)
