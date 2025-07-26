import { Injectable, Logger } from '@nestjs/common';
import { AuthenticatedUser } from '@lib/shared-auth';
import { BusinessException } from '@lib/shared-errors';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

export interface TemplateContext {
  entity: any;
  project: any;
  relations: any[];
  variables: Record<string, any>;
  helpers: Record<string, Function>;
  partials: Record<string, string>;
}

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  usedVariables: string[];
  missingVariables: string[];
}

@Injectable()
export class EnhancedTemplateEngineService {
  private readonly logger = new Logger(EnhancedTemplateEngineService.name);
  private handlebars: typeof Handlebars;
  private customHelpers: Map<string, Function> = new Map();
  private partials: Map<string, string> = new Map();

  constructor() {
    this.handlebars = Handlebars.create();
    this.registerBuiltinHelpers();
    this.registerBuiltinPartials();
  }

  async renderTemplate(
    templateContent: string,
    context: TemplateContext,
    user: AuthenticatedUser
  ): Promise<string> {
    this.logger.log(`Rendering template for user: ${user.username}`);

    try {
      // 注册自定义helpers
      this.registerCustomHelpers(context.helpers);

      // 注册partials
      this.registerPartials(context.partials);

      // 编译模板
      const template = this.handlebars.compile(templateContent, {
        strict: true,
        noEscape: false,
      });

      // 渲染模板
      const result = template(context);

      this.logger.log('Template rendered successfully');
      return result;

    } catch (error) {
      this.logger.error(`Template rendering failed: ${error.message}`);
      throw BusinessException.badRequest('Template rendering failed', error.message);
    }
  }

  async validateTemplate(
    templateContent: string,
    context: TemplateContext,
    user: AuthenticatedUser
  ): Promise<TemplateValidationResult> {
    this.logger.log(`Validating template for user: ${user.username}`);

    const result: TemplateValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      usedVariables: [],
      missingVariables: [],
    };

    try {
      // 解析模板AST
      const ast = this.handlebars.parse(templateContent);
      
      // 分析模板中使用的变量
      const usedVariables = this.extractVariables(ast);
      result.usedVariables = usedVariables;

      // 检查缺失的变量
      const availableVariables = Object.keys(context.variables || {});
      result.missingVariables = usedVariables.filter(
        variable => !availableVariables.includes(variable)
      );

      // 尝试编译模板
      this.handlebars.compile(templateContent);

      // 检查语法错误
      if (result.missingVariables.length > 0) {
        result.warnings.push(`Missing variables: ${result.missingVariables.join(', ')}`);
      }

    } catch (error) {
      result.isValid = false;
      result.errors.push(error.message);
    }

