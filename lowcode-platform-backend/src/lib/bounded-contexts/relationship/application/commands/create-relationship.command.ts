import { RelationshipType } from '@lib/bounded-contexts/relationship/domain/relationship.model';

export class CreateRelationshipCommand {
  constructor(
    public readonly projectId: string,
    public readonly name: string,
    public readonly code: string,
    public readonly type: RelationshipType,
    public readonly sourceEntityId: string,
    public readonly targetEntityId: string,
    public readonly description?: string,
    public readonly sourceFieldId?: string,
    public readonly targetFieldId?: string,
    public readonly foreignKeyName?: string,
    public readonly onDelete?: string,
    public readonly onUpdate?: string,
    public readonly config?: any,
    public readonly createdBy?: string,
  ) {}
}
