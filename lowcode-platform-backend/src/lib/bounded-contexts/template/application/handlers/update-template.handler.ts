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
import { TemplateStatus } from '../../domain/code-template.model';

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
    const updatedTemplate = template.update({
      name: command.name,
      description: command.description,
      category: command.category,
      language: command.language,
      framework: command.framework,
      content: command.content,
      variables: command.variables,
      tags: command.tags,
      isPublic: command.isPublic,
      updatedBy: command.updatedBy,
    });

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

    // Validate template content
    await this.validateTemplateContent(command.content, command.variables);

    // Create new version
    const updatedTemplate = template.createVersion(
      command.content,
      command.variables,
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

    const publishedTemplate = template.publish(command.publishedBy);
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
}
