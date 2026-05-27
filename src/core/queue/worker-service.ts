import { Worker, type Job, type WorkerOptions } from 'bullmq';

export type JobHandler<T = any, R = any> = (job: Job<T, R>) => Promise<R>;

export class WorkerService {
  private workers: Worker[] = [];

  constructor(private redisConfig: any) {}

  register<T = any, R = any>(
    queueName: string,
    handler: JobHandler<T, R>,
    options?: Omit<WorkerOptions, 'connection'>,
  ): Worker {
    const worker = new Worker(queueName, handler, {
      ...options,
      connection: this.redisConfig,
    });

    this.workers.push(worker);
    return worker;
  }

  async close(): Promise<void> {
    await Promise.all(this.workers.map((w) => w.close()));
  }
}
