import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ServiceCommunicationService } from './service-communication.service';
import {
  HealthCheckResponse,
  ServiceEndpoint,
} from '../interfaces/service-communication.interface';

export interface ServiceMetrics {
  serviceName: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  uptime: number;
  errorRate: number;
  requestCount: number;
  lastCheck: Date;
  consecutiveFailures: number;
}

export interface SystemMetrics {
  totalServices: number;
  healthyServices: number;
  unhealthyServices: number;
  degradedServices: number;
  averageResponseTime: number;
  systemUptime: number;
  lastUpdate: Date;
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private readonly serviceMetrics: Map<string, ServiceMetrics> = new Map();
  private readonly systemStartTime = Date.now();
  private monitoringTimer: NodeJS.Timeout | null = null;
  private readonly monitoringInterval: number;
  private readonly maxConsecutiveFailures: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly serviceCommunication: ServiceCommunicationService
  ) {
    this.monitoringInterval = this.configService.get<number>('MONITORING_INTERVAL', 30000);
    this.maxConsecutiveFailures = this.configService.get<number>('MAX_CONSECUTIVE_FAILURES', 3);
    
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    const monitoringEnabled = this.configService.get<boolean>('MONITORING_ENABLED', true);
    
    if (!monitoringEnabled) {
      this.logger.log('Service monitoring is disabled');
      return;
    }

    this.logger.log('Initializing service monitoring');
    this.startMonitoring();
  }

  private startMonitoring() {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }

    // 立即执行一次检查
    this.performHealthChecks();

    // 设置定时检查
    this.monitoringTimer = setInterval(async () => {
      await this.performHealthChecks();
    }, this.monitoringInterval);

    this.logger.log(`Service monitoring started with interval: ${this.monitoringInterval}ms`);
  }

  private async performHealthChecks() {
    try {
      const services = this.serviceCommunication.getAllServices();
      const checkPromises = services.map(service => this.checkServiceHealth(service));
      
      await Promise.allSettled(checkPromises);
      
      // 更新系统指标
      this.updateSystemMetrics();
      
      // 发出监控事件
      this.eventEmitter.emit('monitoring.health_check_completed', {
        timestamp: new Date().toISOString(),
        metrics: this.getSystemMetrics(),
      });
    } catch (error) {
      this.logger.error('Error during health checks:', error);
    }
  }

  private async checkServiceHealth(service: ServiceEndpoint): Promise<void> {
    const startTime = Date.now();
    let metrics = this.serviceMetrics.get(service.name);

    if (!metrics) {
      metrics = {
        serviceName: service.name,
        status: 'healthy',
        responseTime: 0,
        uptime: 0,
        errorRate: 0,
        requestCount: 0,
        lastCheck: new Date(),
        consecutiveFailures: 0,
      };
      this.serviceMetrics.set(service.name, metrics);
    }

    try {
      const healthData = await this.serviceCommunication.healthCheck(service.name);
      const responseTime = Date.now() - startTime;

      if (healthData) {
        // 服务健康
        metrics.status = healthData.status === 'healthy' ? 'healthy' : 'degraded';
        metrics.responseTime = responseTime;
        metrics.consecutiveFailures = 0;
        metrics.requestCount++;
        
        // 发出服务恢复事件
        if (metrics.consecutiveFailures > 0) {
          this.eventEmitter.emit('monitoring.service_recovered', {
            serviceName: service.name,
            timestamp: new Date().toISOString(),
            responseTime,
          });
        }
      } else {
        // 服务不健康
        metrics.status = 'unhealthy';
        metrics.responseTime = responseTime;
        metrics.consecutiveFailures++;
        metrics.requestCount++;

        // 发出服务故障事件
        this.eventEmitter.emit('monitoring.service_unhealthy', {
          serviceName: service.name,
          timestamp: new Date().toISOString(),
          consecutiveFailures: metrics.consecutiveFailures,
          responseTime,
        });

        // 如果连续失败次数超过阈值，发出严重故障事件
        if (metrics.consecutiveFailures >= this.maxConsecutiveFailures) {
          this.eventEmitter.emit('monitoring.service_critical', {
            serviceName: service.name,
            timestamp: new Date().toISOString(),
            consecutiveFailures: metrics.consecutiveFailures,
          });
        }
      }

      metrics.lastCheck = new Date();
      
    } catch (error) {
      this.logger.error(`Health check failed for service ${service.name}:`, error);
      
      metrics.status = 'unhealthy';
      metrics.responseTime = Date.now() - startTime;
      metrics.consecutiveFailures++;
      metrics.requestCount++;
      metrics.lastCheck = new Date();

      this.eventEmitter.emit('monitoring.service_error', {
        serviceName: service.name,
        timestamp: new Date().toISOString(),
        error: error.message,
        consecutiveFailures: metrics.consecutiveFailures,
      });
    }
  }

  private updateSystemMetrics() {
    const allMetrics = Array.from(this.serviceMetrics.values());
    
    if (allMetrics.length === 0) {
      return;
    }

    const healthyCount = allMetrics.filter(m => m.status === 'healthy').length;
    const unhealthyCount = allMetrics.filter(m => m.status === 'unhealthy').length;
    const degradedCount = allMetrics.filter(m => m.status === 'degraded').length;
    
    const totalResponseTime = allMetrics.reduce((sum, m) => sum + m.responseTime, 0);
    const averageResponseTime = totalResponseTime / allMetrics.length;

    const systemMetrics: SystemMetrics = {
      totalServices: allMetrics.length,
      healthyServices: healthyCount,
      unhealthyServices: unhealthyCount,
      degradedServices: degradedCount,
      averageResponseTime,
      systemUptime: Date.now() - this.systemStartTime,
      lastUpdate: new Date(),
    };

    // 发出系统指标更新事件
    this.eventEmitter.emit('monitoring.system_metrics_updated', systemMetrics);
  }

  // 公共方法：获取服务指标
  getServiceMetrics(serviceName?: string): ServiceMetrics | ServiceMetrics[] | null {
    if (serviceName) {
      return this.serviceMetrics.get(serviceName) || null;
    }
    return Array.from(this.serviceMetrics.values());
  }

  // 公共方法：获取系统指标
  getSystemMetrics(): SystemMetrics {
    const allMetrics = Array.from(this.serviceMetrics.values());
    
    if (allMetrics.length === 0) {
      return {
        totalServices: 0,
        healthyServices: 0,
        unhealthyServices: 0,
        degradedServices: 0,
        averageResponseTime: 0,
        systemUptime: Date.now() - this.systemStartTime,
        lastUpdate: new Date(),
      };
    }

    const healthyCount = allMetrics.filter(m => m.status === 'healthy').length;
    const unhealthyCount = allMetrics.filter(m => m.status === 'unhealthy').length;
    const degradedCount = allMetrics.filter(m => m.status === 'degraded').length;
    
    const totalResponseTime = allMetrics.reduce((sum, m) => sum + m.responseTime, 0);
    const averageResponseTime = totalResponseTime / allMetrics.length;

    return {
      totalServices: allMetrics.length,
      healthyServices: healthyCount,
      unhealthyServices: unhealthyCount,
      degradedServices: degradedCount,
      averageResponseTime,
      systemUptime: Date.now() - this.systemStartTime,
      lastUpdate: new Date(),
    };
  }

  // 公共方法：手动触发健康检查
  async triggerHealthCheck(serviceName?: string): Promise<void> {
    if (serviceName) {
      const service = this.serviceCommunication.getServiceEndpoint(serviceName);
      if (service) {
        await this.checkServiceHealth(service);
      }
    } else {
      await this.performHealthChecks();
    }
  }

  // 公共方法：重置服务指标
  resetServiceMetrics(serviceName?: string): void {
    if (serviceName) {
      this.serviceMetrics.delete(serviceName);
    } else {
      this.serviceMetrics.clear();
    }
  }

  // 停止监控
  stop(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
    this.logger.log('Service monitoring stopped');
  }
}
