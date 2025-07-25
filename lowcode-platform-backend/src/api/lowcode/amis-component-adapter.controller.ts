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
  ValidationPipe,
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
  AmisComponentAdapterService,
  AmisCrudConfig,
  AmisFormConfig,
} from '../../services/amis-component-adapter.service';

/**
 * 生成CRUD配置请求DTO
 */
export class GenerateCrudConfigDto {
  /** 实体名称 */
  entityName: string;

  /** API基础路径 */
  apiBasePath: string;

  /** 字段配置 */
  fields: Array<{
    name: string;
    label: string;
    type: string;
    required?: boolean;
    searchable?: boolean;
    sortable?: boolean;
    filterable?: boolean;
  }>;

  /** 操作配置 */
  operations?: {
    create?: boolean;
    update?: boolean;
    delete?: boolean;
    view?: boolean;
    batch?: boolean;
  };

  /** 分页配置 */
  pagination?: {
    pageSize?: number;
    pageSizeOptions?: number[];
  };
}

/**
 * 生成表单配置请求DTO
 */
export class GenerateFormConfigDto {
  /** 实体名称 */
  entityName: string;

  /** API路径 */
  apiPath: string;

  /** 表单模式 */
  mode: 'create' | 'edit' | 'view';

  /** 字段配置 */
  fields: Array<{
    name: string;
    label: string;
    type: string;
    required?: boolean;
    options?: Array<{ label: string; value: any }>;
    validation?: any;
  }>;
}

/**
 * 生成页面配置请求DTO
 */
export class GeneratePageConfigDto {
  /** 页面标题 */
  title: string;

  /** 页面类型 */
  type: 'crud' | 'form' | 'custom';

  /** 组件配置 */
  componentConfig: any;

  /** 面包屑 */
  breadcrumb?: Array<{ label: string; url?: string }>;
}

/**
 * 格式化API响应请求DTO
 */
export class FormatApiResponseDto {
  /** 响应数据 */
  data: any;

  /** 是否成功 */
  success?: boolean;

  /** 响应消息 */
  message?: string;
}

/**
 * 格式化分页数据请求DTO
 */
export class FormatPaginationDataDto {
  /** 数据列表 */
  items: any[];

  /** 总记录数 */
  total: number;

  /** 当前页码 */
  page: number;

  /** 每页数量 */
  limit: number;
}

/**
 * Amis组件适配器控制器
 */
