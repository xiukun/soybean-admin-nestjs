import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, ConflictException } from '@nestjs/common';
import { CreateEntityCommand } from '../commands/create-entity.command';
import { Entity } from '../../domain/entity.model';
import { EntityRepository } from '../../domain/entity.repository';

@CommandHandler(CreateEntityCommand)
export class CreateEntityHandler implements ICommandHandler<CreateEntityCommand> {
  constructor(
    @Inject('EntityRepository')
    private readonly entityRepository: EntityRepository,
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
      createdBy: command.createdBy || 'system',
    });

    // 保存实体
    return await this.entityRepository.save(entity);
  }
}
