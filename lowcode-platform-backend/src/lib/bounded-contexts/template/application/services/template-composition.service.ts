import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { CompositeTemplate, TemplateSection } from '../../domain/template-composition.model';
import { TemplateRepository } from '../../domain/template.repository';
import { TemplateEngineService } from '../../../code-generation/infrastructure/template-engine.service';

export interface TemplateInheritanceRequest {
  name: string;
  description: string;
  parentTemplateId: string;
  overrides: {
    content?: string;
    variables?: any[];
    sections?: Record<string, string>;
  };
  extensions: {
    beforeContent?: string;
    afterContent?: string;
    additionalVariables?: any[];
  };
}

export interface TemplateCompositionRequest {
  name: string;
  description: string;
  baseTemplateId: string;
  mixins: Array<{
    templateId: string;
    priority: number;
    sections: string[];
    variables?: Record<string, any>;
  }>;
  overrides: Record<string, string>;
}

@Injectable()
export class TemplateCompositionService {
  constructor(
    @Inject('TemplateRepository')
    private readonly templateRepository: TemplateRepository,
    private readonly templateEngine: TemplateEngineService,
  ) {}

  async createInheritedTemplate(
    request: TemplateInheritanceRequest,
    createdBy: string,
  ): Promise<CompositeTemplate> {
    // Validate parent template exists
    const parentTemplate = await this.templateRepository.findById(request.parentTemplateId);
    if (!parentTemplate) {
      throw new NotFoundException(`Parent template ${request.parentTemplateId} not found`);
    }

    // Create composite template with inheritance
    const compositeTemplate = CompositeTemplate.createWithInheritance({
      name: request.name,
      description: request.description,
      parentTemplateId: request.parentTemplateId,
      overrides: request.overrides,
      extensions: request.extensions,
      createdBy,
    });

    // Compile the template
    const compiledTemplate = compositeTemplate.compile(parentTemplate, parentTemplate);

    // Validate the compiled template
    await this.validateCompiledTemplate(compiledTemplate.compiledContent);

    return compiledTemplate;
  }

  async createComposedTemplate(
    request: TemplateCompositionRequest,
    createdBy: string,
  ): Promise<CompositeTemplate> {
    // Validate base template exists
    const baseTemplate = await this.templateRepository.findById(request.baseTemplateId);
    if (!baseTemplate) {
      throw new NotFoundException(`Base template ${request.baseTemplateId} not found`);
    }

    // Validate mixin templates exist
    const mixinTemplateIds = request.mixins.map(m => m.templateId);
    const mixinTemplates = await Promise.all(
      mixinTemplateIds.map(id => this.templateRepository.findById(id))
    );

    const missingTemplates = mixinTemplateIds.filter((id, index) => !mixinTemplates[index]);
    if (missingTemplates.length > 0) {
      throw new NotFoundException(`Mixin templates not found: ${missingTemplates.join(', ')}`);
    }

    // Create composite template with composition
    const compositeTemplate = CompositeTemplate.createWithComposition({
      name: request.name,
      description: request.description,
      baseTemplateId: request.baseTemplateId,
      mixins: request.mixins,
      overrides: request.overrides,
      createdBy,
    });

    // Compile the template
    const compiledTemplate = compositeTemplate.compile(
      baseTemplate,
      undefined,
      mixinTemplates.filter(Boolean)
    );

    // Validate the compiled template
    await this.validateCompiledTemplate(compiledTemplate.compiledContent);

    return compiledTemplate;
  }

  async addSectionToTemplate(
    templateId: string,
    section: TemplateSection,
  ): Promise<CompositeTemplate> {
    // This would typically load from a repository
    // For now, we'll create a placeholder implementation
    throw new Error('Not implemented - requires composite template repository');
  }

  async updateTemplateSection(
    templateId: string,
    sectionName: string,
    content: string,
  ): Promise<CompositeTemplate> {
    // This would typically load from a repository
    // For now, we'll create a placeholder implementation
    throw new Error('Not implemented - requires composite template repository');
  }

  async previewComposition(
    request: TemplateCompositionRequest,
    variables: Record<string, any>,
  ): Promise<{ content: string; variables: string[]; errors: string[] }> {
    try {
      // Get templates
      const baseTemplate = await this.templateRepository.findById(request.baseTemplateId);
      if (!baseTemplate) {
        throw new NotFoundException(`Base template ${request.baseTemplateId} not found`);
      }

      const mixinTemplateIds = request.mixins.map(m => m.templateId);
      const mixinTemplates = await Promise.all(
        mixinTemplateIds.map(id => this.templateRepository.findById(id))
      );

      // Create temporary composite template
      const compositeTemplate = CompositeTemplate.createWithComposition({
        name: 'Preview',
        description: 'Preview composition',
        baseTemplateId: request.baseTemplateId,
        mixins: request.mixins,
        overrides: request.overrides,
        createdBy: 'system',
      });

      // Compile the template
      const compiledTemplate = compositeTemplate.compile(
        baseTemplate,
        undefined,
        mixinTemplates.filter(Boolean)
      );

      // Render with variables
      const renderedContent = this.templateEngine.compileTemplateFromString(
        compiledTemplate.compiledContent,
        variables
      );

      return {
        content: renderedContent,
        variables: compiledTemplate.getRequiredVariables(),
        errors: [],
      };
    } catch (error) {
      return {
        content: '',
        variables: [],
        errors: [error.message],
      };
    }
  }

