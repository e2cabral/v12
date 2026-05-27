# Implementação de Webhooks

Webhooks permitem que sua aplicação receba notificações em tempo real de serviços externos (como Stripe, GitHub ou WhatsApp). Este guia mostra como criar um endpoint de Webhook seguro e robusto.

## 1. Criando o Endpoint do Webhook

Webhooks geralmente usam o método `POST`. É importante que o endpoint responda rapidamente (status 200) para evitar que o serviço de origem tente reenviar a notificação repetidamente.

```ts
router.post('/stripe', {
  handler: async ({ request, container }) => {
    // 1. Responder imediatamente
    // O processamento pesado deve ser feito em background (Job ou Event)
    const eventBus = container.resolve(EventBus);
    eventBus.emit('webhook.stripe.received', request.body);

    return { received: true };
  }
});
```

## 2. Segurança: Validando a Assinatura

Nunca confie cegamente nos dados enviados para um webhook. A maioria dos serviços envia uma assinatura no header para garantir que a requisição veio deles.

```ts
import { BusinessError } from 'v12';
import crypto from 'node:crypto';

const stripeWebhookGuard = async ({ request }) => {
  const signature = request.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  // Exemplo simplificado de validação
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(request.body))
    .digest('hex');

  if (signature !== expectedSignature) {
    throw new BusinessError('Assinatura inválida', 401);
  }
};

router.post('/stripe', {
  middlewares: [stripeWebhookGuard],
  handler: async ({ request }) => {
    // Processar...
  }
});
```

## 3. Processamento Assíncrono (Jobs)

Para Webhooks que disparam processos longos (como gerar uma nota fiscal ou enviar um e-mail), use o sistema de `Jobs` do V12.

```ts
router.post('/payment-confirmed', {
  handler: async ({ request, container }) => {
    const queue = container.resolve(QueueService);
    
    // Adiciona o processamento na fila para ser executado por um Worker
    await queue.add('payments', 'process-webhook', request.body);

    return { ok: true };
  }
});
```

## 4. Gerenciando Idempotência

Serviços externos podem enviar o mesmo webhook mais de uma vez (retry). Sua aplicação deve ser capaz de lidar com isso sem duplicar dados.

```ts
export class WebhookService {
  async handle(payload: any) {
    const eventId = payload.id;
    
    // 1. Verificar se já processamos este evento
    const alreadyProcessed = await this.db.webhookLogs.findUnique({ where: { eventId } });
    if (alreadyProcessed) return;

    // 2. Processar a lógica
    await this.processPayment(payload);

    // 3. Marcar como processado
    await this.db.webhookLogs.create({ data: { eventId } });
  }
}
```

## Resumo de Boas Práticas

1.  **Responda Rápido**: O serviço de origem geralmente tem um timeout curto (ex: 5-10 segundos).
2.  **Valide Sempre**: Use segredos e assinaturas para evitar que atacantes forjem requisições.
3.  **Fila de Processamento**: Use `Jobs` e `Redis` para garantir que nenhuma notificação seja perdida se o servidor estiver ocupado.
4.  **Logs**: Guarde um log dos webhooks recebidos (payload e status) para facilitar a depuração se algo der errado.
