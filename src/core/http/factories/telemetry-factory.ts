import type { FastifyInstance } from 'fastify';
import { Telemetry, type TelemetryOptions } from '../../telemetry/otel.js';

export async function initTelemetry(app: FastifyInstance, options?: TelemetryOptions) {
  if (!options?.enabled) return null;

  const telemetry = new Telemetry(options);
  await telemetry.start();

  app.decorate('telemetry', telemetry);
  
  app.addHook('onClose', async () => {
    await telemetry.stop();
  });

  return telemetry;
}
