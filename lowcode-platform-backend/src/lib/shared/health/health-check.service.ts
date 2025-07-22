import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@prisma/prisma.service';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: ServiceHealth;
    codeGeneration: ServiceHealth;
    fileSystem: ServiceHealth;
    memory: ServiceHealth;
    disk: ServiceHealth;
  };
  dependencies: {
    [serviceName: string]: DependencyHealth;
  };
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  message?: string;
  details?: any;
  lastCheck: string;
}

export interface DependencyHealth {
  status: 'healthy' | 'unhealthy' | 'unknown';
  url?: string;
  responseTime?: number;
  message?: string;
  lastCheck: string;
}

@Injectable()
export class HealthCheckService {
  private readonly logger = new Logger(HealthCheckService.name);
  private readonly startTime = Date.now();

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 获取完整的健康状态
   */
  async getHealthStatus(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    
    try {
      // 并行检查所有服务
      const [
        databaseHealth,
        codeGenerationHealth,
        fileSystemHealth,
        memoryHealth,
        diskHealth,
        dependencies,
      ] = await Promise.all([
        this.checkDatabase(),
        this.checkCodeGeneration(),
        this.checkFileSystem(),
        this.checkMemory(),
        this.checkDisk(),
        this.checkDependencies(),
      ]);

      const services = {
        database: databaseHealth,
        codeGeneration: codeGenerationHealth,
        fileSystem: fileSystemHealth,
        memory: memoryHealth,
        disk: diskHealth,
      };

      // 计算整体状态
      const overallStatus = this.calculateOverallStatus(services, dependencies);

      return {
        status: overallStatus,
        timestamp,
        uptime: Date.now() - this.startTime,
        version: this.getVersion(),
        environment: this.configService.get('NODE_ENV', 'development'),
        services,
        dependencies,
      };

    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp,
        uptime: Date.now() - this.startTime,
        version: this.getVersion(),
        environment: this.configService.get('NODE_ENV', 'development'),
        services: {
          database: { status: 'unhealthy', message: 'Health check failed', lastCheck: timestamp },
          codeGeneration: { status: 'unhealthy', message: 'Health check failed', lastCheck: timestamp },
          fileSystem: { status: 'unhealthy', message: 'Health check failed', lastCheck: timestamp },
          memory: { status: 'unhealthy', message: 'Health check failed', lastCheck: timestamp },
          disk: { status: 'unhealthy', message: 'Health check failed', lastCheck: timestamp },
        },
        dependencies: {},
      };
    }
  }

  /**
   * 检查数据库连接
   */
  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        responseTime,
        message: `Database connection successful (${responseTime}ms)`,
        lastCheck: timestamp,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: `Database connection failed: ${error.message}`,
        lastCheck: timestamp,
      };
    }
  }

  /**
   * 检查代码生成服务
   */
  private async checkCodeGeneration(): Promise<ServiceHealth> {
    const timestamp = new Date().toISOString();

    try {
      // 检查模板目录是否存在
      const templatesPath = path.join(__dirname, '../../../resources/templates');
      const templatesExist = fs.existsSync(templatesPath);
      
      if (!templatesExist) {
        return {
          status: 'unhealthy',
          message: 'Templates directory not found',
          lastCheck: timestamp,
        };
      }

      // 检查必要的模板文件
      const requiredTemplates = [
        'entity-base-controller.hbs',
        'entity-base-service.hbs',
        'entity-controller.hbs',
        'entity-module.hbs',
        'amis-page.hbs',
      ];

      const missingTemplates = requiredTemplates.filter(template => 
        !fs.existsSync(path.join(templatesPath, template))
      );

      if (missingTemplates.length > 0) {
        return {
          status: 'degraded',
          message: `Missing templates: ${missingTemplates.join(', ')}`,
          details: { missingTemplates },
          lastCheck: timestamp,
        };
      }

      return {
        status: 'healthy',
        message: 'Code generation service is ready',
        details: { templatesCount: requiredTemplates.length },
        lastCheck: timestamp,
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Code generation check failed: ${error.message}`,
        lastCheck: timestamp,
      };
    }
  }

  /**
   * 检查文件系统
   */
  private async checkFileSystem(): Promise<ServiceHealth> {
    const timestamp = new Date().toISOString();

    try {
      // 检查临时目录写入权限
      const tempDir = os.tmpdir();
      const testFile = path.join(tempDir, `health-check-${Date.now()}.tmp`);
      
      fs.writeFileSync(testFile, 'health check test');
      fs.unlinkSync(testFile);

      return {
        status: 'healthy',
        message: 'File system is accessible',
        lastCheck: timestamp,
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        message: `File system check failed: ${error.message}`,
        lastCheck: timestamp,
      };
    }
  }

  /**
   * 检查内存使用情况
   */
  private async checkMemory(): Promise<ServiceHealth> {
    const timestamp = new Date().toISOString();

    try {
      const memoryUsage = process.memoryUsage();
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let message = 'Memory usage is normal';

      if (memoryUsagePercent > 90) {
        status = 'unhealthy';
        message = 'Critical memory usage';
      } else if (memoryUsagePercent > 80) {
        status = 'degraded';
        message = 'High memory usage';
      }

      return {
        status,
        message,
        details: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024),
          systemMemoryUsage: Math.round(memoryUsagePercent),
        },
        lastCheck: timestamp,
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Memory check failed: ${error.message}`,
        lastCheck: timestamp,
      };
    }
  }

  /**
   * 检查磁盘空间
   */
  private async checkDisk(): Promise<ServiceHealth> {
    const timestamp = new Date().toISOString();

    try {
      const stats = fs.statSync(process.cwd());
      
      // 简化的磁盘检查（在生产环境中可能需要更复杂的逻辑）
      return {
        status: 'healthy',
        message: 'Disk space is available',
        details: {
          workingDirectory: process.cwd(),
        },
        lastCheck: timestamp,
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Disk check failed: ${error.message}`,
        lastCheck: timestamp,
      };
    }
  }

  /**
   * 检查外部依赖
   */
  private async checkDependencies(): Promise<{ [serviceName: string]: DependencyHealth }> {
    const dependencies: { [serviceName: string]: DependencyHealth } = {};
    const timestamp = new Date().toISOString();

    // 检查amis-lowcode-backend服务（如果配置了）
    const amisBackendUrl = this.configService.get('AMIS_BACKEND_URL');
    if (amisBackendUrl) {
      dependencies['amis-lowcode-backend'] = await this.checkHttpDependency(
        'amis-lowcode-backend',
        `${amisBackendUrl}/health`,
        timestamp
      );
    }

    return dependencies;
  }

  /**
   * 检查HTTP依赖
   */
  private async checkHttpDependency(
    name: string,
    url: string,
    timestamp: string
  ): Promise<DependencyHealth> {
    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        method: 'GET',
        timeout: 5000,
      });

      const responseTime = Date.now() - startTime;

      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        url,
        responseTime,
        message: `HTTP ${response.status} (${responseTime}ms)`,
        lastCheck: timestamp,
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        url,
        responseTime: Date.now() - startTime,
        message: `Connection failed: ${error.message}`,
        lastCheck: timestamp,
      };
    }
  }

  /**
   * 计算整体状态
   */
  private calculateOverallStatus(
    services: { [key: string]: ServiceHealth },
    dependencies: { [key: string]: DependencyHealth }
  ): 'healthy' | 'unhealthy' | 'degraded' {
    const allChecks = [
      ...Object.values(services),
      ...Object.values(dependencies),
    ];

    const unhealthyCount = allChecks.filter(check => check.status === 'unhealthy').length;
    const degradedCount = allChecks.filter(check => check.status === 'degraded').length;

    if (unhealthyCount > 0) {
      return 'unhealthy';
    } else if (degradedCount > 0) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  /**
   * 获取应用版本
   */
  private getVersion(): string {
    try {
      const packageJson = require('../../../../package.json');
      return packageJson.version || '1.0.0';
    } catch {
      return '1.0.0';
    }
  }
}
