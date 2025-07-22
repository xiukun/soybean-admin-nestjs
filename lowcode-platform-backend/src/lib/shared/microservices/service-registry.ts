import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceTracing } from '../middleware/tracing.middleware';

export interface ServiceEndpoint {
  name: string;
  url: string;
  version: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  capabilities: string[];
}

export interface ServiceRequest {
  service: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  status: number;
  headers?: Record<string, string>;
  duration: number;
}

@Injectable()
export class ServiceRegistry {
  private readonly logger = new Logger(ServiceRegistry.name);
  private services = new Map<string, ServiceEndpoint>();

  constructor(private readonly configService: ConfigService) {
    this.initializeServices();
  }

  /**
   * 初始化服务注册表
   */
  private initializeServices() {
    const services = [
      {
        name: 'backend',
        url: this.configService.get('BACKEND_URL', 'http://localhost:3000'),
        version: '1.0.0',
        capabilities: ['auth', 'user-management', 'system-config'],
      },
      {
        name: 'lowcode-platform-backend',
        url: this.configService.get('LOWCODE_PLATFORM_URL', 'http://localhost:3100'),
        version: '1.0.0',
        capabilities: ['entity-management', 'code-generation', 'template-management'],
      },
      {
        name: 'amis-lowcode-backend',
        url: this.configService.get('AMIS_BACKEND_URL', 'http://localhost:3200'),
        version: '1.0.0',
        capabilities: ['generated-apis', 'dynamic-crud', 'amis-pages'],
      },
      {
        name: 'lowcode-designer',
        url: this.configService.get('DESIGNER_URL', 'http://localhost:3300'),
        version: '1.0.0',
        capabilities: ['visual-design', 'entity-designer', 'relationship-designer'],
      },
      {
        name: 'frontend',
        url: this.configService.get('FRONTEND_URL', 'http://localhost:3400'),
        version: '1.0.0',
        capabilities: ['web-ui', 'admin-panel', 'user-interface'],
      },
    ];

    services.forEach(service => {
      this.services.set(service.name, {
        ...service,
        status: 'unknown',
        lastCheck: new Date(),
      });
    });

    this.logger.log(`Initialized ${services.length} services in registry`);
  }

  /**
   * 获取服务信息
   */
  getService(name: string): ServiceEndpoint | undefined {
    return this.services.get(name);
  }

  /**
   * 获取所有服务
   */
  getAllServices(): ServiceEndpoint[] {
    return Array.from(this.services.values());
  }

  /**
   * 更新服务状态
   */
  updateServiceStatus(name: string, status: 'healthy' | 'unhealthy' | 'unknown') {
    const service = this.services.get(name);
    if (service) {
      service.status = status;
      service.lastCheck = new Date();
      this.services.set(name, service);
    }
  }

  /**
   * 检查服务健康状态
   */
  async checkServiceHealth(name: string): Promise<boolean> {
    const service = this.services.get(name);
    if (!service) {
      this.logger.warn(`Service ${name} not found in registry`);
      return false;
    }

    try {
      const response = await this.makeRequest({
        service: name,
        endpoint: '/health',
        method: 'GET',
        timeout: 5000,
      });

      const isHealthy = response.success && response.status === 200;
      this.updateServiceStatus(name, isHealthy ? 'healthy' : 'unhealthy');
      return isHealthy;

    } catch (error) {
      this.logger.error(`Health check failed for ${name}:`, error.message);
      this.updateServiceStatus(name, 'unhealthy');
      return false;
    }
  }

