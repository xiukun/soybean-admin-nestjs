/**
 * 统一环境配置管理器
 * 管理前端应用的环境变量和服务配置
 */

export interface ServiceConfig {
  /** 服务名称 */
  name: string;
  /** 服务基础URL */
  baseURL: string;
  /** 服务超时时间 */
  timeout?: number;
  /** 是否启用重试 */
  retry?: boolean;
  /** 重试次数 */
  retryCount?: number;
  /** 健康检查端点 */
  healthEndpoint?: string;
}

export interface EnvConfig {
  /** 应用名称 */
  appName: string;
  /** 应用版本 */
  appVersion: string;
  /** 运行环境 */
  env: 'development' | 'test' | 'production';
  /** 是否开发模式 */
  isDev: boolean;
  /** 是否生产模式 */
  isProd: boolean;
  /** 是否启用HTTP代理 */
  httpProxy: boolean;
  /** 基础路径 */
  basePath: string;
  /** 路由模式 */
  routerMode: 'hash' | 'history' | 'memory';
  /** 默认首页路由 */
  homeRoute: string;
  /** 服务配置 */
  services: {
    /** 主后端服务 */
    backend: ServiceConfig;
    /** 低代码平台服务 */
    lowcode: ServiceConfig;
    /** Amis后端服务 */
    amis: ServiceConfig;
  };
  /** API配置 */
  api: {
    /** 请求超时时间 */
    timeout: number;
    /** 重试配置 */
    retry: {
      enabled: boolean;
      count: number;
      delay: number;
    };
    /** 错误码配置 */
    errorCodes: {
      /** 后端错误码 */
      backend: string[];
      /** 过期令牌错误码 */
      expiredToken: string[];
    };
  };
  /** 认证配置 */
  auth: {
    /** 令牌存储键 */
    tokenKey: string;
    /** 刷新令牌存储键 */
    refreshTokenKey: string;
    /** 用户信息存储键 */
    userInfoKey: string;
    /** 登录页面路径 */
    loginPath: string;
    /** 登录后重定向路径 */
    redirectPath: string;
  };
  /** 主题配置 */
  theme: {
    /** 默认主题模式 */
    defaultMode: 'light' | 'dark' | 'auto';
    /** 主题色 */
    primaryColor: string;
    /** 是否启用主题切换 */
    enableToggle: boolean;
  };
  /** 国际化配置 */
  i18n: {
    /** 默认语言 */
    defaultLocale: string;
    /** 支持的语言 */
    supportedLocales: string[];
    /** 语言存储键 */
    localeKey: string;
  };
  /** 低代码配置 */
  lowcode: {
    /** 设计器URL */
    designerUrl: string;
    /** 是否启用设计器 */
    enableDesigner: boolean;
    /** 默认页面类型 */
    defaultPageType: 'amis' | 'lowcode' | 'custom';
    /** Amis配置 */
    amis: {
      /** SDK版本 */
      sdkVersion: string;
      /** 主题 */
      theme: string;
      /** 语言包 */
      locale: string;
    };
  };
  /** 开发工具配置 */
  devtools: {
    /** 是否启用 */
    enabled: boolean;
    /** 是否显示性能监控 */
    showPerformance: boolean;
    /** 是否启用热重载 */
    hotReload: boolean;
  };
}

/**
 * 解析服务URL配置
 */
function parseServiceUrls(urlConfig: string): Record<string, string> {
  try {
    return JSON.parse(urlConfig);
  } catch {
    // 如果解析失败，返回默认配置
    return {
      backend: 'http://localhost:9528',
      lowcode: 'http://localhost:3000',
      amis: 'http://localhost:9522'
    };
  }
}

/**
 * 创建环境配置
 */
