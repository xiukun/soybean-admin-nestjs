export class CreateProjectCommand {
  constructor(
    public readonly name: string,
    public readonly code: string,
    public readonly description?: string,
    public readonly version?: string,
    public readonly config?: any,
    public readonly createdBy?: string,
  ) {}
}
