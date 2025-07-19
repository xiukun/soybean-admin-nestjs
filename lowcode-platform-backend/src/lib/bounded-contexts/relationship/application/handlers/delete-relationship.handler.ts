import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { DeleteRelationshipCommand } from '@lib/bounded-contexts/relationship/application/commands/delete-relationship.command';
import { RelationshipRepository } from '@lib/bounded-contexts/relationship/domain/relationship.repository';

@CommandHandler(DeleteRelationshipCommand)
export class DeleteRelationshipHandler implements ICommandHandler<DeleteRelationshipCommand> {
  constructor(
    @Inject('RelationshipRepository')
    private readonly relationshipRepository: RelationshipRepository,
  ) {}

  async execute(command: DeleteRelationshipCommand): Promise<void> {
    // 查找现有关系
    const existingRelationship = await this.relationshipRepository.findById(command.id);
    
    if (!existingRelationship) {
      throw new NotFoundException(`Relationship with ID '${command.id}' not found`);
    }

    // 删除关系
    await this.relationshipRepository.delete(command.id);
  }
}
