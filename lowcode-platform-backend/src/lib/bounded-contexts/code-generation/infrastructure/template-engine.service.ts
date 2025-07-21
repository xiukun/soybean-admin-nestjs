import { Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TemplateEngineService {
  private handlebars: typeof Handlebars;

  constructor() {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  private registerHelpers() {
    // String transformation helpers
    this.handlebars.registerHelper('camelCase', (str: string) => {
      return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      }).replace(/\s+/g, '');
    });

    this.handlebars.registerHelper('pascalCase', (str: string) => {
      return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => {
        return word.toUpperCase();
      }).replace(/\s+/g, '');
    });

    this.handlebars.registerHelper('kebabCase', (str: string) => {
      return str.replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/\s+/g, '-')
        .toLowerCase();
    });

    this.handlebars.registerHelper('snakeCase', (str: string) => {
      return str.replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/\s+/g, '_')
        .toLowerCase();
    });

    this.handlebars.registerHelper('upperCase', (str: string) => {
      return str.toUpperCase();
    });

    this.handlebars.registerHelper('lowerCase', (str: string) => {
      return str.toLowerCase();
    });

    this.handlebars.registerHelper('capitalize', (str: string) => {
      return str.charAt(0).toUpperCase() + str.slice(1);
    });

    // Comparison helpers
    this.handlebars.registerHelper('eq', (a: any, b: any) => {
      return a === b;
    });

    this.handlebars.registerHelper('ne', (a: any, b: any) => {
      return a !== b;
    });

    this.handlebars.registerHelper('gt', (a: any, b: any) => {
      return a > b;
    });

    this.handlebars.registerHelper('lt', (a: any, b: any) => {
      return a < b;
    });

    this.handlebars.registerHelper('gte', (a: any, b: any) => {
      return a >= b;
    });

    this.handlebars.registerHelper('lte', (a: any, b: any) => {
      return a <= b;
    });

    // Logical helpers
    this.handlebars.registerHelper('and', (...args: any[]) => {
      const options = args.pop();
      return args.every(Boolean);
    });

    this.handlebars.registerHelper('or', (...args: any[]) => {
      const options = args.pop();
      return args.some(Boolean);
    });

    this.handlebars.registerHelper('not', (value: any) => {
      return !value;
    });

    // Array helpers
    this.handlebars.registerHelper('length', (array: any[]) => {
      return Array.isArray(array) ? array.length : 0;
    });

    this.handlebars.registerHelper('first', (array: any[]) => {
      return Array.isArray(array) && array.length > 0 ? array[0] : null;
    });

    this.handlebars.registerHelper('last', (array: any[]) => {
      return Array.isArray(array) && array.length > 0 ? array[array.length - 1] : null;
    });

    this.handlebars.registerHelper('join', (array: any[], separator: string = ', ') => {
      return Array.isArray(array) ? array.join(separator) : '';
    });

    // Date helpers
    this.handlebars.registerHelper('now', () => {
      return new Date().toISOString();
    });

    this.handlebars.registerHelper('formatDate', (date: string | Date, format: string = 'YYYY-MM-DD') => {
      const d = new Date(date);
      // Simple date formatting - in production, use a proper date library
      return d.toISOString().split('T')[0];
    });

    // Type checking helpers
    this.handlebars.registerHelper('isString', (value: any) => {
      return typeof value === 'string';
    });

    this.handlebars.registerHelper('isNumber', (value: any) => {
      return typeof value === 'number';
    });

    this.handlebars.registerHelper('isBoolean', (value: any) => {
      return typeof value === 'boolean';
    });

    this.handlebars.registerHelper('isArray', (value: any) => {
      return Array.isArray(value);
    });

    this.handlebars.registerHelper('isObject', (value: any) => {
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    });

    // Code generation specific helpers
    this.handlebars.registerHelper('typeScriptType', (fieldType: string) => {
      const typeMap: Record<string, string> = {
        'string': 'string',
        'text': 'string',
        'varchar': 'string',
        'char': 'string',
        'int': 'number',
        'integer': 'number',
        'bigint': 'number',
        'float': 'number',
        'double': 'number',
        'decimal': 'number',
        'boolean': 'boolean',
        'bool': 'boolean',
        'date': 'Date',
        'datetime': 'Date',
        'timestamp': 'Date',
        'json': 'any',
        'jsonb': 'any',
        'uuid': 'string',
      };
      return typeMap[fieldType.toLowerCase()] || 'any';
    });

    this.handlebars.registerHelper('prismaType', (fieldType: string) => {
      const typeMap: Record<string, string> = {
        'string': 'String',
        'text': 'String',
        'varchar': 'String',
        'char': 'String',
        'int': 'Int',
        'integer': 'Int',
        'bigint': 'BigInt',
        'float': 'Float',
        'double': 'Float',
        'decimal': 'Decimal',
        'boolean': 'Boolean',
        'bool': 'Boolean',
        'date': 'DateTime',
        'datetime': 'DateTime',
        'timestamp': 'DateTime',
        'json': 'Json',
        'jsonb': 'Json',
        'uuid': 'String',
      };
      return typeMap[fieldType.toLowerCase()] || 'String';
    });

    this.handlebars.registerHelper('validatorDecorator', (fieldType: string, constraints: any = {}) => {
      const decorators: string[] = [];
      
      switch (fieldType.toLowerCase()) {
        case 'string':
        case 'text':
        case 'varchar':
        case 'char':
          decorators.push('@IsString()');
          if (constraints.maxLength) {
            decorators.push(`@MaxLength(${constraints.maxLength})`);
          }
          if (constraints.minLength) {
            decorators.push(`@MinLength(${constraints.minLength})`);
          }
          if (constraints.isEmail) {
            decorators.push('@IsEmail()');
          }
          break;
        case 'int':
        case 'integer':
        case 'bigint':
        case 'float':
        case 'double':
        case 'decimal':
          decorators.push('@IsNumber()');
          if (constraints.min !== undefined) {
            decorators.push(`@Min(${constraints.min})`);
          }
          if (constraints.max !== undefined) {
            decorators.push(`@Max(${constraints.max})`);
          }
          break;
        case 'boolean':
        case 'bool':
          decorators.push('@IsBoolean()');
          break;
        case 'date':
        case 'datetime':
        case 'timestamp':
          decorators.push('@IsDateString()');
          break;
        case 'uuid':
          decorators.push('@IsUUID()');
          break;
        default:
          decorators.push('@IsString()');
      }

      return decorators.join('\n  ');
    });

    // Math helpers
    this.handlebars.registerHelper('add', (a: number, b: number) => {
      return a + b;
    });

    this.handlebars.registerHelper('subtract', (a: number, b: number) => {
      return a - b;
    });

    this.handlebars.registerHelper('multiply', (a: number, b: number) => {
      return a * b;
    });

    this.handlebars.registerHelper('divide', (a: number, b: number) => {
      return b !== 0 ? a / b : 0;
    });

    // Conditional helpers
    this.handlebars.registerHelper('ifCond', function(v1: any, operator: string, v2: any, options: any) {
      switch (operator) {
        case '==':
          return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
          return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
          return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
          return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
          return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
          return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
          return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
          return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
          return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
          return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
          return options.inverse(this);
      }
    });
  }

  async compileTemplate(templatePath: string, data: any): Promise<string> {
    try {
      const templateContent = await fs.promises.readFile(templatePath, 'utf-8');
      const template = this.handlebars.compile(templateContent);
      return template(data);
    } catch (error) {
      throw new Error(`Failed to compile template ${templatePath}: ${error.message}`);
    }
  }

  compileTemplateFromString(templateString: string, data: any): string {
    try {
      const template = this.handlebars.compile(templateString);
      return template(data);
    } catch (error) {
      throw new Error(`Failed to compile template from string: ${error.message}`);
    }
  }

  async getAvailableTemplates(templatesDir: string): Promise<string[]> {
    try {
      const files = await fs.promises.readdir(templatesDir);
      return files.filter(file => file.endsWith('.hbs') || file.endsWith('.handlebars'));
    } catch (error) {
      throw new Error(`Failed to read templates directory ${templatesDir}: ${error.message}`);
    }
  }

  registerPartial(name: string, template: string): void {
    this.handlebars.registerPartial(name, template);
  }

  async loadPartials(partialsDir: string): Promise<void> {
    try {
      const files = await fs.promises.readdir(partialsDir);
      const partialFiles = files.filter(file => file.endsWith('.hbs') || file.endsWith('.handlebars'));
      
      for (const file of partialFiles) {
        const partialName = path.basename(file, path.extname(file));
        const partialContent = await fs.promises.readFile(path.join(partialsDir, file), 'utf-8');
        this.registerPartial(partialName, partialContent);
      }
    } catch (error) {
      // Partials directory might not exist, which is okay
      console.warn(`Could not load partials from ${partialsDir}: ${error.message}`);
    }
  }
}
