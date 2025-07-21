import { ulid } from 'ulid';

export interface TemplateInheritance {
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

export interface TemplateComposition {
  baseTemplateId: string;
  mixins: Array<{
    templateId: string;
    priority: number;
    sections: string[];
    variables?: Record<string, any>;
  }>;
  overrides: Record<string, string>;
}

export interface TemplateSection {
  name: string;
  content: string;
  variables: string[];
  dependencies: string[];
  optional: boolean;
}

export class CompositeTemplate {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly baseTemplateId: string,
    public readonly inheritance: TemplateInheritance | null,
    public readonly composition: TemplateComposition | null,
    public readonly sections: Map<string, TemplateSection>,
    public readonly variables: any[],
    public readonly compiledContent: string,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static createWithInheritance(properties: {
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
    createdBy: string;
  }): CompositeTemplate {
    const inheritance: TemplateInheritance = {
      parentTemplateId: properties.parentTemplateId,
      overrides: properties.overrides,
      extensions: properties.extensions,
    };

    return new CompositeTemplate(
      ulid(),
      properties.name,
      properties.description,
      properties.parentTemplateId,
      inheritance,
      null,
      new Map(),
      [],
      '', // Will be compiled later
      properties.createdBy,
      new Date(),
      new Date(),
    );
  }

  static createWithComposition(properties: {
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
    createdBy: string;
  }): CompositeTemplate {
    const composition: TemplateComposition = {
      baseTemplateId: properties.baseTemplateId,
      mixins: properties.mixins,
      overrides: properties.overrides,
    };

    return new CompositeTemplate(
      ulid(),
      properties.name,
      properties.description,
      properties.baseTemplateId,
      null,
      composition,
      new Map(),
      [],
      '', // Will be compiled later
      properties.createdBy,
      new Date(),
      new Date(),
    );
  }

  addSection(section: TemplateSection): CompositeTemplate {
    const newSections = new Map(this.sections);
    newSections.set(section.name, section);

    return new CompositeTemplate(
      this.id,
      this.name,
      this.description,
      this.baseTemplateId,
      this.inheritance,
      this.composition,
      newSections,
      this.variables,
      this.compiledContent,
      this.createdBy,
      this.createdAt,
      new Date(),
    );
  }

  removeSection(sectionName: string): CompositeTemplate {
    const newSections = new Map(this.sections);
    newSections.delete(sectionName);

    return new CompositeTemplate(
      this.id,
      this.name,
      this.description,
      this.baseTemplateId,
      this.inheritance,
      this.composition,
      newSections,
      this.variables,
      this.compiledContent,
      this.createdBy,
      this.createdAt,
      new Date(),
    );
  }

  updateSection(sectionName: string, content: string): CompositeTemplate {
    const section = this.sections.get(sectionName);
    if (!section) {
      throw new Error(`Section ${sectionName} not found`);
    }

    const updatedSection: TemplateSection = {
      ...section,
      content,
    };

    const newSections = new Map(this.sections);
    newSections.set(sectionName, updatedSection);

    return new CompositeTemplate(
      this.id,
      this.name,
      this.description,
      this.baseTemplateId,
      this.inheritance,
      this.composition,
      newSections,
      this.variables,
      this.compiledContent,
      this.createdBy,
      this.createdAt,
      new Date(),
    );
  }

  compile(baseTemplate: any, parentTemplate?: any, mixinTemplates?: any[]): CompositeTemplate {
    let compiledContent = '';

    if (this.inheritance && parentTemplate) {
      compiledContent = this.compileWithInheritance(parentTemplate);
    } else if (this.composition && mixinTemplates) {
      compiledContent = this.compileWithComposition(baseTemplate, mixinTemplates);
    } else {
      compiledContent = baseTemplate.content;
    }

    return new CompositeTemplate(
      this.id,
      this.name,
      this.description,
      this.baseTemplateId,
      this.inheritance,
      this.composition,
      this.sections,
      this.variables,
      compiledContent,
      this.createdBy,
      this.createdAt,
      new Date(),
    );
  }

