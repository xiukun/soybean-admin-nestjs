import { Injectable, Logger } from '@nestjs/common';

/**
 * 增强的模板引擎服务
 * 支持复杂的模板语法和helper函数
 */
@Injectable()
export class EnhancedTemplateEngineService {
  private readonly logger = new Logger(EnhancedTemplateEngineService.name);

  /**
   * 渲染模板
   * @param template 模板字符串
   * @param variables 变量对象
   * @returns 渲染后的字符串
   */
  render(template: string, variables: Record<string, any>): string {
    try {
      // 注册helper函数
      const helpers = this.getHelpers();
      
      // 处理模板变量替换
      let result = template;
      
      // 处理简单变量替换 {{variableName}}
      result = this.processSimpleVariables(result, variables);
      
      // 处理helper函数 {{helperName variableName}}
      result = this.processHelperFunctions(result, variables, helpers);
      
      // 处理条件语句 {{#if condition}}...{{/if}}
      result = this.processConditionals(result, variables);
      
      // 处理循环语句 {{#each array}}...{{/each}}
      result = this.processLoops(result, variables);
      
      return result;
    } catch (error) {
      this.logger.error('Template rendering failed:', error);
      throw new Error(`Template rendering failed: ${error.message}`);
    }
  }

  /**
   * 验证模板语法
   * @param template 模板字符串
   * @returns 验证结果
   */
  validate(template: string): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 检查括号匹配
      const openBrackets = (template.match(/\{\{/g) || []).length;
      const closeBrackets = (template.match(/\}\}/g) || []).length;
      
      if (openBrackets !== closeBrackets) {
        errors.push('Mismatched template brackets');
      }

