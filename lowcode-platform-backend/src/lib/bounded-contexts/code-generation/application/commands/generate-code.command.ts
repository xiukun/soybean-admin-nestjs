export class GenerateCodeCommand {
  constructor(
    public readonly projectId: string,
    public readonly templateIds: string[],
    public readonly entityIds: string[] | undefined,
    public readonly outputPath: string,
    public readonly variables: Record<string, any>,
    public readonly options: {
      overwriteExisting: boolean;
      generateTests: boolean;
      generateDocs: boolean;
      architecture: 'base-biz' | 'standard';
      framework: 'nestjs' | 'express' | 'spring';
    },
  ) {}
}
