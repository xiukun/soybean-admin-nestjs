import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Logger,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MonitoringService, ServiceMetrics, SystemMetrics } from '../services/monitoring.service';
import { Public } from '../decorators/public.decorator';
import { ApiResponse as CustomApiResponse } from '../decorators/api-response.decorator';

@ApiTags('Monitoring')
@Controller('api/v1/monitoring')
export class MonitoringController {
  private readonly logger = new Logger(MonitoringController.name);

  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get system metrics' })
  @ApiResponse({ status: 200, description: 'System metrics retrieved successfully' })
  @CustomApiResponse()
  getSystemMetrics(): SystemMetrics {
    try {
      return this.monitoringService.getSystemMetrics();
    } catch (error) {
      this.logger.error('Error getting system metrics:', error);
      throw new HttpException(
        'Failed to retrieve system metrics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('services')
  @ApiOperation({ summary: 'Get all service metrics' })
  @ApiResponse({ status: 200, description: 'Service metrics retrieved successfully' })
  @CustomApiResponse()
  getAllServiceMetrics(): ServiceMetrics[] {
    try {
      const metrics = this.monitoringService.getServiceMetrics();
      return Array.isArray(metrics) ? metrics : [];
    } catch (error) {
      this.logger.error('Error getting service metrics:', error);
      throw new HttpException(
        'Failed to retrieve service metrics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('services/:serviceName')
  @ApiOperation({ summary: 'Get specific service metrics' })
  @ApiParam({ name: 'serviceName', description: 'Name of the service' })
  @ApiResponse({ status: 200, description: 'Service metrics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @CustomApiResponse()
  getServiceMetrics(@Param('serviceName') serviceName: string): ServiceMetrics {
    try {
      const metrics = this.monitoringService.getServiceMetrics(serviceName);
      
      if (!metrics || Array.isArray(metrics)) {
        throw new HttpException(
          `Service '${serviceName}' not found`,
          HttpStatus.NOT_FOUND
        );
      }
      
      return metrics;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`Error getting metrics for service ${serviceName}:`, error);
      throw new HttpException(
        'Failed to retrieve service metrics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get monitoring dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  @CustomApiResponse()
  getDashboardData() {
    try {
      const systemMetrics = this.monitoringService.getSystemMetrics();
      const serviceMetrics = this.monitoringService.getServiceMetrics();
      const services = Array.isArray(serviceMetrics) ? serviceMetrics : [];

      // 计算额外的仪表板指标
      const criticalServices = services.filter(s => s.consecutiveFailures >= 3);
      const slowServices = services.filter(s => s.responseTime > 5000); // 超过5秒
      const recentlyFailedServices = services.filter(s => 
        s.status === 'unhealthy' && 
        Date.now() - s.lastCheck.getTime() < 300000 // 最近5分钟
      );

      return {
        system: systemMetrics,
        services: services,
        alerts: {
          critical: criticalServices.length,
          slow: slowServices.length,
          recentFailures: recentlyFailedServices.length,
        },
        summary: {
          healthPercentage: systemMetrics.totalServices > 0 
            ? Math.round((systemMetrics.healthyServices / systemMetrics.totalServices) * 100)
            : 100,
          averageResponseTime: Math.round(systemMetrics.averageResponseTime),
          uptime: systemMetrics.systemUptime,
        },
        criticalServices: criticalServices.map(s => ({
          name: s.serviceName,
          status: s.status,
          consecutiveFailures: s.consecutiveFailures,
          lastCheck: s.lastCheck,
        })),
        slowServices: slowServices.map(s => ({
          name: s.serviceName,
          responseTime: s.responseTime,
          status: s.status,
        })),
      };
    } catch (error) {
      this.logger.error('Error getting dashboard data:', error);
      throw new HttpException(
        'Failed to retrieve dashboard data',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('health-check')
  @ApiOperation({ summary: 'Trigger manual health check' })
  @ApiQuery({ name: 'service', required: false, description: 'Specific service to check' })
  @ApiResponse({ status: 200, description: 'Health check triggered successfully' })
  @CustomApiResponse()
  async triggerHealthCheck(@Query('service') serviceName?: string) {
    try {
      await this.monitoringService.triggerHealthCheck(serviceName);
      
      return {
        message: `Health check triggered${serviceName ? ` for service: ${serviceName}` : ' for all services'}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error triggering health check:', error);
      throw new HttpException(
        'Failed to trigger health check',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('metrics/:serviceName?')
  @ApiOperation({ summary: 'Reset service metrics' })
  @ApiParam({ name: 'serviceName', required: false, description: 'Specific service to reset' })
  @ApiResponse({ status: 200, description: 'Metrics reset successfully' })
  @CustomApiResponse()
  resetMetrics(@Param('serviceName') serviceName?: string) {
    try {
      this.monitoringService.resetServiceMetrics(serviceName);
      
      return {
        message: `Metrics reset${serviceName ? ` for service: ${serviceName}` : ' for all services'}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error resetting metrics:', error);
      throw new HttpException(
        'Failed to reset metrics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get current alerts' })
  @ApiResponse({ status: 200, description: 'Alerts retrieved successfully' })
  @CustomApiResponse()
  getAlerts() {
    try {
      const serviceMetrics = this.monitoringService.getServiceMetrics();
      const services = Array.isArray(serviceMetrics) ? serviceMetrics : [];

      const alerts = [];

      // 检查关键服务故障
      services.forEach(service => {
        if (service.consecutiveFailures >= 3) {
          alerts.push({
            type: 'critical',
            service: service.serviceName,
            message: `Service has failed ${service.consecutiveFailures} consecutive health checks`,
            timestamp: service.lastCheck,
            severity: 'high',
          });
        }

        if (service.responseTime > 10000) {
          alerts.push({
            type: 'performance',
            service: service.serviceName,
            message: `Service response time is ${service.responseTime}ms (>10s)`,
            timestamp: service.lastCheck,
            severity: 'medium',
          });
        }

        if (service.status === 'unhealthy') {
          alerts.push({
            type: 'health',
            service: service.serviceName,
            message: 'Service is currently unhealthy',
            timestamp: service.lastCheck,
            severity: service.consecutiveFailures >= 3 ? 'high' : 'medium',
          });
        }
      });

      // 按严重程度和时间排序
      alerts.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      return {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'high').length,
        warnings: alerts.filter(a => a.severity === 'medium').length,
        alerts: alerts.slice(0, 50), // 限制返回最近50个告警
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error getting alerts:', error);
      throw new HttpException(
        'Failed to retrieve alerts',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
