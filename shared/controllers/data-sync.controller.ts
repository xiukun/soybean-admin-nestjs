import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Delete,
  Logger,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSyncService, SyncEvent } from '../services/data-sync.service';
import { Public } from '../decorators/public.decorator';
import { ApiResponse as CustomApiResponse } from '../decorators/api-response.decorator';

interface SyncRequest {
  events: SyncEvent[];
  source: string;
  timestamp: string;
}

@ApiTags('Data Synchronization')
@Controller('api/v1/sync')
export class DataSyncController {
  private readonly logger = new Logger(DataSyncController.name);

  constructor(
    private readonly dataSyncService: DataSyncService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  @Post(':entity')
  @Public() // 允许服务间调用
  @ApiOperation({ summary: 'Receive sync events for an entity' })
  @ApiParam({ name: 'entity', description: 'Entity type to sync' })
  @ApiResponse({ status: 200, description: 'Sync events processed successfully' })
  @CustomApiResponse()
  async receiveSyncEvents(
    @Param('entity') entity: string,
    @Body() syncRequest: SyncRequest
  ) {
    try {
      this.logger.log(`Received ${syncRequest.events.length} sync events for entity: ${entity}`, {
        source: syncRequest.source,
        timestamp: syncRequest.timestamp,
      });

      const processedEvents = [];
      const failedEvents = [];

      for (const event of syncRequest.events) {
        try {
          await this.processSyncEvent(entity, event);
          processedEvents.push(event);
        } catch (error) {
          this.logger.error(`Failed to process sync event:`, error);
          failedEvents.push({
            event,
            error: error.message,
          });
        }
      }

      const result = {
        processed: processedEvents.length,
        failed: failedEvents.length,
        failedEvents: failedEvents.length > 0 ? failedEvents : undefined,
      };

      this.logger.log(`Sync processing completed for ${entity}:`, result);

      return result;
    } catch (error) {
      this.logger.error(`Error processing sync request for ${entity}:`, error);
      throw new HttpException(
        `Failed to process sync request: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('status')
  @ApiOperation({ summary: 'Get synchronization status' })
  @ApiResponse({ status: 200, description: 'Sync status retrieved successfully' })
  @CustomApiResponse()
  getSyncStatus() {
    const status = this.dataSyncService.getSyncStatus();
    const totalPending = Object.values(status).reduce((sum, count) => sum + count, 0);

    return {
      status: 'active',
      pendingEvents: status,
      totalPending,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('trigger/:entity?')
  @ApiOperation({ summary: 'Manually trigger synchronization' })
  @ApiParam({ name: 'entity', required: false, description: 'Specific entity to sync' })
  @ApiResponse({ status: 200, description: 'Sync triggered successfully' })
  @CustomApiResponse()
  async triggerSync(@Param('entity') entity?: string) {
    try {
      await this.dataSyncService.triggerSync(entity);
      
      return {
        message: `Sync triggered successfully${entity ? ` for entity: ${entity}` : ''}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error triggering sync:', error);
      throw new HttpException(
        `Failed to trigger sync: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('queue/:entity?')
  @ApiOperation({ summary: 'Clear synchronization queue' })
  @ApiParam({ name: 'entity', required: false, description: 'Specific entity queue to clear' })
  @ApiResponse({ status: 200, description: 'Sync queue cleared successfully' })
  @CustomApiResponse()
  clearSyncQueue(@Param('entity') entity?: string) {
    try {
      this.dataSyncService.clearSyncQueue(entity);
      
      return {
        message: `Sync queue cleared${entity ? ` for entity: ${entity}` : ''}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error clearing sync queue:', error);
      throw new HttpException(
        `Failed to clear sync queue: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private async processSyncEvent(entity: string, event: SyncEvent): Promise<void> {
    this.logger.debug(`Processing sync event: ${event.type} ${entity}`, {
      id: event.data.id,
      version: event.version,
      source: event.source,
    });

    // 根据实体类型和操作类型处理同步事件
    switch (entity) {
      case 'entity':
        await this.processEntitySync(event);
        break;
      case 'user':
        await this.processUserSync(event);
        break;
      case 'config':
        await this.processConfigSync(event);
        break;
      default:
        this.logger.warn(`Unknown entity type for sync: ${entity}`);
    }

    // 发出本地事件，让其他模块可以监听
    this.eventEmitter.emit(`sync.${entity}.${event.type}`, {
      entity,
      event,
      timestamp: new Date().toISOString(),
    });
  }

  private async processEntitySync(event: SyncEvent): Promise<void> {
    // 处理实体同步逻辑
    switch (event.type) {
      case 'create':
        // 创建实体
        this.logger.debug('Processing entity creation sync');
        break;
      case 'update':
        // 更新实体
        this.logger.debug('Processing entity update sync');
        break;
      case 'delete':
        // 删除实体
        this.logger.debug('Processing entity deletion sync');
        break;
    }
  }

  private async processUserSync(event: SyncEvent): Promise<void> {
    // 处理用户同步逻辑
    switch (event.type) {
      case 'create':
        this.logger.debug('Processing user creation sync');
        break;
      case 'update':
        this.logger.debug('Processing user update sync');
        break;
      case 'delete':
        this.logger.debug('Processing user deletion sync');
        break;
    }
  }

  private async processConfigSync(event: SyncEvent): Promise<void> {
    // 处理配置同步逻辑
    switch (event.type) {
      case 'update':
        this.logger.debug('Processing config update sync');
        break;
    }
  }
}
