import { Controller, Post, Get, Body, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { DataSyncService, SyncStatus } from '@lib/shared/sync/data-sync.service';
import { AmisResponse } from '@decorators/amis-response.decorator';

class TriggerSyncDto {
  entityIds?: string[];
  force?: boolean;
}

@ApiTags('Data Synchronization')
@Controller('api/v1/sync')
export class SyncController {
  constructor(private readonly dataSyncService: DataSyncService) {}

  @Post('trigger')
  @AmisResponse()
  @ApiOperation({
    summary: 'Trigger data synchronization',
    description: 'Manually trigger synchronization between lowcode-platform-backend and amis-lowcode-backend',
  })
  @ApiBody({
    type: TriggerSyncDto,
    description: 'Sync configuration',
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sync triggered successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            lastSync: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['success', 'failed', 'in_progress'] },
            syncedEntities: { type: 'number' },
            errors: { type: 'array', items: { type: 'string' } },
            duration: { type: 'number' },
          },
        },
        msg: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Sync already in progress or invalid request',
  })
  async triggerSync(@Body() body: TriggerSyncDto = {}): Promise<{ syncStatus: SyncStatus }> {
    try {
      let syncStatus: SyncStatus;

      if (body.entityIds && body.entityIds.length > 0) {
        // 增量同步指定实体
        syncStatus = await this.dataSyncService.syncSpecificEntities(body.entityIds);
      } else {
        // 全量同步
        syncStatus = await this.dataSyncService.triggerSync();
      }

      return { syncStatus };
    } catch (error) {
      throw new Error(`Failed to trigger sync: ${error.message}`);
    }
  }

  @Get('status')
  @AmisResponse()
  @ApiOperation({
    summary: 'Get synchronization status',
    description: 'Get the current status of data synchronization',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sync status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            lastSync: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['success', 'failed', 'in_progress'] },
            syncedEntities: { type: 'number' },
            errors: { type: 'array', items: { type: 'string' } },
            duration: { type: 'number' },
          },
        },
        msg: { type: 'string' },
      },
    },
  })
  async getSyncStatus(): Promise<{ syncStatus: SyncStatus | null }> {
    const syncStatus = this.dataSyncService.getSyncStatus();
    return { syncStatus };
  }

  @Post('entities')
  @AmisResponse()
  @ApiOperation({
    summary: 'Sync specific entities',
    description: 'Synchronize specific entities to amis-lowcode-backend',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        entityIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of entity IDs to sync',
        },
      },
      required: ['entityIds'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entities synced successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid entity IDs or sync in progress',
  })
  async syncEntities(@Body() body: { entityIds: string[] }): Promise<{ syncStatus: SyncStatus }> {
    if (!body.entityIds || body.entityIds.length === 0) {
      throw new Error('Entity IDs are required');
    }

    try {
      const syncStatus = await this.dataSyncService.syncSpecificEntities(body.entityIds);
      return { syncStatus };
    } catch (error) {
      throw new Error(`Failed to sync entities: ${error.message}`);
    }
  }
}

/**
 * 在amis-lowcode-backend中接收同步数据的控制器
 */
@ApiTags('Sync Receiver')
@Controller('api/sync')
export class SyncReceiverController {
  @Post('entity')
  @ApiOperation({
    summary: 'Receive entity sync data',
    description: 'Receive and process entity synchronization data from lowcode-platform-backend',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        entity: {
          type: 'object',
          description: 'Entity data to sync',
        },
        syncTimestamp: {
          type: 'string',
          format: 'date-time',
          description: 'Timestamp of the sync operation',
        },
      },
    },
  })
  async receiveEntitySync(@Body() body: any) {
    // 这个方法应该在amis-lowcode-backend中实现
    // 这里只是作为接口定义的示例
    
    const { entity, syncTimestamp } = body;
    
    // 处理实体同步逻辑
    // 1. 验证实体数据
    // 2. 更新本地实体缓存
    // 3. 生成或更新相关代码文件
    // 4. 更新Prisma Schema
    // 5. 重新生成Prisma Client
    
    return {
      success: true,
      message: 'Entity sync received and processed',
      entityId: entity.id,
      syncTimestamp,
    };
  }

  @Post('prisma-schema')
  @ApiOperation({
    summary: 'Receive Prisma schema sync',
    description: 'Receive and update Prisma schema from lowcode-platform-backend',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        schema: {
          type: 'string',
          description: 'Prisma schema content',
        },
        syncTimestamp: {
          type: 'string',
          format: 'date-time',
          description: 'Timestamp of the sync operation',
        },
      },
    },
  })
  async receivePrismaSchemaSync(@Body() body: any) {
    // 这个方法应该在amis-lowcode-backend中实现
    
    const { schema, syncTimestamp } = body;
    
    // 处理Prisma Schema同步逻辑
    // 1. 备份当前schema
    // 2. 写入新的schema内容
    // 3. 执行prisma generate
    // 4. 验证schema有效性
    
    return {
      success: true,
      message: 'Prisma schema sync received and processed',
      syncTimestamp,
    };
  }
}
