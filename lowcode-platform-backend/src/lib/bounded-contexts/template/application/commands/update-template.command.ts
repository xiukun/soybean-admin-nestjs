export class UpdateTemplateCommand {
  constructor(
    public readonly templateId: string,
    public readonly name?: string,
    public readonly description?: string,
    public readonly category?: string,
    public readonly language?: string,
    public readonly framework?: string,
    public readonly content?: string,
    public readonly variables?: Array<{
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
    public readonly tags?: string[],
    public readonly isPublic?: boolean,
    public readonly updatedBy?: string,
  ) {}
}

export class CreateTemplateVersionCommand {
  constructor(
    public readonly templateId: string,
    public readonly version: string,
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
    public readonly changelog?: string,
    public readonly createdBy?: string,
  ) {}
}

export class PublishTemplateCommand {
  constructor(
    public readonly templateId: string,
    public readonly publishedBy: string,
  ) {}
}

export class DeleteTemplateCommand {
  constructor(
    public readonly templateId: string,
    public readonly deletedBy: string,
  ) {}
}