  async previewInheritance(
    request: TemplateInheritanceRequest,
    variables: Record<string, any>,
  ): Promise<{ content: string; variables: string[]; errors: string[] }> {
    try {
      // Get parent template
      const parentTemplate = await this.templateRepository.findById(request.parentTemplateId);
      if (!parentTemplate) {
        throw new NotFoundException(`Parent template ${request.parentTemplateId} not found`);
      }

      // Create temporary composite template
      const compositeTemplate = CompositeTemplate.createWithInheritance({
        name: 'Preview',
        description: 'Preview inheritance',
        parentTemplateId: request.parentTemplateId,
        overrides: request.overrides,
        extensions: request.extensions,
        createdBy: 'system',
      });

      // Compile the template
      const compiledTemplate = compositeTemplate.compile(parentTemplate, parentTemplate);

      // Render with variables
      const renderedContent = this.templateEngine.compileTemplateFromString(
        compiledTemplate.compiledContent,
        variables
      );

      return {
        content: renderedContent,
        variables: compiledTemplate.getRequiredVariables(),
        errors: [],
      };
    } catch (error) {
      return {
        content: '',
        variables: [],
        errors: [error.message],
      };
    }
  }

  extractSectionsFromTemplate(templateContent: string): TemplateSection[] {
    const sections: TemplateSection[] = [];
    const sectionRegex = /{{#section "([^"]+)"}}([\s\S]*?){{\/section}}/g;
    let match;

    while ((match = sectionRegex.exec(templateContent)) !== null) {
      const sectionName = match[1];
      const sectionContent = match[2];

      // Extract variables from section content
      const variables = this.extractVariablesFromContent(sectionContent);

      // Extract dependencies (simplified - could be more sophisticated)
      const dependencies = this.extractDependenciesFromContent(sectionContent);

      sections.push({
        name: sectionName,
        content: sectionContent,
        variables,
        dependencies,
        optional: false, // Could be determined by template metadata
      });
    }

    return sections;
  }

  private extractVariablesFromContent(content: string): string[] {
    const variables: string[] = [];
    const variableRegex = /\{\{([^}]+)\}\}/g;
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      const variableExpression = match[1].trim();
      // Extract the base variable name (handle helpers)
      const baseVariable = variableExpression.split(' ').pop() || variableExpression;
      if (!variables.includes(baseVariable)) {
        variables.push(baseVariable);
      }
    }

    return variables;
  }

  private extractDependenciesFromContent(content: string): string[] {
    const dependencies: string[] = [];
    
    // Look for import statements or dependency declarations
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      dependencies.push(match[1]);
    }

    return dependencies;
  }

  private async validateCompiledTemplate(content: string): Promise<void> {
    try {
      // Test compile with sample data
      const sampleData = { test: 'value' };
      this.templateEngine.compileTemplateFromString(content, sampleData);
    } catch (error) {
      throw new BadRequestException(`Compiled template validation failed: ${error.message}`);
    }
  }

  async analyzeTemplateCompatibility(
    baseTemplateId: string,
    mixinTemplateIds: string[],
  ): Promise<{
    compatible: boolean;
    conflicts: string[];
    suggestions: string[];
  }> {
    const conflicts: string[] = [];
    const suggestions: string[] = [];

    try {
      // Get all templates
      const baseTemplate = await this.templateRepository.findById(baseTemplateId);
      const mixinTemplates = await Promise.all(
        mixinTemplateIds.map(id => this.templateRepository.findById(id))
      );

      if (!baseTemplate) {
        conflicts.push(`Base template ${baseTemplateId} not found`);
        return { compatible: false, conflicts, suggestions };
      }

      // Check for variable conflicts
      const baseVariables = new Set(baseTemplate.variables.map(v => v.name));
      
      mixinTemplates.forEach((mixin, index) => {
        if (!mixin) {
          conflicts.push(`Mixin template ${mixinTemplateIds[index]} not found`);
          return;
        }

        const mixinVariables = new Set(mixin.variables.map(v => v.name));
        
        // Check for variable name conflicts
        const commonVariables = [...baseVariables].filter(v => mixinVariables.has(v));
        if (commonVariables.length > 0) {
          conflicts.push(`Variable conflicts with mixin ${mixin.name}: ${commonVariables.join(', ')}`);
        }

        // Check framework compatibility
        if (baseTemplate.framework !== mixin.framework) {
          conflicts.push(`Framework mismatch: base uses ${baseTemplate.framework}, mixin ${mixin.name} uses ${mixin.framework}`);
        }

        // Check language compatibility
        if (baseTemplate.language !== mixin.language) {
          conflicts.push(`Language mismatch: base uses ${baseTemplate.language}, mixin ${mixin.name} uses ${mixin.language}`);
        }
      });

      // Generate suggestions
      if (conflicts.length === 0) {
        suggestions.push('Templates are compatible for composition');
      } else {
        suggestions.push('Consider resolving conflicts before composition');
        suggestions.push('Use variable renaming to avoid conflicts');
        suggestions.push('Ensure all templates use the same framework and language');
      }

      return {
        compatible: conflicts.length === 0,
        conflicts,
        suggestions,
      };
    } catch (error) {
      return {
        compatible: false,
        conflicts: [`Analysis failed: ${error.message}`],
        suggestions: ['Check template IDs and try again'],
      };
    }
  }
}
