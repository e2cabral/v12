import type { Logger } from 'pino';

export type AuditEntry = {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'OTHER';
  resource: string;
  resourceId?: string;
  userId?: string;
  previousData?: any;
  newData?: any;
  metadata?: any;
  timestamp?: Date;
};

export class AuditService {
  constructor(private logger: Logger) {}

  async log(entry: AuditEntry) {
    const auditLog = {
      ...entry,
      timestamp: entry.timestamp || new Date(),
    };

    // Por padrão, enviamos para o logger estruturado
    // Mas no futuro pode salvar em um banco dedicado ou enviar para um serviço externo
    this.logger.info({ audit: auditLog }, `Audit Log: ${entry.action} on ${entry.resource}`);
    
    return auditLog;
  }
}
