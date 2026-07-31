export type MetricLabels = Record<string, string>;

function labelsKey(labels: MetricLabels): string {
  const keys = Object.keys(labels).sort();
  if (keys.length === 0) return '';
  return keys.map((k) => `${k}="${labels[k]}"`).join(',');
}

function formatLabels(labels: MetricLabels, extra?: Record<string, string>): string {
  const merged = extra ? { ...labels, ...extra } : labels;
  const keys = Object.keys(merged).sort();
  if (keys.length === 0) return '';
  return `{${keys.map((k) => `${k}="${merged[k]}"`).join(',')}}`;
}

export class Counter {
  private values = new Map<string, number>();

  constructor(
    public readonly name: string,
    public readonly help: string,
  ) {}

  inc(labels: MetricLabels = {}, value = 1): void {
    const key = labelsKey(labels);
    this.values.set(key, (this.values.get(key) ?? 0) + value);
  }

  serialize(): string {
    const lines: string[] = [
      `# HELP ${this.name} ${this.help}`,
      `# TYPE ${this.name} counter`,
    ];

    if (this.values.size === 0) {
      lines.push(`${this.name} 0`);
    } else {
      for (const [key, value] of this.values) {
        const labelStr = key ? `{${key}}` : '';
        lines.push(`${this.name}${labelStr} ${value}`);
      }
    }

    return lines.join('\n');
  }
}

export class Histogram {
  private buckets: number[];
  private counts = new Map<string, number[]>();
  private sums = new Map<string, number>();
  private totals = new Map<string, number>();

  constructor(
    public readonly name: string,
    public readonly help: string,
    buckets?: number[],
  ) {
    this.buckets = buckets ?? [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
  }

  observe(labels: MetricLabels = {}, value: number): void {
    const key = labelsKey(labels);

    if (!this.counts.has(key)) {
      this.counts.set(key, new Array(this.buckets.length + 1).fill(0));
      this.sums.set(key, 0);
      this.totals.set(key, 0);
    }

    const bucketCounts = this.counts.get(key)!;
    for (let i = 0; i < this.buckets.length; i++) {
      if (value <= this.buckets[i]) {
        bucketCounts[i]++;
      }
    }
    // +Inf bucket
    bucketCounts[this.buckets.length]++;

    this.sums.set(key, this.sums.get(key)! + value);
    this.totals.set(key, this.totals.get(key)! + 1);
  }

  serialize(): string {
    const lines: string[] = [
      `# HELP ${this.name} ${this.help}`,
      `# TYPE ${this.name} histogram`,
    ];

    for (const [key, bucketCounts] of this.counts) {
      const baseLabels = key ? `${key},` : '';

      for (let i = 0; i < this.buckets.length; i++) {
        lines.push(
          `${this.name}_bucket{${baseLabels}le="${this.buckets[i]}"} ${bucketCounts[i]}`,
        );
      }
      lines.push(
        `${this.name}_bucket{${baseLabels}le="+Inf"} ${bucketCounts[this.buckets.length]}`,
      );

      const labelStr = key ? `{${key}}` : '';
      lines.push(`${this.name}_sum${labelStr} ${this.sums.get(key)!}`);
      lines.push(`${this.name}_count${labelStr} ${this.totals.get(key)!}`);
    }

    return lines.join('\n');
  }
}

export class Gauge {
  private values = new Map<string, number>();

  constructor(
    public readonly name: string,
    public readonly help: string,
  ) {}

  set(labels: MetricLabels = {}, value: number): void {
    const key = labelsKey(labels);
    this.values.set(key, value);
  }

  inc(labels: MetricLabels = {}, value = 1): void {
    const key = labelsKey(labels);
    this.values.set(key, (this.values.get(key) ?? 0) + value);
  }

  dec(labels: MetricLabels = {}, value = 1): void {
    const key = labelsKey(labels);
    this.values.set(key, (this.values.get(key) ?? 0) - value);
  }

  serialize(): string {
    const lines: string[] = [
      `# HELP ${this.name} ${this.help}`,
      `# TYPE ${this.name} gauge`,
    ];

    if (this.values.size === 0) {
      lines.push(`${this.name} 0`);
    } else {
      for (const [key, value] of this.values) {
        const labelStr = key ? `{${key}}` : '';
        lines.push(`${this.name}${labelStr} ${value}`);
      }
    }

    return lines.join('\n');
  }
}

export class MetricsRegistry {
  private metrics: Array<Counter | Histogram | Gauge> = [];

  createCounter(name: string, help: string): Counter {
    const counter = new Counter(name, help);
    this.metrics.push(counter);
    return counter;
  }

  createHistogram(name: string, help: string, buckets?: number[]): Histogram {
    const histogram = new Histogram(name, help, buckets);
    this.metrics.push(histogram);
    return histogram;
  }

  createGauge(name: string, help: string): Gauge {
    const gauge = new Gauge(name, help);
    this.metrics.push(gauge);
    return gauge;
  }

  serialize(): string {
    return this.metrics.map((m) => m.serialize()).join('\n');
  }
}
