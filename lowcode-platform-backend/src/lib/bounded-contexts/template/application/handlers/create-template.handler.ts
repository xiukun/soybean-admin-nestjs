import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, BadRequestException } from '@nestjs/common';
import { CreateTemplateCommand } from '../commands/create-template.command';
import { CodeTemplate, TemplateVariable } from '../../domain/code-template.model';
import { TemplateRepository } from '../../domain/template.repository';
import { TemplateEngineService } from '../../../code-generation/infrastructure/template-engine.service';

@CommandHandler(CreateTemplateCommand)
export class CreateTemplateHandler implements ICommandHandler<CreateTemplateCommand> {
  constructor(
    @Inject('TemplateRepository')
    private readonly templateRepository: TemplateRepository,
    private readonly eventBus: EventBus,
    private readonly templateEngine: TemplateEngineService,
  ) {}

  async execute(command: CreateTemplateCommand): Promise<string> {
    const {
      projectId,
      name,
      description,
      category,
      language,
      framework,
      content,
      variables,
      tags,
      isPublic,
      createdBy,
    } = command;

    // Convert variables to proper type
    const templateVariables = this.convertToTemplateVariables(variables);

    // Validate template content syntax
    await this.validateTemplateContent(content, templateVariables);

    // Check for duplicate template names in the project
    const existingTemplate = await this.templateRepository.findByProjectAndName(projectId, name);
    if (existingTemplate) {
      throw new BadRequestException(`Template with name '${name}' already exists in this project`);
    }

    // Create template
    const template = CodeTemplate.create({
      projectId,
      name,
      description,
      category,
      language,
      framework,
      content,
      variables: templateVariables,
      tags,
      isPublic,
      createdBy,
    });

    // Save template
    await this.templateRepository.save(template);

    // Publish domain events
    template.getUncommittedEvents().forEach(event => {
      this.eventBus.publish(event);
    });
    template.markEventsAsCommitted();

    return template.id;
  }

  private async validateTemplateContent(content: string, variables: TemplateVariable[]): Promise<void> {
    try {
      // Test compile with sample data
      const sampleData = this.generateSampleData(variables);
      this.templateEngine.compileTemplateFromString(content, sampleData);
    } catch (error) {
      throw new BadRequestException(`Template syntax error: ${error.message}`);
    }

    // Validate that all declared variables are used in the template
    const usedVariables = this.extractVariablesFromTemplate(content);
    const declaredVariables = variables.map(v => v.name);

    const unusedVariables = declaredVariables.filter(v => !usedVariables.includes(v));
    if (unusedVariables.length > 0) {
      console.warn(`Unused variables detected: ${unusedVariables.join(', ')}`);
    }

    const undeclaredVariables = usedVariables.filter(v => !declaredVariables.includes(v));
    if (undeclaredVariables.length > 0) {
      throw new BadRequestException(`Undeclared variables found in template: ${undeclaredVariables.join(', ')}`);
    }
  }

  private generateSampleData(variables: TemplateVariable[]): Record<string, any> {
    const sampleData: Record<string, any> = {};

    variables.forEach(variable => {
      switch (variable.type) {
        case 'string':
          sampleData[variable.name] = variable.defaultValue || 'SampleString';
          break;
        case 'number':
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

  private extractVariablesFromTemplate(content: string): string[] {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      const variableExpression = match[1].trim();
      // Extract the base variable name (handle helpers like {{pascalCase entityName}})
      const baseVariable = variableExpression.split(' ').pop() || variableExpression;
      if (!variables.includes(baseVariable)) {
        variables.push(baseVariable);
      }
    }

    return variables;
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
