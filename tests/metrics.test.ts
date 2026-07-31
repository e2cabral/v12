import { describe, expect, it, beforeEach } from 'vitest';
import { Counter, Histogram, Gauge, MetricsRegistry } from '../src/core/telemetry/metrics.js';
import { createTestingApp } from '../src/core/testing/testing-app.js';
import { createRouter, defineModule } from '../src/index.js';

describe('Prometheus Metrics', () => {
  describe('Counter', () => {
    let counter: Counter;

    beforeEach(() => {
      counter = new Counter('http_requests_total', 'Total HTTP requests');
    });

    it('increments and serializes in Prometheus format', () => {
      counter.inc();
      counter.inc();
      counter.inc();

      const output = counter.serialize();
      expect(output).toContain('# HELP http_requests_total Total HTTP requests');
      expect(output).toContain('# TYPE http_requests_total counter');
      expect(output).toContain('http_requests_total 3');
    });

    it('increments with custom value', () => {
      counter.inc({}, 5);
      const output = counter.serialize();
      expect(output).toContain('http_requests_total 5');
    });

    it('produces correct output with labels', () => {
      counter.inc({ method: 'GET', path: '/users' });
      counter.inc({ method: 'GET', path: '/users' });
      counter.inc({ method: 'POST', path: '/users' });

      const output = counter.serialize();
      expect(output).toContain('# HELP http_requests_total Total HTTP requests');
      expect(output).toContain('# TYPE http_requests_total counter');
      expect(output).toContain('http_requests_total{method="GET",path="/users"} 2');
      expect(output).toContain('http_requests_total{method="POST",path="/users"} 1');
    });

    it('sorts label keys alphabetically', () => {
      counter.inc({ path: '/users', method: 'GET', status: '200' });

      const output = counter.serialize();
      expect(output).toContain('http_requests_total{method="GET",path="/users",status="200"} 1');
    });

    it('serializes with zero when no increments', () => {
      const output = counter.serialize();
      expect(output).toContain('http_requests_total 0');
    });
  });

  describe('Histogram', () => {
    let histogram: Histogram;

    beforeEach(() => {
      histogram = new Histogram(
        'http_request_duration_seconds',
        'Request duration in seconds',
        [0.01, 0.05, 0.1, 0.5, 1],
      );
    });

    it('observe adds to correct buckets', () => {
      histogram.observe({}, 0.03); // fits in 0.05, 0.1, 0.5, 1
      histogram.observe({}, 0.08); // fits in 0.1, 0.5, 1
      histogram.observe({}, 0.7);  // fits in 1

      const output = histogram.serialize();

      expect(output).toContain('http_request_duration_seconds_bucket{le="0.01"} 0');
      expect(output).toContain('http_request_duration_seconds_bucket{le="0.05"} 1');
      expect(output).toContain('http_request_duration_seconds_bucket{le="0.1"} 2');
      expect(output).toContain('http_request_duration_seconds_bucket{le="0.5"} 2');
      expect(output).toContain('http_request_duration_seconds_bucket{le="1"} 3');
      expect(output).toContain('http_request_duration_seconds_bucket{le="+Inf"} 3');
    });

    it('serializes with _bucket, _sum, _count suffixes', () => {
      histogram.observe({}, 0.25);
      histogram.observe({}, 0.75);

      const output = histogram.serialize();

      expect(output).toContain('# HELP http_request_duration_seconds Request duration in seconds');
      expect(output).toContain('# TYPE http_request_duration_seconds histogram');
      expect(output).toContain('http_request_duration_seconds_sum 1');
      expect(output).toContain('http_request_duration_seconds_count 2');
    });

    it('serializes with labels', () => {
      histogram.observe({ method: 'GET', path: '/users' }, 0.03);
      histogram.observe({ method: 'GET', path: '/users' }, 0.07);

      const output = histogram.serialize();

      expect(output).toContain(
        'http_request_duration_seconds_bucket{method="GET",path="/users",le="0.05"} 1',
      );
      expect(output).toContain(
        'http_request_duration_seconds_bucket{method="GET",path="/users",le="0.1"} 2',
      );
      expect(output).toContain(
        'http_request_duration_seconds_bucket{method="GET",path="/users",le="+Inf"} 2',
      );
      expect(output).toContain(
        'http_request_duration_seconds_sum{method="GET",path="/users"} 0.1',
      );
      expect(output).toContain(
        'http_request_duration_seconds_count{method="GET",path="/users"} 2',
      );
    });

    it('uses default buckets when none provided', () => {
      const h = new Histogram('test_histogram', 'Test');
      h.observe({}, 0.003);

      const output = h.serialize();
      expect(output).toContain('test_histogram_bucket{le="0.005"} 1');
      expect(output).toContain('test_histogram_bucket{le="10"} 1');
    });
  });

  describe('Gauge', () => {
    let gauge: Gauge;

    beforeEach(() => {
      gauge = new Gauge('process_uptime_seconds', 'Process uptime in seconds');
    });

    it('set and serialize works', () => {
      gauge.set({}, 123.45);

      const output = gauge.serialize();
      expect(output).toContain('# HELP process_uptime_seconds Process uptime in seconds');
      expect(output).toContain('# TYPE process_uptime_seconds gauge');
      expect(output).toContain('process_uptime_seconds 123.45');
    });

    it('set with labels works', () => {
      gauge.set({ space: 'heap_used' }, 1024000);
      gauge.set({ space: 'heap_total' }, 2048000);

      const output = gauge.serialize();
      expect(output).toContain('process_uptime_seconds{space="heap_used"} 1024000');
      expect(output).toContain('process_uptime_seconds{space="heap_total"} 2048000');
    });

    it('inc and dec work', () => {
      gauge.set({}, 10);
      gauge.inc({}, 5);
      gauge.dec({}, 3);

      const output = gauge.serialize();
      expect(output).toContain('process_uptime_seconds 12');
    });

    it('serializes zero when no values set', () => {
      const output = gauge.serialize();
      expect(output).toContain('process_uptime_seconds 0');
    });
  });

  describe('MetricsRegistry', () => {
    it('serialize() combines all metrics', () => {
      const registry = new MetricsRegistry();

      const counter = registry.createCounter('requests_total', 'Total requests');
      const gauge = registry.createGauge('active_connections', 'Active connections');
      const histogram = registry.createHistogram('response_time', 'Response time', [0.1, 0.5, 1]);

      counter.inc({ method: 'GET' }, 5);
      gauge.set({}, 42);
      histogram.observe({}, 0.3);

      const output = registry.serialize();

      expect(output).toContain('# HELP requests_total Total requests');
      expect(output).toContain('# TYPE requests_total counter');
      expect(output).toContain('requests_total{method="GET"} 5');

      expect(output).toContain('# HELP active_connections Active connections');
      expect(output).toContain('# TYPE active_connections gauge');
      expect(output).toContain('active_connections 42');

      expect(output).toContain('# HELP response_time Response time');
      expect(output).toContain('# TYPE response_time histogram');
      expect(output).toContain('response_time_bucket{le="0.5"} 1');
      expect(output).toContain('response_time_sum 0.3');
      expect(output).toContain('response_time_count 1');
    });
  });

  describe('Integration: /metrics endpoint', () => {
    it('returns Prometheus-formatted metrics after requests', async () => {
      const router = createRouter();
      router.get('/items', {
        handler: () => ({ hello: 'world' }),
      });

      const TestModule = defineModule({
        name: 'test',
        providers: [],
        routes: router.build(),
      });

      const app = await createTestingApp({ modules: [TestModule] });

      // Make some requests to generate metrics
      await app.inject({ method: 'GET', url: '/test/items' });
      await app.inject({ method: 'GET', url: '/test/items' });
      await app.inject({ method: 'GET', url: '/health' });

      const response = await app.inject({ method: 'GET', url: '/metrics' });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');

      const body = response.body;

      // Verify Prometheus format: # HELP and # TYPE lines
      expect(body).toContain('# HELP http_requests_total Total number of HTTP requests');
      expect(body).toContain('# TYPE http_requests_total counter');
      expect(body).toContain('# HELP http_request_duration_seconds HTTP request duration in seconds');
      expect(body).toContain('# TYPE http_request_duration_seconds histogram');
      expect(body).toContain('# HELP http_errors_total Total number of HTTP errors');
      expect(body).toContain('# TYPE http_errors_total counter');

      // Verify process metrics
      expect(body).toContain('# HELP process_uptime_seconds Process uptime in seconds');
      expect(body).toContain('# TYPE process_uptime_seconds gauge');
      expect(body).toContain('# HELP nodejs_heap_bytes Node.js heap memory usage in bytes');
      expect(body).toContain('# TYPE nodejs_heap_bytes gauge');
      expect(body).toContain('nodejs_heap_bytes{space="rss"}');
      expect(body).toContain('nodejs_heap_bytes{space="heap_total"}');
      expect(body).toContain('nodejs_heap_bytes{space="heap_used"}');
      expect(body).toContain('nodejs_heap_bytes{space="external"}');

      // Verify request counts
      expect(body).toContain('http_requests_total{method="GET",path="/test/items",status="200"} 2');
      expect(body).toContain('http_requests_total{method="GET",path="/health",status="200"}');
    });

    it('tracks error metrics', async () => {
      const router = createRouter();
      router.get('/fail', {
        handler: () => {
          throw new Error('boom');
        },
      });

      const TestModule = defineModule({
        name: 'test',
        providers: [],
        routes: router.build(),
      });

      const app = await createTestingApp({ modules: [TestModule] });

      await app.inject({ method: 'GET', url: '/test/fail' });

      const response = await app.inject({ method: 'GET', url: '/metrics' });
      const body = response.body;

      expect(body).toContain('http_errors_total{method="GET",path="/test/fail",status="500"} 1');
    });

    it('normalizes route params in path labels', async () => {
      const router = createRouter();
      router.get('/:id', {
        handler: ({ request }) => ({ id: (request.params as any).id }),
      });

      const TestModule = defineModule({
        name: 'items',
        providers: [],
        routes: router.build(),
      });

      const app = await createTestingApp({ modules: [TestModule] });

      await app.inject({ method: 'GET', url: '/items/123' });
      await app.inject({ method: 'GET', url: '/items/456' });

      const response = await app.inject({ method: 'GET', url: '/metrics' });
      const body = response.body;

      // Should use the route pattern, not the actual param values
      expect(body).toContain('path="/items/:id"');
      expect(body).not.toContain('path="/items/123"');
      expect(body).not.toContain('path="/items/456"');
    });
  });
});
