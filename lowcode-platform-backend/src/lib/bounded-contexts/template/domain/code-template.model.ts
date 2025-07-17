import { ulid } from 'ulid';

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  defaultValue?: any;
  required: boolean;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

export interface TemplateVersion {
  version: string;
  content: string;
  variables: TemplateVariable[];
  changelog?: string;
  createdAt: Date;
  createdBy: string;
}

export interface CodeTemplateProperties {
  projectId: string;
  name: string;
  description?: string;
  category: string;
  language: string;
  framework?: string;
  content: string;
  variables: TemplateVariable[];
  tags: string[];
  isPublic: boolean;
  createdBy: string;
}

export interface CodeTemplatePersistence extends CodeTemplateProperties {
  id: string;
  status: TemplateStatus;
  versions: TemplateVersion[];
  currentVersion: string;
  usageCount: number;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string;
}

export enum TemplateStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  DEPRECATED = 'DEPRECATED',
}

export class CodeTemplate {
  private constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly name: string,
    public readonly description: string | undefined,
    public readonly category: string,
    public readonly language: string,
    public readonly framework: string | undefined,
    public readonly content: string,
    public readonly variables: TemplateVariable[],
    public readonly tags: string[],
    public readonly isPublic: boolean,
    public readonly status: TemplateStatus,
    public readonly versions: TemplateVersion[],
    public readonly currentVersion: string,
    public readonly usageCount: number,
    public readonly rating: number | undefined,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly updatedBy: string | undefined,
  ) {}

  static create(properties: CodeTemplateProperties): CodeTemplate {
    // 验证基本属性
    if (!properties.projectId?.trim()) {
      throw new Error('Project ID is required');
    }

    if (!properties.name?.trim()) {
      throw new Error('Template name is required');
    }

    if (properties.name.length > 100) {
      throw new Error('Template name cannot exceed 100 characters');
    }

    if (!properties.category?.trim()) {
      throw new Error('Template category is required');
    }

    if (!properties.language?.trim()) {
      throw new Error('Template language is required');
    }

    if (!properties.content?.trim()) {
      throw new Error('Template content is required');
    }

    if (!properties.createdBy?.trim()) {
      throw new Error('Created by is required');
    }

    // 验证变量定义
    this.validateVariables(properties.variables);

    // 验证标签
    this.validateTags(properties.tags);

    const now = new Date();
    const initialVersion = '1.0.0';

    const initialVersionData: TemplateVersion = {
      version: initialVersion,
      content: properties.content,
      variables: properties.variables,
      changelog: 'Initial version',
      createdAt: now,
      createdBy: properties.createdBy,
    };

    return new CodeTemplate(
      ulid(),
      properties.projectId,
      properties.name,
      properties.description,
      properties.category,
      properties.language,
      properties.framework,
      properties.content,
      properties.variables,
      properties.tags || [],
      properties.isPublic || false,
      TemplateStatus.DRAFT,
      [initialVersionData],
      initialVersion,
      0,
      undefined,
      properties.createdBy,
      now,
      now,
      undefined,
    );
  }

  static fromPersistence(data: CodeTemplatePersistence): CodeTemplate {
    return new CodeTemplate(
      data.id,
      data.projectId,
      data.name,
      data.description,
      data.category,
      data.language,
      data.framework,
      data.content,
      data.variables,
      data.tags,
      data.isPublic,
      data.status,
      data.versions,
      data.currentVersion,
      data.usageCount,
      data.rating,
      data.createdBy,
      data.createdAt,
      data.updatedAt,
      data.updatedBy,
    );
  }

  private static validateVariables(variables: TemplateVariable[]): void {
    if (!variables) return;

    const variableNames = new Set<string>();

    for (const variable of variables) {
      if (!variable.name?.trim()) {
        throw new Error('Variable name is required');
      }

      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(variable.name)) {
        throw new Error('Variable name must be a valid identifier');
      }

      if (variableNames.has(variable.name)) {
        throw new Error(`Duplicate variable name: ${variable.name}`);
      }

      variableNames.add(variable.name);

      if (!['string', 'number', 'boolean', 'array', 'object'].includes(variable.type)) {
        throw new Error(`Invalid variable type: ${variable.type}`);
      }

      // 验证默认值类型
      if (variable.defaultValue !== undefined) {
        this.validateVariableDefaultValue(variable);
      }
    }
  }

  private static validateVariableDefaultValue(variable: TemplateVariable): void {
    const { type, defaultValue } = variable;

    switch (type) {
      case 'string':
        if (typeof defaultValue !== 'string') {
          throw new Error(`Default value for ${variable.name} must be a string`);
        }
        break;
      case 'number':
        if (typeof defaultValue !== 'number') {
          throw new Error(`Default value for ${variable.name} must be a number`);
        }
        break;
      case 'boolean':
        if (typeof defaultValue !== 'boolean') {
          throw new Error(`Default value for ${variable.name} must be a boolean`);
        }
        break;
      case 'array':
        if (!Array.isArray(defaultValue)) {
          throw new Error(`Default value for ${variable.name} must be an array`);
        }
        break;
      case 'object':
        if (typeof defaultValue !== 'object' || Array.isArray(defaultValue)) {
          throw new Error(`Default value for ${variable.name} must be an object`);
        }
        break;
    }
  }

  private static validateTags(tags: string[]): void {
    if (!tags) return;

    for (const tag of tags) {
      if (!tag?.trim()) {
        throw new Error('Tag cannot be empty');
      }

      if (tag.length > 50) {
        throw new Error('Tag cannot exceed 50 characters');
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(tag)) {
        throw new Error('Tag can only contain letters, numbers, hyphens, and underscores');
      }
    }
  }

  update(
    name?: string,
    description?: string,
    category?: string,
    language?: string,
    framework?: string,
    content?: string,
    variables?: TemplateVariable[],
    tags?: string[],
    isPublic?: boolean,
    updatedBy?: string,
  ): CodeTemplate {
    // 验证更新的数据
    if (name !== undefined) {
      if (!name.trim()) {
        throw new Error('Template name is required');
      }
      if (name.length > 100) {
        throw new Error('Template name cannot exceed 100 characters');
      }
    }

    if (category !== undefined && !category.trim()) {
      throw new Error('Template category is required');
    }

    if (language !== undefined && !language.trim()) {
      throw new Error('Template language is required');
    }

    if (content !== undefined && !content.trim()) {
      throw new Error('Template content is required');
    }

    if (variables !== undefined) {
      CodeTemplate.validateVariables(variables);
    }

    if (tags !== undefined) {
      CodeTemplate.validateTags(tags);
    }

    return new CodeTemplate(
      this.id,
      this.projectId,
      name ?? this.name,
      description ?? this.description,
      category ?? this.category,
      language ?? this.language,
      framework ?? this.framework,
      content ?? this.content,
      variables ?? this.variables,
      tags ?? this.tags,
      isPublic ?? this.isPublic,
      this.status,
      this.versions,
      this.currentVersion,
      this.usageCount,
      this.rating,
      this.createdBy,
      this.createdAt,
      new Date(),
      updatedBy ?? this.updatedBy,
    );
  }

  createVersion(
    content: string,
    variables: TemplateVariable[],
    version: string,
    changelog?: string,
    createdBy?: string,
  ): CodeTemplate {
    if (!content?.trim()) {
      throw new Error('Template content is required');
    }

    if (!version?.trim()) {
      throw new Error('Version is required');
    }

    // 检查版本是否已存在
    if (this.versions.some(v => v.version === version)) {
      throw new Error(`Version ${version} already exists`);
    }

    CodeTemplate.validateVariables(variables);

    const newVersion: TemplateVersion = {
      version,
      content,
      variables,
      changelog,
      createdAt: new Date(),
      createdBy: createdBy || this.createdBy,
    };

    const newVersions = [...this.versions, newVersion];

    return new CodeTemplate(
      this.id,
      this.projectId,
      this.name,
      this.description,
      this.category,
      this.language,
      this.framework,
      content,
      variables,
      this.tags,
      this.isPublic,
      this.status,
      newVersions,
      version,
      this.usageCount,
      this.rating,
      this.createdBy,
      this.createdAt,
      new Date(),
      createdBy,
    );
  }

  publish(): CodeTemplate {
    if (this.status === TemplateStatus.PUBLISHED) {
      throw new Error('Template is already published');
    }

    return new CodeTemplate(
      this.id,
      this.projectId,
      this.name,
      this.description,
      this.category,
      this.language,
      this.framework,
      this.content,
      this.variables,
      this.tags,
      this.isPublic,
      TemplateStatus.PUBLISHED,
      this.versions,
      this.currentVersion,
      this.usageCount,
      this.rating,
      this.createdBy,
      this.createdAt,
      new Date(),
      this.updatedBy,
    );
  }

  deprecate(): CodeTemplate {
    if (this.status === TemplateStatus.DEPRECATED) {
      throw new Error('Template is already deprecated');
    }

    return new CodeTemplate(
      this.id,
      this.projectId,
      this.name,
      this.description,
      this.category,
      this.language,
      this.framework,
      this.content,
      this.variables,
      this.tags,
      this.isPublic,
      TemplateStatus.DEPRECATED,
      this.versions,
      this.currentVersion,
      this.usageCount,
      this.rating,
      this.createdBy,
      this.createdAt,
      new Date(),
      this.updatedBy,
    );
  }

  incrementUsage(): CodeTemplate {
    return new CodeTemplate(
      this.id,
      this.projectId,
      this.name,
      this.description,
      this.category,
      this.language,
      this.framework,
      this.content,
      this.variables,
      this.tags,
      this.isPublic,
      this.status,
      this.versions,
      this.currentVersion,
      this.usageCount + 1,
      this.rating,
      this.createdBy,
      this.createdAt,
      new Date(),
      this.updatedBy,
    );
  }

  updateRating(rating: number): CodeTemplate {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    return new CodeTemplate(
      this.id,
      this.projectId,
      this.name,
      this.description,
      this.category,
      this.language,
      this.framework,
      this.content,
      this.variables,
      this.tags,
      this.isPublic,
      this.status,
      this.versions,
      this.currentVersion,
      this.usageCount,
      rating,
      this.createdBy,
      this.createdAt,
      new Date(),
      this.updatedBy,
    );
  }

  getVersion(version: string): TemplateVersion | undefined {
    return this.versions.find(v => v.version === version);
  }

  getLatestVersion(): TemplateVersion {
    return this.versions[this.versions.length - 1];
  }

  toPersistence(): CodeTemplatePersistence {
    return {
      id: this.id,
      projectId: this.projectId,
      name: this.name,
      description: this.description,
      category: this.category,
      language: this.language,
      framework: this.framework,
      content: this.content,
      variables: this.variables,
      tags: this.tags,
      isPublic: this.isPublic,
      status: this.status,
      versions: this.versions,
      currentVersion: this.currentVersion,
      usageCount: this.usageCount,
      rating: this.rating,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      updatedBy: this.updatedBy,
    };
  }
}
