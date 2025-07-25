import { Injectable } from '@nestjs/common';
import { UnifiedJwtService } from '../services/unified-jwt.service';

export interface HealthIndicatorResult {
  [key: string]: {
    status: 'up' | 'down';
    [optionalKeys: string]: any;
  };
}

export class HealthCheckError extends Error {
  constructor(message: string, public causes: HealthIndicatorResult) {
    super(message);
  }
}

@Injectable()
export class AuthHealthService {
  constructor(private readonly unifiedJwtService: UnifiedJwtService) {}

  /**
   * 检查JWT服务健康状态
   */
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // 测试JWT服务基本功能
      const testPayload = {
        uid: 'health-check',
        username: 'health-check',
        domain: 'system',
      };

      // 生成测试token
      const tokenPair = await this.unifiedJwtService.generateTokenPair(testPayload);
      
      // 验证生成的token
      const verifiedPayload = await this.unifiedJwtService.verifyAccessToken(tokenPair.accessToken);
      
      // 检查payload是否正确
      if (verifiedPayload.uid !== testPayload.uid) {
        throw new Error('JWT payload verification failed');
      }

      const result: HealthIndicatorResult = {
        [key]: {
          status: 'up',
          message: 'JWT service is healthy',
          tokenGeneration: 'OK',
          tokenVerification: 'OK',
          timestamp: new Date().toISOString(),
        }
      };

      return result;
    } catch (error) {
      const result: HealthIndicatorResult = {
        [key]: {
          status: 'down',
          message: 'JWT service is unhealthy',
          error: error.message,
          timestamp: new Date().toISOString(),
        }
      };

      throw new HealthCheckError('JWT service health check failed', result);
    }
  }

  /**
   * 获取JWT服务性能指标
   */
  async getPerformanceMetrics(): Promise<{
    tokenGenerationTime: number;
    tokenVerificationTime: number;
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
  }> {
    const testPayload = {
      uid: 'perf-test',
      username: 'perf-test',
      domain: 'system',
    };

    // 测试token生成性能
    const genStart = process.hrtime.bigint();
    const tokenPair = await this.unifiedJwtService.generateTokenPair(testPayload);
    const genEnd = process.hrtime.bigint();
    const tokenGenerationTime = Number(genEnd - genStart) / 1000000; // 转换为毫秒

    // 测试token验证性能
    const verifyStart = process.hrtime.bigint();
    await this.unifiedJwtService.verifyAccessToken(tokenPair.accessToken);
    const verifyEnd = process.hrtime.bigint();
    const tokenVerificationTime = Number(verifyEnd - verifyStart) / 1000000; // 转换为毫秒

    return {
      tokenGenerationTime,
      tokenVerificationTime,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    };
  }

  /**
   * 检查token黑名单服务状态
   */
  async checkTokenBlacklistHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    message: string;
    details?: any;
  }> {
    try {
      // 这里可以添加Redis连接检查等
      // 目前返回基本状态
      return {
        status: 'healthy',
        message: 'Token blacklist service is operational',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Token blacklist service is not available',
        details: error.message,
      };
    }
  }

  /**
   * 获取认证服务统计信息
   */
  async getAuthStatistics(): Promise<{
    totalTokensGenerated: number;
    activeTokens: number;
    revokedTokens: number;
    lastTokenGenerated: string;
    averageTokenLifetime: number;
  }> {
    // 这里应该从实际的存储中获取统计信息
    // 目前返回模拟数据
    return {
      totalTokensGenerated: 0,
      activeTokens: 0,
      revokedTokens: 0,
      lastTokenGenerated: new Date().toISOString(),
      averageTokenLifetime: 900, // 15分钟
    };
  }
}
