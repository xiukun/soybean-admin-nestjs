export class DeleteRelationshipCommand {
  constructor(
    public readonly id: string,
    public readonly deletedBy?: string,
  ) {}
}
