import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { UpdateFieldCommand } from '@field/application/commands/update-field.command';
import { Field } from '@field/domain/field.model';
import { FieldRepository } from '@field/domain/field.repository';

@CommandHandler(UpdateFieldCommand)
export class UpdateFieldHandler implements ICommandHandler<UpdateFieldCommand> {
  constructor(
    @Inject('FieldRepository')
    private readonly fieldRepository: FieldRepository,
  ) {}

  async execute(command: UpdateFieldCommand): Promise<Field> {
    const field = await this.fieldRepository.findById(command.id);
    if (!field) {
      throw new NotFoundException(`Field with id '${command.id}' not found`);
    }

    // 检查字段代码是否已存在（如果代码发生变化）
    if (command.code && command.code !== field.code) {
      const existingField = await this.fieldRepository.findByCode(
        field.entityId,
        command.code,
      );
      if (existingField && existingField.id !== command.id) {
        throw new ConflictException(
          `Field with code '${command.code}' already exists in this entity`,
        );
      }
    }

    // 检查显示顺序是否已存在（如果顺序发生变化）
    if (command.displayOrder !== undefined && command.displayOrder !== field.displayOrder) {
      const existingOrderField = await this.fieldRepository.findByDisplayOrder(
        field.entityId,
        command.displayOrder,
      );
      if (existingOrderField && existingOrderField.id !== command.id) {
        throw new ConflictException(
          `Display order '${command.displayOrder}' already exists in this entity`,
        );
      }
    }

    // 更新字段
    field.update({
      name: command.name,
      code: command.code,
      dataType: command.dataType,
      description: command.description,
      length: command.length,
      precision: command.precision,
      required: command.required,
      unique: command.unique,
      defaultValue: command.defaultValue,
      config: command.config,
      displayOrder: command.displayOrder,
      updatedBy: command.updatedBy,
    });

    // 保存字段
    return await this.fieldRepository.update(field);
  }
}
