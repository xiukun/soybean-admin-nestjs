export class CreateTemplateCommand {
  constructor(
    public readonly data: {
      name: string;
      code: string;
      type: string;
      category: string;
      language: string;
      framework?: string;
      description?: string;
      content: string;
      variables?: any[];
      tags?: string[];
      isPublic?: boolean;
      createdBy: string;
    },
  ) {}
}

export class UpdateTemplateCommand {
  constructor(
    public readonly id: string,
    public readonly data: {
      name?: string;
      category?: string;
      language?: string;
      framework?: string;
      description?: string;
      content?: string;
      variables?: any[];
      tags?: string[];
      isPublic?: boolean;
      version?: string;
      updatedBy: string;
    },
  ) {}
}

export class DeleteTemplateCommand {
  constructor(
    public readonly id: string,
    public readonly deletedBy: string,
  ) {}
}

export class CreateTemplateVersionCommand {
  constructor(
    public readonly templateId: string,
    public readonly data: {
      version: string;
      content: string;
      variables?: any[];
      changelog?: string;
      createdBy: string;
    },
  ) {}
}

export class RestoreTemplateVersionCommand {
  constructor(
    public readonly templateId: string,
    public readonly versionId: string,
    public readonly restoredBy: string,
  ) {}
}
