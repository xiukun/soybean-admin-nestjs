import { Injectable, Logger } from '@nestjs/common';
import * as Handlebars from 'handlebars';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
}

export interface ValidationError {
  type: 'syntax' | 'variable' | 'helper' | 'logic' | 'security';
  message: string;
  line?: number;
  column?: number;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  type: 'performance' | 'best_practice' | 'compatibility';
  message: string;
  line?: number;
  suggestion?: string;
}

export interface ValidationSuggestion {
  type: 'optimization' | 'improvement' | 'alternative';
  message: string;
  example?: string;
}

export interface TemplateVariable {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: any;
}

@Injectable()
export class TemplateValidationService {
  private readonly logger = new Logger(TemplateValidationService.name);

  // 支持的Handlebars助手函数
  private readonly supportedHelpers = [
    'if', 'unless', 'each', 'with', 'lookup', 'log',
    // 自定义助手
    'pascalCase', 'camelCase', 'kebabCase', 'snakeCase',
    'upperCase', 'lowerCase', 'pluralize', 'singularize',
    'mapTypeToTS', 'mapTypeToPrisma', 'mapTypeToSQL',
    'formatComment', 'indent', 'join'
  ];

  // 危险的表达式模式
  private readonly dangerousPatterns = [
    /eval\s*\(/i,
    /function\s*\(/i,
    /new\s+Function/i,
    /setTimeout/i,
    /setInterval/i,
    /require\s*\(/i,
    /import\s*\(/i,
    /process\./i,
    /global\./i,
    /window\./i,
    /__proto__/i,
    /constructor/i,
  ];

  /**
   * 验证模板语法和内容
   */
  async validateTemplate(
    templateContent: string,
    variables: TemplateVariable[] = [],
    options?: {
      strict?: boolean;
      checkSecurity?: boolean;
      checkPerformance?: boolean;
    }
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };

    try {
      // 1. 语法验证
      await this.validateSyntax(templateContent, result);

      // 2. 变量验证
      await this.validateVariables(templateContent, variables, result);

      // 3. 助手函数验证
      await this.validateHelpers(templateContent, result);

      // 4. 安全性检查
      if (options?.checkSecurity !== false) {
        await this.validateSecurity(templateContent, result);
      }

      // 5. 性能检查
      if (options?.checkPerformance) {
        await this.validatePerformance(templateContent, result);
      }

      // 6. 最佳实践检查
      await this.validateBestPractices(templateContent, result);

      // 设置整体验证结果
      result.isValid = result.errors.filter(e => e.severity === 'error').length === 0;

    } catch (error) {
      this.logger.error('Template validation failed', error.stack);
      result.isValid = false;
      result.errors.push({
        type: 'syntax',
        message: `Validation failed: ${error.message}`,
        severity: 'error',
      });
    }

    return result;
  }

  /**
   * 验证模板语法
   */
  private async validateSyntax(templateContent: string, result: ValidationResult): Promise<void> {
    try {
      // 尝试编译模板
      Handlebars.compile(templateContent);
    } catch (error) {
      result.errors.push({
        type: 'syntax',
        message: `Syntax error: ${error.message}`,
        severity: 'error',
      });
    }

    // 检查括号匹配
    const openBraces = (templateContent.match(/\{\{/g) || []).length;
    const closeBraces = (templateContent.match(/\}\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      result.errors.push({
        type: 'syntax',
        message: `Mismatched braces: ${openBraces} opening braces, ${closeBraces} closing braces`,
        severity: 'error',
      });
    }

    // 检查嵌套块的匹配
    this.validateBlockNesting(templateContent, result);
  }

  /**
   * 验证变量使用
   */
  private async validateVariables(
    templateContent: string,
    variables: TemplateVariable[],
    result: ValidationResult
  ): Promise<void> {
    // 提取模板中使用的变量
    const usedVariables = this.extractUsedVariables(templateContent);
    const definedVariables = new Set(variables.map(v => v.name));

    // 检查未定义的变量
    usedVariables.forEach(variable => {
      if (!definedVariables.has(variable) && !this.isBuiltinVariable(variable)) {
        result.errors.push({
          type: 'variable',
          message: `Undefined variable: ${variable}`,
          severity: 'error',
        });
      }
    });

    // 检查未使用的必需变量
    variables.forEach(variable => {
      if (variable.required && !usedVariables.has(variable.name)) {
        result.warnings.push({
          type: 'best_practice',
          message: `Required variable '${variable.name}' is not used in template`,
          suggestion: `Consider removing the variable or using it in the template`,
        });
      }
    });
  }

  /**
   * 验证助手函数
   */
  private async validateHelpers(templateContent: string, result: ValidationResult): Promise<void> {
    const helperPattern = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s+/g;
    let match;

    while ((match = helperPattern.exec(templateContent)) !== null) {
      const helperName = match[1];
      
      if (!this.supportedHelpers.includes(helperName) && !this.isBuiltinHelper(helperName)) {
        result.errors.push({
          type: 'helper',
          message: `Unknown helper function: ${helperName}`,
          severity: 'error',
        });
      }
    }
  }

  /**
   * 验证安全性
   */
  private async validateSecurity(templateContent: string, result: ValidationResult): Promise<void> {
    // 检查危险模式
    this.dangerousPatterns.forEach(pattern => {
      if (pattern.test(templateContent)) {
        result.errors.push({
          type: 'security',
          message: `Potentially dangerous expression detected: ${pattern.source}`,
          severity: 'error',
        });
      }
    });

    // 检查脚本注入
    if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(templateContent)) {
      result.errors.push({
        type: 'security',
        message: 'Script tags detected in template',
        severity: 'error',
      });
    }

    // 检查HTML注入风险
    if (/\{\{\{.*\}\}\}/g.test(templateContent)) {
      result.warnings.push({
        type: 'best_practice',
        message: 'Triple braces detected - ensure content is properly sanitized',
        suggestion: 'Use double braces for automatic HTML escaping',
      });
    }
  }

  /**
   * 验证性能
   */
  private async validatePerformance(templateContent: string, result: ValidationResult): Promise<void> {
    // 检查深度嵌套
    const maxNestingDepth = this.calculateMaxNestingDepth(templateContent);
    if (maxNestingDepth > 5) {
      result.warnings.push({
        type: 'performance',
        message: `Deep nesting detected (depth: ${maxNestingDepth})`,
        suggestion: 'Consider breaking down complex templates into smaller partials',
      });
    }

    // 检查大型循环
    const eachBlocks = templateContent.match(/\{\{\s*#each\s+\w+\s*\}\}/g) || [];
    if (eachBlocks.length > 3) {
      result.warnings.push({
        type: 'performance',
        message: `Multiple loops detected (${eachBlocks.length})`,
        suggestion: 'Consider optimizing data structure or using partials',
      });
    }
  }

  /**
   * 验证最佳实践
   */
  private async validateBestPractices(templateContent: string, result: ValidationResult): Promise<void> {
    // 检查注释
    if (!templateContent.includes('{{!')) {
      result.suggestions.push({
        type: 'improvement',
        message: 'Consider adding comments to explain complex template logic',
        example: '{{! This is a comment }}',
      });
    }

    // 检查空白处理
    if (templateContent.includes('{{~') || templateContent.includes('~}}')) {
      result.suggestions.push({
        type: 'optimization',
        message: 'Whitespace control is being used - ensure it\'s necessary',
      });
    }

    // 检查模板长度
    const lineCount = templateContent.split('\n').length;
    if (lineCount > 100) {
      result.suggestions.push({
        type: 'improvement',
        message: `Template is quite long (${lineCount} lines)`,
        example: 'Consider breaking it into smaller partials using {{> partial}}',
      });
    }
  }

  /**
   * 验证块嵌套
   */
  private validateBlockNesting(templateContent: string, result: ValidationResult): void {
    const blockPattern = /\{\{\s*(#|\/)\s*(\w+)/g;
    const stack: string[] = [];
    let match;

    while ((match = blockPattern.exec(templateContent)) !== null) {
      const [, prefix, blockName] = match;
      
      if (prefix === '#') {
        stack.push(blockName);
      } else if (prefix === '/') {
        const expected = stack.pop();
        if (expected !== blockName) {
          result.errors.push({
            type: 'syntax',
            message: `Mismatched block: expected {{/${expected}}}, found {{/${blockName}}}`,
            severity: 'error',
          });
        }
      }
    }

    if (stack.length > 0) {
      result.errors.push({
        type: 'syntax',
        message: `Unclosed blocks: ${stack.join(', ')}`,
        severity: 'error',
      });
    }
  }

  /**
   * 提取模板中使用的变量
   */
  private extractUsedVariables(templateContent: string): Set<string> {
    const variables = new Set<string>();
    const variablePattern = /\{\{\s*(?:[#\/]?\s*)?([a-zA-Z_][a-zA-Z0-9_.]*)/g;
    let match;

    while ((match = variablePattern.exec(templateContent)) !== null) {
      const variable = match[1].split('.')[0]; // 只取根变量名
      if (!this.isBuiltinHelper(variable)) {
        variables.add(variable);
      }
    }

    return variables;
  }

  /**
   * 检查是否为内置变量
   */
  private isBuiltinVariable(variable: string): boolean {
    const builtinVariables = ['this', '@index', '@key', '@first', '@last', '@root'];
    return builtinVariables.includes(variable);
  }

  /**
   * 检查是否为内置助手函数
   */
  private isBuiltinHelper(helper: string): boolean {
    const builtinHelpers = ['if', 'unless', 'each', 'with', 'lookup', 'log'];
    return builtinHelpers.includes(helper);
  }

  /**
   * 计算最大嵌套深度
   */
  private calculateMaxNestingDepth(templateContent: string): number {
    const blockPattern = /\{\{\s*(#|\/)\s*\w+/g;
    let currentDepth = 0;
    let maxDepth = 0;
    let match;

    while ((match = blockPattern.exec(templateContent)) !== null) {
      const [, prefix] = match;
      
      if (prefix === '#') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (prefix === '/') {
        currentDepth--;
      }
    }

    return maxDepth;
  }

  /**
   * 获取模板复杂度评分
   */
  getComplexityScore(templateContent: string): {
    score: number;
    factors: Array<{ factor: string; impact: number; description: string }>;
  } {
    const factors: Array<{ factor: string; impact: number; description: string }> = [];
    let score = 0;

    // 行数影响
    const lineCount = templateContent.split('\n').length;
    const lineImpact = Math.min(lineCount / 10, 5);
    factors.push({
      factor: 'Line Count',
      impact: lineImpact,
      description: `${lineCount} lines`,
    });
    score += lineImpact;

    // 嵌套深度影响
    const nestingDepth = this.calculateMaxNestingDepth(templateContent);
    const nestingImpact = nestingDepth * 2;
    factors.push({
      factor: 'Nesting Depth',
      impact: nestingImpact,
      description: `Maximum depth: ${nestingDepth}`,
    });
    score += nestingImpact;

    // 循环数量影响
    const loopCount = (templateContent.match(/\{\{\s*#each/g) || []).length;
    const loopImpact = loopCount * 1.5;
    factors.push({
      factor: 'Loop Count',
      impact: loopImpact,
      description: `${loopCount} loops`,
    });
    score += loopImpact;

    // 条件数量影响
    const conditionCount = (templateContent.match(/\{\{\s*#if/g) || []).length;
    const conditionImpact = conditionCount * 1;
    factors.push({
      factor: 'Condition Count',
      impact: conditionImpact,
      description: `${conditionCount} conditions`,
    });
    score += conditionImpact;

    return { score: Math.round(score * 10) / 10, factors };
  }
}
