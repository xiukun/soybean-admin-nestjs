import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import {
  ServiceRequest,
  ServiceResponse,
  ServiceError,
  ServiceEndpoint,
  ServiceContext,
  HealthCheckResponse,
} from '../interfaces/service-communication.interface';

@Injectable()
export class ServiceCommunicationService {
  private readonly logger = new Logger(ServiceCommunicationService.name);
  private readonly httpClient: AxiosInstance;
  private readonly services: Map<string, ServiceEndpoint> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.httpClient = axios.create({
      timeout: this.configService.get<number>('SERVICE_TIMEOUT', 30000),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.initializeServices();
  }

  private setupInterceptors() {
    // 请求拦截器
    this.httpClient.interceptors.request.use(
      (config) => {
        const traceId = uuidv4();
        const requestId = uuidv4();
        
        config.headers['X-Trace-ID'] = traceId;
        config.headers['X-Request-ID'] = requestId;
        config.headers['X-Service-Source'] = this.configService.get<string>('SERVICE_NAME', 'unknown');
        config.headers['X-Timestamp'] = new Date().toISOString();

        this.logger.debug(`Outgoing request: ${config.method?.toUpperCase()} ${config.url}`, {
          traceId,
          requestId,
        });

        return config;
      },
      (error) => {
        this.logger.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.httpClient.interceptors.response.use(
      (response) => {
        const duration = Date.now() - (response.config as any).startTime;
        
        this.logger.debug(`Response received: ${response.status}`, {
          url: response.config.url,
          duration,
          traceId: response.headers['x-trace-id'],
        });

        return response;
      },
      (error) => {
        const duration = Date.now() - (error.config as any).startTime;
        
        this.logger.error(`Request failed: ${error.message}`, {
          url: error.config?.url,
          status: error.response?.status,
          duration,
          traceId: error.config?.headers['X-Trace-ID'],
        });

        return Promise.reject(error);
      }
    );
  }

  private initializeServices() {
    // 注册已知服务
    const services = [
      {
        name: 'backend',
        url: this.configService.get<string>('BACKEND_URL', 'http://localhost:9528'),
        version: '1.0.0',
        status: 'unknown' as const,
        capabilities: ['auth', 'user-management', 'system-config'],
      },
      {
        name: 'lowcode-platform',
        url: this.configService.get<string>('LOWCODE_PLATFORM_URL', 'http://localhost:3000'),
        version: '1.0.0',
        status: 'unknown' as const,
        capabilities: ['entity-management', 'code-generation', 'template-management'],
      },
      {
        name: 'amis-backend',
        url: this.configService.get<string>('AMIS_BACKEND_URL', 'http://localhost:9522'),
        version: '1.0.0',
        status: 'unknown' as const,
        capabilities: ['business-api', 'amis-compatible'],
      },
    ];

    services.forEach(service => {
      this.services.set(service.name, service);
    });
  }

  async callService<T = any, R = any>(
    request: ServiceRequest<T>
  ): Promise<ServiceResponse<R>> {
    const startTime = Date.now();
    const traceId = uuidv4();

    try {
      const service = this.services.get(request.service);
      if (!service) {
        throw new Error(`Service '${request.service}' not found`);
      }

      const url = `${service.url}${request.endpoint}`;
      const config: AxiosRequestConfig = {
        method: request.method,
        url,
        data: request.data,
        headers: {
          ...request.headers,
          'X-Trace-ID': traceId,
          'Authorization': request.headers?.Authorization,
        },
        timeout: request.timeout || 30000,
      };

      (config as any).startTime = startTime;

      const response = await this.httpClient.request(config);
      const duration = Date.now() - startTime;

      return {
        success: true,
        data: response.data,
        status: response.status,
        duration,
        timestamp: new Date().toISOString(),
        traceId,
        service: request.service,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      this.logger.error(`Service call failed: ${request.service}${request.endpoint}`, {
        error: error.message,
        traceId,
        duration,
      });

      return {
        success: false,
        message: error.message,
        status: error.response?.status || 500,
        duration,
        timestamp: new Date().toISOString(),
        traceId,
        service: request.service,
      };
    }
  }

  async healthCheck(serviceName: string): Promise<HealthCheckResponse | null> {
    try {
      const service = this.services.get(serviceName);
      if (!service) {
        return null;
      }

      const response = await this.callService({
        service: serviceName,
        endpoint: '/health',
        method: 'GET',
        timeout: 5000,
      });

      if (response.success) {
        service.status = 'healthy';
        service.lastHealthCheck = new Date();
        return response.data as HealthCheckResponse;
      } else {
        service.status = 'unhealthy';
        return null;
      }
    } catch (error) {
      const service = this.services.get(serviceName);
      if (service) {
        service.status = 'unhealthy';
      }
      return null;
    }
  }

  async healthCheckAll(): Promise<Record<string, HealthCheckResponse | null>> {
    const results: Record<string, HealthCheckResponse | null> = {};
    
    const promises = Array.from(this.services.keys()).map(async (serviceName) => {
      results[serviceName] = await this.healthCheck(serviceName);
    });

    await Promise.all(promises);
    return results;
  }

  getServiceEndpoint(serviceName: string): ServiceEndpoint | undefined {
    return this.services.get(serviceName);
  }

  getAllServices(): ServiceEndpoint[] {
    return Array.from(this.services.values());
  }

  registerService(service: ServiceEndpoint): void {
    this.services.set(service.name, service);
    this.logger.log(`Service registered: ${service.name} at ${service.url}`);
  }
}
