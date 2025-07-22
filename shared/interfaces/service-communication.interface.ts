/**
 * 微服务间通信统一接口定义
 */

// 服务注册信息
export interface ServiceEndpoint {
  name: string;
  url: string;
  version: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  capabilities: string[];
  lastHealthCheck?: Date;
}

// 统一请求格式
export interface ServiceRequest<T = any> {
  service: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: T;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

// 统一响应格式
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  status: number;
  duration: number;
  timestamp: string;
  traceId?: string;
  service?: string;
}

// 错误响应格式
export interface ServiceError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  traceId?: string;
  service?: string;
}

// Amis兼容响应格式
export interface AmisResponse<T = any> {
  status: number;
  msg: string;
  data?: T;
  timestamp?: string;
}

// 分页请求参数
export interface PaginationRequest {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 分页响应格式
export interface PaginationResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 健康检查响应
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  services?: Record<string, {
    status: 'healthy' | 'unhealthy';
    responseTime?: number;
    error?: string;
  }>;
}

// 服务间调用上下文
export interface ServiceContext {
  traceId: string;
  userId?: string;
  userDomain?: string;
  requestId: string;
  timestamp: string;
  source: string;
  target: string;
}

// 事件通知接口
export interface ServiceEvent<T = any> {
  type: string;
  source: string;
  data: T;
  timestamp: string;
  traceId?: string;
}

// 服务配置接口
export interface ServiceConfig {
  name: string;
  version: string;
  port: number;
  baseUrl: string;
  dependencies: string[];
  healthCheckPath: string;
  timeout: number;
  retries: number;
}
