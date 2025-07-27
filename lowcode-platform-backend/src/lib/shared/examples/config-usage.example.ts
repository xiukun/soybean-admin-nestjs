import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigUtil } from '../utils/config.util';
import { IAppConfig, ICorsConfig, ISecurityConfig, ConfigKeyPaths } from '../config';

/**
 * Example service showing how to use the configuration system
 * 展示如何使用配置系统的示例服务
 */
@Injectable()
export class ConfigUsageExampleService {
  private readonly configUtil: ConfigUtil;

  constructor(private readonly configService: ConfigService<ConfigKeyPaths>) {
    this.configUtil = new ConfigUtil(configService);
  }

  /**
   * Method 1: Using ConfigUtil (Recommended)
   * 方法1：使用 ConfigUtil（推荐）
   */
  getAppInfoUsingUtil() {
    const appConfig = this.configUtil.app;
    const corsConfig = this.configUtil.cors;
    
    return {
      serverUrl: this.configUtil.serverUrl,
      apiBaseUrl: this.configUtil.apiBaseUrl,
      isDevelopment: this.configUtil.isDevelopment,
      corsEnabled: corsConfig.enabled,
      allowedOrigins: corsConfig.corsOptions.origin,
    };
  }

  /**
   * Method 2: Using ConfigService directly
   * 方法2：直接使用 ConfigService
   */
  getAppInfoUsingConfigService() {
    const appConfig = this.configService.get<IAppConfig>('app', { infer: true });
    const corsConfig = this.configService.get<ICorsConfig>('cors', { infer: true });
    const securityConfig = this.configService.get<ISecurityConfig>('security', { infer: true });

    return {
      port: appConfig.port,
      host: appConfig.host,
      nodeEnv: appConfig.nodeEnv,
      jwtSecret: securityConfig.jwtSecret,
      corsOrigins: corsConfig.corsOptions.origin,
    };
  }

  /**
   * Method 3: Getting specific configuration values
   * 方法3：获取特定配置值
   */
  getSpecificConfigs() {
    return {
      // App configs
      port: this.configUtil.app.port,
      apiPrefix: this.configUtil.app.apiPrefix,
      
      // CORS configs
      corsEnabled: this.configUtil.cors.enabled,
      corsCredentials: this.configUtil.cors.corsOptions.credentials,
      
      // Security configs
      jwtExpiresIn: this.configUtil.security.jwtExpiresIn,
      passwordMinLength: this.configUtil.security.passwordMinLength,
    };
  }

  /**
   * Example of conditional logic based on environment
   * 基于环境的条件逻辑示例
   */
  getEnvironmentSpecificBehavior() {
    if (this.configUtil.isDevelopment) {
      return {
        logLevel: 'debug',
        enableDetailedErrors: true,
        allowTestRoutes: true,
      };
    } else if (this.configUtil.isProduction) {
      return {
        logLevel: 'error',
        enableDetailedErrors: false,
        allowTestRoutes: false,
      };
    }
    
    return {
      logLevel: 'info',
      enableDetailedErrors: false,
      allowTestRoutes: false,
    };
  }
}
