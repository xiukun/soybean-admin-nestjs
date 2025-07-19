import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { MoveFieldCommand } from '@field/application/commands/move-field.command';
import { FieldRepository } from '@field/domain/field.repository';

@CommandHandler(MoveFieldCommand)
export class MoveFieldHandler implements ICommandHandler<MoveFieldCommand> {
  constructor(
    @Inject('FieldRepository')
    private readonly fieldRepository: FieldRepository,
  ) {}

  async execute(command: MoveFieldCommand): Promise<void> {
    const field = await this.fieldRepository.findById(command.id);
    if (!field) {
      throw new NotFoundException(`Field with id '${command.id}' not found`);
    }

    const entityFields = await this.fieldRepository.findByEntityId(field.entityId);
    const sortedFields = entityFields.sort((a, b) => a.displayOrder - b.displayOrder);
    
    const currentIndex = sortedFields.findIndex(f => f.id === command.id);
    if (currentIndex === -1) {
      throw new NotFoundException(`Field with id '${command.id}' not found in entity`);
    }

    let targetIndex: number;
    if (command.direction === 'up') {
      if (currentIndex === 0) {
        return; // Already at the top
      }
      targetIndex = currentIndex - 1;
    } else {
      if (currentIndex === sortedFields.length - 1) {
        return; // Already at the bottom
      }
      targetIndex = currentIndex + 1;
    }

    // Swap display orders
    const currentField = sortedFields[currentIndex];
    const targetField = sortedFields[targetIndex];
    
    const tempOrder = currentField.displayOrder;
    currentField.updateDisplayOrder(targetField.displayOrder);
    targetField.updateDisplayOrder(tempOrder);

    // Save both fields
    await this.fieldRepository.update(currentField);
    await this.fieldRepository.update(targetField);
  }
}
