export class CreateTemplateCommand {
  constructor(
    public readonly projectId: string,
    public readonly name: string,
    public readonly description: string | undefined,
    public readonly category: string,
    public readonly language: string,
    public readonly framework: string | undefined,
    public readonly content: string,
    public readonly variables: Array<{
      name: string;
      type: string;
      description?: string;
      required: boolean;
      defaultValue?: any;
      minLength?: number;
      maxLength?: number;
      min?: number;
      max?: number;
      pattern?: string;
      enum?: any[];
    }>,
    public readonly tags: string[],
    public readonly isPublic: boolean,
    public readonly createdBy: string,
  ) {}
}
