import { Injectable, Logger } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import { TemplateEngine } from './template-engine.service';

/**
 * 模板验证结果
 */
export interface TemplateValidationResult {
  /** 是否有效 */
  isValid: boolean;
  /** 错误信息 */
  errors: TemplateValidationError[];
  /** 警告信息 */
  warnings: TemplateValidationWarning[];
  /** 使用的变量 */
  variables: string[];
  /** 使用的helper函数 */
  helpers: string[];
  /** 语法分析结果 */
  syntaxAnalysis: TemplateSyntaxAnalysis;
}

/**
 * 模板验证错误
 */
export interface TemplateValidationError {
  /** 错误类型 */
  type: 'syntax' | 'variable' | 'helper' | 'logic' | 'security';
  /** 错误消息 */
  message: string;
  /** 错误位置 */
  location?: {
    line: number;
    column: number;
    length?: number;
  };
  /** 错误代码 */
  code: string;
  /** 修复建议 */
  suggestion?: string;
}

/**
 * 模板验证警告
 */
export interface TemplateValidationWarning {
  /** 警告类型 */
  type: 'performance' | 'best-practice' | 'deprecated' | 'unused';
  /** 警告消息 */
  message: string;
  /** 警告位置 */
  location?: {
    line: number;
    column: number;
  };
  /** 警告代码 */
  code: string;
  /** 改进建议 */
  suggestion?: string;
}

/**
 * 模板语法分析结果
 */
export interface TemplateSyntaxAnalysis {
  /** 总行数 */
  totalLines: number;
  /** 模板块数量 */
  blockCount: number;
  /** 表达式数量 */
  expressionCount: number;
  /** 复杂度评分 */
  complexityScore: number;
  /** 性能评估 */
  performanceRating: 'excellent' | 'good' | 'fair' | 'poor';
}

/**
 * 模板测试用例
 */
export interface TemplateTestCase {
  /** 测试名称 */
  name: string;
  /** 测试描述 */
  description?: string;
  /** 输入数据 */
  input: Record<string, any>;
  /** 期望输出 */
  expectedOutput?: string;
  /** 期望包含的内容 */
  expectedContains?: string[];
  /** 期望不包含的内容 */
  expectedNotContains?: string[];
  /** 是否应该失败 */
  shouldFail?: boolean;
}

/**
 * 模板测试结果
 */
export interface TemplateTestResult {
  /** 测试用例名称 */
  testName: string;
  /** 是否通过 */
  passed: boolean;
  /** 实际输出 */
  actualOutput?: string;
  /** 错误信息 */
  error?: string;
  /** 执行时间（毫秒） */
  executionTime: number;
}

/**
 * 模板验证服务
 */
@Injectable()
export class TemplateValidationService {
  private readonly logger = new Logger(TemplateValidationService.name);

  constructor(private readonly templateEngine: TemplateEngine) {}

  /**
   * 验证模板
   */
  async validateTemplate(
    templateContent: string,
    templateType?: string
  ): Promise<TemplateValidationResult> {
    const result: TemplateValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      variables: [],
      helpers: [],
      syntaxAnalysis: {
        totalLines: 0,
        blockCount: 0,
        expressionCount: 0,
        complexityScore: 0,
        performanceRating: 'excellent'
      }
    };

    try {
      // 1. 语法验证
      await this.validateSyntax(templateContent, result);

      // 2. 变量分析
      this.analyzeVariables(templateContent, result);

      // 3. Helper函数分析
      this.analyzeHelpers(templateContent, result);

      // 4. 安全性检查
      this.validateSecurity(templateContent, result);

      // 5. 性能分析
      this.analyzePerformance(templateContent, result);

      // 6. 最佳实践检查
      this.checkBestPractices(templateContent, result, templateType);

      // 7. 语法分析
      this.performSyntaxAnalysis(templateContent, result);

      // 设置整体验证结果
      result.isValid = result.errors.length === 0;

    } catch (error) {
      this.logger.error('模板验证失败:', error);
      result.isValid = false;
      result.errors.push({
        type: 'syntax',
        message: `模板验证过程中发生错误: ${error.message}`,
        code: 'VALIDATION_ERROR'
      });
    }

