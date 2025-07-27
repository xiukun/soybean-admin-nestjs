import { ConfigService } from '@nestjs/config';
import { IAppConfig, ICorsConfig, ISecurityConfig, ConfigKeyPaths } from '../config';

/**
 * Configuration utility class
 * 配置工具类
 */
export class ConfigUtil {
  constructor(private readonly configService: ConfigService<ConfigKeyPaths>) {}

  /**
   * Get application configuration
   * 获取应用配置
   */
  get app(): IAppConfig {
    return this.configService.get<IAppConfig>('app', { infer: true });
  }

  /**
   * Get CORS configuration
   * 获取 CORS 配置
   */
  get cors(): ICorsConfig {
    return this.configService.get<ICorsConfig>('cors', { infer: true });
  }

  /**
   * Get security configuration
   * 获取安全配置
   */
  get security(): ISecurityConfig {
    return this.configService.get<ISecurityConfig>('security', { infer: true });
  }

  /**
   * Check if development environment
   * 检查是否为开发环境
   */
  get isDevelopment(): boolean {
    return this.app.nodeEnv === 'development';
  }

  /**
   * Check if production environment
   * 检查是否为生产环境
   */
  get isProduction(): boolean {
    return this.app.nodeEnv === 'production';
  }

  /**
   * Get full API base URL
   * 获取完整的 API 基础 URL
   */
  get apiBaseUrl(): string {
    const { host, port, apiPrefix, apiVersion } = this.app;
    return `http://${host}:${port}/${apiPrefix}/v${apiVersion}`;
  }

  /**
   * Get server URL
   * 获取服务器 URL
   */
  get serverUrl(): string {
    const { host, port } = this.app;
    return `http://${host}:${port}`;
  }
}
