/*
 * @Description: 模板预览查询处理器
 * @Autor: henry.xiukun
 * @Date: 2025-07-25 21:40:00
 * @LastEditors: henry.xiukun
 */

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { TemplatePreviewService } from '../services/template-preview.service';
import {
  PreviewTemplateQuery,
  ValidateTemplateQuery,
  TestTemplateQuery,
} from '../queries/template-preview.query';

@Injectable()
@QueryHandler(PreviewTemplateQuery)
export class PreviewTemplateHandler implements IQueryHandler<PreviewTemplateQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly templatePreviewService: TemplatePreviewService,
  ) {}

  async execute(query: PreviewTemplateQuery) {
    const { templateId, variables = {} } = query;

    // 获取模板
    const template = await (this.prisma as any).codeTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException(`Template with id '${templateId}' not found`);
    }

    // 解析模板变量
    let templateVariables = [];
    try {
      templateVariables = typeof template.variables === 'string' 
        ? JSON.parse(template.variables) 
        : template.variables || [];
    } catch (error) {
      templateVariables = [];
    }

    // 预览模板
    const previewResult = this.templatePreviewService.previewTemplate(
      template.content,
      variables,
    );

    return {
      template: {
        id: template.id,
        name: template.name,
        content: template.content,
        variables: templateVariables,
      },
      preview: previewResult,
      metadata: {
        templateVariables: templateVariables.map((v: any) => v.name),
        providedVariables: Object.keys(variables),
        extractedVariables: this.templatePreviewService['extractVariables'](template.content),
      },
    };
  }
}

@Injectable()
@QueryHandler(ValidateTemplateQuery)
export class ValidateTemplateHandler implements IQueryHandler<ValidateTemplateQuery> {
  constructor(private readonly templatePreviewService: TemplatePreviewService) {}

  async execute(query: ValidateTemplateQuery) {
    const { content, variables = [] } = query;

    const validationResult = this.templatePreviewService.validateTemplate(content, variables);

    return {
      validation: validationResult,
      extractedVariables: this.templatePreviewService['extractVariables'](content),
      suggestions: this.generateSuggestions(content, variables),
    };
  }

  private generateSuggestions(content: string, variables: any[]): string[] {
    const suggestions: string[] = [];
    
    // 检查是否使用了推荐的辅助函数
    if (content.includes('{{') && !content.includes('pascalCase') && !content.includes('camelCase')) {
      suggestions.push('考虑使用 pascalCase 或 camelCase 辅助函数来格式化变量名');
    }

    // 检查是否有条件逻辑
    if (content.includes('{{#if') && variables.some(v => v.type === 'boolean')) {
      suggestions.push('使用布尔变量进行条件渲染时，确保变量类型正确');
    }

    // 检查是否有循环逻辑
    if (content.includes('{{#each') && variables.some(v => v.type === 'array')) {
      suggestions.push('使用数组变量进行循环时，确保提供正确的数组数据');
    }

    return suggestions;
  }
}

@Injectable()
@QueryHandler(TestTemplateQuery)
export class TestTemplateHandler implements IQueryHandler<TestTemplateQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly templatePreviewService: TemplatePreviewService,
  ) {}

  async execute(query: TestTemplateQuery) {
    const { templateId, testData } = query;

    // 获取模板
    const template = await (this.prisma as any).codeTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException(`Template with id '${templateId}' not found`);
    }

    // 测试模板
    const testResult = this.templatePreviewService.testTemplate(
      template.content,
      testData,
    );

    return {
      template: {
        id: template.id,
        name: template.name,
        content: template.content,
      },
      test: testResult,
      timestamp: new Date().toISOString(),
    };
  }
}