    return result;
  }

  async previewTemplate(
    templateContent: string,
    context: TemplateContext,
    user: AuthenticatedUser
  ): Promise<{ preview: string; validation: TemplateValidationResult }> {
    this.logger.log(`Previewing template for user: ${user.username}`);

    // 验证模板
    const validation = await this.validateTemplate(templateContent, context, user);

    let preview = '';
    if (validation.isValid) {
      try {
        preview = await this.renderTemplate(templateContent, context, user);
      } catch (error) {
        validation.isValid = false;
        validation.errors.push(`Preview generation failed: ${error.message}`);
      }
    }

    return { preview, validation };
  }

  registerCustomHelper(name: string, helper: Function): void {
    this.customHelpers.set(name, helper);
    this.handlebars.registerHelper(name, helper);
  }

  registerPartial(name: string, content: string): void {
    this.partials.set(name, content);
    this.handlebars.registerPartial(name, content);
  }

  private registerBuiltinHelpers(): void {
    // 字符串处理helpers
    this.handlebars.registerHelper('camelCase', (str: string) => {
      return str.charAt(0).toLowerCase() + str.slice(1).replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
    });

    this.handlebars.registerHelper('pascalCase', (str: string) => {
      return str.charAt(0).toUpperCase() + str.slice(1).replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
    });

    this.handlebars.registerHelper('kebabCase', (str: string) => {
      return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    });

    this.handlebars.registerHelper('snakeCase', (str: string) => {
      return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
    });

    this.handlebars.registerHelper('upperCase', (str: string) => str.toUpperCase());
    this.handlebars.registerHelper('lowerCase', (str: string) => str.toLowerCase());

    this.handlebars.registerHelper('capitalize', (str: string) => {
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    });

    this.handlebars.registerHelper('pluralize', (str: string) => {
      // 简单的复数化规则
      if (str.endsWith('y')) {
        return str.slice(0, -1) + 'ies';
      } else if (str.endsWith('s') || str.endsWith('sh') || str.endsWith('ch')) {
        return str + 'es';
      } else {
        return str + 's';
      }
    });

    // 条件判断helpers
    this.handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    this.handlebars.registerHelper('ne', (a: any, b: any) => a !== b);
    this.handlebars.registerHelper('gt', (a: number, b: number) => a > b);
    this.handlebars.registerHelper('gte', (a: number, b: number) => a >= b);
    this.handlebars.registerHelper('lt', (a: number, b: number) => a < b);
    this.handlebars.registerHelper('lte', (a: number, b: number) => a <= b);
    this.handlebars.registerHelper('and', (a: any, b: any) => a && b);
    this.handlebars.registerHelper('or', (a: any, b: any) => a || b);
    this.handlebars.registerHelper('not', (a: any) => !a);

    // 数组和对象helpers
    this.handlebars.registerHelper('length', (arr: any[]) => arr ? arr.length : 0);
    this.handlebars.registerHelper('isEmpty', (arr: any[]) => !arr || arr.length === 0);
    this.handlebars.registerHelper('isNotEmpty', (arr: any[]) => arr && arr.length > 0);
    this.handlebars.registerHelper('first', (arr: any[]) => arr && arr.length > 0 ? arr[0] : null);
    this.handlebars.registerHelper('last', (arr: any[]) => arr && arr.length > 0 ? arr[arr.length - 1] : null);

    this.handlebars.registerHelper('join', (arr: any[], separator: string = ', ') => {
      return arr ? arr.join(separator) : '';
    });

    this.handlebars.registerHelper('filter', (arr: any[], property: string, value: any) => {
      return arr ? arr.filter(item => item[property] === value) : [];
    });

    this.handlebars.registerHelper('map', (arr: any[], property: string) => {
      return arr ? arr.map(item => item[property]) : [];
    });

    // 数据类型helpers
    this.handlebars.registerHelper('typeOf', (value: any) => typeof value);
    this.handlebars.registerHelper('isString', (value: any) => typeof value === 'string');
    this.handlebars.registerHelper('isNumber', (value: any) => typeof value === 'number');
    this.handlebars.registerHelper('isBoolean', (value: any) => typeof value === 'boolean');
    this.handlebars.registerHelper('isArray', (value: any) => Array.isArray(value));
    this.handlebars.registerHelper('isObject', (value: any) => value && typeof value === 'object' && !Array.isArray(value));

    // 日期和时间helpers
    this.handlebars.registerHelper('now', () => new Date().toISOString());
    this.handlebars.registerHelper('date', (format?: string) => {
      const now = new Date();
      if (format === 'iso') return now.toISOString();
      if (format === 'date') return now.toDateString();
      if (format === 'time') return now.toTimeString();
      return now.toString();
    });

    this.handlebars.registerHelper('year', () => new Date().getFullYear());

    // JSON和格式化helpers
    this.handlebars.registerHelper('json', (obj: any, indent?: number) => {
      return JSON.stringify(obj, null, indent || 2);
    });

    this.handlebars.registerHelper('jsonParse', (str: string) => {
      try {
        return JSON.parse(str);
      } catch {
        return null;
      }
    });

    // 数学helpers
    this.handlebars.registerHelper('add', (a: number, b: number) => a + b);
    this.handlebars.registerHelper('subtract', (a: number, b: number) => a - b);
    this.handlebars.registerHelper('multiply', (a: number, b: number) => a * b);
    this.handlebars.registerHelper('divide', (a: number, b: number) => b !== 0 ? a / b : 0);
    this.handlebars.registerHelper('mod', (a: number, b: number) => a % b);
    this.handlebars.registerHelper('round', (num: number) => Math.round(num));
    this.handlebars.registerHelper('ceil', (num: number) => Math.ceil(num));
    this.handlebars.registerHelper('floor', (num: number) => Math.floor(num));

    // 循环helpers
    this.handlebars.registerHelper('times', function(n: number, options: any) {
      let result = '';
      for (let i = 0; i < n; i++) {
        result += options.fn({ index: i, count: i + 1 });
      }
      return result;
    });

    this.handlebars.registerHelper('range', function(start: number, end: number, options: any) {
      let result = '';
      for (let i = start; i <= end; i++) {
        result += options.fn({ value: i, index: i - start });
      }
      return result;
    });

    // 实体相关helpers
    this.handlebars.registerHelper('primaryKey', (entity: any) => {
      return entity.fields?.find((field: any) => field.isPrimary) || { name: 'id', type: 'number' };
    });

    this.handlebars.registerHelper('requiredFields', (entity: any) => {
      return entity.fields?.filter((field: any) => field.isRequired) || [];
    });

    this.handlebars.registerHelper('optionalFields', (entity: any) => {
      return entity.fields?.filter((field: any) => !field.isRequired) || [];
    });

    this.handlebars.registerHelper('fieldsByType', (entity: any, type: string) => {
      return entity.fields?.filter((field: any) => field.type === type) || [];
    });

    // 关系helpers
    this.handlebars.registerHelper('oneToOneRelations', (relations: any[]) => {
      return relations?.filter(rel => rel.type === 'ONE_TO_ONE') || [];
    });

    this.handlebars.registerHelper('oneToManyRelations', (relations: any[]) => {
      return relations?.filter(rel => rel.type === 'ONE_TO_MANY') || [];
    });

    this.handlebars.registerHelper('manyToOneRelations', (relations: any[]) => {
      return relations?.filter(rel => rel.type === 'MANY_TO_ONE') || [];
    });

    this.handlebars.registerHelper('manyToManyRelations', (relations: any[]) => {
      return relations?.filter(rel => rel.type === 'MANY_TO_MANY') || [];
    });
  }

  private registerBuiltinPartials(): void {
    // 注册常用的partial模板
    this.handlebars.registerPartial('import', `{{#each imports}}
import { {{name}} } from '{{path}}';
{{/each}}`);

    this.handlebars.registerPartial('field', `{{#if description}}
  /**
   * {{description}}
   */
  {{/if}}
  {{#if isRequired}}@IsNotEmpty(){{/if}}
  {{#if validation}}{{validation}}{{/if}}
  {{name}}{{#unless isRequired}}?{{/unless}}: {{type}};`);

    this.handlebars.registerPartial('method', `{{#if description}}
  /**
   * {{description}}
   {{#each params}}
   * @param {{name}} {{description}}
   {{/each}}
   {{#if returns}}
   * @returns {{returns}}
   {{/if}}
   */
  {{/if}}
  {{visibility}} {{#if async}}async {{/if}}{{name}}({{#each params}}{{name}}: {{type}}{{#unless @last}}, {{/unless}}{{/each}}){{#if returns}}: {{returns}}{{/if}} {
    {{body}}
  }`);

    this.handlebars.registerPartial('class', `{{#if description}}
/**
 * {{description}}
 */
{{/if}}
{{#each decorators}}
{{this}}
{{/each}}
export class {{name}}{{#if extends}} extends {{extends}}{{/if}}{{#if implements}} implements {{implements}}{{/if}} {
  {{#each fields}}
  {{> field this}}
  {{/each}}

  {{#each methods}}
  {{> method this}}
  {{/each}}
}`);
  }

  private registerCustomHelpers(helpers: Record<string, Function>): void {
    if (helpers) {
      Object.entries(helpers).forEach(([name, helper]) => {
        this.registerCustomHelper(name, helper);
      });
    }
  }

  private registerPartials(partials: Record<string, string>): void {
    if (partials) {
      Object.entries(partials).forEach(([name, content]) => {
        this.registerPartial(name, content);
      });
    }
  }

  private extractVariables(ast: any): string[] {
    const variables: Set<string> = new Set();

    const traverse = (node: any) => {
      if (node.type === 'MustacheStatement' || node.type === 'BlockStatement') {
        if (node.path && node.path.type === 'PathExpression') {
          variables.add(node.path.original);
        }
      }

      if (node.body) {
        if (Array.isArray(node.body)) {
          node.body.forEach(traverse);
        } else {
          traverse(node.body);
        }
      }

      if (node.program) {
        traverse(node.program);
      }

      if (node.inverse) {
        traverse(node.inverse);
      }
    };

    traverse(ast);
    return Array.from(variables);
  }
}
