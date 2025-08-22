import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { ServiceTracing } from '../middleware/tracing.middleware';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface SyncStatus {
  lastSync: Date;
  status: 'success' | 'failed' | 'in_progress';
  syncedEntities: number;
  errors: string[];
  duration: number;
}

export interface EntitySyncData {
  id: string;
  name: string;
  code: string;
  description?: string;
  fields: FieldSyncData[];
  relationships: RelationshipSyncData[];
  config: any;
  version: string;
  lastModified: Date;
}

export interface FieldSyncData {
  id: string;
  name: string;
  code: string;
  type: string;
  required: boolean;
  defaultValue?: any;
  validation?: any;
  config: any;
}

export interface RelationshipSyncData {
  id: string;
  type: string;
  sourceEntityId: string;
  targetEntityId: string;
  sourceFieldId?: string;
  targetFieldId?: string;
  config: any;
}

@Injectable()
export class DataSyncService {
  private readonly logger = new Logger(DataSyncService.name);
  private syncInProgress = false;
  private lastSyncStatus: SyncStatus | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 手动触发数据同步
   */
  async triggerSync(): Promise<SyncStatus> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    return this.performSync();
  }

  /**
   * 获取同步状态
   */
  getSyncStatus(): SyncStatus | null {
    return this.lastSyncStatus;
  }

  /**
   * 定时同步任务（每小时执行一次）
   */
  @Cron(CronExpression.EVERY_HOUR)
  async scheduledSync() {
    if (this.syncInProgress) {
      this.logger.warn('Skipping scheduled sync - sync already in progress');
      return;
    }

    try {
      await this.performSync();
    } catch (error) {
      this.logger.error('Scheduled sync failed:', error);
    }
  }

  /**
   * 执行数据同步
   */
  private async performSync(): Promise<SyncStatus> {
    const startTime = Date.now();
    this.syncInProgress = true;

    const syncStatus: SyncStatus = {
      lastSync: new Date(),
      status: 'in_progress',
      syncedEntities: 0,
      errors: [],
      duration: 0,
    };

    try {
      this.logger.log('Starting data synchronization...');

      // 1. 获取需要同步的实体
      const entities = await this.getEntitiesForSync();
      this.logger.log(`Found ${entities.length} entities to sync`);

      // 2. 同步实体到amis-lowcode-backend
      for (const entity of entities) {
        try {
          await this.syncEntityToAmisBackend(entity);
          syncStatus.syncedEntities++;
          this.logger.debug(`Synced entity: ${entity.name}`);
        } catch (error) {
          const errorMsg = `Failed to sync entity ${entity.name}: ${error.message}`;
          syncStatus.errors.push(errorMsg);
          this.logger.error(errorMsg);
        }
      }

      // 3. 同步Prisma Schema
      await this.syncPrismaSchema();

      // 4. 触发amis-lowcode-backend重启（如果需要）
      if (syncStatus.syncedEntities > 0) {
        await this.triggerAmisBackendRestart();
      }

      syncStatus.status = syncStatus.errors.length === 0 ? 'success' : 'failed';
      syncStatus.duration = Date.now() - startTime;

      this.logger.log(`Data sync completed: ${syncStatus.syncedEntities} entities synced, ${syncStatus.errors.length} errors`);

    } catch (error) {
      syncStatus.status = 'failed';
      syncStatus.errors.push(`Sync failed: ${error.message}`);
      syncStatus.duration = Date.now() - startTime;
      
      this.logger.error('Data sync failed:', error);
    } finally {
      this.syncInProgress = false;
      this.lastSyncStatus = syncStatus;
    }

    return syncStatus;
  }

  /**
   * 获取需要同步的实体
   */
  private async getEntitiesForSync(): Promise<EntitySyncData[]> {
    return ServiceTracing.traceServiceCall('database', 'getEntitiesForSync', async () => {
      const entities = await this.prisma.entity.findMany({
        include: {
          fields: true,
          sourceRelations: true,
          targetRelations: true,
        },
        where: {
          // 只同步已发布的实体
          status: 'ACTIVE',
        },
      });

      return entities.map(entity => ({
        id: entity.id,
        name: entity.name,
        code: entity.code,
        description: entity.description,
        fields: entity.fields.map(field => ({
          id: field.id,
          name: field.name,
          code: field.code,
          type: field.type,
          required: !field.nullable, // 使用nullable字段反向映射到required
          defaultValue: field.defaultValue,
          validation: field.validationRules, // 映射到正确的字段名
          config: {}, // field没有config字段，返回空对象
        })),
        relationships: [
          ...entity.sourceRelations.map(rel => ({
            id: rel.id,
            type: rel.type,
            sourceEntityId: rel.sourceEntityId,
            targetEntityId: rel.targetEntityId,
            sourceFieldId: rel.sourceFieldId,
            targetFieldId: rel.targetFieldId,
            config: rel.config,
          })),
          ...entity.targetRelations.map(rel => ({
            id: rel.id,
            type: rel.type,
            sourceEntityId: rel.sourceEntityId,
            targetEntityId: rel.targetEntityId,
            sourceFieldId: rel.sourceFieldId,
            targetFieldId: rel.targetFieldId,
            config: rel.config,
          })),
        ],
        config: entity.config,
        version: entity.version || '1.0.0',
        lastModified: entity.updatedAt,
      }));
    });
  }

  /**
   * 同步实体到amis-lowcode-backend
   */
  private async syncEntityToAmisBackend(entity: EntitySyncData): Promise<void> {
    const amisBackendUrl = this.configService.get('AMIS_BACKEND_URL');
    if (!amisBackendUrl) {
      throw new Error('AMIS_BACKEND_URL not configured');
    }

    return ServiceTracing.traceServiceCall('amis-backend', 'syncEntity', async () => {
      const headers = {
        'Content-Type': 'application/json',
        ...ServiceTracing.createTracingHeaders(),
      };

      const response = await fetch(`${amisBackendUrl}/api/sync/entity`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          entity,
          syncTimestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return result;
    });
  }

  /**
   * 同步Prisma Schema
   */
  private async syncPrismaSchema(): Promise<void> {
    const amisBackendUrl = this.configService.get('AMIS_BACKEND_URL');
    if (!amisBackendUrl) {
      throw new Error('AMIS_BACKEND_URL not configured');
    }

    return ServiceTracing.traceServiceCall('amis-backend', 'syncPrismaSchema', async () => {
      // 生成最新的Prisma Schema
      const entities = await this.getEntitiesForSync();
      const schemaContent = await this.generatePrismaSchema(entities);

      const headers = {
        'Content-Type': 'application/json',
        ...ServiceTracing.createTracingHeaders(),
      };

      const response = await fetch(`${amisBackendUrl}/api/sync/prisma-schema`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          schema: schemaContent,
          syncTimestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return response.json();
    });
  }

  /**
   * 生成Prisma Schema内容
   */
  private async generatePrismaSchema(entities: EntitySyncData[]): Promise<string> {
    // 这里应该使用与代码生成器相同的模板引擎
    // 为了简化，这里返回一个基本的schema结构
    
    let schema = `// Generated Prisma Schema
// This file is auto-generated. Do not edit manually.

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;

    for (const entity of entities) {
      schema += `model ${entity.code} {
`;
      
      // 添加ID字段
      schema += `  id        String   @id @default(cuid())
`;
      
      // 添加实体字段
      for (const field of entity.fields) {
        const fieldType = this.mapFieldTypeToPrisma(field.type);
        const optional = field.required ? '' : '?';
        schema += `  ${field.code}${optional}  ${fieldType}
`;
      }
      
      // 添加时间戳字段
      schema += `  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
`;
      
      schema += `}

`;
    }

    return schema;
  }

  /**
   * 映射字段类型到Prisma类型
   */
  private mapFieldTypeToPrisma(fieldType: string): string {
    const typeMap: Record<string, string> = {
      'string': 'String',
      'text': 'String',
      'number': 'Int',
      'float': 'Float',
      'boolean': 'Boolean',
      'date': 'DateTime',
      'datetime': 'DateTime',
      'json': 'Json',
    };

    return typeMap[fieldType] || 'String';
  }

  /**
   * 触发amis-lowcode-backend重启
   */
  private async triggerAmisBackendRestart(): Promise<void> {
    const amisBackendUrl = this.configService.get('AMIS_BACKEND_URL');
    if (!amisBackendUrl) {
      this.logger.warn('AMIS_BACKEND_URL not configured, skipping restart');
      return;
    }

    return ServiceTracing.traceServiceCall('amis-backend', 'restart', async () => {
      const headers = {
        'Content-Type': 'application/json',
        ...ServiceTracing.createTracingHeaders(),
      };

      const response = await fetch(`${amisBackendUrl}/api/system/restart`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          reason: 'Data sync completed',
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.warn(`Failed to trigger restart: HTTP ${response.status}: ${errorText}`);
        // 不抛出错误，因为重启失败不应该影响同步状态
      } else {
        this.logger.log('Successfully triggered amis-lowcode-backend restart');
      }
    });
  }

  /**
   * 增量同步 - 只同步指定的实体
   */
  async syncSpecificEntities(entityIds: string[]): Promise<SyncStatus> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    const startTime = Date.now();
    this.syncInProgress = true;

    const syncStatus: SyncStatus = {
      lastSync: new Date(),
      status: 'in_progress',
      syncedEntities: 0,
      errors: [],
      duration: 0,
    };

    try {
      this.logger.log(`Starting incremental sync for entities: ${entityIds.join(', ')}`);

      // 获取指定的实体
      const entities = await this.prisma.entity.findMany({
        where: {
          id: { in: entityIds },
          status: 'ACTIVE',
        },
        include: {
          fields: true,
          sourceRelations: true,
          targetRelations: true,
        },
      });

      const entitySyncData = entities.map(entity => ({
        id: entity.id,
        name: entity.name,
        code: entity.code,
        description: entity.description,
        fields: entity.fields.map(field => ({
          id: field.id,
          name: field.name,
          code: field.code,
          type: field.type,
          required: !field.nullable, // 使用nullable字段反向映射到required
          defaultValue: field.defaultValue,
          validation: field.validationRules, // 映射到正确的字段名
          config: {}, // field没有config字段，返回空对象
        })),
        relationships: [],
        config: entity.config,
        version: entity.version || '1.0.0',
        lastModified: entity.updatedAt,
      }));

      // 同步实体
      for (const entity of entitySyncData) {
        try {
          await this.syncEntityToAmisBackend(entity);
          syncStatus.syncedEntities++;
        } catch (error) {
          const errorMsg = `Failed to sync entity ${entity.name}: ${error.message}`;
          syncStatus.errors.push(errorMsg);
          this.logger.error(errorMsg);
        }
      }

      syncStatus.status = syncStatus.errors.length === 0 ? 'success' : 'failed';
      syncStatus.duration = Date.now() - startTime;

      this.logger.log(`Incremental sync completed: ${syncStatus.syncedEntities} entities synced`);

    } catch (error) {
      syncStatus.status = 'failed';
      syncStatus.errors.push(`Incremental sync failed: ${error.message}`);
      syncStatus.duration = Date.now() - startTime;
      
      this.logger.error('Incremental sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }

    return syncStatus;
  }
}
