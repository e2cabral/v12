import type { RequestContext, RouteMiddleware } from '../http/router.js';

export type MultiTenancyOptions = {
  header?: string;
  query?: string;
  cookie?: string;
  defaultTenant?: string;
  required?: boolean;
};

export function multiTenancy(options: MultiTenancyOptions = {}): RouteMiddleware {
  const headerName = options.header || 'x-tenant-id';
  const queryName = options.query || 'tenantId';
  
  return async (context: RequestContext) => {
    const { request, container } = context;
    
    let tenantId = (request.headers[headerName] as string) || 
                   (request.query as any)?.[queryName] ||
                   options.defaultTenant;

    if (!tenantId && options.required) {
      throw new Error('Tenant ID is required');
    }

    // Registra o tenantId no container da requisição para ser injetado nos repositories
    container.register({
      provide: 'TenantId',
      useValue: tenantId
    });
  };
}