  /**
   * 统一的服务请求方法
   */
  async makeRequest<T = any>(request: ServiceRequest): Promise<ServiceResponse<T>> {
    const service = this.services.get(request.service);
    if (!service) {
      throw new Error(`Service ${request.service} not found in registry`);
    }

    const startTime = Date.now();
    const url = `${service.url}${request.endpoint}`;

    return ServiceTracing.traceServiceCall(
      request.service,
      `${request.method} ${request.endpoint}`,
      async () => {
        try {
          const headers = {
            'Content-Type': 'application/json',
            'X-Service-Name': 'lowcode-platform-backend',
            'X-Service-Version': '1.0.0',
            ...ServiceTracing.createTracingHeaders(),
            ...request.headers,
          };

          const fetchOptions: RequestInit = {
            method: request.method,
            headers,
            signal: AbortSignal.timeout(request.timeout || 30000),
          };

          if (request.data && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
            fetchOptions.body = JSON.stringify(request.data);
          }

          const response = await fetch(url, fetchOptions);
          const duration = Date.now() - startTime;

          let responseData: T | undefined;
          const contentType = response.headers.get('content-type');
          
          if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
          } else {
            responseData = await response.text() as any;
          }

          const serviceResponse: ServiceResponse<T> = {
            success: response.ok,
            data: responseData,
            status: response.status,
            duration,
            headers: Object.fromEntries(response.headers.entries()),
          };

          if (!response.ok) {
            serviceResponse.message = `HTTP ${response.status}: ${response.statusText}`;
          }

          // 更新服务状态
          this.updateServiceStatus(request.service, response.ok ? 'healthy' : 'unhealthy');

          return serviceResponse;

        } catch (error) {
          const duration = Date.now() - startTime;
          this.updateServiceStatus(request.service, 'unhealthy');

          if (error.name === 'AbortError') {
            throw new Error(`Request to ${request.service} timed out after ${request.timeout || 30000}ms`);
          }

          throw new Error(`Request to ${request.service} failed: ${error.message}`);
        }
      }
    );
  }

  /**
   * 批量健康检查
   */
  async checkAllServicesHealth(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    const services = Array.from(this.services.keys());

    await Promise.allSettled(
      services.map(async (serviceName) => {
        try {
          results[serviceName] = await this.checkServiceHealth(serviceName);
        } catch (error) {
          results[serviceName] = false;
        }
      })
    );

    return results;
  }

  /**
   * 获取服务发现信息
   */
  getServiceDiscovery() {
    return {
      services: this.getAllServices(),
      timestamp: new Date().toISOString(),
      registry: 'lowcode-platform-backend',
    };
  }
}

/**
 * 微服务通信装饰器
 */
export function MicroserviceCall(serviceName: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const serviceRegistry = this.serviceRegistry as ServiceRegistry;
      if (!serviceRegistry) {
        throw new Error('ServiceRegistry not injected');
      }

      const logger = new Logger(`${target.constructor.name}.${propertyName}`);
      logger.debug(`Making call to service: ${serviceName}`);

      try {
        return await method.apply(this, args);
      } catch (error) {
        logger.error(`Service call to ${serviceName} failed:`, error.message);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * 服务间数据传输对象基类
 */
export abstract class ServiceDTO {
  timestamp: string = new Date().toISOString();
  source: string = 'lowcode-platform-backend';
  version: string = '1.0.0';
  traceId?: string;

  constructor() {
    const context = ServiceTracing.getCurrentContext();
    if (context) {
      this.traceId = context.traceId;
    }
  }
}

/**
 * 实体同步DTO
 */
export class EntitySyncDTO extends ServiceDTO {
  constructor(
    public entityId: string,
    public entityData: any,
    public operation: 'create' | 'update' | 'delete',
    public metadata?: any
  ) {
    super();
  }
}

/**
 * 代码生成DTO
 */
export class CodeGenerationDTO extends ServiceDTO {
  constructor(
    public entityIds: string[],
    public targetService: string,
    public options: any,
    public templates?: string[]
  ) {
    super();
  }
}

/**
 * 设计器数据DTO
 */
export class DesignerDataDTO extends ServiceDTO {
  constructor(
    public designData: any,
    public designType: 'entity' | 'relationship' | 'page',
    public projectId?: string
  ) {
    super();
  }
}
