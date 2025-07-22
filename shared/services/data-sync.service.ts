import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ServiceCommunicationService } from './service-communication.service';
import {
  ServiceEvent,
  ServiceRequest,
} from '../interfaces/service-communication.interface';

export interface SyncEvent<T = any> {
  type: 'create' | 'update' | 'delete';
  entity: string;
  data: T;
  timestamp: string;
  source: string;
  version?: number;
  checksum?: string;
}

export interface SyncConfig {
  enabled: boolean;
  batchSize: number;
  syncInterval: number;
  retryAttempts: number;
  retryDelay: number;
  conflictResolution: 'source-wins' | 'target-wins' | 'timestamp-wins' | 'manual';
}

@Injectable()
export class DataSyncService {
  private readonly logger = new Logger(DataSyncService.name);
  private readonly syncQueue: Map<string, SyncEvent[]> = new Map();
  private readonly syncConfig: SyncConfig;
  private syncTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly serviceCommunication: ServiceCommunicationService
  ) {
    this.syncConfig = {
      enabled: this.configService.get<boolean>('DATA_SYNC_ENABLED', true),
      batchSize: this.configService.get<number>('DATA_SYNC_BATCH_SIZE', 100),
      syncInterval: this.configService.get<number>('DATA_SYNC_INTERVAL', 30000),
      retryAttempts: this.configService.get<number>('DATA_SYNC_RETRY_ATTEMPTS', 3),
      retryDelay: this.configService.get<number>('DATA_SYNC_RETRY_DELAY', 5000),
      conflictResolution: this.configService.get<'source-wins' | 'target-wins' | 'timestamp-wins' | 'manual'>(
        'DATA_SYNC_CONFLICT_RESOLUTION',
        'timestamp-wins'
      ),
    };

    this.initializeSync();
  }

  private initializeSync() {
    if (!this.syncConfig.enabled) {
      this.logger.log('Data synchronization is disabled');
      return;
    }

    this.logger.log('Initializing data synchronization service');
    
    // 启动定时同步
    this.startPeriodicSync();

    // 监听数据变更事件
    this.setupEventListeners();
  }

  private startPeriodicSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(async () => {
      await this.processSyncQueue();
    }, this.syncConfig.syncInterval);

    this.logger.log(`Periodic sync started with interval: ${this.syncConfig.syncInterval}ms`);
  }

  private setupEventListeners() {
    // 监听实体变更事件
    this.eventEmitter.on('entity.created', (data) => this.handleEntityEvent('create', 'entity', data));
    this.eventEmitter.on('entity.updated', (data) => this.handleEntityEvent('update', 'entity', data));
    this.eventEmitter.on('entity.deleted', (data) => this.handleEntityEvent('delete', 'entity', data));

    // 监听用户数据变更事件
    this.eventEmitter.on('user.created', (data) => this.handleEntityEvent('create', 'user', data));
    this.eventEmitter.on('user.updated', (data) => this.handleEntityEvent('update', 'user', data));
    this.eventEmitter.on('user.deleted', (data) => this.handleEntityEvent('delete', 'user', data));

    // 监听配置变更事件
    this.eventEmitter.on('config.updated', (data) => this.handleEntityEvent('update', 'config', data));
  }

  private handleEntityEvent(type: 'create' | 'update' | 'delete', entity: string, data: any) {
    const syncEvent: SyncEvent = {
      type,
      entity,
      data,
      timestamp: new Date().toISOString(),
      source: this.configService.get<string>('SERVICE_NAME', 'unknown'),
      version: data.version || 1,
      checksum: this.calculateChecksum(data),
    };

    this.addToSyncQueue(entity, syncEvent);
  }

  private addToSyncQueue(entity: string, event: SyncEvent) {
    if (!this.syncQueue.has(entity)) {
      this.syncQueue.set(entity, []);
    }

    const queue = this.syncQueue.get(entity)!;
    queue.push(event);

    this.logger.debug(`Added sync event to queue: ${entity}`, {
      type: event.type,
      queueSize: queue.length,
    });

    // 如果队列达到批处理大小，立即处理
    if (queue.length >= this.syncConfig.batchSize) {
      this.processSyncQueue(entity);
    }
  }

  private async processSyncQueue(specificEntity?: string) {
    const entities = specificEntity ? [specificEntity] : Array.from(this.syncQueue.keys());

    for (const entity of entities) {
      const queue = this.syncQueue.get(entity);
      if (!queue || queue.length === 0) {
        continue;
      }

      const events = queue.splice(0, this.syncConfig.batchSize);
      await this.syncEvents(entity, events);
    }
  }

  private async syncEvents(entity: string, events: SyncEvent[]) {
    this.logger.debug(`Syncing ${events.length} events for entity: ${entity}`);

    const targetServices = this.getTargetServices(entity);

    for (const service of targetServices) {
      await this.syncToService(service, entity, events);
    }
  }

  private getTargetServices(entity: string): string[] {
    // 根据实体类型确定需要同步的目标服务
    const syncMap: Record<string, string[]> = {
      entity: ['amis-backend'], // 实体数据同步到amis-backend
      user: ['lowcode-platform', 'amis-backend'], // 用户数据同步到所有服务
      config: ['lowcode-platform', 'amis-backend'], // 配置数据同步到所有服务
    };

    return syncMap[entity] || [];
  }

  private async syncToService(serviceName: string, entity: string, events: SyncEvent[]) {
    try {
      const request: ServiceRequest = {
        service: serviceName,
        endpoint: `/api/v1/sync/${entity}`,
        method: 'POST',
        data: {
          events,
          source: this.configService.get<string>('SERVICE_NAME'),
          timestamp: new Date().toISOString(),
        },
        timeout: 30000,
      };

      const response = await this.serviceCommunication.callService(request);

      if (response.success) {
        this.logger.debug(`Successfully synced ${events.length} events to ${serviceName}`);
      } else {
        this.logger.error(`Failed to sync events to ${serviceName}:`, response.message);
        await this.handleSyncFailure(serviceName, entity, events);
      }
    } catch (error) {
      this.logger.error(`Error syncing to ${serviceName}:`, error);
      await this.handleSyncFailure(serviceName, entity, events);
    }
  }

  private async handleSyncFailure(serviceName: string, entity: string, events: SyncEvent[]) {
    // 重新加入队列进行重试
    const queue = this.syncQueue.get(entity) || [];
    queue.unshift(...events);
    this.syncQueue.set(entity, queue);

    this.logger.warn(`Re-queued ${events.length} events for retry: ${entity} -> ${serviceName}`);
  }

  private calculateChecksum(data: any): string {
    // 简单的校验和计算，实际应用中可以使用更复杂的算法
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  // 公共方法：手动触发同步
  async triggerSync(entity?: string): Promise<void> {
    this.logger.log(`Manual sync triggered${entity ? ` for entity: ${entity}` : ''}`);
    await this.processSyncQueue(entity);
  }

  // 公共方法：获取同步状态
  getSyncStatus(): Record<string, number> {
    const status: Record<string, number> = {};
    for (const [entity, queue] of this.syncQueue.entries()) {
      status[entity] = queue.length;
    }
    return status;
  }

  // 公共方法：清空同步队列
  clearSyncQueue(entity?: string): void {
    if (entity) {
      this.syncQueue.delete(entity);
      this.logger.log(`Cleared sync queue for entity: ${entity}`);
    } else {
      this.syncQueue.clear();
      this.logger.log('Cleared all sync queues');
    }
  }

  // 停止同步服务
  stop(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    this.logger.log('Data synchronization service stopped');
  }
}
