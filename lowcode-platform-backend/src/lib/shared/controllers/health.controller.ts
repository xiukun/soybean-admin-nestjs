import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { PrismaService } from '../../../prisma/prisma.service';
import { PerformanceMiddleware } from '../middleware/performance.middleware';
import { Public } from '../decorators/public.decorator';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: ServiceHealth;
    cache: ServiceHealth;
    memory: ServiceHealth;
    disk: ServiceHealth;
  };
  metrics?: any;
}

interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  details?: any;
  error?: string;
}

@Controller('health')
@ApiTags('Health Check')
@Public()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly performanceMiddleware: PerformanceMiddleware,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async healthCheck(@Res() res: FastifyReply) {
    const startTime = Date.now();
    
    try {
      const health: HealthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
          database: await this.checkDatabase(),
          cache: await this.checkCache(),
          memory: this.checkMemory(),
          disk: await this.checkDisk(),
        },
      };

      // Determine overall health status
      const serviceStatuses = Object.values(health.services).map(s => s.status);
      if (serviceStatuses.includes('unhealthy')) {
        health.status = 'unhealthy';
      } else if (serviceStatuses.includes('degraded')) {
        health.status = 'degraded';
      }

      const statusCode = health.status === 'healthy' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

      return res.status(statusCode).send(health);
    } catch (error) {
      const errorHealth: HealthStatus = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
          database: { status: 'unhealthy', error: error.message },
          cache: { status: 'unhealthy' },
          memory: { status: 'unhealthy' },
          disk: { status: 'unhealthy' },
        },
      };

      return res.status(HttpStatus.SERVICE_UNAVAILABLE).send(errorHealth);
    }
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check with metrics' })
  @ApiResponse({ status: 200, description: 'Detailed health information' })
  async detailedHealthCheck(@Res() res: FastifyReply) {
    const startTime = Date.now();
    
    try {
      const health: HealthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
          database: await this.checkDatabase(),
          cache: await this.checkCache(),
          memory: this.checkMemory(),
          disk: await this.checkDisk(),
        },
        metrics: await this.performanceMiddleware.getMetricValues(),
      };

      // Add detailed system information
      health.services.memory.details = {
        ...process.memoryUsage(),
        loadAverage: process.platform !== 'win32' ? require('os').loadavg() : null,
        cpuCount: require('os').cpus().length,
      };

      // Determine overall health status
      const serviceStatuses = Object.values(health.services).map(s => s.status);
      if (serviceStatuses.includes('unhealthy')) {
        health.status = 'unhealthy';
      } else if (serviceStatuses.includes('degraded')) {
        health.status = 'degraded';
      }

      const statusCode = health.status === 'healthy' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

      return res.status(statusCode).send(health);
    } catch (error) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).send({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async readinessCheck(@Res() res: FastifyReply) {
    try {
      // Check if all critical services are available
      const dbHealth = await this.checkDatabase();
      
      if (dbHealth.status === 'healthy') {
        return res.status(HttpStatus.OK).send({
          status: 'ready',
          timestamp: new Date().toISOString(),
        });
      } else {
        return res.status(HttpStatus.SERVICE_UNAVAILABLE).send({
          status: 'not ready',
          timestamp: new Date().toISOString(),
          reason: 'Database not available',
        });
      }
    } catch (error) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).send({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async livenessCheck(@Res() res: FastifyReply) {
    // Simple liveness check - if we can respond, we're alive
    return res.status(HttpStatus.OK).send({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Prometheus metrics' })
  @ApiResponse({ status: 200, description: 'Prometheus metrics in text format' })
  async getMetrics(@Res() res: FastifyReply) {
    try {
      const metrics = this.performanceMiddleware.getMetrics();
      res.header('Content-Type', 'text/plain');
      return res.send(metrics);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        error: 'Failed to retrieve metrics',
        message: error.message,
      });
    }
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Simple database connectivity check
      await this.prisma.$queryRaw`SELECT 1`;
      
      const responseTime = Date.now() - startTime;
      
      // Check if response time is acceptable
      if (responseTime > 5000) {
        return {
          status: 'degraded',
          responseTime,
          details: { message: 'Database response time is slow' },
        };
      }
      
      return {
        status: 'healthy',
        responseTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  private async checkCache(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // If Redis is configured, check Redis connectivity
      // For now, we'll assume cache is healthy if no Redis is configured
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime,
        details: { type: 'in-memory' },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  private checkMemory(): ServiceHealth {
    const memUsage = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    const freeMemory = require('os').freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;
    
    // Check memory usage thresholds
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (memoryUsagePercent > 90) {
      status = 'unhealthy';
    } else if (memoryUsagePercent > 80) {
      status = 'degraded';
    }
    
    return {
      status,
      details: {
        process: memUsage,
        system: {
          total: totalMemory,
          free: freeMemory,
          used: usedMemory,
          usagePercent: Math.round(memoryUsagePercent * 100) / 100,
        },
      },
    };
  }

  private async checkDisk(): Promise<ServiceHealth> {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Check disk space for the current working directory
      const stats = await fs.promises.statvfs?.(process.cwd()) || null;
      
      if (!stats) {
        // If statvfs is not available (Windows), return healthy
        return {
          status: 'healthy',
          details: { message: 'Disk check not available on this platform' },
        };
      }
      
      const totalSpace = stats.blocks * stats.frsize;
      const freeSpace = stats.bavail * stats.frsize;
      const usedSpace = totalSpace - freeSpace;
      const usagePercent = (usedSpace / totalSpace) * 100;
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (usagePercent > 95) {
        status = 'unhealthy';
      } else if (usagePercent > 85) {
        status = 'degraded';
      }
      
      return {
        status,
        details: {
          total: totalSpace,
          free: freeSpace,
          used: usedSpace,
          usagePercent: Math.round(usagePercent * 100) / 100,
        },
      };
    } catch (error) {
      return {
        status: 'healthy',
        details: { message: 'Disk check failed, assuming healthy' },
      };
    }
  }
}

// Health check service for internal use
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async isHealthy(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  async getSystemInfo() {
    const os = require('os');
    
    return {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: os.cpus(),
      loadAverage: os.platform() !== 'win32' ? os.loadavg() : null,
      networkInterfaces: os.networkInterfaces(),
    };
  }

  async getDatabaseInfo() {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          version() as version,
          current_database() as database,
          current_user as user,
          inet_server_addr() as host,
          inet_server_port() as port
      ` as any[];

      return result[0];
    } catch (error) {
      return { error: error.message };
    }
  }
}