  private compileWithInheritance(parentTemplate: any): string {
    if (!this.inheritance) return '';

    let content = parentTemplate.content;

    // Apply section overrides
    if (this.inheritance.overrides.sections) {
      Object.entries(this.inheritance.overrides.sections).forEach(([sectionName, sectionContent]) => {
        const sectionRegex = new RegExp(`{{#section "${sectionName}"}}([\\s\\S]*?){{/section}}`, 'g');
        content = content.replace(sectionRegex, `{{#section "${sectionName}"}}${sectionContent}{{/section}}`);
      });
    }

    // Apply content override
    if (this.inheritance.overrides.content) {
      content = this.inheritance.overrides.content;
    }

    // Apply extensions
    if (this.inheritance.extensions.beforeContent) {
      content = this.inheritance.extensions.beforeContent + '\n' + content;
    }

    if (this.inheritance.extensions.afterContent) {
      content = content + '\n' + this.inheritance.extensions.afterContent;
    }

    return content;
  }

  private compileWithComposition(baseTemplate: any, mixinTemplates: any[]): string {
    if (!this.composition) return baseTemplate.content;

    let content = baseTemplate.content;

    // Sort mixins by priority
    const sortedMixins = [...this.composition.mixins].sort((a, b) => a.priority - b.priority);

    // Apply mixins
    for (const mixin of sortedMixins) {
      const mixinTemplate = mixinTemplates.find(t => t.id === mixin.templateId);
      if (!mixinTemplate) continue;

      // Apply mixin sections
      for (const sectionName of mixin.sections) {
        const sectionRegex = new RegExp(`{{#mixin "${sectionName}"}}`, 'g');
        const mixinSectionRegex = new RegExp(`{{#section "${sectionName}"}}([\\s\\S]*?){{/section}}`, 'g');
        
        const mixinSectionMatch = mixinTemplate.content.match(mixinSectionRegex);
        if (mixinSectionMatch) {
          const mixinSectionContent = mixinSectionMatch[0].replace(mixinSectionRegex, '$1');
          content = content.replace(sectionRegex, mixinSectionContent);
        }
      }
    }

    // Apply overrides
    Object.entries(this.composition.overrides).forEach(([sectionName, sectionContent]) => {
      const sectionRegex = new RegExp(`{{#section "${sectionName}"}}([\\s\\S]*?){{/section}}`, 'g');
      content = content.replace(sectionRegex, `{{#section "${sectionName}"}}${sectionContent}{{/section}}`);
    });

    return content;
  }

  getRequiredVariables(): string[] {
    const variables = new Set<string>();

    // Extract variables from compiled content
    const variableRegex = /\{\{([^}]+)\}\}/g;
    let match;

    while ((match = variableRegex.exec(this.compiledContent)) !== null) {
      const variableExpression = match[1].trim();
      // Extract the base variable name (handle helpers)
      const baseVariable = variableExpression.split(' ').pop() || variableExpression;
      variables.add(baseVariable);
    }

    return Array.from(variables);
  }

  getDependencies(): string[] {
    const dependencies = new Set<string>();

    // Add dependencies from sections
    this.sections.forEach(section => {
      section.dependencies.forEach(dep => dependencies.add(dep));
    });

    return Array.from(dependencies);
  }

  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate sections
    this.sections.forEach((section, name) => {
      if (!section.content.trim()) {
        errors.push(`Section ${name} has empty content`);
      }

      // Check for circular dependencies
      if (section.dependencies.includes(name)) {
        errors.push(`Section ${name} has circular dependency`);
      }
    });

    // Validate inheritance
    if (this.inheritance) {
      if (!this.inheritance.parentTemplateId) {
        errors.push('Parent template ID is required for inheritance');
      }
    }

    // Validate composition
    if (this.composition) {
      if (!this.composition.baseTemplateId) {
        errors.push('Base template ID is required for composition');
      }

      if (this.composition.mixins.length === 0) {
        errors.push('At least one mixin is required for composition');
      }

      // Check for duplicate mixin priorities
      const priorities = this.composition.mixins.map(m => m.priority);
      const uniquePriorities = new Set(priorities);
      if (priorities.length !== uniquePriorities.size) {
        errors.push('Mixin priorities must be unique');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
