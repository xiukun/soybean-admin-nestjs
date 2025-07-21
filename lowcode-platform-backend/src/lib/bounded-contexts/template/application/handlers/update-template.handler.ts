import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { 
  UpdateTemplateCommand, 
  CreateTemplateVersionCommand, 
  PublishTemplateCommand,
  DeleteTemplateCommand 
} from '../commands/update-template.command';
import { TemplateRepository } from '../../domain/template.repository';
import { TemplateEngineService } from '../../../code-generation/infrastructure/template-engine.service';
import { TemplateStatus, TemplateVariable } from '../../domain/code-template.model';

@CommandHandler(UpdateTemplateCommand)
export class UpdateTemplateHandler implements ICommandHandler<UpdateTemplateCommand> {
  constructor(
    @Inject('TemplateRepository')
    private readonly templateRepository: TemplateRepository,
    private readonly eventBus: EventBus,
    private readonly templateEngine: TemplateEngineService,
  ) {}

  async execute(command: UpdateTemplateCommand): Promise<void> {
    const template = await this.templateRepository.findById(command.templateId);
    if (!template) {
      throw new NotFoundException(`Template with ID ${command.templateId} not found`);
    }

    // Validate template content if provided
    if (command.content) {
      await this.validateTemplateContent(command.content, command.variables || template.variables);
    }

    // Update template
    const templateVariables = this.convertToTemplateVariables(command.variables);

    const updatedTemplate = template.update(
      command.name,
      command.description,
      command.category,
      command.language,
      command.framework,
      command.content,
      templateVariables,
      command.tags,
      command.isPublic,
      command.updatedBy,
    );

    await this.templateRepository.save(updatedTemplate);

    // Publish domain events
    updatedTemplate.getUncommittedEvents().forEach(event => {
      this.eventBus.publish(event);
    });
    updatedTemplate.markEventsAsCommitted();
  }

  private async validateTemplateContent(content: string, variables: any[]): Promise<void> {
    try {
      const sampleData = this.generateSampleData(variables);
      this.templateEngine.compileTemplateFromString(content, sampleData);
    } catch (error) {
      throw new BadRequestException(`Template syntax error: ${error.message}`);
    }
  }

  private generateSampleData(variables: any[]): Record<string, any> {
    const sampleData: Record<string, any> = {};
    variables.forEach(variable => {
      switch (variable.type) {
        case 'string':
          sampleData[variable.name] = variable.defaultValue || 'SampleString';
          break;
        case 'number':
        case 'integer':
          sampleData[variable.name] = variable.defaultValue || 42;
          break;
        case 'boolean':
          sampleData[variable.name] = variable.defaultValue !== undefined ? variable.defaultValue : true;
          break;
        case 'array':
          sampleData[variable.name] = variable.defaultValue || ['item1', 'item2'];
          break;
        case 'object':
          sampleData[variable.name] = variable.defaultValue || { key: 'value' };
          break;
        default:
          sampleData[variable.name] = variable.defaultValue || 'defaultValue';
      }
    });
    return sampleData;
  }

  /**
   * 转换变量类型为TemplateVariable
   */
  private convertToTemplateVariables(variables: any[]): TemplateVariable[] {
    return variables.map(variable => ({
      name: variable.name,
      type: this.mapVariableType(variable.type),
      description: variable.description,
      defaultValue: variable.defaultValue,
      required: variable.required,
      validation: {
        pattern: variable.pattern,
        minLength: variable.minLength,
        maxLength: variable.maxLength,
        min: variable.min,
        max: variable.max,
      },
    }));
  }

  /**
   * 映射变量类型
   */
  private mapVariableType(type: string): 'string' | 'number' | 'boolean' | 'array' | 'object' {
    const typeMap: Record<string, 'string' | 'number' | 'boolean' | 'array' | 'object'> = {
      'string': 'string',
      'text': 'string',
      'varchar': 'string',
      'number': 'number',
      'integer': 'number',
      'float': 'number',
      'decimal': 'number',
      'boolean': 'boolean',
      'bool': 'boolean',
      'array': 'array',
      'object': 'object',
      'json': 'object',
    };

    return typeMap[type.toLowerCase()] || 'string';
  }
}

@CommandHandler(CreateTemplateVersionCommand)
export class CreateTemplateVersionHandler implements ICommandHandler<CreateTemplateVersionCommand> {
  constructor(
    @Inject('TemplateRepository')
    private readonly templateRepository: TemplateRepository,
    private readonly eventBus: EventBus,
    private readonly templateEngine: TemplateEngineService,
  ) {}

  async execute(command: CreateTemplateVersionCommand): Promise<void> {
    const template = await this.templateRepository.findById(command.templateId);
    if (!template) {
      throw new NotFoundException(`Template with ID ${command.templateId} not found`);
    }

    // Convert variables to proper type
    const templateVariables = this.convertToTemplateVariables(command.variables);

    // Validate template content
    await this.validateTemplateContent(command.content, templateVariables);

    // Create new version
    const updatedTemplate = template.createVersion(
      command.content,
      templateVariables,
      command.version,
      command.changelog,
      command.createdBy,
    );

    await this.templateRepository.save(updatedTemplate);

    // Publish domain events
    updatedTemplate.getUncommittedEvents().forEach(event => {
      this.eventBus.publish(event);
    });
    updatedTemplate.markEventsAsCommitted();
  }

