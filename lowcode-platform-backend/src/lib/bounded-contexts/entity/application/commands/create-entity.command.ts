export class CreateEntityCommand {
  constructor(
    public readonly projectId: string,
    public readonly name: string,
    public readonly code: string,
    public readonly tableName: string,
    public readonly description?: string,
    public readonly category?: string,
    public readonly diagramPosition?: any,
    public readonly config?: any,
    public readonly createdBy?: string,
  ) {}
}