    return result;
  }

  /**
   * 测试模板
   */
  async testTemplate(
    templateContent: string,
    testCases: TemplateTestCase[]
  ): Promise<TemplateTestResult[]> {
    const results: TemplateTestResult[] = [];

    for (const testCase of testCases) {
      const startTime = Date.now();
      const result: TemplateTestResult = {
        testName: testCase.name,
        passed: false,
        executionTime: 0
      };

      try {
        // 渲染模板
        const output = await this.templateEngine.render(templateContent, testCase.input);
        result.actualOutput = output;

        // 检查测试结果
        let passed = true;

        // 检查期望输出
        if (testCase.expectedOutput !== undefined) {
          passed = passed && output.trim() === testCase.expectedOutput.trim();
        }

        // 检查期望包含的内容
        if (testCase.expectedContains) {
          for (const content of testCase.expectedContains) {
            passed = passed && output.includes(content);
          }
        }

        // 检查期望不包含的内容
        if (testCase.expectedNotContains) {
          for (const content of testCase.expectedNotContains) {
            passed = passed && !output.includes(content);
          }
        }

        // 如果期望失败但实际成功，则测试失败
        if (testCase.shouldFail) {
          passed = false;
          result.error = '期望模板渲染失败，但实际成功了';
        }

        result.passed = passed;

      } catch (error) {
        // 如果期望失败且实际失败，则测试通过
        if (testCase.shouldFail) {
          result.passed = true;
        } else {
          result.passed = false;
          result.error = error.message;
        }
      }

      result.executionTime = Date.now() - startTime;
      results.push(result);
    }

    return results;
  }

  /**
   * 语法验证
   */
  private async validateSyntax(
    templateContent: string,
    result: TemplateValidationResult
  ): Promise<void> {
    try {
      // 尝试编译模板
      Handlebars.compile(templateContent);
    } catch (error) {
      const location = this.parseHandlebarsError(error.message);
      result.errors.push({
        type: 'syntax',
        message: `语法错误: ${error.message}`,
        location,
        code: 'SYNTAX_ERROR',
        suggestion: '请检查模板语法，确保所有的Handlebars表达式都正确闭合'
      });
    }
  }

  /**
   * 变量分析
   */
  private analyzeVariables(
    templateContent: string,
    result: TemplateValidationResult
  ): void {
    // 匹配Handlebars变量表达式
    const variableRegex = /\{\{\{?([^}]+)\}?\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = variableRegex.exec(templateContent)) !== null) {
      const expression = match[1].trim();
      
      // 解析变量名（去除helper函数和操作符）
      const variableName = this.extractVariableName(expression);
      if (variableName) {
        variables.add(variableName);
      }
    }

    result.variables = Array.from(variables);
  }

  /**
   * Helper函数分析
   */
  private analyzeHelpers(
    templateContent: string,
    result: TemplateValidationResult
  ): void {
    // 匹配helper函数调用
    const helperRegex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s+/g;
    const helpers = new Set<string>();
    let match;

    while ((match = helperRegex.exec(templateContent)) !== null) {
      const helperName = match[1];
      
      // 排除内置的控制结构
      if (!['if', 'unless', 'each', 'with', 'lookup', 'log'].includes(helperName)) {
        helpers.add(helperName);
        
        // 检查helper是否已注册
        if (!Handlebars.helpers[helperName]) {
          result.warnings.push({
            type: 'best-practice',
            message: `使用了未注册的helper函数: ${helperName}`,
            code: 'UNREGISTERED_HELPER',
            suggestion: `请确保helper函数 '${helperName}' 已正确注册`
          });
        }
      }
    }

    result.helpers = Array.from(helpers);
  }

  /**
   * 安全性检查
   */
  private validateSecurity(
    templateContent: string,
    result: TemplateValidationResult
  ): void {
    // 检查潜在的安全风险
    const securityPatterns = [
      {
        pattern: /\{\{\{[^}]*<script/i,
        message: '检测到潜在的XSS风险：模板中包含script标签',
        code: 'XSS_RISK'
      },
      {
        pattern: /\{\{\{[^}]*javascript:/i,
        message: '检测到潜在的XSS风险：模板中包含javascript协议',
        code: 'JAVASCRIPT_PROTOCOL'
      },
      {
        pattern: /\{\{\{[^}]*eval\s*\(/i,
        message: '检测到潜在的代码注入风险：模板中包含eval函数',
        code: 'CODE_INJECTION'
      }
    ];

    for (const { pattern, message, code } of securityPatterns) {
      if (pattern.test(templateContent)) {
        result.errors.push({
          type: 'security',
          message,
          code,
          suggestion: '请避免在模板中使用可能导致安全风险的代码'
        });
      }
    }
  }

  /**
   * 性能分析
   */
  private analyzePerformance(
    templateContent: string,
    result: TemplateValidationResult
  ): void {
    // 检查可能影响性能的模式
    const performancePatterns = [
      {
        pattern: /\{\{#each\s+[^}]*\}\}[\s\S]*?\{\{#each/g,
        message: '检测到嵌套循环，可能影响性能',
        code: 'NESTED_LOOPS'
      },
      {
        pattern: /\{\{[^}]*\.[^}]*\.[^}]*\.[^}]*\}/g,
        message: '检测到深层属性访问，可能影响性能',
        code: 'DEEP_PROPERTY_ACCESS'
      }
    ];

    for (const { pattern, message, code } of performancePatterns) {
      const matches = templateContent.match(pattern);
      if (matches && matches.length > 0) {
        result.warnings.push({
          type: 'performance',
          message: `${message} (发现 ${matches.length} 处)`,
          code,
          suggestion: '考虑优化模板结构以提高渲染性能'
        });
      }
    }
  }

  /**
   * 最佳实践检查
   */
  private checkBestPractices(
    templateContent: string,
    result: TemplateValidationResult,
    templateType?: string
  ): void {
    // 检查是否使用了推荐的模式
    const lines = templateContent.split('\n');
    
    // 检查注释
    const hasComments = /\{\{!/.test(templateContent);
    if (!hasComments && lines.length > 20) {
      result.warnings.push({
        type: 'best-practice',
        message: '建议在复杂模板中添加注释以提高可维护性',
        code: 'MISSING_COMMENTS',
        suggestion: '使用 {{! 注释内容 }} 添加模板注释'
      });
    }

    // 检查模板长度
    if (lines.length > 100) {
      result.warnings.push({
        type: 'best-practice',
        message: '模板过长，建议拆分为多个子模板',
        code: 'TEMPLATE_TOO_LONG',
        suggestion: '考虑使用partial模板来拆分复杂的模板'
      });
    }
  }

  /**
   * 语法分析
   */
  private performSyntaxAnalysis(
    templateContent: string,
    result: TemplateValidationResult
  ): void {
    const lines = templateContent.split('\n');
    const blockRegex = /\{\{#[^}]+\}\}/g;
    const expressionRegex = /\{\{[^}]+\}\}/g;

    const blockMatches = templateContent.match(blockRegex) || [];
    const expressionMatches = templateContent.match(expressionRegex) || [];

    // 计算复杂度评分
    let complexityScore = 0;
    complexityScore += blockMatches.length * 2; // 块结构权重更高
    complexityScore += expressionMatches.length;
    complexityScore += (templateContent.match(/\{\{#each/g) || []).length * 3; // 循环权重最高

    // 性能评级
    let performanceRating: TemplateSyntaxAnalysis['performanceRating'] = 'excellent';
    if (complexityScore > 50) performanceRating = 'poor';
    else if (complexityScore > 30) performanceRating = 'fair';
    else if (complexityScore > 15) performanceRating = 'good';

    result.syntaxAnalysis = {
      totalLines: lines.length,
      blockCount: blockMatches.length,
      expressionCount: expressionMatches.length,
      complexityScore,
      performanceRating
    };
  }

  /**
   * 解析Handlebars错误信息中的位置
   */
  private parseHandlebarsError(errorMessage: string): { line: number; column: number } | undefined {
    const match = errorMessage.match(/line (\d+), column (\d+)/);
    if (match) {
      return {
        line: parseInt(match[1], 10),
        column: parseInt(match[2], 10)
      };
    }
    return undefined;
  }

  /**
   * 从表达式中提取变量名
   */
  private extractVariableName(expression: string): string | null {
    // 移除helper函数调用
    const parts = expression.split(/\s+/);
    const firstPart = parts[0];

    // 如果是简单变量引用
    if (!/[(){}]/.test(firstPart)) {
      return firstPart.split('.')[0]; // 取根变量名
    }

    return null;
  }

  /**
   * 生成默认测试用例
   */
  generateDefaultTestCases(variables: string[]): TemplateTestCase[] {
    const testCases: TemplateTestCase[] = [];

    // 基础测试用例
    testCases.push({
      name: '基础渲染测试',
      description: '测试模板是否能正常渲染',
      input: this.generateTestData(variables)
    });

    // 空数据测试
    testCases.push({
      name: '空数据测试',
      description: '测试模板处理空数据的能力',
      input: {}
    });

    // 边界值测试
    testCases.push({
      name: '边界值测试',
      description: '测试模板处理边界值的能力',
      input: this.generateBoundaryTestData(variables)
    });

    return testCases;
  }

  /**
   * 生成测试数据
   */
  private generateTestData(variables: string[]): Record<string, any> {
    const data: Record<string, any> = {};

    for (const variable of variables) {
      // 根据变量名生成合适的测试数据
      if (variable.toLowerCase().includes('name')) {
        data[variable] = 'TestName';
      } else if (variable.toLowerCase().includes('id')) {
        data[variable] = '123';
      } else if (variable.toLowerCase().includes('date')) {
        data[variable] = new Date().toISOString();
      } else if (variable.toLowerCase().includes('list') || variable.toLowerCase().includes('items')) {
        data[variable] = ['item1', 'item2', 'item3'];
      } else {
        data[variable] = 'test_value';
      }
    }

    return data;
  }

  /**
   * 生成边界值测试数据
   */
  private generateBoundaryTestData(variables: string[]): Record<string, any> {
    const data: Record<string, any> = {};

    for (const variable of variables) {
      // 生成边界值数据
      if (variable.toLowerCase().includes('list') || variable.toLowerCase().includes('items')) {
        data[variable] = []; // 空数组
      } else {
        data[variable] = null; // null值
      }
    }

    return data;
  }
}