  private async validateTemplateContent(content: string, variables: any[]): Promise<void> {
    try {
      const sampleData = this.generateSampleData(variables);
      this.templateEngine.compileTemplateFromString(content, sampleData);
    } catch (error) {
      throw new BadRequestException(`Template syntax error: ${error.message}`);
    }
  }

  private generateSampleData(variables: any[]): Record<string, any> {
    const sampleData: Record<string, any> = {};
    variables.forEach(variable => {
      switch (variable.type) {
        case 'string':
          sampleData[variable.name] = variable.defaultValue || 'SampleString';
          break;
        case 'number':
        case 'integer':
          sampleData[variable.name] = variable.defaultValue || 42;
          break;
        case 'boolean':
          sampleData[variable.name] = variable.defaultValue !== undefined ? variable.defaultValue : true;
          break;
        case 'array':
          sampleData[variable.name] = variable.defaultValue || ['item1', 'item2'];
          break;
        case 'object':
          sampleData[variable.name] = variable.defaultValue || { key: 'value' };
          break;
        default:
          sampleData[variable.name] = variable.defaultValue || 'defaultValue';
      }
    });
    return sampleData;
  }

  /**
   * 转换变量类型为TemplateVariable
   */
  private convertToTemplateVariables(variables: any[]): TemplateVariable[] {
    return variables.map(variable => ({
      name: variable.name,
      type: this.mapVariableType(variable.type),
      description: variable.description,
      defaultValue: variable.defaultValue,
      required: variable.required,
      validation: {
        pattern: variable.pattern,
        minLength: variable.minLength,
        maxLength: variable.maxLength,
        min: variable.min,
        max: variable.max,
      },
    }));
  }

  /**
   * 映射变量类型
   */
  private mapVariableType(type: string): 'string' | 'number' | 'boolean' | 'array' | 'object' {
    const typeMap: Record<string, 'string' | 'number' | 'boolean' | 'array' | 'object'> = {
      'string': 'string',
      'text': 'string',
      'varchar': 'string',
      'number': 'number',
      'integer': 'number',
      'float': 'number',
      'decimal': 'number',
      'boolean': 'boolean',
      'bool': 'boolean',
      'array': 'array',
      'object': 'object',
      'json': 'object',
    };

    return typeMap[type.toLowerCase()] || 'string';
  }
}

@CommandHandler(PublishTemplateCommand)
export class PublishTemplateHandler implements ICommandHandler<PublishTemplateCommand> {
  constructor(
    @Inject('TemplateRepository')
    private readonly templateRepository: TemplateRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: PublishTemplateCommand): Promise<void> {
    const template = await this.templateRepository.findById(command.templateId);
    if (!template) {
      throw new NotFoundException(`Template with ID ${command.templateId} not found`);
    }

    const publishedTemplate = template.publish();
    await this.templateRepository.save(publishedTemplate);

    // Publish domain events
    publishedTemplate.getUncommittedEvents().forEach(event => {
      this.eventBus.publish(event);
    });
    publishedTemplate.markEventsAsCommitted();
  }
}

@CommandHandler(DeleteTemplateCommand)
export class DeleteTemplateHandler implements ICommandHandler<DeleteTemplateCommand> {
  constructor(
    @Inject('TemplateRepository')
    private readonly templateRepository: TemplateRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeleteTemplateCommand): Promise<void> {
    const template = await this.templateRepository.findById(command.templateId);
    if (!template) {
      throw new NotFoundException(`Template with ID ${command.templateId} not found`);
    }

    await this.templateRepository.delete(command.templateId);

    // Publish domain events if needed
    // template.delete(command.deletedBy);
  }

  /**
   * 转换变量类型为TemplateVariable
   */
  private convertToTemplateVariables(variables: any[]): TemplateVariable[] {
    return variables.map(variable => ({
      name: variable.name,
      type: this.mapVariableType(variable.type),
      description: variable.description,
      defaultValue: variable.defaultValue,
      required: variable.required,
      validation: {
        pattern: variable.pattern,
        minLength: variable.minLength,
        maxLength: variable.maxLength,
        min: variable.min,
        max: variable.max,
      },
    }));
  }

  /**
   * 映射变量类型
   */
  private mapVariableType(type: string): 'string' | 'number' | 'boolean' | 'array' | 'object' {
    const typeMap: Record<string, 'string' | 'number' | 'boolean' | 'array' | 'object'> = {
      'string': 'string',
      'text': 'string',
      'varchar': 'string',
      'number': 'number',
      'integer': 'number',
      'float': 'number',
      'decimal': 'number',
      'boolean': 'boolean',
      'bool': 'boolean',
      'array': 'array',
      'object': 'object',
      'json': 'object',
    };

    return typeMap[type.toLowerCase()] || 'string';
  }
}
