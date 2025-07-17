import { AggregateRoot } from '@nestjs/cqrs';

// 模板类型枚举
export enum TemplateType {
  ENTITY_MODEL = 'ENTITY_MODEL',
  ENTITY_DTO = 'ENTITY_DTO',
  ENTITY_SERVICE = 'ENTITY_SERVICE',
  ENTITY_CONTROLLER = 'ENTITY_CONTROLLER',
  ENTITY_REPOSITORY = 'ENTITY_REPOSITORY',
  API_CONTROLLER = 'API_CONTROLLER',
  API_SERVICE = 'API_SERVICE',
  MODULE = 'MODULE'
}

// 编程语言枚举
export enum ProgrammingLanguage {
  TYPESCRIPT = 'TYPESCRIPT',
  JAVASCRIPT = 'JAVASCRIPT',
  JAVA = 'JAVA',
  PYTHON = 'PYTHON',
  CSHARP = 'CSHARP'
}

// 框架枚举
export enum Framework {
  NESTJS = 'NESTJS',
  EXPRESS = 'EXPRESS',
  SPRING_BOOT = 'SPRING_BOOT',
  FASTAPI = 'FASTAPI',
  DOTNET = 'DOTNET'
}

// 模板状态枚举
export enum TemplateStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

// 代码模板属性接口
export interface CodeTemplateProperties {
  id?: string;
  name: string;
  code: string;
  type: TemplateType;
  language: ProgrammingLanguage;
  framework: Framework;
  description?: string;
  template: string;
  variables?: any[];
  version?: string;
  status?: TemplateStatus;
  createdBy: string;
  createdAt?: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

export interface CodeTemplateCreateProperties extends Omit<CodeTemplateProperties, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt?: Date;
}

export interface CodeTemplateUpdateProperties extends Partial<Omit<CodeTemplateProperties, 'id' | 'createdBy' | 'createdAt'>> {
  updatedBy: string;
  updatedAt?: Date;
}

export class CodeTemplate extends AggregateRoot {
  private constructor(private props: CodeTemplateProperties) {
    super();
  }

  static create(props: CodeTemplateCreateProperties): CodeTemplate {
    // 业务规则验证
    CodeTemplate.validateBusinessRules(props);
    
    const templateProps: CodeTemplateProperties = {
      ...props,
      version: props.version || '1.0.0',
      status: props.status || TemplateStatus.ACTIVE,
      variables: props.variables || [],
      createdAt: props.createdAt || new Date(),
    };

    return new CodeTemplate(templateProps);
  }

  static fromPersistence(props: CodeTemplateProperties): CodeTemplate {
    return new CodeTemplate(props);
  }

  update(props: CodeTemplateUpdateProperties): void {
    // 验证更新属性
    if (props.code && props.code !== this.props.code) {
      CodeTemplate.validateCode(props.code);
    }
    
    if (props.template && props.template !== this.props.template) {
      CodeTemplate.validateTemplate(props.template);
    }
    
    Object.assign(this.props, {
      ...props,
      updatedAt: props.updatedAt || new Date(),
    });
  }

  private static validateBusinessRules(props: CodeTemplateCreateProperties): void {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Template name is required');
    }
    
    if (!props.code || props.code.trim().length === 0) {
      throw new Error('Template code is required');
    }
    
    CodeTemplate.validateCode(props.code);
    
    if (!props.type) {
      throw new Error('Template type is required');
    }
    
    if (!props.language) {
      throw new Error('Programming language is required');
    }
    
    if (!props.framework) {
      throw new Error('Framework is required');
    }
    
    if (!props.template || props.template.trim().length === 0) {
      throw new Error('Template content is required');
    }
    
    CodeTemplate.validateTemplate(props.template);
    
    if (!props.createdBy) {
      throw new Error('Created by is required');
    }
  }

  private static validateCode(code: string): void {
    const codeRegex = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
    if (!codeRegex.test(code)) {
      throw new Error('Template code must start with a letter and contain only letters, numbers, underscores, and hyphens');
    }
  }

  private static validateTemplate(template: string): void {
    // 基本的模板语法验证（Handlebars）
    const openBraces = (template.match(/\{\{/g) || []).length;
    const closeBraces = (template.match(/\}\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      throw new Error('Template has unmatched handlebars braces');
    }
  }

  // Getters
  get id(): string | undefined { return this.props.id; }
  get name(): string { return this.props.name; }
  get code(): string { return this.props.code; }
  get type(): TemplateType { return this.props.type; }
  get language(): ProgrammingLanguage { return this.props.language; }
  get framework(): Framework { return this.props.framework; }
  get description(): string | undefined { return this.props.description; }
  get template(): string { return this.props.template; }
  get variables(): any[] { return this.props.variables || []; }
  get version(): string { return this.props.version || '1.0.0'; }
  get status(): TemplateStatus { return this.props.status || TemplateStatus.ACTIVE; }
  get createdBy(): string { return this.props.createdBy; }
  get createdAt(): Date | undefined { return this.props.createdAt; }
  get updatedBy(): string | undefined { return this.props.updatedBy; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  // 业务方法
  activate(): void {
    if (this.status === TemplateStatus.ACTIVE) {
      throw new Error('Template is already active');
    }
    this.props.status = TemplateStatus.ACTIVE;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    if (this.status === TemplateStatus.INACTIVE) {
      throw new Error('Template is already inactive');
    }
    this.props.status = TemplateStatus.INACTIVE;
    this.props.updatedAt = new Date();
  }

  canDelete(): boolean {
    return this.status === TemplateStatus.INACTIVE;
  }

  isActive(): boolean {
    return this.status === TemplateStatus.ACTIVE;
  }

  hasVariables(): boolean {
    return this.variables && this.variables.length > 0;
  }

  getVariableNames(): string[] {
    if (!this.hasVariables()) {
      return [];
    }
    return this.variables.map(variable => variable.name || variable);
  }

  validateVariables(data: any): boolean {
    const requiredVariables = this.getVariableNames();
    const providedVariables = Object.keys(data || {});
    
    return requiredVariables.every(variable => providedVariables.includes(variable));
  }

  render(data: any): string {
    // 这里应该使用实际的模板引擎（如Handlebars）
    // 简单的字符串替换示例
    let rendered = this.template;
    
    if (data) {
      Object.keys(data).forEach(key => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        rendered = rendered.replace(regex, data[key]);
      });
    }
    
    return rendered;
  }

  toJSON(): CodeTemplateProperties {
    return { ...this.props };
  }
}