      // 检查条件语句匹配
      const ifStatements = (template.match(/\{\{#if\s+\w+\}\}/g) || []).length;
      const endIfStatements = (template.match(/\{\{\/if\}\}/g) || []).length;
      
      if (ifStatements !== endIfStatements) {
        errors.push('Mismatched if/endif statements');
      }

      // 检查循环语句匹配
      const eachStatements = (template.match(/\{\{#each\s+\w+\}\}/g) || []).length;
      const endEachStatements = (template.match(/\{\{\/each\}\}/g) || []).length;
      
      if (eachStatements !== endEachStatements) {
        errors.push('Mismatched each/endeach statements');
      }

      // 检查未知的helper函数
      const helperMatches = template.match(/\{\{(\w+)\s+\w+\}\}/g) || [];
      const knownHelpers = Object.keys(this.getHelpers());
      
      for (const match of helperMatches) {
        const helperName = match.match(/\{\{(\w+)\s+/)?.[1];
        if (helperName && !knownHelpers.includes(helperName) && !['if', 'each', 'unless'].includes(helperName)) {
          warnings.push(`Unknown helper function: ${helperName}`);
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
      return {
        isValid: false,
        errors,
        warnings
      };
    }
  }

  /**
   * 提取模板中使用的变量
   * @param template 模板字符串
   * @returns 变量名数组
   */
  extractVariables(template: string): string[] {
    const variables = new Set<string>();
    
    // 提取简单变量 {{variableName}}
    const simpleMatches = template.match(/\{\{(?!#|\/)\s*(\w+)\s*\}\}/g) || [];
    for (const match of simpleMatches) {
      const varName = match.match(/\{\{(?!#|\/)\s*(\w+)\s*\}\}/)?.[1];
      if (varName) {
        variables.add(varName);
      }
    }

    // 提取helper函数中的变量 {{helperName variableName}}
    const helperMatches = template.match(/\{\{(\w+)\s+(\w+)\}\}/g) || [];
    for (const match of helperMatches) {
      const varName = match.match(/\{\{(\w+)\s+(\w+)\}\}/)?.[2];
      if (varName) {
        variables.add(varName);
      }
    }

    // 提取条件语句中的变量 {{#if variableName}}
    const ifMatches = template.match(/\{\{#if\s+(\w+)\}\}/g) || [];
    for (const match of ifMatches) {
      const varName = match.match(/\{\{#if\s+(\w+)\}\}/)?.[1];
      if (varName) {
        variables.add(varName);
      }
    }

    // 提取循环语句中的变量 {{#each variableName}}
    const eachMatches = template.match(/\{\{#each\s+(\w+)\}\}/g) || [];
    for (const match of eachMatches) {
      const varName = match.match(/\{\{#each\s+(\w+)\}\}/)?.[1];
      if (varName) {
        variables.add(varName);
      }
    }

    return Array.from(variables);
  }

  /**
   * 处理简单变量替换
   */
  private processSimpleVariables(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(?!#|\/)\s*(\w+)\s*\}\}/g, (match, varName) => {
      return variables[varName] !== undefined ? String(variables[varName]) : match;
    });
  }

  /**
   * 处理helper函数
   */
  private processHelperFunctions(template: string, variables: Record<string, any>, helpers: Record<string, Function>): string {
    return template.replace(/\{\{(\w+)\s+(\w+)\}\}/g, (match, helperName, varName) => {
      if (helpers[helperName] && variables[varName] !== undefined) {
        return helpers[helperName](variables[varName]);
      }
      return match;
    });
  }

  /**
   * 处理条件语句
   */
  private processConditionals(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, varName, content) => {
      const value = variables[varName];
      return value ? content : '';
    });
  }

  /**
   * 处理循环语句
   */
  private processLoops(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, varName, content) => {
      const array = variables[varName];
      if (!Array.isArray(array)) {
        return '';
      }
      
      return array.map((item, index) => {
        let itemContent = content;
        // 替换循环项中的变量
        itemContent = itemContent.replace(/\{\{this\}\}/g, String(item));
        itemContent = itemContent.replace(/\{\{@index\}\}/g, String(index));
        
        // 如果item是对象，替换对象属性
        if (typeof item === 'object' && item !== null) {
          for (const [key, value] of Object.entries(item)) {
            itemContent = itemContent.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
          }
        }
        
        return itemContent;
      }).join('');
    });
  }

  /**
   * 获取helper函数
   */
  private getHelpers(): Record<string, Function> {
    return {
      // 转换为驼峰命名
      camelCase: (str: string) => {
        return str.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
      },
      
      // 转换为帕斯卡命名
      pascalCase: (str: string) => {
        const camelCase = str.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
        return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
      },
      
      // 转换为短横线命名
      kebabCase: (str: string) => {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2')
                  .replace(/[\s_]+/g, '-')
                  .toLowerCase();
      },
      
      // 转换为下划线命名
      snakeCase: (str: string) => {
        return str.replace(/([a-z])([A-Z])/g, '$1_$2')
                  .replace(/[\s-]+/g, '_')
                  .toLowerCase();
      },
      
      // 转换为大写
      upperCase: (str: string) => str.toUpperCase(),
      
      // 转换为小写
      lowerCase: (str: string) => str.toLowerCase(),
      
      // 首字母大写
      capitalize: (str: string) => str.charAt(0).toUpperCase() + str.slice(1),
      
      // 复数形式
      pluralize: (str: string) => {
        if (str.endsWith('y')) {
          return str.slice(0, -1) + 'ies';
        } else if (str.endsWith('s') || str.endsWith('sh') || str.endsWith('ch') || str.endsWith('x') || str.endsWith('z')) {
          return str + 'es';
        } else {
          return str + 's';
        }
      },
      
      // 单数形式
      singularize: (str: string) => {
        if (str.endsWith('ies')) {
          return str.slice(0, -3) + 'y';
        } else if (str.endsWith('es')) {
          return str.slice(0, -2);
        } else if (str.endsWith('s')) {
          return str.slice(0, -1);
        } else {
          return str;
        }
      }
    };
  }
}
