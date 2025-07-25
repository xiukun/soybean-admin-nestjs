import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
  Headers,
  BadRequestException,
  NotFoundException,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@nestjs/passport';
import { AmisResponse } from '@lib/shared/decorators/amis-response.decorator';
import { 
  LowcodeDesignerIntegrationService,
  PageConfig,
  DesignerComponentConfig,
  ApiGenerationConfig,
} from '../../services/lowcode-designer-integration.service';

/**
 * 页面发布请求DTO
 */
export class PublishPageDto {
  /** 页面配置 */
  pageConfig: PageConfig;

  /** 是否自动生成API */
  autoGenerateApis?: boolean;

  /** 是否覆盖已存在的API */
  overwriteExistingApis?: boolean;

  /** 生成选项 */
  generationOptions?: {
    /** 是否生成测试文件 */
    generateTests?: boolean;
    /** 是否生成文档 */
    generateDocs?: boolean;
    /** 是否启用缓存 */
    enableCache?: boolean;
    /** 是否启用权限验证 */
    enableAuth?: boolean;
  };
}

/**
 * 组件分析请求DTO
 */
export class AnalyzeComponentDto {
  /** 组件配置 */
  component: DesignerComponentConfig;

  /** 分析选项 */
  options?: {
    /** 是否包含子组件 */
    includeChildren?: boolean;
    /** 是否生成API建议 */
    generateApiSuggestions?: boolean;
  };
}

/**
 * API生成请求DTO
 */
export class GenerateApiDto {
  /** API生成配置 */
  config: ApiGenerationConfig;

  /** 生成选项 */
  options?: {
    /** 输出目录 */
    outputDir?: string;
    /** 是否异步生成 */
    async?: boolean;
    /** 是否发送通知 */
    sendNotification?: boolean;
  };
}

/**
 * 页面预览请求DTO
 */
export class PreviewPageDto {
  /** 页面配置 */
  pageConfig: PageConfig;

  /** 预览选项 */
  options?: {
    /** 是否包含模拟数据 */
    includeMockData?: boolean;
    /** 是否生成API文档 */
    generateApiDocs?: boolean;
  };
}

/**
 * 低代码设计器集成控制器
 */
