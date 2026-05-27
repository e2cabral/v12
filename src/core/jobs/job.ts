export type JobDefinition<TPayload = void> = {
  name: string;
  timeoutMs?: number;
  retries?: number;
  handler: (payload: TPayload) => Promise<void> | void;
};

export const defineJob = <TPayload>(job: JobDefinition<TPayload>) => job;
