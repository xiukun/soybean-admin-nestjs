import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { GetGenerationProgressQuery } from '../queries/get-generation-progress.query';

@Injectable()
@QueryHandler(GetGenerationProgressQuery)
export class GetGenerationProgressHandler implements IQueryHandler<GetGenerationProgressQuery> {
  private readonly logger = new Logger(GetGenerationProgressHandler.name);

  // 简单的内存存储，实际项目中应该使用Redis或数据库
  private static progressStore = new Map<string, any>();

  async execute(query: GetGenerationProgressQuery): Promise<any> {
    this.logger.log(`Getting progress for task: ${query.taskId}`);

    try {
      const progress = GetGenerationProgressHandler.progressStore.get(query.taskId);

      if (!progress) {
        // 如果没有找到进度信息，返回默认状态
        return {
          percentage: 0,
          status: 'not_found',
          message: 'Task not found or expired',
          logs: [],
        };
      }

      return progress;

    } catch (error) {
      this.logger.error(`Failed to get progress for task ${query.taskId}:`, error);
      
      return {
        percentage: 0,
        status: 'error',
        message: 'Failed to get progress information',
        logs: [
          {
            level: 'error',
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    }
  }

  // 静态方法用于更新进度
  static updateProgress(taskId: string, progress: any): void {
    this.progressStore.set(taskId, progress);
    
    // 设置过期时间（1小时后清理）
    setTimeout(() => {
      this.progressStore.delete(taskId);
    }, 60 * 60 * 1000);
  }

  // 静态方法用于设置初始进度
  static initProgress(taskId: string): void {
    this.updateProgress(taskId, {
      percentage: 0,
      status: 'pending',
      message: 'Initializing code generation...',
      logs: [
        {
          level: 'info',
          message: 'Code generation task created',
          timestamp: new Date().toISOString(),
        },
      ],
    });
  }

  // 静态方法用于完成进度
  static completeProgress(taskId: string, success: boolean, message: string, additionalData?: any): void {
    const existingProgress = this.progressStore.get(taskId) || { logs: [] };
    
    this.updateProgress(taskId, {
      percentage: 100,
      status: success ? 'success' : 'failed',
      message,
      logs: [
        ...existingProgress.logs,
        {
          level: success ? 'info' : 'error',
          message,
          timestamp: new Date().toISOString(),
        },
      ],
      ...additionalData,
    });
  }

  // 静态方法用于添加日志
  static addLog(taskId: string, level: 'info' | 'warn' | 'error', message: string): void {
    const existingProgress = this.progressStore.get(taskId);
    
    if (existingProgress) {
      existingProgress.logs.push({
        level,
        message,
        timestamp: new Date().toISOString(),
      });
      
      this.progressStore.set(taskId, existingProgress);
    }
  }

  // 静态方法用于更新进度百分比
  static updatePercentage(taskId: string, percentage: number, message?: string): void {
    const existingProgress = this.progressStore.get(taskId);
    
    if (existingProgress) {
      existingProgress.percentage = percentage;
      if (message) {
        existingProgress.message = message;
        existingProgress.logs.push({
          level: 'info',
          message,
          timestamp: new Date().toISOString(),
        });
      }
      
      this.progressStore.set(taskId, existingProgress);
    }
  }
}
