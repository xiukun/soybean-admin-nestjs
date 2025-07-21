import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PerformanceMonitorService } from '@lib/shared/monitoring/performance-monitor.service';
import { EnhancedLoggerService } from '@lib/shared/logging/enhanced-logger.service';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ApiHealthCheckResponses, ApiSuccessResponse } from '@lib/shared/decorators/api-response.decorators';
import { Public } from '@lib/shared/decorators/public.decorator';

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: ServiceHealth;
    cache?: ServiceHealth;
    fileSystem: ServiceHealth;
    memory: ServiceHealth;
    cpu: ServiceHealth;
  };
  metrics: {
    requests: {
      total: number;
      successful: number;
      failed: number;
      averageResponseTime: number;
    };
    system: {
      memoryUsage: number;
      cpuUsage: number;
      uptime: number;
    };
  };
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  details?: any;
  lastChecked: string;
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly performanceMonitor: PerformanceMonitorService,
    private readonly logger: EnhancedLoggerService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.logger = this.logger.child('HealthController');
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Health check endpoint',
    description: 'Returns the overall health status of the application and its dependencies'
  })
  @ApiHealthCheckResponses()
  async getHealth(): Promise<{ status: number; msg: string; data: HealthCheckResponse }> {
    const startTime = Date.now();
    
    try {
      // Get system metrics
      const systemMetrics = this.performanceMonitor.getSystemMetrics();
      const appMetrics = this.performanceMonitor.getApplicationMetrics();
      const healthStatus = this.performanceMonitor.getHealthStatus();
      
      // Check individual services
      const services = await this.checkServices();
      
      // Determine overall status
      const overallStatus = this.determineOverallStatus(healthStatus.status, services);
      
      const response: HealthCheckResponse = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: this.configService.get('APP_VERSION', '1.0.0'),
        environment: this.configService.get('NODE_ENV', 'development'),
        services,
        metrics: {
          requests: {
            total: appMetrics.requests.total,
            successful: appMetrics.requests.successful,
            failed: appMetrics.requests.failed,
            averageResponseTime: appMetrics.requests.averageResponseTime,
          },
          system: {
            memoryUsage: systemMetrics.memory.usagePercent,
            cpuUsage: systemMetrics.cpu.usage,
            uptime: systemMetrics.process.uptime,
          },
        },
      };
      
      const responseTime = Date.now() - startTime;
      
      // Log health check
      this.logger.log(`Health check completed in ${responseTime}ms`, {
        status: overallStatus,
        responseTime,
        services: Object.keys(services),
      });
      
      // Record metrics
      this.performanceMonitor.recordTiming('health_check_duration', responseTime);
      this.performanceMonitor.recordCounter('health_checks_total', 1, {
        status: overallStatus,
      });
      
      return {
        status: 0,
        msg: 'success',
        data: response,
      };
    } catch (error) {
      this.logger.error('Health check failed', error.stack);
      
      this.performanceMonitor.recordCounter('health_checks_total', 1, {
        status: 'error',
      });
      
      return {
        status: 1,
        msg: 'Health check failed',
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          version: this.configService.get('APP_VERSION', '1.0.0'),
          environment: this.configService.get('NODE_ENV', 'development'),
          services: {
            database: { status: 'unhealthy', lastChecked: new Date().toISOString() },
            fileSystem: { status: 'unhealthy', lastChecked: new Date().toISOString() },
            memory: { status: 'unhealthy', lastChecked: new Date().toISOString() },
            cpu: { status: 'unhealthy', lastChecked: new Date().toISOString() },
          },
          metrics: {
            requests: { total: 0, successful: 0, failed: 0, averageResponseTime: 0 },
            system: { memoryUsage: 0, cpuUsage: 0, uptime: 0 },
          },
        },
      };
    }
  }

  @Get('detailed')
  @Public()
  @ApiOperation({
    summary: 'Detailed health check',
    description: 'Returns detailed health information including performance metrics and service diagnostics'
  })
  @ApiSuccessResponse()
  async getDetailedHealth(): Promise<{ status: number; msg: string; data: any }> {
    try {
      const systemMetrics = this.performanceMonitor.getSystemMetrics();
      const appMetrics = this.performanceMonitor.getApplicationMetrics();
      const metricsSummary = this.performanceMonitor.getMetricsSummary();
      const services = await this.checkServices();
      
      const detailedHealth = {
        overview: {
          status: this.performanceMonitor.getHealthStatus().status,
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          version: this.configService.get('APP_VERSION', '1.0.0'),
          environment: this.configService.get('NODE_ENV', 'development'),
        },
        system: {
          cpu: {
            usage: systemMetrics.cpu.usage,
            cores: systemMetrics.cpu.cores,
            loadAverage: systemMetrics.cpu.loadAverage,
          },
          memory: {
            total: systemMetrics.memory.total,
            used: systemMetrics.memory.used,
            free: systemMetrics.memory.free,
            usagePercent: systemMetrics.memory.usagePercent,
            heap: systemMetrics.memory.heap,
          },
          process: {
            pid: systemMetrics.process.pid,
            uptime: systemMetrics.process.uptime,
            memoryUsage: systemMetrics.process.memoryUsage,
          },
        },
        application: {
          requests: appMetrics.requests,
          codeGeneration: appMetrics.codeGeneration,
          templates: appMetrics.templates,
          database: appMetrics.database,
        },
        services,
        metrics: {
          summary: metricsSummary,
          recent: this.performanceMonitor.getMetrics().slice(0, 50), // Last 50 metrics
        },
      };
      
      return {
        status: 0,
        msg: 'success',
        data: detailedHealth,
      };
    } catch (error) {
      this.logger.error('Detailed health check failed', error.stack);
      
      return {
        status: 1,
        msg: 'Detailed health check failed',
        data: { error: error.message },
      };
    }
  }

  @Get('metrics')
  @Public()
  @ApiOperation({
    summary: 'Performance metrics',
    description: 'Returns current performance metrics and statistics'
  })
  @ApiSuccessResponse()
  async getMetrics(): Promise<{ status: number; msg: string; data: any }> {
    try {
      const systemMetrics = this.performanceMonitor.getSystemMetrics();
      const appMetrics = this.performanceMonitor.getApplicationMetrics();
      const metricsSummary = this.performanceMonitor.getMetricsSummary();
      
      return {
        status: 0,
        msg: 'success',
        data: {
          system: systemMetrics,
          application: appMetrics,
          summary: metricsSummary,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('Failed to get metrics', error.stack);
      
      return {
        status: 1,
        msg: 'Failed to get metrics',
        data: { error: error.message },
      };
    }
  }

  @Get('ready')
  @Public()
  @ApiOperation({
    summary: 'Readiness check',
    description: 'Returns whether the application is ready to serve requests'
  })
  @ApiSuccessResponse()
  async getReadiness(): Promise<{ status: number; msg: string; data: any }> {
    try {
      // Check critical services
      const databaseHealth = await this.checkDatabaseHealth();
      const fileSystemHealth = await this.checkFileSystemHealth();
      
      const isReady = databaseHealth.status === 'healthy' && 
                     fileSystemHealth.status === 'healthy';
      
      return {
        status: isReady ? 0 : 1,
        msg: isReady ? 'ready' : 'not ready',
        data: {
          ready: isReady,
          timestamp: new Date().toISOString(),
          checks: {
            database: databaseHealth,
            fileSystem: fileSystemHealth,
          },
        },
      };
    } catch (error) {
      this.logger.error('Readiness check failed', error.stack);
      
      return {
        status: 1,
        msg: 'not ready',
        data: {
          ready: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  @Get('live')
  @Public()
  @ApiOperation({
    summary: 'Liveness check',
    description: 'Returns whether the application is alive and responding'
  })
  @ApiSuccessResponse()
  async getLiveness(): Promise<{ status: number; msg: string; data: any }> {
    // Simple liveness check - if we can respond, we're alive
    return {
      status: 0,
      msg: 'alive',
      data: {
        alive: true,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        pid: process.pid,
      },
    };
  }

  private async checkServices(): Promise<HealthCheckResponse['services']> {
    const [database, fileSystem, memory, cpu] = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkFileSystemHealth(),
      this.checkMemoryHealth(),
      this.checkCpuHealth(),
    ]);
    
    return {
      database,
      fileSystem,
      memory,
      cpu,
    };
  }

  private async checkDatabaseHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Simple database query to check connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: {
          connectionPool: 'active',
          responseTime: `${responseTime}ms`,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        lastChecked: new Date().toISOString(),
        details: {
          error: error.message,
        },
      };
    }
  }

  private async checkFileSystemHealth(): Promise<ServiceHealth> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const testFile = path.join(process.cwd(), 'health-check.tmp');
      
      // Test write
      await fs.writeFile(testFile, 'health-check');
      
      // Test read
      const content = await fs.readFile(testFile, 'utf8');
      
      // Clean up
      await fs.unlink(testFile);
      
      return {
        status: content === 'health-check' ? 'healthy' : 'unhealthy',
        lastChecked: new Date().toISOString(),
        details: {
          writable: true,
          readable: true,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        lastChecked: new Date().toISOString(),
        details: {
          error: error.message,
        },
      };
    }
  }

  private async checkMemoryHealth(): Promise<ServiceHealth> {
    const memoryUsage = process.memoryUsage();
    const systemMemory = this.performanceMonitor.getSystemMetrics().memory;
    
    const heapUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    const systemUsagePercent = systemMemory.usagePercent;
    
    const status = heapUsagePercent < 90 && systemUsagePercent < 90 ? 'healthy' : 'unhealthy';
    
    return {
      status,
      lastChecked: new Date().toISOString(),
      details: {
        heapUsagePercent: Math.round(heapUsagePercent),
        systemUsagePercent: Math.round(systemUsagePercent),
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
      },
    };
  }

  private async checkCpuHealth(): Promise<ServiceHealth> {
    const systemMetrics = this.performanceMonitor.getSystemMetrics();
    const cpuUsage = systemMetrics.cpu.usage;
    
    const status = cpuUsage < 90 ? 'healthy' : 'unhealthy';
    
    return {
      status,
      lastChecked: new Date().toISOString(),
      details: {
        usage: Math.round(cpuUsage),
        cores: systemMetrics.cpu.cores,
        loadAverage: systemMetrics.cpu.loadAverage,
      },
    };
  }

  private determineOverallStatus(
    performanceStatus: 'healthy' | 'degraded' | 'unhealthy',
    services: HealthCheckResponse['services'],
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const serviceStatuses = Object.values(services).map(service => service.status);
    
    if (serviceStatuses.includes('unhealthy') || performanceStatus === 'unhealthy') {
      return 'unhealthy';
    }
    
    if (performanceStatus === 'degraded') {
      return 'degraded';
    }
    
    return 'healthy';
  }
}
