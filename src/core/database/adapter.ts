export interface DatabaseAdapter {
  name: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  transaction?<T>(fn: (tx: any) => Promise<T>): Promise<T>;
}

export const defineAdapter = (adapter: DatabaseAdapter): DatabaseAdapter => adapter;
