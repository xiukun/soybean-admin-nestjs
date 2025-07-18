import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateRelationshipCommand } from '@lib/bounded-contexts/relationship/application/commands/create-relationship.command';
import { Relationship } from '@lib/bounded-contexts/relationship/domain/relationship.model';
import { RelationshipRepository } from '@lib/bounded-contexts/relationship/domain/relationship.repository';

@CommandHandler(CreateRelationshipCommand)
export class CreateRelationshipHandler implements ICommandHandler<CreateRelationshipCommand> {
  constructor(
    @Inject('RelationshipRepository')
    private readonly relationshipRepository: RelationshipRepository,
  ) {}

  async execute(command: CreateRelationshipCommand): Promise<Relationship> {
    // 检查关系代码是否已存在
    const existingRelationship = await this.relationshipRepository.existsByCode(
      command.projectId,
      command.code,
    );

    if (existingRelationship) {
      throw new ConflictException(
        `Relationship with code '${command.code}' already exists in this project`,
      );
    }

    // 检查实体间是否已存在相同类型的关系
    const existingBetweenEntities = await this.relationshipRepository.existsBetweenEntities(
      command.sourceEntityId,
      command.targetEntityId,
    );

    if (existingBetweenEntities) {
      console.warn(
        `Relationship already exists between entities ${command.sourceEntityId} and ${command.targetEntityId}`
      );
    }

    // 验证实体存在性（这里应该调用EntityRepository，但为了简化先跳过）
    // TODO: 验证sourceEntityId和targetEntityId是否存在且属于同一项目

    // 创建关系
    const relationship = Relationship.create({
      projectId: command.projectId,
      name: command.name,
      code: command.code,
      type: command.type,
      sourceEntityId: command.sourceEntityId,
      targetEntityId: command.targetEntityId,
      description: command.description,
      sourceFieldId: command.sourceFieldId,
      targetFieldId: command.targetFieldId,
      foreignKeyName: command.foreignKeyName,
      onDelete: command.onDelete,
      onUpdate: command.onUpdate,
      config: command.config,
      createdBy: command.createdBy || 'system',
    });

    // 保存关系
    return await this.relationshipRepository.save(relationship);
  }
}
