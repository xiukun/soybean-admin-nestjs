import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, ConflictException } from '@nestjs/common';
import { CreateFieldCommand } from '@lib/bounded-contexts/field/application/commands/create-field.command';
import { Field } from '@lib/bounded-contexts/field/domain/field.model';
import { FieldRepository } from '@lib/bounded-contexts/field/domain/field.repository';

@CommandHandler(CreateFieldCommand)
export class CreateFieldHandler implements ICommandHandler<CreateFieldCommand> {
  constructor(
    @Inject('FieldRepository')
    private readonly fieldRepository: FieldRepository,
  ) {}

  async execute(command: CreateFieldCommand): Promise<Field> {
    // 检查字段代码是否已存在
    const existingField = await this.fieldRepository.existsByCode(
      command.entityId,
      command.code,
    );

    if (existingField) {
      throw new ConflictException(
        `Field with code '${command.code}' already exists in this entity`,
      );
    }

    // 获取显示顺序
    let displayOrder = command.displayOrder;
    if (displayOrder === undefined) {
      const maxOrder = await this.fieldRepository.findMaxDisplayOrder(command.entityId);
      displayOrder = maxOrder + 1;
    } else {
      // 检查显示顺序是否已存在
      const existingOrderField = await this.fieldRepository.existsByDisplayOrder(
        command.entityId,
        displayOrder,
      );
      if (existingOrderField) {
        throw new ConflictException(
          `Display order '${displayOrder}' already exists in this entity`,
        );
      }
    }

    // 创建字段
    const field = Field.create({
      entityId: command.entityId,
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
      displayOrder,
      createdBy: command.createdBy || 'system',
    });

    // 保存字段
    return await this.fieldRepository.save(field);
  }
}
