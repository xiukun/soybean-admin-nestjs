/*
 * @Description: 实体关系管理命令处理器
 * @Autor: henry.xiukun
 * @Date: 2025-07-26 00:15:00
 * @LastEditors: henry.xiukun
 */

import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  CreateRelationshipCommand,
  UpdateRelationshipCommand,
  DeleteRelationshipCommand,
  ValidateRelationshipCommand,
  GenerateRelationshipSQLCommand,
  BatchCreateRelationshipsCommand,
  SyncRelationshipsCommand,
} from '../commands/relationship.commands';
import { RelationshipManagerService } from '../services/relationship-manager.service';

@Injectable()
@CommandHandler(CreateRelationshipCommand)
export class CreateRelationshipHandler implements ICommandHandler<CreateRelationshipCommand> {
  private readonly logger = new Logger(CreateRelationshipHandler.name);

  constructor(private readonly relationshipManager: RelationshipManagerService) {}

  async execute(command: CreateRelationshipCommand) {
    this.logger.log(`创建关系: ${command.name}`);

    try {
      const relationship = await this.relationshipManager.createRelationship(
        command.projectId,
        command.name,
        command.code,
        command.description,
        command.config,
        command.userId,
      );

      return {
        success: true,
        data: relationship,
        message: '关系创建成功',
      };

    } catch (error) {
      this.logger.error(`创建关系失败: ${error.message}`);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  }
}

@Injectable()
@CommandHandler(UpdateRelationshipCommand)
export class UpdateRelationshipHandler implements ICommandHandler<UpdateRelationshipCommand> {
  private readonly logger = new Logger(UpdateRelationshipHandler.name);

  constructor(private readonly relationshipManager: RelationshipManagerService) {}

  async execute(command: UpdateRelationshipCommand) {
    this.logger.log(`更新关系: ${command.relationshipId}`);

    try {
      const relationship = await this.relationshipManager.updateRelationship(
        command.relationshipId,
        {
          name: command.name,
          description: command.description,
          config: command.config,
        },
        command.userId || 'system',
      );

      return {
        success: true,
        data: relationship,
        message: '关系更新成功',
      };

    } catch (error) {
      this.logger.error(`更新关系失败: ${error.message}`);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  }
}

@Injectable()
@CommandHandler(DeleteRelationshipCommand)
export class DeleteRelationshipHandler implements ICommandHandler<DeleteRelationshipCommand> {
  private readonly logger = new Logger(DeleteRelationshipHandler.name);

  constructor(private readonly relationshipManager: RelationshipManagerService) {}

  async execute(command: DeleteRelationshipCommand) {
    this.logger.log(`删除关系: ${command.relationshipId}`);

    try {
      await this.relationshipManager.deleteRelationship(
        command.relationshipId,
        command.userId,
      );

      return {
        success: true,
        message: '关系删除成功',
      };

    } catch (error) {
      this.logger.error(`删除关系失败: ${error.message}`);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  }
}

@Injectable()
@CommandHandler(ValidateRelationshipCommand)
export class ValidateRelationshipHandler implements ICommandHandler<ValidateRelationshipCommand> {
  private readonly logger = new Logger(ValidateRelationshipHandler.name);

  constructor(private readonly relationshipManager: RelationshipManagerService) {}

  async execute(command: ValidateRelationshipCommand) {
    this.logger.log(`验证关系配置: ${command.projectId}`);

    try {
      const validation = await this.relationshipManager.validateRelationshipConfig(
        command.projectId,
        command.config,
      );

      return {
        success: true,
        data: validation,
        message: '关系配置验证完成',
      };

    } catch (error) {
      this.logger.error(`验证关系配置失败: ${error.message}`);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  }
}

@Injectable()
@CommandHandler(GenerateRelationshipSQLCommand)
export class GenerateRelationshipSQLHandler implements ICommandHandler<GenerateRelationshipSQLCommand> {
  private readonly logger = new Logger(GenerateRelationshipSQLHandler.name);

  constructor(private readonly relationshipManager: RelationshipManagerService) {}

  async execute(command: GenerateRelationshipSQLCommand) {
    this.logger.log(`生成关系SQL: ${command.relationshipId}`);

    try {
      const sql = await this.relationshipManager.generateRelationshipSQL(
        command.relationshipId,
      );

      return {
        success: true,
        data: { sql },
        message: 'SQL生成成功',
      };

    } catch (error) {
      this.logger.error(`生成关系SQL失败: ${error.message}`);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  }
}

@Injectable()
@CommandHandler(BatchCreateRelationshipsCommand)
export class BatchCreateRelationshipsHandler implements ICommandHandler<BatchCreateRelationshipsCommand> {
  private readonly logger = new Logger(BatchCreateRelationshipsHandler.name);

  constructor(private readonly relationshipManager: RelationshipManagerService) {}

  async execute(command: BatchCreateRelationshipsCommand) {
    this.logger.log(`批量创建关系: ${command.relationships.length} 个`);

    try {
      const results = [];
      const errors = [];

      for (const relationshipData of command.relationships) {
        try {
          const relationship = await this.relationshipManager.createRelationship(
            command.projectId,
            relationshipData.name,
            relationshipData.code,
            relationshipData.description,
            relationshipData.config,
            command.userId,
          );
          results.push(relationship);
        } catch (error) {
          errors.push({
            name: relationshipData.name,
            error: error.message,
          });
        }
      }

      return {
        success: errors.length === 0,
        data: {
          created: results,
          errors,
          total: command.relationships.length,
          successful: results.length,
          failed: errors.length,
        },
        message: `批量创建完成: 成功 ${results.length} 个，失败 ${errors.length} 个`,
      };

    } catch (error) {
      this.logger.error(`批量创建关系失败: ${error.message}`);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  }
}

@Injectable()
@CommandHandler(SyncRelationshipsCommand)
export class SyncRelationshipsHandler implements ICommandHandler<SyncRelationshipsCommand> {
  private readonly logger = new Logger(SyncRelationshipsHandler.name);

  constructor(private readonly relationshipManager: RelationshipManagerService) {}

  async execute(command: SyncRelationshipsCommand) {
    this.logger.log(`同步关系: ${command.projectId}`);

    try {
      // 这里可以实现从数据库schema同步关系的逻辑
      // 暂时返回成功状态
      return {
        success: true,
        data: {
          synchronized: 0,
          created: 0,
          updated: 0,
          deleted: 0,
        },
        message: '关系同步完成',
      };

    } catch (error) {
      this.logger.error(`同步关系失败: ${error.message}`);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  }
}
