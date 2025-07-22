import {
  Controller,
  Get,
  Logger,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ServiceCommunicationService } from '../services/service-communication.service';
import { Public } from '../decorators/public.decorator';
import { ApiResponse as CustomApiResponse } from '../decorators/api-response.decorator';
import { HealthCheckResponse } from '../interfaces/service-communication.interface';

@ApiTags('Health Check')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);
  private readonly startTime = Date.now();

  constructor(
    private readonly configService: ConfigService,
    private readonly serviceCommunication?: ServiceCommunicationService
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @CustomApiResponse()
  async getHealth(): Promise<HealthCheckResponse> {
    const uptime = Date.now() - this.startTime;
    const serviceName = this.configService.get<string>('SERVICE_NAME', 'unknown');
    const version = this.configService.get<string>('SERVICE_VERSION', '1.0.0');

    try {
      // 基础健康检查
      const healthStatus: HealthCheckResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime,
        version,
        services: {},
      };

      // 检查数据库连接
      try {
        await this.checkDatabase();
        healthStatus.services!.database = {
          status: 'healthy',
          responseTime: await this.measureResponseTime(() => this.checkDatabase()),
        };
      } catch (error) {
        this.logger.error('Database health check failed:', error);
        healthStatus.services!.database = {
          status: 'unhealthy',
          error: error.message,
        };
        healthStatus.status = 'degraded';
      }

      // 检查Redis连接
      try {
        await this.checkRedis();
        healthStatus.services!.redis = {
          status: 'healthy',
          responseTime: await this.measureResponseTime(() => this.checkRedis()),
        };
      } catch (error) {
        this.logger.error('Redis health check failed:', error);
        healthStatus.services!.redis = {
          status: 'unhealthy',
          error: error.message,
        };
        if (healthStatus.status === 'healthy') {
          healthStatus.status = 'degraded';
        }
      }

      return healthStatus;
    } catch (error) {
      this.logger.error('Health check failed:', error);
      throw new HttpException(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          uptime,
          version,
          error: error.message,
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  @Get('detailed')
  @Public()
  @ApiOperation({ summary: 'Detailed health check with dependencies' })
  @ApiResponse({ status: 200, description: 'Detailed health status' })
  @CustomApiResponse()
  async getDetailedHealth(): Promise<HealthCheckResponse> {
    const basicHealth = await this.getHealth();

    if (!this.serviceCommunication) {
      return basicHealth;
    }

    try {
      // 检查依赖服务
      const dependencyChecks = await this.serviceCommunication.healthCheckAll();
      
      for (const [serviceName, healthData] of Object.entries(dependencyChecks)) {
        if (healthData) {
          basicHealth.services![serviceName] = {
            status: 'healthy',
            responseTime: 0, // 实际响应时间在serviceCommunication中已测量
          };
        } else {
          basicHealth.services![serviceName] = {
            status: 'unhealthy',
            error: 'Service unreachable',
          };
          if (basicHealth.status === 'healthy') {
            basicHealth.status = 'degraded';
          }
        }
      }

      return basicHealth;
    } catch (error) {
      this.logger.error('Detailed health check failed:', error);
      basicHealth.status = 'degraded';
      return basicHealth;
    }
  }

  @Get('ready')
  @Public()
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @CustomApiResponse()
  async getReadiness() {
    try {
      // 检查服务是否准备好接收请求
      await this.checkDatabase();
      
      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
        message: 'Service is ready to accept requests',
      };
    } catch (error) {
      this.logger.error('Readiness check failed:', error);
      throw new HttpException(
        {
          status: 'not_ready',
          timestamp: new Date().toISOString(),
          error: error.message,
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  @Get('live')
  @Public()
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  @CustomApiResponse()
  getLiveness() {
    // 简单的存活检查
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
    };
  }

  private async checkDatabase(): Promise<void> {
    // 这里应该根据实际使用的数据库客户端进行检查
    // 例如：await this.prismaService.$queryRaw`SELECT 1`
    // 暂时返回成功，具体实现需要在各个服务中重写
    return Promise.resolve();
  }

  private async checkRedis(): Promise<void> {
    // 这里应该根据实际使用的Redis客户端进行检查
    // 例如：await this.redisService.ping()
    // 暂时返回成功，具体实现需要在各个服务中重写
    return Promise.resolve();
  }

  private async measureResponseTime(operation: () => Promise<void>): Promise<number> {
    const startTime = Date.now();
    try {
      await operation();
      return Date.now() - startTime;
    } catch (error) {
      return Date.now() - startTime;
    }
  }
}
