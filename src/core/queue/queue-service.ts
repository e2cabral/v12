import { Queue, type Job, type QueueOptions } from 'bullmq';

export class QueueService {
  private queues = new Map<string, Queue>();

  constructor(private redisConfig: any) {}

  get(name: string, options?: Omit<QueueOptions, 'connection'>): Queue {
    if (!this.queues.has(name)) {
      this.queues.set(
        name,
        new Queue(name, {
          ...options,
          connection: this.redisConfig,
        }),
      );
    }
    return this.queues.get(name)!;
  }

  async add(queueName: string, jobName: string, data: any, options?: any): Promise<Job> {
    const queue = this.get(queueName);
    return queue.add(jobName, data, options);
  }

  async close(): Promise<void> {
    for (const queue of this.queues.values()) {
      await queue.close();
    }
  }
}