@ApiTags('Amis Component Adapter')
@Controller('amis-component-adapter')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AmisComponentAdapterController {
  constructor(
    private readonly amisComponentAdapter: AmisComponentAdapterService,
  ) {}

  /**
   * 生成Amis CRUD配置
   */
  @Post('generate-crud-config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '生成Amis CRUD配置',
    description: '根据实体和字段信息生成Amis CRUD组件配置',
  })
  @ApiBody({
    type: GenerateCrudConfigDto,
    description: 'CRUD配置生成参数',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'CRUD配置生成成功',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 0 },
        msg: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          description: 'Amis CRUD配置',
        },
      },
    },
  })
  @AmisResponse()
  async generateCrudConfig(@Body(ValidationPipe) generateDto: GenerateCrudConfigDto) {
    try {
      const crudConfig = this.amisComponentAdapter.generateCrudConfig(generateDto);

      return {
        data: crudConfig,
        message: 'CRUD配置生成成功',
      };
    } catch (error) {
      throw new BadRequestException('生成CRUD配置失败: ' + error.message);
    }
  }

  /**
   * 生成Amis表单配置
   */
  @Post('generate-form-config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '生成Amis表单配置',
    description: '根据实体和字段信息生成Amis表单组件配置',
  })
  @ApiBody({
    type: GenerateFormConfigDto,
    description: '表单配置生成参数',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '表单配置生成成功',
  })
  @AmisResponse()
  async generateFormConfig(@Body(ValidationPipe) generateDto: GenerateFormConfigDto) {
    try {
      const formConfig = this.amisComponentAdapter.generateFormConfig(generateDto);

      return {
        data: formConfig,
        message: '表单配置生成成功',
      };
    } catch (error) {
      throw new BadRequestException('生成表单配置失败: ' + error.message);
    }
  }

  /**
   * 生成Amis页面配置
   */
  @Post('generate-page-config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '生成Amis页面配置',
    description: '生成完整的Amis页面配置',
  })
  @ApiBody({
    type: GeneratePageConfigDto,
    description: '页面配置生成参数',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '页面配置生成成功',
  })
  @AmisResponse()
  async generatePageConfig(@Body(ValidationPipe) generateDto: GeneratePageConfigDto) {
    try {
      const pageConfig = this.amisComponentAdapter.generatePageConfig(generateDto);

      return {
        data: pageConfig,
        message: '页面配置生成成功',
      };
    } catch (error) {
      throw new BadRequestException('生成页面配置失败: ' + error.message);
    }
  }

  /**
   * 格式化API响应
   */
  @Post('format-api-response')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '格式化API响应',
    description: '将数据格式化为Amis标准响应格式',
  })
  @ApiBody({
    type: FormatApiResponseDto,
    description: 'API响应格式化参数',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '响应格式化成功',
  })
  @AmisResponse()
  async formatApiResponse(@Body(ValidationPipe) formatDto: FormatApiResponseDto) {
    try {
      const { data, success = true, message = 'success' } = formatDto;
      const formattedResponse = this.amisComponentAdapter.formatApiResponse(data, success, message);

      return formattedResponse;
    } catch (error) {
      throw new BadRequestException('格式化API响应失败: ' + error.message);
    }
  }

  /**
   * 格式化分页数据
   */
  @Post('format-pagination-data')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '格式化分页数据',
    description: '将分页数据格式化为Amis标准分页格式',
  })
  @ApiBody({
    type: FormatPaginationDataDto,
    description: '分页数据格式化参数',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '分页数据格式化成功',
  })
  @AmisResponse()
  async formatPaginationData(@Body(ValidationPipe) formatDto: FormatPaginationDataDto) {
    try {
      const paginationData = this.amisComponentAdapter.formatPaginationData(formatDto);

      return {
        data: paginationData,
        message: '分页数据格式化成功',
      };
    } catch (error) {
      throw new BadRequestException('格式化分页数据失败: ' + error.message);
    }
  }

  /**
   * 生成图表配置
   */
  @Post('generate-chart-config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '生成Amis图表配置',
    description: '生成Amis图表组件配置',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        chartType: { type: 'string', enum: ['line', 'bar', 'pie', 'area', 'scatter'], description: '图表类型' },
        apiUrl: { type: 'string', description: '数据API地址' },
        chartOptions: { type: 'object', description: '图表配置选项' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '图表配置生成成功',
  })
  @AmisResponse()
  async generateChartConfig(@Body() body: {
    chartType: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
    apiUrl: string;
    chartOptions: any;
  }) {
    try {
      const chartConfig = this.amisComponentAdapter.generateChartConfig(body);

      return {
        data: chartConfig,
        message: '图表配置生成成功',
      };
    } catch (error) {
      throw new BadRequestException('生成图表配置失败: ' + error.message);
    }
  }

  /**
   * 生成服务配置
   */
  @Post('generate-service-config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '生成Amis服务配置',
    description: '生成Amis服务组件配置',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        api: { type: 'string', description: '服务API地址' },
        dataMapping: { type: 'object', description: '数据映射配置' },
        body: { type: 'array', description: '子组件配置' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '服务配置生成成功',
  })
  @AmisResponse()
  async generateServiceConfig(@Body() body: {
    api: string;
    dataMapping?: any;
    body: any[];
  }) {
    try {
      const serviceConfig = this.amisComponentAdapter.generateServiceConfig(body);

      return {
        data: serviceConfig,
        message: '服务配置生成成功',
      };
    } catch (error) {
      throw new BadRequestException('生成服务配置失败: ' + error.message);
    }
  }

  /**
   * 获取字段类型映射
   */
  @Get('field-type-mappings')
  @ApiOperation({
    summary: '获取字段类型映射',
    description: '获取数据库字段类型到Amis组件类型的映射关系',
  })
  @ApiQuery({
    name: 'target',
    required: false,
    description: '目标类型',
    enum: ['column', 'form'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
  })
  @AmisResponse()
  async getFieldTypeMappings(@Query('target') target: 'column' | 'form' = 'form') {
    try {
      const mappings = this.getFieldTypeMappings(target);

      return {
        data: {
          mappings,
          target,
          supportedTypes: Object.keys(mappings),
        },
        message: '字段类型映射获取成功',
      };
    } catch (error) {
      throw new BadRequestException('获取字段类型映射失败: ' + error.message);
    }
  }

  /**
   * 获取Amis组件模板
   */
  @Get('component-templates')
  @ApiOperation({
    summary: '获取Amis组件模板',
    description: '获取预定义的Amis组件配置模板',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: '组件类型',
    enum: ['crud', 'form', 'chart', 'service', 'page'],
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: '组件分类',
    enum: ['basic', 'advanced', 'business'],
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
        data: {
          templates: filteredTemplates,
          total: filteredTemplates.length,
          types: [...new Set(templates.map(t => t.type))],
          categories: [...new Set(templates.map(t => t.category))],
        },
        message: 'Amis组件模板获取成功',
      };
    } catch (error) {
      throw new BadRequestException('获取Amis组件模板失败: ' + error.message);
    }
  }

  /**
   * 验证Amis配置
   */
  @Post('validate-config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '验证Amis配置',
    description: '验证Amis组件配置的正确性',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        config: { type: 'object', description: 'Amis配置' },
        type: { type: 'string', enum: ['crud', 'form', 'page', 'chart'], description: '配置类型' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '验证完成',
  })
  @AmisResponse()
  async validateConfig(@Body() body: {
    config: any;
    type: 'crud' | 'form' | 'page' | 'chart';
  }) {
    try {
      const validation = this.validateAmisConfig(body.config, body.type);

      return {
        data: validation,
        message: validation.isValid ? 'Amis配置验证通过' : 'Amis配置验证失败',
      };
    } catch (error) {
      throw new BadRequestException('验证Amis配置失败: ' + error.message);
    }
  }

  /**
   * 获取Amis适配统计
   */
  @Get('statistics')
  @ApiOperation({
    summary: '获取Amis适配统计',
    description: '获取Amis组件适配的统计信息',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '统计信息获取成功',
  })
  @AmisResponse()
  async getAdapterStatistics() {
    try {
      // TODO: 实现统计信息收集逻辑
      const statistics = {
        totalConfigs: 0,
        configsByType: {
          crud: 0,
          form: 0,
          page: 0,
          chart: 0,
        },
        popularFieldTypes: [],
        recentGenerations: [],
        performanceMetrics: {
          averageGenerationTime: 0,
          successRate: 0,
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
   * 获取字段类型映射
   */
  private getFieldTypeMappings(target: 'column' | 'form'): Record<string, string> {
    if (target === 'column') {
      return {
        'string': 'text',
        'number': 'number',
        'boolean': 'status',
        'date': 'date',
        'datetime': 'datetime',
        'text': 'text',
        'email': 'text',
        'url': 'link',
        'image': 'image',
        'file': 'file',
        'json': 'json',
        'array': 'list',
      };
    } else {
      return {
        'string': 'input-text',
        'number': 'input-number',
        'boolean': 'switch',
        'date': 'input-date',
        'datetime': 'input-datetime',
        'text': 'textarea',
        'email': 'input-email',
        'url': 'input-url',
        'password': 'input-password',
        'select': 'select',
        'radio': 'radios',
        'checkbox': 'checkboxes',
        'file': 'input-file',
        'image': 'input-image',
        'rich-text': 'input-rich-text',
        'json': 'json-editor',
      };
    }
  }

  /**
   * 获取组件模板列表
   */
  private getComponentTemplateList(): any[] {
    return [
      {
        id: 'basic-crud',
        name: '基础CRUD表格',
        type: 'crud',
        category: 'basic',
        description: '基础的CRUD表格模板',
        config: {
          type: 'crud',
          api: '/api/entities',
          columns: [
            { name: 'id', label: 'ID', type: 'text' },
            { name: 'name', label: '名称', type: 'text' },
            { name: 'status', label: '状态', type: 'status' },
            { name: 'createdAt', label: '创建时间', type: 'datetime' },
          ],
          headerToolbar: ['bulkActions', 'reload'],
          footerToolbar: ['statistics', 'pagination'],
        },
      },
      {
        id: 'basic-form',
        name: '基础表单',
        type: 'form',
        category: 'basic',
        description: '基础的表单模板',
        config: {
          type: 'form',
          api: '/api/entities',
          mode: 'horizontal',
          body: [
            { name: 'name', label: '名称', type: 'input-text', required: true },
            { name: 'description', label: '描述', type: 'textarea' },
            { name: 'status', label: '状态', type: 'select' },
          ],
        },
      },
      {
        id: 'line-chart',
        name: '折线图',
        type: 'chart',
        category: 'basic',
        description: '基础的折线图模板',
        config: {
          type: 'chart',
          api: '/api/chart-data',
          config: {
            type: 'line',
            xAxis: { type: 'category' },
            yAxis: { type: 'value' },
            series: [{ type: 'line' }],
          },
        },
      },
      {
        id: 'list-page',
        name: '列表页面',
        type: 'page',
        category: 'business',
        description: '标准的列表页面模板',
        config: {
          type: 'page',
          title: '数据列表',
          body: [
            {
              type: 'crud',
              api: '/api/entities',
              columns: [],
            },
          ],
        },
      },
    ];
  }

  /**
   * 验证Amis配置
   */
  private validateAmisConfig(config: any, type: string): any {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 基础验证
    if (!config.type) {
      errors.push('配置必须包含type字段');
    }

    if (config.type !== type) {
      warnings.push(`配置类型(${config.type})与指定类型(${type})不匹配`);
    }

    // 根据类型进行特定验证
    switch (type) {
      case 'crud':
        if (!config.api) {
          errors.push('CRUD配置必须包含api字段');
        }
        if (!config.columns || !Array.isArray(config.columns)) {
          errors.push('CRUD配置必须包含columns数组');
        }
        break;

      case 'form':
        if (!config.body || !Array.isArray(config.body)) {
          errors.push('表单配置必须包含body数组');
        }
        break;

      case 'page':
        if (!config.body) {
          errors.push('页面配置必须包含body字段');
        }
        break;

      case 'chart':
        if (!config.api && !config.data) {
          errors.push('图表配置必须包含api或data字段');
        }
        if (!config.config) {
          errors.push('图表配置必须包含config字段');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, 100 - errors.length * 20 - warnings.length * 10),
    };
  }
}
