/*
 * @Description: 代码生成配置管理服务
 * @Autor: henry.xiukun
 * @Date: 2025-07-25 23:00:00
 * @LastEditors: henry.xiukun
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { GenerationConfig } from './dual-layer-generator.service';

export interface ConfigTemplate {
  id: string;
  name: string;
  description: string;
  category: 'web' | 'api' | 'mobile' | 'desktop' | 'custom';
  framework: string;
  language: string;
  config: GenerationConfig;
  isPublic: boolean;
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  score: number; // 0-100
}

export interface ConfigComparison {
  differences: Array<{
    path: string;
    type: 'added' | 'removed' | 'modified';
    oldValue?: any;
    newValue?: any;
  }>;
  compatibility: number; // 0-1
  recommendations: string[];
}

@Injectable()
export class GenerationConfigManagerService {
  private readonly logger = new Logger(GenerationConfigManagerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 保存代码生成配置
   */
  async saveConfig(
    projectId: string,
    config: GenerationConfig,
    name?: string,
    description?: string,
    userId?: string,
  ): Promise<{ id: string; success: boolean; message: string }> {
    try {
      // 验证配置
      const validation = await this.validateConfig(config);
      if (!validation.isValid) {
        return {
          id: '',
          success: false,
          message: `配置验证失败: ${validation.errors.join(', ')}`,
        };
      }

      // 暂时使用CodegenTask表保存配置
      const savedConfig = await this.prisma.codegenTask.create({
        data: {
          projectId,
          name: name || `配置_${new Date().toISOString().slice(0, 10)}`,
          type: 'config',
          config: config as any,
          status: 'completed',
          createdBy: userId || 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      this.logger.log(`配置保存成功: ${savedConfig.id}`);
      return {
        id: savedConfig.id,
        success: true,
        message: '配置保存成功',
      };

    } catch (error) {
      this.logger.error(`配置保存失败: ${error.message}`);
      return {
        id: '',
        success: false,
        message: `配置保存失败: ${error.message}`,
      };
    }
  }

  /**
   * 加载代码生成配置
   */
  async loadConfig(configId: string): Promise<GenerationConfig | null> {
    try {
      // 暂时使用CodegenTask表查询配置
      const savedConfig = await this.prisma.codegenTask.findUnique({
        where: { id: configId },
      });

      if (!savedConfig || savedConfig.type !== 'config') {
        return null;
      }

      return savedConfig.config as unknown as GenerationConfig;

    } catch (error) {
      this.logger.error(`配置加载失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 获取项目的配置列表
   */
  async getProjectConfigs(
    projectId: string,
    page: number = 1,
    size: number = 10,
  ): Promise<{
    configs: any[];
    total: number;
    page: number;
    size: number;
  }> {
    try {
      const skip = (page - 1) * size;

      // 暂时使用CodegenTask表查询配置
      const [configs, total] = await Promise.all([
        this.prisma.codegenTask.findMany({
          where: {
            projectId,
            type: 'config',
          },
          skip,
          take: size,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        this.prisma.codegenTask.count({
          where: {
            projectId,
            type: 'config',
          },
        }),
      ]);

      return {
        configs,
        total,
        page,
        size,
      };

    } catch (error) {
      this.logger.error(`获取配置列表失败: ${error.message}`);
      return {
        configs: [],
        total: 0,
        page,
        size,
      };
    }
  }

  /**
   * 创建配置模板
   */
  async createConfigTemplate(
    name: string,
    description: string,
    category: ConfigTemplate['category'],
    framework: string,
    language: string,
    config: GenerationConfig,
    isPublic: boolean = false,
    userId?: string,
  ): Promise<ConfigTemplate> {
    // 暂时使用CodeTemplate表创建配置模板
    const template = await this.prisma.codeTemplate.create({
      data: {
        name,
        code: name.toLowerCase().replace(/\s+/g, '_'),
        type: 'config',
        language,
        framework,
        description,
        template: JSON.stringify(config),
        // isPublic: template.isPublic, // 该字段不存在
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return {
      id: template.id,
      name: template.name,
      description: template.description || '',
      category,
      framework: template.framework || 'nestjs',
      language: template.language,
      config,
      isPublic: false, // 默认为false，因为该字段在模型中不存在
      usageCount: 0,
      createdBy: template.createdBy || 'system',
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  /**
   * 获取配置模板列表
   */
  async getConfigTemplates(
    category?: string,
    framework?: string,
    language?: string,
  ): Promise<ConfigTemplate[]> {
    const where: any = {
      // OR: [
      //   { isPublic: true },
      //   // TODO: 添加用户权限检查
      // ],
    };

    if (category) {
      where.category = category;
    }

    if (framework) {
      where.framework = framework;
    }

    if (language) {
      where.language = language;
    }

    // 暂时使用CodeTemplate表，后续需要创建专门的配置模板表
    const templates = await this.prisma.codeTemplate.findMany({
      where: {
        type: 'config',
        // isPublic: true, // 该字段不存在于 CodeTemplate 模型中
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
    });

    return templates.map((template: any) => ({
      id: template.id,
      name: template.name,
      description: template.description || '',
      category: 'custom' as const,
      framework: template.framework || 'nestjs',
      language: template.language,
      config: {
        projectId: '',
        entityIds: [],
        templateIds: [],
        outputPath: './generated',
        baseConfig: {
          generateAuth: true,
          generateValidation: true,
          generateSwagger: true,
          generateTests: false,
          outputFormat: 'typescript' as const,
        },
        bizConfig: {
          allowCustomization: true,
          preserveCustomCode: true,
          generateInterfaces: true,
        },
      }, // 返回默认配置结构
      isPublic: false, // 默认为false，因为该字段在模型中不存在
      usageCount: 0, // CodeTemplate表没有这个字段
      createdBy: template.createdBy || 'system',
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    }));
  }

  /**
   * 验证代码生成配置
   */
  async validateConfig(config: GenerationConfig): Promise<ConfigValidationResult> {
    const result: ConfigValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      score: 100,
    };

    try {
      // 基本验证
      if (!config.projectId) {
        result.errors.push('项目ID不能为空');
      }

      if (!config.entityIds || config.entityIds.length === 0) {
        result.errors.push('至少需要选择一个实体');
      }

      if (!config.templateIds || config.templateIds.length === 0) {
        result.errors.push('至少需要选择一个模板');
      }

      if (!config.outputPath) {
        result.errors.push('输出路径不能为空');
      }

      // 高级验证
      await this.validateAdvancedConfig(config, result);

      // 计算分数
      result.score = this.calculateConfigScore(config, result);
      result.isValid = result.errors.length === 0;

    } catch (error) {
      result.errors.push(`配置验证失败: ${error.message}`);
      result.isValid = false;
      result.score = 0;
    }

    return result;
  }

  /**
   * 比较两个配置
   */
  async compareConfigs(
    config1: GenerationConfig,
    config2: GenerationConfig,
  ): Promise<ConfigComparison> {
    const differences: ConfigComparison['differences'] = [];
    const recommendations: string[] = [];

    // 比较基本配置
    this.compareBasicConfig(config1, config2, differences);

    // 比较实体和模板
    this.compareEntitiesAndTemplates(config1, config2, differences);

    // 比较高级配置
    this.compareAdvancedConfig(config1, config2, differences);

    // 计算兼容性
    const compatibility = this.calculateCompatibility(differences);

    // 生成建议
    this.generateComparisonRecommendations(differences, recommendations);

    return {
      differences,
      compatibility,
      recommendations,
    };
  }

  /**
   * 克隆配置
   */
  async cloneConfig(
    configId: string,
    newName: string,
    newDescription?: string,
    userId?: string,
  ): Promise<{ id: string; success: boolean; message: string }> {
    try {
      const originalConfig = await (this.prisma as any).codeGenerationConfig.findUnique({
        where: { id: configId },
      });

      if (!originalConfig) {
        return {
          id: '',
          success: false,
          message: '原配置不存在',
        };
      }

      const clonedConfig = await (this.prisma as any).codeGenerationConfig.create({
        data: {
          projectId: originalConfig.projectId,
          name: newName,
          description: newDescription || `${originalConfig.description} (副本)`,
          config: originalConfig.config,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return {
        id: clonedConfig.id,
        success: true,
        message: '配置克隆成功',
      };

    } catch (error) {
      return {
        id: '',
        success: false,
        message: `配置克隆失败: ${error.message}`,
      };
    }
  }

  /**
   * 高级配置验证
   */
  private async validateAdvancedConfig(
    config: GenerationConfig,
    result: ConfigValidationResult,
  ): Promise<void> {
    // 验证实体是否存在
    if (config.entityIds.length > 0) {
      const entities = await (this.prisma as any).lowcodeEntity.findMany({
        where: { id: { in: config.entityIds } },
      });

      if (entities.length !== config.entityIds.length) {
        result.warnings.push('部分实体不存在或已被删除');
        result.score -= 10;
      }
    }

    // 验证模板是否存在
    if (config.templateIds.length > 0) {
      const templates = await (this.prisma as any).codeTemplate.findMany({
        where: { id: { in: config.templateIds } },
      });

      if (templates.length !== config.templateIds.length) {
        result.warnings.push('部分模板不存在或已被删除');
        result.score -= 10;
      }
    }

    // 验证输出路径
    if (config.outputPath) {
      if (!config.outputPath.startsWith('./') && !config.outputPath.startsWith('/')) {
        result.warnings.push('建议使用相对路径或绝对路径');
        result.score -= 5;
      }
    }

    // 生成建议
    this.generateConfigSuggestions(config, result);
  }

  /**
   * 计算配置分数
   */
  private calculateConfigScore(
    config: GenerationConfig,
    result: ConfigValidationResult,
  ): number {
    let score = 100;

    // 错误扣分
    score -= result.errors.length * 20;

    // 警告扣分
    score -= result.warnings.length * 5;

    // 配置完整性加分
    if (config.baseConfig.generateAuth) score += 5;
    if (config.baseConfig.generateValidation) score += 5;
    if (config.baseConfig.generateSwagger) score += 5;
    if (config.baseConfig.generateTests) score += 10;

    if (config.bizConfig.allowCustomization) score += 5;
    if (config.bizConfig.preserveCustomCode) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 生成配置建议
   */
  private generateConfigSuggestions(
    config: GenerationConfig,
    result: ConfigValidationResult,
  ): void {
    if (!config.baseConfig.generateTests) {
      result.suggestions.push('建议启用测试代码生成以提高代码质量');
    }

    if (!config.baseConfig.generateSwagger) {
      result.suggestions.push('建议启用Swagger文档生成以提高API可维护性');
    }

    if (!config.bizConfig.preserveCustomCode) {
      result.suggestions.push('建议启用自定义代码保护以避免覆盖用户修改');
    }

    if (config.entityIds.length > 20) {
      result.suggestions.push('实体数量较多，建议分批生成以提高性能');
    }
  }

  // 配置比较相关的私有方法
  private compareBasicConfig(
    config1: GenerationConfig,
    config2: GenerationConfig,
    differences: ConfigComparison['differences'],
  ): void {
    if (config1.outputPath !== config2.outputPath) {
      differences.push({
        path: 'outputPath',
        type: 'modified',
        oldValue: config1.outputPath,
        newValue: config2.outputPath,
      });
    }
  }

  private compareEntitiesAndTemplates(
    config1: GenerationConfig,
    config2: GenerationConfig,
    differences: ConfigComparison['differences'],
  ): void {
    // 比较实体
    const addedEntities = config2.entityIds.filter(id => !config1.entityIds.includes(id));
    const removedEntities = config1.entityIds.filter(id => !config2.entityIds.includes(id));

    addedEntities.forEach(id => {
      differences.push({
        path: `entityIds.${id}`,
        type: 'added',
        newValue: id,
      });
    });

    removedEntities.forEach(id => {
      differences.push({
        path: `entityIds.${id}`,
        type: 'removed',
        oldValue: id,
      });
    });

    // 比较模板
    const addedTemplates = config2.templateIds.filter(id => !config1.templateIds.includes(id));
    const removedTemplates = config1.templateIds.filter(id => !config2.templateIds.includes(id));

    addedTemplates.forEach(id => {
      differences.push({
        path: `templateIds.${id}`,
        type: 'added',
        newValue: id,
      });
    });

    removedTemplates.forEach(id => {
      differences.push({
        path: `templateIds.${id}`,
        type: 'removed',
        oldValue: id,
      });
    });
  }

  private compareAdvancedConfig(
    config1: GenerationConfig,
    config2: GenerationConfig,
    differences: ConfigComparison['differences'],
  ): void {
    // 比较baseConfig
    Object.keys(config1.baseConfig).forEach(key => {
      if (config1.baseConfig[key] !== config2.baseConfig[key]) {
        differences.push({
          path: `baseConfig.${key}`,
          type: 'modified',
          oldValue: config1.baseConfig[key],
          newValue: config2.baseConfig[key],
        });
      }
    });

    // 比较bizConfig
    Object.keys(config1.bizConfig).forEach(key => {
      if (config1.bizConfig[key] !== config2.bizConfig[key]) {
        differences.push({
          path: `bizConfig.${key}`,
          type: 'modified',
          oldValue: config1.bizConfig[key],
          newValue: config2.bizConfig[key],
        });
      }
    });
  }

  private calculateCompatibility(differences: ConfigComparison['differences']): number {
    if (differences.length === 0) return 1;

    // 根据差异类型计算兼容性
    let score = 1;
    differences.forEach(diff => {
      switch (diff.type) {
        case 'added':
          score -= 0.1; // 新增影响较小
          break;
        case 'removed':
          score -= 0.2; // 删除影响中等
          break;
        case 'modified':
          score -= 0.15; // 修改影响中等
          break;
      }
    });

    return Math.max(0, score);
  }

  private generateComparisonRecommendations(
    differences: ConfigComparison['differences'],
    recommendations: string[],
  ): void {
    const entityChanges = differences.filter(d => d.path.startsWith('entityIds'));
    const templateChanges = differences.filter(d => d.path.startsWith('templateIds'));
    const configChanges = differences.filter(d => d.path.includes('Config'));

    if (entityChanges.length > 0) {
      recommendations.push(`实体配置有 ${entityChanges.length} 处变更，请检查相关依赖`);
    }

    if (templateChanges.length > 0) {
      recommendations.push(`模板配置有 ${templateChanges.length} 处变更，可能影响生成结果`);
    }

    if (configChanges.length > 0) {
      recommendations.push(`生成配置有 ${configChanges.length} 处变更，建议重新验证`);
    }
  }
}
