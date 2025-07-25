/*
 * @Description: 模板预览服务
 * @Autor: henry.xiukun
 * @Date: 2025-07-25 21:40:00
 * @LastEditors: henry.xiukun
 */

import { Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TemplatePreviewResult {
  success: boolean;
  output: string;
  errors: string[];
  usedVariables: string[];
  unusedVariables: string[];
}

@Injectable()
export class TemplatePreviewService {
  constructor() {
    this.registerHelpers();
  }

  /**
   * 注册Handlebars辅助函数
   */
  private registerHelpers() {
    // 注册常用的辅助函数
    Handlebars.registerHelper('pascalCase', (str: string) => {
      if (!str) return '';
      return str.replace(/(?:^|[\s-_]+)(\w)/g, (match, letter) => letter.toUpperCase());
    });

    Handlebars.registerHelper('camelCase', (str: string) => {
      if (!str) return '';
      const pascalCase = str.replace(/(?:^|[\s-_]+)(\w)/g, (match, letter) => letter.toUpperCase());
      return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
    });

    Handlebars.registerHelper('kebabCase', (str: string) => {
      if (!str) return '';
      return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase().replace(/[\s_]+/g, '-');
    });

    Handlebars.registerHelper('snakeCase', (str: string) => {
      if (!str) return '';
      return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase().replace(/[\s-]+/g, '_');
    });

    Handlebars.registerHelper('upperCase', (str: string) => {
      return str ? str.toUpperCase() : '';
    });

    Handlebars.registerHelper('lowerCase', (str: string) => {
      return str ? str.toLowerCase() : '';
    });

    Handlebars.registerHelper('eq', (a: any, b: any) => {
      return a === b;
    });

    Handlebars.registerHelper('ne', (a: any, b: any) => {
      return a !== b;
    });

    Handlebars.registerHelper('gt', (a: number, b: number) => {
      return a > b;
    });

    Handlebars.registerHelper('lt', (a: number, b: number) => {
      return a < b;
    });

    Handlebars.registerHelper('and', (a: any, b: any) => {
      return a && b;
    });

    Handlebars.registerHelper('or', (a: any, b: any) => {
      return a || b;
    });

    Handlebars.registerHelper('not', (a: any) => {
      return !a;
    });

    // 日期格式化
    Handlebars.registerHelper('formatDate', (date: Date, format: string = 'YYYY-MM-DD') => {
      if (!date) return '';
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      
      return format
        .replace('YYYY', year.toString())
        .replace('MM', month)
        .replace('DD', day);
    });

    // 数组操作
    Handlebars.registerHelper('join', (array: any[], separator: string = ', ') => {
      return Array.isArray(array) ? array.join(separator) : '';
    });

    Handlebars.registerHelper('length', (array: any[]) => {
      return Array.isArray(array) ? array.length : 0;
    });

    // 条件渲染
    Handlebars.registerHelper('ifCond', function(v1: any, operator: string, v2: any, options: any) {
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

  /**
   * 验证模板语法
   */
  validateTemplate(content: string, variables?: any[]): TemplateValidationResult {
    const result: TemplateValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      // 编译模板以检查语法
      Handlebars.compile(content);

      // 检查变量定义
      if (variables && variables.length > 0) {
        const templateVars = this.extractVariables(content);
        const definedVars = variables.map(v => v.name);

        // 检查未定义的变量
        const undefinedVars = templateVars.filter(v => !definedVars.includes(v));
        if (undefinedVars.length > 0) {
          result.warnings.push(`未定义的变量: ${undefinedVars.join(', ')}`);
        }

        // 检查未使用的变量
        const unusedVars = definedVars.filter(v => !templateVars.includes(v));
        if (unusedVars.length > 0) {
          result.warnings.push(`未使用的变量: ${unusedVars.join(', ')}`);
        }
      }
    } catch (error) {
      result.isValid = false;
      result.errors.push(`模板语法错误: ${error.message}`);
    }

    return result;
  }

  /**
   * 预览模板
   */
  previewTemplate(content: string, variables: Record<string, any> = {}): TemplatePreviewResult {
    const result: TemplatePreviewResult = {
      success: false,
      output: '',
      errors: [],
      usedVariables: [],
      unusedVariables: [],
    };

    try {
      // 编译模板
      const template = Handlebars.compile(content);
      
      // 渲染模板
      result.output = template(variables);
      result.success = true;

      // 分析变量使用情况
      const templateVars = this.extractVariables(content);
      const providedVars = Object.keys(variables);

      result.usedVariables = templateVars.filter(v => providedVars.includes(v));
      result.unusedVariables = providedVars.filter(v => !templateVars.includes(v));

      // 检查缺失的变量
      const missingVars = templateVars.filter(v => !providedVars.includes(v));
      if (missingVars.length > 0) {
        result.errors.push(`缺失变量: ${missingVars.join(', ')}`);
      }

    } catch (error) {
      result.errors.push(`模板渲染错误: ${error.message}`);
    }

    return result;
  }

  /**
   * 提取模板中的变量
   */
  private extractVariables(content: string): string[] {
    const variables = new Set<string>();
    
    // 匹配 {{variable}} 格式的变量
    const simpleVarRegex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s*\}\}/g;
    let match;
    
    while ((match = simpleVarRegex.exec(content)) !== null) {
      const varPath = match[1];
      const rootVar = varPath.split('.')[0];
      variables.add(rootVar);
    }

    // 匹配 {{#each items}} 格式的变量
    const eachRegex = /\{\{\s*#each\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s*\}\}/g;
    while ((match = eachRegex.exec(content)) !== null) {
      const varPath = match[1];
      const rootVar = varPath.split('.')[0];
      variables.add(rootVar);
    }

    // 匹配 {{#if condition}} 格式的变量
    const ifRegex = /\{\{\s*#if\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s*\}\}/g;
    while ((match = ifRegex.exec(content)) !== null) {
      const varPath = match[1];
      const rootVar = varPath.split('.')[0];
      variables.add(rootVar);
    }

    return Array.from(variables);
  }

  /**
   * 测试模板
   */
  testTemplate(content: string, testData: { variables: Record<string, any>; expectedOutput?: string }): any {
    const previewResult = this.previewTemplate(content, testData.variables);
    
    const testResult = {
      ...previewResult,
      testPassed: false,
      expectedOutput: testData.expectedOutput,
      actualOutput: previewResult.output,
    };

    if (testData.expectedOutput) {
      testResult.testPassed = previewResult.success && 
        previewResult.output.trim() === testData.expectedOutput.trim();
    } else {
      testResult.testPassed = previewResult.success;
    }

    return testResult;
  }
}
