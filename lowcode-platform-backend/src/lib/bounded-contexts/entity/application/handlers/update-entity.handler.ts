import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { UpdateEntityCommand } from '@entity/application/commands/update-entity.command';
import { Entity } from '@entity/domain/entity.model';
import { EntityRepository } from '@entity/domain/entity.repository';

@CommandHandler(UpdateEntityCommand)
export class UpdateEntityHandler implements ICommandHandler<UpdateEntityCommand> {
  constructor(
    @Inject('EntityRepository')
    private readonly entityRepository: EntityRepository,
  ) {}

  async execute(command: UpdateEntityCommand): Promise<Entity> {
    // 查找实体
    const entity = await this.entityRepository.findById(command.id);
    if (!entity) {
      throw new NotFoundException(`Entity with id '${command.id}' not found`);
    }

    // 检查代码冲突
    if (command.code && command.code !== entity.code) {
      const existingEntity = await this.entityRepository.existsByCode(
        entity.projectId,
        command.code,
        command.id,
      );

      if (existingEntity) {
        throw new ConflictException(
          `Entity with code '${command.code}' already exists in this project`,
        );
      }
    }

    // 检查表名冲突
    if (command.tableName && command.tableName !== entity.tableName) {
      const existingTableName = await this.entityRepository.existsByTableName(
        entity.projectId,
        command.tableName,
        command.id,
      );

      if (existingTableName) {
        throw new ConflictException(
          `Entity with table name '${command.tableName}' already exists in this project`,
        );
      }
    }

    // 更新实体
    entity.update({
      name: command.name,
      code: command.code,
      tableName: command.tableName,
      description: command.description,
      category: command.category,
      diagramPosition: command.diagramPosition,
      config: command.config,
      updatedBy: command.updatedBy || 'system',
    });

    // 保存更新
    return await this.entityRepository.update(entity);
  }
}
