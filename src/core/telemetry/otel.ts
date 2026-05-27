import { NodeSDK, metrics } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

export type TelemetryOptions = {
  serviceName: string;
  url?: string; // OTLP Collector URL
  enabled?: boolean;
  debug?: boolean;
};

export class Telemetry {
  private sdk: NodeSDK | null = null;

  constructor(private options: TelemetryOptions) {
    if (options.debug) {
      diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
    }
  }

  async start() {
    if (this.options.enabled === false) return;

    const traceExporter = this.options.url 
      ? new OTLPTraceExporter({ url: `${this.options.url}/v1/traces` })
      : undefined;

    const metricExporter = this.options.url
      ? new OTLPMetricExporter({ url: `${this.options.url}/v1/metrics` })
      : undefined;

    this.sdk = new NodeSDK({
      serviceName: this.options.serviceName,
      traceExporter,
      metricReader: metricExporter
        ? new metrics.PeriodicExportingMetricReader({
            exporter: metricExporter,
          })
        : undefined,
      instrumentations: [getNodeAutoInstrumentations()],
    });

    try {
      await this.sdk.start();
      console.log('✨ OpenTelemetry initialized');
    } catch (error) {
      console.error('❌ Error initializing OpenTelemetry', error);
    }
  }

  async stop() {
    if (this.sdk) {
      await this.sdk.shutdown();
      console.log('🛑 OpenTelemetry shut down');
    }
  }
}
