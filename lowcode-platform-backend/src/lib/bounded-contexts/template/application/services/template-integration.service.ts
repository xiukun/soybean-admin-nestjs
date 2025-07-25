import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { EnhancedTemplateEngineService } from '../../infrastructure/enhanced-template-engine.service';
import { CodeGenerationService, CodeGenerationRequest } from './code-generation.service';

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  variables?: string[];
  usedVariables?: string[];
  definedVariables?: string[];
}

export interface TemplatePreviewResult {
  success?: boolean;
  generatedCode: string;
  variables?: string[];
  usedVariables?: string[];
  variableValues?: Record<string, any>;
  templateInfo?: {
    variableCount: number;
    codeLength: number;
    lineCount: number;
  };
}

@Injectable()
export class TemplateIntegrationService {
  private readonly logger = new Logger(TemplateIntegrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly templateEngine: EnhancedTemplateEngineService,
    private readonly codeGenerationService: CodeGenerationService,
  ) {}

  /**
   * 验证模板语法和变量
   */
  async validateTemplate(templateId: string, variables?: Record<string, any>): Promise<TemplateValidationResult> {
    try {
      const template = await this.prisma.codeTemplate.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        throw new BadRequestException('Template not found');
      }

      // 使用增强的模板引擎进行验证
      const validation = this.templateEngine.validate(template.template);
      const templateVariables = this.templateEngine.extractVariables(template.template);

      const warnings = [...validation.warnings];

      if (variables) {
        // 检查必需的变量是否提供
        for (const variable of templateVariables) {
          if (variables[variable] === undefined) {
            warnings.push(`Variable '${variable}' is used in template but not provided`);
          }
        }
      }

      return {
        isValid: validation.isValid,
        errors: validation.errors,
        warnings,
        variables: templateVariables,
      };
    } catch (error) {
      this.logger.error(`Template validation failed for ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * 预览模板生成的代码
   */
  async previewTemplate(
    templateId: string, 
    entityId?: string, 
    customVariables?: Record<string, any>
  ): Promise<TemplatePreviewResult> {
    try {
      const template = await this.prisma.codeTemplate.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        throw new BadRequestException('Template not found');
      }

      // 获取实体数据（如果提供）
      let entityData = null;
      if (entityId) {
        entityData = await this.prisma.entity.findUnique({
          where: { id: entityId },
          include: {
            fields: true
          }
        });
      }

      // 准备变量
      const variables = { ...customVariables };

      if (entityData) {
        variables.entityName = entityData.name;
        variables.entityDescription = entityData.description;
        variables.fields = entityData.fields;
      }

      // 使用增强的模板引擎渲染
      const generatedCode = this.templateEngine.render(template.template, variables);
      const templateVariables = this.templateEngine.extractVariables(template.template);

      return {
        success: true,
        generatedCode,
        variables: templateVariables,
        usedVariables: Object.keys(variables),
      };
    } catch (error) {
      this.logger.error(`Template preview failed for ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * 生成完整的业务代码
   */
  async generateBusinessCode(request: CodeGenerationRequest) {
    return this.codeGenerationService.generateCode(request);
  }

  /**
   * 测试模板编译
   */
  async testTemplate(templateId: string, testData?: Record<string, any>): Promise<{
    success: boolean;
    compiledContent?: string;
    errors?: string[];
    executionTime: number;
  }> {
    const startTime = Date.now();
    
    try {
      const template = await this.prisma.codeTemplate.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        throw new BadRequestException('Template not found');
      }

      // 准备测试数据
      const variables = template.variables as any[];
      const templateData = { ...testData };

      // 为未提供的变量设置默认值
      for (const variable of variables) {
        if (!(variable.name in templateData)) {
          templateData[variable.name] = this.getDefaultValueByType(variable.type);
        }
      }

      // 编译模板
      const compiledContent = this.simpleTemplateReplace(template.template, templateData);

      return {
        success: true,
        compiledContent,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        errors: [error.message],
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * 获取项目的可用模板
   */
  async getProjectTemplates(projectId: string, filters?: {
    category?: string;
    language?: string;
    framework?: string;
    status?: string;
  }): Promise<any[]> {
    const where: any = {
      projectId,
      status: 'PUBLISHED'
    };

    if (filters?.category) {
      where.category = filters.category;
    }
    if (filters?.language) {
      where.language = filters.language;
    }
    if (filters?.framework) {
      where.framework = filters.framework;
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    return this.prisma.codeTemplate.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' }
      ]
    });
  }

  /**
   * 更新模板使用统计
   */
  async incrementTemplateUsage(templateId: string): Promise<void> {
    try {
      await this.prisma.codeTemplate.update({
        where: { id: templateId },
        data: {
          updatedAt: new Date()
        }
      });
    } catch (error) {
      this.logger.warn(`Failed to update template usage for ${templateId}:`, error);
    }
  }

  /**
   * 验证模板内容
   */
  private validateTemplateContent(template: string, variables: any[]): TemplateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const usedVariables = new Set<string>();
    const definedVariables = new Set(variables.map(v => v.name));

    try {
      // 1. 检查模板语法 - 使用正则表达式检查Handlebars语法
      const variablePattern = /\{\{([^}]+)\}\}/g;
      let match: RegExpExecArray | null;

      while ((match = variablePattern.exec(template)) !== null) {
        const variableExpression = match[1].trim();
        
        // 解析变量表达式（可能包含helper函数）
        const variableName = this.extractVariableName(variableExpression);
        if (variableName) {
          usedVariables.add(variableName);

          // 检查变量是否已定义
          if (!definedVariables.has(variableName) && !this.isBuiltinHelper(variableName)) {
            errors.push(`Undefined variable: ${variableName}`);
          }
        }
      }

      // 2. 检查未使用的变量
      for (const definedVar of definedVariables) {
        if (!usedVariables.has(definedVar)) {
          warnings.push(`Unused variable: ${definedVar}`);
        }
      }

      // 3. 检查基本语法错误
      const bracePattern = /\{\{|\}\}/g;
      const braces = template.match(bracePattern) || [];
      if (braces.length % 2 !== 0) {
        errors.push('Unmatched template braces');
      }

      // 4. 检查变量定义
      for (const variable of variables) {
        if (!variable.name || !variable.type) {
          errors.push(`Invalid variable definition: ${JSON.stringify(variable)}`);
        }
      }

      // 5. 尝试编译模板以检查语法
      try {
        const testData: Record<string, any> = {};
        for (const variable of variables) {
          testData[variable.name] = this.getDefaultValueByType(variable.type);
        }
        this.simpleTemplateReplace(template, testData);
      } catch (compileError) {
        errors.push(`Template compilation error: ${compileError.message}`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        usedVariables: Array.from(usedVariables),
        definedVariables: Array.from(definedVariables)
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Template validation error: ${error.message}`],
        warnings,
        usedVariables: Array.from(usedVariables),
        definedVariables: Array.from(definedVariables)
      };
    }
  }

  /**
   * 生成代码预览
   */
  private generatePreview(
    template: string,
    variables: any[],
    entityData: any,
    customVariables: Record<string, any>
  ): TemplatePreviewResult {
    try {
      const variableValues: Record<string, any> = { ...customVariables };

      // 1. 从实体数据中提取变量值
      if (entityData) {
        variableValues.entityName = entityData.name;
        variableValues.entityCode = entityData.code;
        variableValues.tableName = entityData.tableName;
        variableValues.entityDescription = entityData.description;
        variableValues.fields = entityData.fields || [];

        // 生成字段相关的变量
        if (entityData.fields && entityData.fields.length > 0) {
          variableValues.fieldList = entityData.fields.map((field: any) => ({
            name: field.name,
            code: field.code,
            type: field.type,
            description: field.description,
            nullable: field.nullable,
            primaryKey: field.primaryKey,
            defaultValue: field.defaultValue
          }));
        }
      }

      // 2. 设置默认变量值
      for (const variable of variables) {
        if (!(variable.name in variableValues)) {
          variableValues[variable.name] = variable.defaultValue || this.getDefaultValueByType(variable.type);
        }
      }

      // 3. 生成代码
      const generatedCode = this.simpleTemplateReplace(template, variableValues);

      return {
        generatedCode,
        variableValues,
        templateInfo: {
          variableCount: variables.length,
          codeLength: generatedCode.length,
          lineCount: generatedCode.split('\n').length
        }
      };
    } catch (error) {
      throw new Error(`Code generation failed: ${error.message}`);
    }
  }

  /**
   * 提取变量名（去除helper函数）
   */
  private extractVariableName(expression: string): string | null {
    // 简单的变量名提取，支持基本的helper语法
    const parts = expression.split(/\s+/);
    const firstPart = parts[0];

    // 如果是helper函数，返回第二个参数作为变量名
    if (this.isBuiltinHelper(firstPart) && parts.length > 1) {
      return parts[1];
    }

    // 否则返回第一个部分作为变量名
    return firstPart;
  }

  /**
   * 检查是否是内置helper函数
   */
  private isBuiltinHelper(name: string): boolean {
    const builtinHelpers = [
      'if', 'unless', 'each', 'with', 'lookup', 'log',
      'pascalCase', 'camelCase', 'snakeCase', 'kebabCase',
      'upperCase', 'lowerCase', 'capitalize', 'pluralize',
      'eq', 'ne', 'lt', 'gt', 'lte', 'gte', 'and', 'or',
      'not', 'includes', 'startsWith', 'endsWith'
    ];
    return builtinHelpers.includes(name);
  }

  /**
   * 根据类型获取默认值
   */
  private getDefaultValueByType(type: string): any {
    switch (type.toLowerCase()) {
      case 'string':
        return 'DefaultString';
      case 'number':
      case 'integer':
        return 0;
      case 'boolean':
        return false;
      case 'array':
        return [];
      case 'object':
        return {};
      case 'date':
        return new Date().toISOString();
      default:
        return 'DefaultValue';
    }
  }

  /**
   * 简单的模板替换（后备方案）
   */
  private simpleTemplateReplace(template: string, variables: Record<string, any>): string {
    let result = template;

    // 替换简单的变量 {{variableName}}
    const variablePattern = /\{\{([^}]+)\}\}/g;
    result = result.replace(variablePattern, (match, variableName) => {
      const trimmedName = variableName.trim();
      if (trimmedName in variables) {
        const value = variables[trimmedName];
        return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
      }
      return match; // 保持原样如果变量未定义
    });

    return result;
  }
}
