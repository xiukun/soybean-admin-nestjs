import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

export interface LogContext {
  userId?: string;
  projectId?: string;
  entityId?: string;
  templateId?: string;
  requestId?: string;
  sessionId?: string;
  operation?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  memoryUsage: NodeJS.MemoryUsage;
  timestamp: Date;
  context?: LogContext;
}

@Injectable({ scope: Scope.TRANSIENT })
export class EnhancedLoggerService implements LoggerService {
  private readonly logger: winston.Logger;
  private readonly context: string;
  private readonly performanceMetrics: PerformanceMetrics[] = [];

  constructor(
    private readonly configService: ConfigService,
    context?: string,
  ) {
    this.context = context || 'Application';
    this.logger = this.createLogger();
  }

  private createLogger(): winston.Logger {
    const logLevel = this.configService.get('LOG_LEVEL', 'info');
    const logDir = this.configService.get('LOG_DIR', './logs');
    const enableFileLogging = this.configService.get('ENABLE_FILE_LOGGING', 'true') === 'true';
    const enableConsoleLogging = this.configService.get('ENABLE_CONSOLE_LOGGING', 'true') === 'true';

    const transports: winston.transport[] = [];

    // Console transport
    if (enableConsoleLogging) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
              const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
              return `${timestamp} [${context || this.context}] ${level}: ${message} ${metaStr}`;
            }),
          ),
        }),
      );
    }

    // File transports
    if (enableFileLogging) {
      // General application logs
      transports.push(
        new DailyRotateFile({
          filename: `${logDir}/application-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      );

      // Error logs
      transports.push(
        new DailyRotateFile({
          filename: `${logDir}/error-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '30d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      );

      // Performance logs
      transports.push(
        new DailyRotateFile({
          filename: `${logDir}/performance-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '7d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      );

      // Audit logs
      transports.push(
        new DailyRotateFile({
          filename: `${logDir}/audit-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '90d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      );
    }

    return winston.createLogger({
      level: logLevel,
      transports,
      exceptionHandlers: enableFileLogging ? [
        new DailyRotateFile({
          filename: `${logDir}/exceptions-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
        }),
      ] : [],
      rejectionHandlers: enableFileLogging ? [
        new DailyRotateFile({
          filename: `${logDir}/rejections-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
        }),
      ] : [],
    });
  }

  log(message: string, context?: LogContext): void {
    this.logger.info(message, { context: this.context, ...context });
  }

  error(message: string, trace?: string, context?: LogContext): void {
    this.logger.error(message, { 
      context: this.context, 
      trace, 
      ...context 
    });
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, { context: this.context, ...context });
  }

  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, { context: this.context, ...context });
  }

  verbose(message: string, context?: LogContext): void {
    this.logger.verbose(message, { context: this.context, ...context });
  }

  // Enhanced logging methods
  logOperation(operation: string, context?: LogContext): void {
    this.logger.info(`Operation: ${operation}`, {
      context: this.context,
      operation,
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  logPerformance(metrics: PerformanceMetrics): void {
    this.performanceMetrics.push(metrics);
    
    this.logger.info('Performance metrics', {
      context: this.context,
      type: 'performance',
      ...metrics,
    });

    // Log slow operations
    if (metrics.duration > 1000) {
      this.logger.warn(`Slow operation detected: ${metrics.operation}`, {
        context: this.context,
        type: 'slow_operation',
        ...metrics,
      });
    }
  }

  logAudit(action: string, resource: string, resourceId: string, context?: LogContext): void {
    this.logger.info('Audit log', {
      context: this.context,
      type: 'audit',
      action,
      resource,
      resourceId,
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  logSecurity(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: LogContext): void {
    const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
    
    this.logger.log(level, `Security event: ${event}`, {
      context: this.context,
      type: 'security',
      event,
      severity,
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  logBusinessEvent(event: string, data: any, context?: LogContext): void {
    this.logger.info(`Business event: ${event}`, {
      context: this.context,
      type: 'business',
      event,
      data,
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  logCodeGeneration(
    projectId: string,
    templateIds: string[],
    entityIds: string[],
    status: 'started' | 'completed' | 'failed',
    details?: any,
    context?: LogContext,
  ): void {
    this.logger.info(`Code generation ${status}`, {
      context: this.context,
      type: 'code_generation',
      projectId,
      templateIds,
      entityIds,
      status,
      details,
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  logTemplateOperation(
    templateId: string,
    operation: 'create' | 'update' | 'delete' | 'compile' | 'validate',
    status: 'success' | 'failure',
    details?: any,
    context?: LogContext,
  ): void {
    this.logger.info(`Template ${operation} ${status}`, {
      context: this.context,
      type: 'template_operation',
      templateId,
      operation,
      status,
      details,
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  logEntityOperation(
    entityId: string,
    operation: 'create' | 'update' | 'delete' | 'validate',
    status: 'success' | 'failure',
    details?: any,
    context?: LogContext,
  ): void {
    this.logger.info(`Entity ${operation} ${status}`, {
      context: this.context,
      type: 'entity_operation',
      entityId,
      operation,
      status,
      details,
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  logProjectOperation(
    projectId: string,
    operation: 'create' | 'update' | 'delete' | 'export' | 'import',
    status: 'success' | 'failure',
    details?: any,
    context?: LogContext,
  ): void {
    this.logger.info(`Project ${operation} ${status}`, {
      context: this.context,
      type: 'project_operation',
      projectId,
      operation,
      status,
      details,
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  // Performance monitoring
  startTimer(operation: string): () => void {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    return () => {
      const duration = Date.now() - startTime;
      const endMemory = process.memoryUsage();

      this.logPerformance({
        operation,
        duration,
        memoryUsage: {
          rss: endMemory.rss - startMemory.rss,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          external: endMemory.external - startMemory.external,
          arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers,
        },
        timestamp: new Date(),
      });
    };
  }

  // Metrics aggregation
  getPerformanceMetrics(operation?: string): PerformanceMetrics[] {
    if (operation) {
      return this.performanceMetrics.filter(m => m.operation === operation);
    }
    return [...this.performanceMetrics];
  }

  getAveragePerformance(operation: string): { avgDuration: number; count: number } {
    const metrics = this.getPerformanceMetrics(operation);
    if (metrics.length === 0) {
      return { avgDuration: 0, count: 0 };
    }

    const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
    return {
      avgDuration: totalDuration / metrics.length,
      count: metrics.length,
    };
  }

  clearMetrics(): void {
    this.performanceMetrics.length = 0;
  }

  // Create child logger with additional context
  child(additionalContext: string): EnhancedLoggerService {
    const childContext = `${this.context}:${additionalContext}`;
    return new EnhancedLoggerService(this.configService, childContext);
  }
}
