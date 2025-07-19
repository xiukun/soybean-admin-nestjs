export class UpdateRelationshipCommand {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly description?: string,
    public readonly sourceFieldId?: string,
    public readonly targetFieldId?: string,
    public readonly foreignKeyName?: string,
    public readonly onDelete?: string,
    public readonly onUpdate?: string,
    public readonly config?: any,
    public readonly status?: string,
    public readonly updatedBy?: string,
  ) {}
}
