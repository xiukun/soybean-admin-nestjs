import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { UpdateRelationshipCommand } from '@lib/bounded-contexts/relationship/application/commands/update-relationship.command';
import { Relationship } from '@lib/bounded-contexts/relationship/domain/relationship.model';
import { RelationshipRepository } from '@lib/bounded-contexts/relationship/domain/relationship.repository';

@CommandHandler(UpdateRelationshipCommand)
export class UpdateRelationshipHandler implements ICommandHandler<UpdateRelationshipCommand> {
  constructor(
    @Inject('RelationshipRepository')
    private readonly relationshipRepository: RelationshipRepository,
  ) {}

  async execute(command: UpdateRelationshipCommand): Promise<Relationship> {
    // 查找现有关系
    const existingRelationship = await this.relationshipRepository.findById(command.id);
    
    if (!existingRelationship) {
      throw new NotFoundException(`Relationship with ID '${command.id}' not found`);
    }

    // 更新关系属性
    const updatedData: any = {
      id: command.id,
    };

    if (command.name !== undefined) updatedData.name = command.name;
    if (command.description !== undefined) updatedData.description = command.description;
    if (command.sourceFieldId !== undefined) updatedData.sourceFieldId = command.sourceFieldId;
    if (command.targetFieldId !== undefined) updatedData.targetFieldId = command.targetFieldId;
    if (command.foreignKeyName !== undefined) updatedData.foreignKeyName = command.foreignKeyName;
    if (command.onDelete !== undefined) updatedData.onDelete = command.onDelete;
    if (command.onUpdate !== undefined) updatedData.onUpdate = command.onUpdate;
    if (command.config !== undefined) updatedData.config = command.config;
    if (command.status !== undefined) updatedData.status = command.status;

    updatedData.updatedBy = command.updatedBy || 'system';
    updatedData.updatedAt = new Date();

    // 更新关系
    const updatedRelationship = Relationship.fromExisting({
      ...existingRelationship,
      ...updatedData,
    });

    return await this.relationshipRepository.update(updatedRelationship);
  }
}
