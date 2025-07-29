import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, ConflictException } from '@nestjs/common';
import { CreateEntityCommand } from '@entity/application/commands/create-entity.command';
import { Entity } from '@entity/domain/entity.model';
import { EntityRepository } from '@entity/domain/entity.repository';
import { FieldCreationService } from '@lib/bounded-contexts/field/application/services/field-creation.service';
import { CommonFieldService } from '@lib/bounded-contexts/entity/application/services/common-field.service';
import { DatabaseMigrationService } from '@lib/bounded-contexts/entity/application/services/database-migration.service';

@CommandHandler(CreateEntityCommand)
export class CreateEntityHandler implements ICommandHandler<CreateEntityCommand> {
  constructor(
    @Inject('EntityRepository')
    private readonly entityRepository: EntityRepository,
    private readonly fieldCreationService: FieldCreationService,
    private readonly commonFieldService: CommonFieldService,
    private readonly databaseMigrationService: DatabaseMigrationService,
  ) {}

  async execute(command: CreateEntityCommand): Promise<Entity> {
    // 检查实体代码是否已存在
    const existingEntity = await this.entityRepository.findByCode(
      command.projectId,
      command.code,
    );

    if (existingEntity) {
      throw new ConflictException(
        `Entity with code '${command.code}' already exists in this project`,
      );
    }

    // 检查表名是否已存在
    const existingTableName = await this.entityRepository.existsByTableName(
      command.projectId,
      command.tableName,
    );

    if (existingTableName) {
      throw new ConflictException(
        `Entity with table name '${command.tableName}' already exists in this project`,
      );
    }

    // 创建实体
    const entity = Entity.create({
      projectId: command.projectId,
      name: command.name,
      code: command.code,
      tableName: command.tableName,
      description: command.description,
      category: command.category,
      diagramPosition: command.diagramPosition,
      config: command.config,
      status: command.status,
      createdBy: command.createdBy || 'system',
    });

    // 保存实体
    const savedEntity = await this.entityRepository.save(entity);

    // 自动为实体添加通用字段
    try {
      await this.fieldCreationService.createCommonFieldsForEntity(
        savedEntity.id!,
        command.createdBy || 'system'
      );
      
      console.log(`成功为实体 '${savedEntity.name}' 添加通用字段`);
    } catch (error) {
      console.error(`为实体 '${savedEntity.name}' 添加通用字段失败:`, error.message);
      // 注意：这里我们不抛出异常，因为实体已经创建成功
      // 可以考虑记录日志或发送通知
    }

    // 自动创建数据库表
    try {
      await this.databaseMigrationService.createTableForEntity(savedEntity);
      console.log(`成功为实体 '${savedEntity.name}' 创建数据库表`);
    } catch (error) {
      console.error(`为实体 '${savedEntity.name}' 创建数据库表失败:`, error.message);
      // 注意：这里我们不抛出异常，因为实体和字段已经创建成功
      // 可以考虑记录日志或发送通知，后续可以手动修复
    }

    return savedEntity;
  }
}
