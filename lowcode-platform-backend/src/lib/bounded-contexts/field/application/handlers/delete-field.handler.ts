import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { DeleteFieldCommand } from '@field/application/commands/delete-field.command';
import { FieldRepository } from '@field/domain/field.repository';

@CommandHandler(DeleteFieldCommand)
export class DeleteFieldHandler implements ICommandHandler<DeleteFieldCommand> {
  constructor(
    @Inject('FieldRepository')
    private readonly fieldRepository: FieldRepository,
  ) {}

  async execute(command: DeleteFieldCommand): Promise<void> {
    const field = await this.fieldRepository.findById(command.id);
    if (!field) {
      throw new NotFoundException(`Field with id '${command.id}' not found`);
    }

    // 检查字段是否可以删除
    if (!field.canDelete()) {
      throw new Error('Field cannot be deleted');
    }

    // 删除字段
    await this.fieldRepository.delete(command.id);
  }
}
