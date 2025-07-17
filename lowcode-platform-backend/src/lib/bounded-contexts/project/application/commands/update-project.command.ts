export class UpdateProjectCommand {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly code?: string,
    public readonly description?: string,
    public readonly version?: string,
    public readonly config?: any,
    public readonly updatedBy?: string,
  ) {}
}
