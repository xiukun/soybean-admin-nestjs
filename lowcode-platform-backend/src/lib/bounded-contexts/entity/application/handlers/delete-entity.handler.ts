import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { DeleteEntityCommand } from '@entity/application/commands/delete-entity.command';
import { EntityRepository } from '@entity/domain/entity.repository';

@CommandHandler(DeleteEntityCommand)
export class DeleteEntityHandler implements ICommandHandler<DeleteEntityCommand> {
  constructor(
    @Inject('EntityRepository')
    private readonly entityRepository: EntityRepository,
  ) {}

  async execute(command: DeleteEntityCommand): Promise<void> {
    // 查找实体
    const entity = await this.entityRepository.findById(command.id);
    if (!entity) {
      throw new NotFoundException(`Entity with id '${command.id}' not found`);
    }

    // 检查是否可以删除
    if (!entity.canDelete()) {
      throw new BadRequestException(
        'Cannot delete published entity. Only draft entities can be deleted.',
      );
    }

    // 删除实体
    await this.entityRepository.delete(command.id);
  }
}
