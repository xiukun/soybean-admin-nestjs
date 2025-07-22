import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/services/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prismaService: PrismaService) {}
  getAppInfo() {
    return {
      name: 'Amis Lowcode Business API',
      version: '1.0.0',
      description: 'Auto-generated business API compatible with Amis framework',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  async getHealth() {
    const startTime = Date.now();

    try {
      // 检查数据库连接
      await this.prismaService.$queryRaw`SELECT 1`;
      const dbResponseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          database: {
            status: 'healthy',
            responseTime: dbResponseTime,
          },
        },
        memory: process.memoryUsage(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          database: {
            status: 'unhealthy',
            error: error.message,
          },
        },
        memory: process.memoryUsage(),
      };
    }
  }
}