function createEnvConfig(): EnvConfig {
  const env = import.meta.env;
  const isDev = env.DEV;
  const isProd = env.PROD;
  const isHttpProxy = isDev && env.VITE_HTTP_PROXY === 'Y';
  
  // 解析服务URL
  const serviceUrls = parseServiceUrls(env.VITE_OTHER_SERVICE_BASE_URL || '{}');
  const baseURL = env.VITE_SERVICE_BASE_URL || 'http://localhost:9528';

  return {
    appName: env.VITE_APP_NAME || 'Soybean Admin',
    appVersion: env.VITE_APP_VERSION || '1.0.0',
    env: env.MODE as any,
    isDev,
    isProd,
    httpProxy: isHttpProxy,
    basePath: env.VITE_BASE_URL || '/',
    routerMode: env.VITE_ROUTER_HISTORY_MODE || 'history',
    homeRoute: env.VITE_ROUTE_HOME || '/home',
    
    services: {
      backend: {
        name: 'backend',
        baseURL: isHttpProxy ? '/proxy-backend' : (serviceUrls.backend || baseURL),
        timeout: 10000,
        retry: true,
        retryCount: 3,
        healthEndpoint: '/health'
      },
      lowcode: {
        name: 'lowcode',
        baseURL: isHttpProxy ? '/proxy-lowcode' : (serviceUrls.lowcode || 'http://localhost:3000'),
        timeout: 15000,
        retry: true,
        retryCount: 3,
        healthEndpoint: '/health'
      },
      amis: {
        name: 'amis',
        baseURL: isHttpProxy ? '/proxy-amis' : (serviceUrls.amis || 'http://localhost:9522'),
        timeout: 10000,
        retry: true,
        retryCount: 3,
        healthEndpoint: '/health'
      }
    },

    api: {
      timeout: parseInt(env.VITE_REQUEST_TIMEOUT || '10000', 10),
      retry: {
        enabled: env.VITE_REQUEST_RETRY === 'Y',
        count: parseInt(env.VITE_REQUEST_RETRY_COUNT || '3', 10),
        delay: parseInt(env.VITE_REQUEST_RETRY_DELAY || '1000', 10)
      },
      errorCodes: {
        backend: (env.VITE_SERVICE_ERROR_CODES || '').split(',').filter(Boolean),
        expiredToken: (env.VITE_SERVICE_EXPIRED_TOKEN_CODES || '').split(',').filter(Boolean)
      }
    },

    auth: {
      tokenKey: 'token',
      refreshTokenKey: 'refreshToken',
      userInfoKey: 'userInfo',
      loginPath: '/login',
      redirectPath: env.VITE_ROUTE_HOME || '/home'
    },

    theme: {
      defaultMode: env.VITE_THEME_MODE || 'light',
      primaryColor: env.VITE_THEME_PRIMARY_COLOR || '#1890ff',
      enableToggle: env.VITE_THEME_TOGGLE !== 'N'
    },

    i18n: {
      defaultLocale: env.VITE_DEFAULT_LOCALE || 'zh-CN',
      supportedLocales: (env.VITE_SUPPORTED_LOCALES || 'zh-CN,en-US').split(','),
      localeKey: 'locale'
    },

    lowcode: {
      designerUrl: env.VITE_DESIGNER_URL || 'http://localhost:3001',
      enableDesigner: env.VITE_ENABLE_DESIGNER !== 'N',
      defaultPageType: env.VITE_DEFAULT_PAGE_TYPE || 'amis',
      amis: {
        sdkVersion: env.VITE_AMIS_SDK_VERSION || '6.0.0',
        theme: env.VITE_AMIS_THEME || 'antd',
        locale: env.VITE_AMIS_LOCALE || 'zh-CN'
      }
    },

    devtools: {
      enabled: isDev && env.VITE_DEVTOOLS !== 'N',
      showPerformance: isDev && env.VITE_SHOW_PERFORMANCE === 'Y',
      hotReload: isDev && env.VITE_HOT_RELOAD !== 'N'
    }
  };
}

/**
 * 环境配置管理器
 */
export class EnvConfigManager {
  private config: EnvConfig;

  constructor() {
    this.config = createEnvConfig();
  }

  /**
   * 获取完整配置
   */
  getConfig(): EnvConfig {
    return this.config;
  }

  /**
   * 获取应用配置
   */
  getAppConfig() {
    return {
      name: this.config.appName,
      version: this.config.appVersion,
      env: this.config.env,
      isDev: this.config.isDev,
      isProd: this.config.isProd
    };
  }

  /**
   * 获取服务配置
   */
  getServiceConfig(serviceName: keyof EnvConfig['services']): ServiceConfig {
    return this.config.services[serviceName];
  }

  /**
   * 获取所有服务配置
   */
  getAllServiceConfigs(): EnvConfig['services'] {
    return this.config.services;
  }

  /**
   * 获取API配置
   */
  getApiConfig() {
    return this.config.api;
  }

  /**
   * 获取认证配置
   */
  getAuthConfig() {
    return this.config.auth;
  }

  /**
   * 获取主题配置
   */
  getThemeConfig() {
    return this.config.theme;
  }

  /**
   * 获取国际化配置
   */
  getI18nConfig() {
    return this.config.i18n;
  }

  /**
   * 获取低代码配置
   */
  getLowcodeConfig() {
    return this.config.lowcode;
  }

  /**
   * 获取开发工具配置
   */
  getDevtoolsConfig() {
    return this.config.devtools;
  }

  /**
   * 检查是否为开发环境
   */
  isDevelopment(): boolean {
    return this.config.isDev;
  }

  /**
   * 检查是否为生产环境
   */
  isProduction(): boolean {
    return this.config.isProd;
  }

  /**
   * 检查是否启用HTTP代理
   */
  isHttpProxyEnabled(): boolean {
    return this.config.httpProxy;
  }

  /**
   * 获取服务基础URL
   */
  getServiceBaseURL(serviceName: keyof EnvConfig['services']): string {
    return this.config.services[serviceName].baseURL;
  }

  /**
   * 更新配置（用于运行时配置更新）
   */
  updateConfig(updates: Partial<EnvConfig>) {
    this.config = { ...this.config, ...updates };
  }

  /**
   * 打印配置信息（开发环境）
   */
  printConfig() {
    if (this.config.isDev) {
      console.group('🔧 环境配置信息');
      console.log('应用信息:', this.getAppConfig());
      console.log('服务配置:', this.getAllServiceConfigs());
      console.log('API配置:', this.getApiConfig());
      console.log('低代码配置:', this.getLowcodeConfig());
      console.groupEnd();
    }
  }
}

// 创建全局配置管理器实例
export const envConfig = new EnvConfigManager();

// 在开发环境下打印配置信息
if (envConfig.isDevelopment()) {
  envConfig.printConfig();
}

// 导出默认实例
export default envConfig;