@ApiTags('Lowcode Designer Integration')
@Controller('lowcode-designer-integration')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LowcodeDesignerIntegrationController {
  constructor(
    private readonly designerIntegrationService: LowcodeDesignerIntegrationService,
  ) {}

  /**
   * 发布页面并生成后端接口
   */
  @Post('publish-page')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '发布页面并生成后端接口',
    description: '根据页面配置自动分析并生成对应的后端API接口',
  })
  @ApiBody({
    type: PublishPageDto,
    description: '页面发布配置',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '页面发布成功',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 0 },
        msg: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            pageId: { type: 'string', example: 'page_123' },
            generatedApis: { type: 'array', description: '生成的API列表' },
            generatedFiles: { type: 'array', description: '生成的文件列表' },
            errors: { type: 'array', description: '错误列表' },
            warnings: { type: 'array', description: '警告列表' },
          },
        },
      },
    },
  })
  @AmisResponse()
  async publishPage(
    @Body(ValidationPipe) publishDto: PublishPageDto,
    @Headers('user-id') userId: string,
  ) {
    try {
      const { pageConfig, autoGenerateApis = true, overwriteExistingApis = false } = publishDto;

      // 验证页面配置
      this.validatePageConfig(pageConfig);

      let generatedApis: any[] = [];
      let generatedFiles: any[] = [];
      let errors: string[] = [];

      if (autoGenerateApis) {
        // 生成后端接口
        const result = await this.designerIntegrationService.generateApisFromPageConfig(pageConfig);
        generatedApis = result.generatedApis;
        generatedFiles = result.generatedFiles;
        errors = result.errors;
      }

      // 保存页面配置到数据库
      // TODO: 实现页面配置保存逻辑

      return {
        pageId: pageConfig.id,
        generatedApis: generatedApis.map(api => ({
          path: api.path,
          method: api.method,
          name: api.name,
          description: api.description,
        })),
        generatedFiles: generatedFiles.map(file => ({
          filePath: file.filePath,
          type: file.type,
          description: file.description,
        })),
        errors,
        warnings: [], // TODO: 实现警告收集
        message: `页面发布成功，生成了 ${generatedApis.length} 个API和 ${generatedFiles.length} 个文件`,
      };
    } catch (error) {
      throw new BadRequestException('页面发布失败: ' + error.message);
    }
  }

  /**
   * 分析组件并生成API建议
   */
  @Post('analyze-component')
  @ApiOperation({
    summary: '分析组件并生成API建议',
    description: '分析设计器组件配置，生成对应的API需求和建议',
  })
  @ApiBody({
    type: AnalyzeComponentDto,
    description: '组件分析配置',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '分析完成',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 0 },
        msg: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            componentType: { type: 'string', description: '组件类型' },
            apiRequirements: { type: 'array', description: 'API需求列表' },
            suggestedApis: { type: 'array', description: '建议的API配置' },
            dataSourceConfig: { type: 'object', description: '数据源配置' },
            fieldMapping: { type: 'object', description: '字段映射' },
          },
        },
      },
    },
  })
  @AmisResponse()
  async analyzeComponent(@Body(ValidationPipe) analyzeDto: AnalyzeComponentDto) {
    try {
      const { component, options = {} } = analyzeDto;

      // 分析组件
      const analysis = await this.analyzeComponentRequirements(component, options);

      return {
        componentType: component.type,
        apiRequirements: analysis.apiRequirements,
        suggestedApis: analysis.suggestedApis,
        dataSourceConfig: analysis.dataSourceConfig,
        fieldMapping: analysis.fieldMapping,
        message: '组件分析完成',
      };
    } catch (error) {
      throw new BadRequestException('组件分析失败: ' + error.message);
    }
  }

  /**
   * 生成单个API
   */
  @Post('generate-api')
  @ApiOperation({
    summary: '生成单个API',
    description: '根据配置生成单个API接口',
  })
  @ApiBody({
    type: GenerateApiDto,
    description: 'API生成配置',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'API生成成功',
  })
  @AmisResponse()
  async generateApi(
    @Body(ValidationPipe) generateDto: GenerateApiDto,
    @Headers('user-id') userId: string,
  ) {
    try {
      const { config, options = {} } = generateDto;

      // 生成API
      const result = await this.generateSingleApi(config, options, userId);

      return {
        apiConfig: result.apiConfig,
        generatedFiles: result.generatedFiles,
        message: 'API生成成功',
      };
    } catch (error) {
      throw new BadRequestException('API生成失败: ' + error.message);
    }
  }

  /**
   * 预览页面配置
   */
  @Post('preview-page')
  @ApiOperation({
    summary: '预览页面配置',
    description: '预览页面配置，生成API文档和模拟数据',
  })
  @ApiBody({
    type: PreviewPageDto,
    description: '页面预览配置',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '预览生成成功',
  })
  @AmisResponse()
  async previewPage(@Body(ValidationPipe) previewDto: PreviewPageDto) {
    try {
      const { pageConfig, options = {} } = previewDto;

      // 生成预览数据
      const preview = await this.generatePagePreview(pageConfig, options);

      return {
        pageConfig: preview.pageConfig,
        apiDocumentation: preview.apiDocumentation,
        mockData: preview.mockData,
        dataSourceMapping: preview.dataSourceMapping,
        message: '页面预览生成成功',
      };
    } catch (error) {
      throw new BadRequestException('页面预览生成失败: ' + error.message);
    }
  }

  /**
   * 获取组件模板
   */
  @Get('component-templates')
  @ApiOperation({
    summary: '获取组件模板',
    description: '获取预定义的组件配置模板',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: '组件类型',
    enum: ['crud-table', 'form', 'detail', 'chart', 'list', 'tree'],
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: '组件分类',
    enum: ['data-display', 'data-entry', 'feedback', 'navigation'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
  })
  @AmisResponse()
  async getComponentTemplates(
    @Query('type') type?: string,
    @Query('category') category?: string,
  ) {
    try {
      const templates = this.getComponentTemplateList();

      let filteredTemplates = templates;

      if (type) {
        filteredTemplates = filteredTemplates.filter(template => template.type === type);
      }

      if (category) {
        filteredTemplates = filteredTemplates.filter(template => template.category === category);
      }

      return {
        templates: filteredTemplates,
        total: filteredTemplates.length,
        types: [...new Set(templates.map(t => t.type))],
        categories: [...new Set(templates.map(t => t.category))],
        message: '组件模板获取成功',
      };
    } catch (error) {
      throw new BadRequestException('获取组件模板失败: ' + error.message);
    }
  }

  /**
   * 获取API模板
   */
  @Get('api-templates')
  @ApiOperation({
    summary: '获取API模板',
    description: '获取预定义的API配置模板',
  })
  @ApiQuery({
    name: 'apiType',
    required: false,
    description: 'API类型',
    enum: ['list', 'detail', 'create', 'update', 'delete', 'batch'],
  })
  @ApiQuery({
    name: 'entityType',
    required: false,
    description: '实体类型',
    enum: ['user', 'product', 'order', 'category', 'custom'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
  })
  @AmisResponse()
  async getApiTemplates(
    @Query('apiType') apiType?: string,
    @Query('entityType') entityType?: string,
  ) {
    try {
      const templates = this.getApiTemplateList();

      let filteredTemplates = templates;

      if (apiType) {
        filteredTemplates = filteredTemplates.filter(template => template.apiType === apiType);
      }

      if (entityType) {
        filteredTemplates = filteredTemplates.filter(template => template.entityType === entityType);
      }

      return {
        templates: filteredTemplates,
        total: filteredTemplates.length,
        apiTypes: [...new Set(templates.map(t => t.apiType))],
        entityTypes: [...new Set(templates.map(t => t.entityType))],
        message: 'API模板获取成功',
      };
    } catch (error) {
      throw new BadRequestException('获取API模板失败: ' + error.message);
    }
  }

  /**
   * 获取页面模板
   */
  @Get('page-templates')
  @ApiOperation({
    summary: '获取页面模板',
    description: '获取预定义的页面配置模板',
  })
  @ApiQuery({
    name: 'pageType',
    required: false,
    description: '页面类型',
    enum: ['list', 'form', 'detail', 'dashboard', 'custom'],
  })
  @ApiQuery({
    name: 'industry',
    required: false,
    description: '行业类型',
    enum: ['ecommerce', 'cms', 'crm', 'erp', 'general'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
  })
  @AmisResponse()
  async getPageTemplates(
    @Query('pageType') pageType?: string,
    @Query('industry') industry?: string,
  ) {
    try {
      const templates = this.getPageTemplateList();

      let filteredTemplates = templates;

      if (pageType) {
        filteredTemplates = filteredTemplates.filter(template => template.pageType === pageType);
      }

      if (industry) {
        filteredTemplates = filteredTemplates.filter(template => template.industry === industry);
      }

      return {
        templates: filteredTemplates,
        total: filteredTemplates.length,
        pageTypes: [...new Set(templates.map(t => t.pageType))],
        industries: [...new Set(templates.map(t => t.industry))],
        message: '页面模板获取成功',
      };
    } catch (error) {
      throw new BadRequestException('获取页面模板失败: ' + error.message);
    }
  }

  /**
   * 验证页面配置
   */
  @Post('validate-page-config')
  @ApiOperation({
    summary: '验证页面配置',
    description: '验证页面配置的正确性和完整性',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        pageConfig: { type: 'object', description: '页面配置' },
        validationLevel: { type: 'string', enum: ['basic', 'strict', 'comprehensive'], description: '验证级别' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '验证完成',
  })
  @AmisResponse()
  async validatePageConfig(@Body() body: {
    pageConfig: PageConfig;
    validationLevel?: 'basic' | 'strict' | 'comprehensive';
  }) {
    try {
      const { pageConfig, validationLevel = 'basic' } = body;

      const validation = this.performPageConfigValidation(pageConfig, validationLevel);

      return {
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
        suggestions: validation.suggestions,
        score: validation.score,
        message: validation.isValid ? '页面配置验证通过' : '页面配置验证失败',
      };
    } catch (error) {
      throw new BadRequestException('页面配置验证失败: ' + error.message);
    }
  }

  /**
   * 获取设计器集成统计
   */
  @Get('statistics')
  @ApiOperation({
    summary: '获取设计器集成统计',
    description: '获取设计器集成的统计信息',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '统计信息获取成功',
  })
  @AmisResponse()
  async getIntegrationStatistics() {
    try {
      // TODO: 实现统计信息收集逻辑
      const statistics = {
        totalPages: 0,
        totalApis: 0,
        totalComponents: 0,
        popularComponentTypes: [],
        popularApiTypes: [],
        recentActivities: [],
        performanceMetrics: {
          averageGenerationTime: 0,
          successRate: 0,
          errorRate: 0,
        },
      };

      return {
        data: statistics,
        message: '统计信息获取成功',
      };
    } catch (error) {
      throw new BadRequestException('获取统计信息失败: ' + error.message);
    }
  }

  /**
   * 验证页面配置
   */
  private validatePageConfig(pageConfig: PageConfig): void {
    if (!pageConfig.id) {
      throw new BadRequestException('页面ID不能为空');
    }

    if (!pageConfig.name) {
      throw new BadRequestException('页面名称不能为空');
    }

    if (!pageConfig.components || pageConfig.components.length === 0) {
      throw new BadRequestException('页面必须包含至少一个组件');
    }
  }

  /**
   * 分析组件需求
   */
  private async analyzeComponentRequirements(
    component: DesignerComponentConfig,
    options: any
  ): Promise<any> {
    // TODO: 实现组件分析逻辑
    return {
      apiRequirements: [],
      suggestedApis: [],
      dataSourceConfig: {},
      fieldMapping: {},
    };
  }

  /**
   * 生成单个API
   */
  private async generateSingleApi(
    config: ApiGenerationConfig,
    options: any,
    userId: string
  ): Promise<any> {
    // TODO: 实现单个API生成逻辑
    return {
      apiConfig: {},
      generatedFiles: [],
    };
  }

  /**
   * 生成页面预览
   */
  private async generatePagePreview(
    pageConfig: PageConfig,
    options: any
  ): Promise<any> {
    // TODO: 实现页面预览生成逻辑
    return {
      pageConfig,
      apiDocumentation: {},
      mockData: {},
      dataSourceMapping: {},
    };
  }

  /**
   * 获取组件模板列表
   */
  private getComponentTemplateList(): any[] {
    return [
      {
        id: 'crud-table-basic',
        name: '基础CRUD表格',
        type: 'crud-table',
        category: 'data-display',
        description: '基础的CRUD表格组件，包含增删改查功能',
        config: {
          type: 'crud-table',
          name: 'basicCrudTable',
          title: '数据表格',
          dataSource: {
            type: 'api',
            api: {
              url: '/api/entities',
              method: 'GET',
            },
          },
          fields: [
            { name: 'id', label: 'ID', type: 'input-text', readonly: true },
            { name: 'name', label: '名称', type: 'input-text', required: true },
            { name: 'status', label: '状态', type: 'select', required: true },
          ],
          actions: [
            {
              id: 'create',
              type: 'button',
              label: '新增',
              action: { type: 'dialog', config: { title: '新增记录' } },
            },
            {
              id: 'edit',
              type: 'button',
              label: '编辑',
              action: { type: 'dialog', config: { title: '编辑记录' } },
            },
            {
              id: 'delete',
              type: 'button',
              label: '删除',
              action: { type: 'api', config: { method: 'DELETE' } },
            },
          ],
        },
      },
      {
        id: 'form-basic',
        name: '基础表单',
        type: 'form',
        category: 'data-entry',
        description: '基础的表单组件，用于数据录入',
        config: {
          type: 'form',
          name: 'basicForm',
          title: '数据表单',
          fields: [
            { name: 'name', label: '名称', type: 'input-text', required: true },
            { name: 'email', label: '邮箱', type: 'input-email', required: true },
            { name: 'phone', label: '电话', type: 'input-text', required: false },
            { name: 'description', label: '描述', type: 'textarea', required: false },
          ],
          actions: [
            {
              id: 'submit',
              type: 'button',
              label: '提交',
              action: { type: 'api', config: { method: 'POST' } },
            },
            {
              id: 'reset',
              type: 'button',
              label: '重置',
              action: { type: 'script', config: { script: 'form.reset()' } },
            },
          ],
        },
      },
    ];
  }

  /**
   * 获取API模板列表
   */
  private getApiTemplateList(): any[] {
    return [
      {
        id: 'list-api',
        name: '列表查询API',
        apiType: 'list',
        entityType: 'custom',
        description: '标准的列表查询API模板',
        config: {
          path: '/api/entities',
          method: 'GET',
          enablePagination: true,
          enableSearch: true,
          enableSort: true,
          enableFilter: true,
        },
      },
      {
        id: 'create-api',
        name: '创建API',
        apiType: 'create',
        entityType: 'custom',
        description: '标准的创建API模板',
        config: {
          path: '/api/entities',
          method: 'POST',
          enableValidation: true,
          enableAuth: true,
        },
      },
    ];
  }

  /**
   * 获取页面模板列表
   */
  private getPageTemplateList(): any[] {
    return [
      {
        id: 'list-page',
        name: '列表页面',
        pageType: 'list',
        industry: 'general',
        description: '标准的列表页面模板',
        config: {
          type: 'list',
          components: [
            {
              type: 'crud-table',
              name: 'dataTable',
              title: '数据列表',
            },
          ],
        },
      },
      {
        id: 'form-page',
        name: '表单页面',
        pageType: 'form',
        industry: 'general',
        description: '标准的表单页面模板',
        config: {
          type: 'form',
          components: [
            {
              type: 'form',
              name: 'dataForm',
              title: '数据表单',
            },
          ],
        },
      },
    ];
  }

  /**
   * 执行页面配置验证
   */
  private performPageConfigValidation(
    pageConfig: PageConfig,
    validationLevel: string
  ): any {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // 基础验证
    if (!pageConfig.id) {
      errors.push('页面ID不能为空');
    }

    if (!pageConfig.name) {
      errors.push('页面名称不能为空');
    }

    if (!pageConfig.components || pageConfig.components.length === 0) {
      errors.push('页面必须包含至少一个组件');
    }

    // 严格验证
    if (validationLevel === 'strict' || validationLevel === 'comprehensive') {
      if (!pageConfig.title) {
        warnings.push('建议设置页面标题');
      }

      if (!pageConfig.path) {
        warnings.push('建议设置页面路径');
      }
    }

    // 综合验证
    if (validationLevel === 'comprehensive') {
      if (!pageConfig.dataSources || Object.keys(pageConfig.dataSources).length === 0) {
        suggestions.push('建议配置页面数据源');
      }

      if (!pageConfig.style) {
        suggestions.push('建议配置页面样式');
      }
    }

    const score = Math.max(0, 100 - errors.length * 20 - warnings.length * 10 - suggestions.length * 5);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      score,
    };
  }
}
