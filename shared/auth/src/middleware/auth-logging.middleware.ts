import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UnifiedJwtService } from '../services/unified-jwt.service';

@Injectable()
export class AuthLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthLoggingMiddleware.name);

  constructor(private readonly unifiedJwtService: UnifiedJwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers['user-agent'] || 'Unknown';
    const authorization = headers.authorization;

    // 提取用户信息
    let userInfo = 'Anonymous';
    let tokenInfo = null;

    if (authorization && authorization.startsWith('Bearer ')) {
      try {
        const token = authorization.substring(7);
        const decoded = this.unifiedJwtService.decodeToken(token);
        
        if (decoded && typeof decoded === 'object') {
          userInfo = `${decoded.username || 'Unknown'}(${decoded.uid || 'Unknown'})`;
          tokenInfo = {
            uid: decoded.uid,
            username: decoded.username,
            domain: decoded.domain,
            exp: decoded.exp,
            iat: decoded.iat,
          };
        }
      } catch (error) {
        userInfo = 'Invalid Token';
        this.logger.warn(`Invalid token in request: ${error.message}`, {
          ip,
          userAgent,
          url: originalUrl,
        });
      }
    }

    // 记录请求开始
    this.logger.log(`[${method}] ${originalUrl} - ${userInfo} - ${ip}`, {
      method,
      url: originalUrl,
      ip,
      userAgent,
      user: userInfo,
      tokenInfo,
      timestamp: new Date().toISOString(),
    });

    // 监听响应完成
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;
      
      const logLevel = statusCode >= 400 ? 'warn' : 'log';
      const message = `[${method}] ${originalUrl} - ${statusCode} - ${duration}ms - ${userInfo}`;

      this.logger[logLevel](message, {
        method,
        url: originalUrl,
        statusCode,
        duration,
        ip,
        userAgent,
        user: userInfo,
        tokenInfo,
        timestamp: new Date().toISOString(),
      });

      // 记录认证相关的特殊事件
      if (statusCode === 401) {
        this.logger.warn('Authentication failed', {
          method,
          url: originalUrl,
          ip,
          userAgent,
          reason: 'Unauthorized access attempt',
          timestamp: new Date().toISOString(),
        });
      }

      if (statusCode === 403) {
        this.logger.warn('Authorization failed', {
          method,
          url: originalUrl,
          ip,
          userAgent,
          user: userInfo,
          reason: 'Insufficient permissions',
          timestamp: new Date().toISOString(),
        });
      }
    });

    next();
  }
}

/**
 * 安全审计中间件
 * 记录敏感操作和安全事件
 */
@Injectable()
export class SecurityAuditMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityAuditMiddleware.name);

  constructor(private readonly unifiedJwtService: UnifiedJwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip, headers, body } = req;
    const userAgent = headers['user-agent'] || 'Unknown';
    const authorization = headers.authorization;

    // 检查是否为敏感操作
    const isSensitiveOperation = this.isSensitiveOperation(method, originalUrl);
    
    if (isSensitiveOperation) {
      let userInfo = 'Anonymous';
      
      if (authorization && authorization.startsWith('Bearer ')) {
        try {
          const token = authorization.substring(7);
          const decoded = this.unifiedJwtService.decodeToken(token);
          
          if (decoded && typeof decoded === 'object') {
            userInfo = `${decoded.username}(${decoded.uid})`;
          }
        } catch (error) {
          userInfo = 'Invalid Token';
        }
      }

      // 记录敏感操作
      this.logger.warn('Sensitive operation attempted', {
        operation: `${method} ${originalUrl}`,
        user: userInfo,
        ip,
        userAgent,
        timestamp: new Date().toISOString(),
        requestBody: this.sanitizeRequestBody(body),
      });
    }

    // 检查可疑活动
    this.checkSuspiciousActivity(req);

    next();
  }

  private isSensitiveOperation(method: string, url: string): boolean {
    const sensitivePatterns = [
      /\/auth\/login/,
      /\/auth\/logout/,
      /\/auth\/refresh/,
      /\/users\/.*\/password/,
      /\/admin\/.*/,
      /\/system\/.*/,
      /DELETE/i,
    ];

    return sensitivePatterns.some(pattern => {
      if (typeof pattern === 'string') {
        return url.includes(pattern);
      }
      return pattern.test(url) || pattern.test(method);
    });
  }

  private sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });

    return sanitized;
  }

  private checkSuspiciousActivity(req: Request): void {
    const { ip, headers, originalUrl } = req;
    const userAgent = headers['user-agent'] || '';

    // 检查可疑的User-Agent
    const suspiciousUserAgents = [
      'curl',
      'wget',
      'python-requests',
      'PostmanRuntime',
    ];

    if (suspiciousUserAgents.some(agent => userAgent.toLowerCase().includes(agent.toLowerCase()))) {
      this.logger.warn('Suspicious user agent detected', {
        ip,
        userAgent,
        url: originalUrl,
        timestamp: new Date().toISOString(),
      });
    }

    // 检查频繁请求（简单实现）
    // 在生产环境中应该使用Redis等存储来跟踪请求频率
    const requestKey = `${ip}-${originalUrl}`;
    // 这里可以添加频率限制逻辑
  }
}
