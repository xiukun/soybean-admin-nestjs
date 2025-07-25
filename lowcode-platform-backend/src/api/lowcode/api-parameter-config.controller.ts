import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
  DefaultValuePipe,
  ParseIntPipe,
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
  ApiParameterConfigService, 
  ApiConfig, 
  ParameterConfig,
  ValidationRule,
  TransformationRule,
} from '../../services/api-parameter-config.service';

/**
 * 创建接口配置请求DTO
 */
export class CreateApiConfigDto {
  /** 接口路径 */
  path: string;

  /** HTTP方法 */
  method: string;

  /** 接口名称 */
  name: string;

  /** 接口描述 */
  description?: string;

  /** 输入参数配置 */
  inputParameters: ParameterConfig[];

  /** 输出参数配置 */
  outputParameters: ParameterConfig[];

  /** 响应格式配置 */
  responseFormat: any;

  /** 分页配置 */
  paginationConfig?: any;

  /** 排序配置 */
  sortConfig?: any;

  /** 筛选配置 */
  filterConfig?: any;

  /** 缓存配置 */
  cacheConfig?: any;

  /** 权限配置 */
  permissionConfig?: any;

  /** 是否启用 */
  enabled: boolean;
}

/**
 * 更新接口配置请求DTO
 */
export class UpdateApiConfigDto {
  /** 接口名称 */
  name?: string;

  /** 接口描述 */
  description?: string;

  /** 输入参数配置 */
  inputParameters?: ParameterConfig[];

  /** 输出参数配置 */
  outputParameters?: ParameterConfig[];

  /** 响应格式配置 */
  responseFormat?: any;

  /** 分页配置 */
  paginationConfig?: any;

  /** 排序配置 */
  sortConfig?: any;

  /** 筛选配置 */
  filterConfig?: any;

  /** 缓存配置 */
  cacheConfig?: any;

  /** 权限配置 */
  permissionConfig?: any;

  /** 是否启用 */
  enabled?: boolean;
}

/**
 * 验证参数请求DTO
 */
export class ValidateParametersDto {
  /** 参数配置 */
  parameters: ParameterConfig[];

  /** 参数值 */
  values: Record<string, any>;
}

/**
 * 复制接口配置请求DTO
 */
export class DuplicateApiConfigDto {
  /** 新接口名称 */
  newName: string;

  /** 新接口路径 */
  newPath: string;
}

/**
 * 接口参数配置控制器
 */
@ApiTags('API Parameter Config')
@Controller('api-parameter-config')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApiParameterConfigController {
  constructor(
    private readonly apiParameterConfigService: ApiParameterConfigService,
  ) {}

  /**
   * 创建接口配置
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '创建接口配置',
    description: '创建新的接口参数配置，包括输入输出参数、验证规则等',
  })
  @ApiBody({
    type: CreateApiConfigDto,
    description: '接口配置信息',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '接口配置创建成功',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 0 },
        msg: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'api_config_123' },
            path: { type: 'string', example: '/api/users' },
            method: { type: 'string', example: 'GET' },
            name: { type: 'string', example: '获取用户列表' },
            version: { type: 'number', example: 1 },
          },
        },
      },
    },
  })
  @AmisResponse()
  async createApiConfig(
    @Body(ValidationPipe) createDto: CreateApiConfigDto,
    @Headers('user-id') userId: string,
  ) {
    try {
      const config = await this.apiParameterConfigService.createApiConfig({
        ...createDto,
        createdBy: userId,
      });

      return {
        id: config.id,
        path: config.path,
        method: config.method,
        name: config.name,
        version: config.version,
        enabled: config.enabled,
        createdAt: config.createdAt,
        message: '接口配置创建成功',
      };
    } catch (error) {
      throw new BadRequestException('创建接口配置失败: ' + error.message);
    }
  }

  /**
   * 获取接口配置列表
   */
  @Get()
  @ApiOperation({
    summary: '获取接口配置列表',
    description: '分页获取接口配置列表，支持搜索和筛选',
  })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', example: 10 })
  @ApiQuery({ name: 'search', required: false, description: '搜索关键词' })
  @ApiQuery({ name: 'method', required: false, description: 'HTTP方法', enum: ['GET', 'POST', 'PUT', 'DELETE'] })
  @ApiQuery({ name: 'enabled', required: false, description: '是否启用', type: 'boolean' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 0 },
        msg: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            items: { type: 'array', description: '接口配置列表' },
            total: { type: 'number', description: '总数量' },
            page: { type: 'number', description: '当前页码' },
            limit: { type: 'number', description: '每页数量' },
            totalPages: { type: 'number', description: '总页数' },
          },
        },
      },
    },
  })
  @AmisResponse()
  async getApiConfigs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('method') method?: string,
    @Query('enabled') enabled?: boolean,
  ) {
    try {
      const result = await this.apiParameterConfigService.findApiConfigs({
        page,
        limit,
        search,
        method,
        enabled,
      });

      return {
        items: result.data.map(config => ({
          id: config.id,
          path: config.path,
          method: config.method,
          name: config.name,
          description: config.description,
          version: config.version,
          enabled: config.enabled,
          inputParametersCount: config.inputParameters.length,
          outputParametersCount: config.outputParameters.length,
          createdAt: config.createdAt,
          updatedAt: config.updatedAt,
        })),
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      };
    } catch (error) {
      throw new BadRequestException('获取接口配置列表失败: ' + error.message);
    }
  }

  /**
   * 获取接口配置详情
   */
  @Get(':id')
  @ApiOperation({
    summary: '获取接口配置详情',
    description: '根据ID获取接口配置的详细信息',
  })
  @ApiParam({
    name: 'id',
    description: '接口配置ID',
    example: 'api_config_123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
  })
  @AmisResponse()
  async getApiConfig(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const config = await this.apiParameterConfigService.findApiConfigById(id);

      return {
        data: config,
        message: '获取接口配置成功',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('获取接口配置失败: ' + error.message);
    }
  }

  /**
   * 更新接口配置
   */
  @Put(':id')
  @ApiOperation({
    summary: '更新接口配置',
    description: '更新指定的接口配置信息',
  })
  @ApiParam({
    name: 'id',
    description: '接口配置ID',
  })
  @ApiBody({
    type: UpdateApiConfigDto,
    description: '更新的配置信息',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '更新成功',
  })
  @AmisResponse()
  async updateApiConfig(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateDto: UpdateApiConfigDto,
  ) {
    try {
      const config = await this.apiParameterConfigService.updateApiConfig(id, updateDto);

      return {
        data: {
          id: config.id,
          version: config.version,
          updatedAt: config.updatedAt,
        },
        message: '接口配置更新成功',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('更新接口配置失败: ' + error.message);
    }
  }

  /**
   * 删除接口配置
   */
  @Delete(':id')
  @ApiOperation({
    summary: '删除接口配置',
    description: '删除指定的接口配置',
  })
  @ApiParam({
    name: 'id',
    description: '接口配置ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '删除成功',
  })
  @AmisResponse()
  async deleteApiConfig(@Param('id', ParseUUIDPipe) id: string) {
    try {
      await this.apiParameterConfigService.deleteApiConfig(id);

      return {
        message: '接口配置删除成功',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('删除接口配置失败: ' + error.message);
    }
  }

  /**
   * 复制接口配置
   */
  @Post(':id/duplicate')
  @ApiOperation({
    summary: '复制接口配置',
    description: '复制现有的接口配置创建新配置',
  })
  @ApiParam({
    name: 'id',
    description: '源接口配置ID',
  })
  @ApiBody({
    type: DuplicateApiConfigDto,
    description: '复制配置信息',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '复制成功',
  })
  @AmisResponse()
  async duplicateApiConfig(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) duplicateDto: DuplicateApiConfigDto,
  ) {
    try {
      const config = await this.apiParameterConfigService.duplicateApiConfig(
        id,
        duplicateDto.newName,
        duplicateDto.newPath
      );

      return {
        data: {
          id: config.id,
          name: config.name,
          path: config.path,
          method: config.method,
        },
        message: '接口配置复制成功',
      };
    } catch (error) {
      throw new BadRequestException('复制接口配置失败: ' + error.message);
    }
  }

  /**
   * 验证参数
   */
  @Post('validate-parameters')
  @ApiOperation({
    summary: '验证参数',
    description: '根据参数配置验证输入值',
  })
  @ApiBody({
    type: ValidateParametersDto,
    description: '参数验证信息',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '验证完成',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 0 },
        msg: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            isValid: { type: 'boolean', description: '是否验证通过' },
            errors: { type: 'array', description: '验证错误列表' },
            transformedValues: { type: 'object', description: '转换后的值' },
          },
        },
      },
    },
  })
  @AmisResponse()
  async validateParameters(@Body(ValidationPipe) validateDto: ValidateParametersDto) {
    try {
      const result = await this.apiParameterConfigService.validateParameters(
        validateDto.parameters,
        validateDto.values
      );

      return {
        data: result,
        message: result.isValid ? '参数验证通过' : '参数验证失败',
      };
    } catch (error) {
      throw new BadRequestException('参数验证失败: ' + error.message);
    }
  }

  /**
   * 生成Joi验证Schema
   */
  @Post(':id/generate-joi-schema')
  @ApiOperation({
    summary: '生成Joi验证Schema',
    description: '根据接口配置生成Joi验证Schema代码',
  })
  @ApiParam({
    name: 'id',
    description: '接口配置ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '生成成功',
  })
  @AmisResponse()
  async generateJoiSchema(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const config = await this.apiParameterConfigService.findApiConfigById(id);

      const inputSchema = this.apiParameterConfigService.generateJoiSchema(config.inputParameters);
      const outputSchema = this.apiParameterConfigService.generateJoiSchema(config.outputParameters);

      return {
        data: {
          inputSchema: inputSchema.describe(),
          outputSchema: outputSchema.describe(),
          inputSchemaCode: this.generateJoiSchemaCode(config.inputParameters, 'input'),
          outputSchemaCode: this.generateJoiSchemaCode(config.outputParameters, 'output'),
        },
        message: 'Joi Schema生成成功',
      };
    } catch (error) {
      throw new BadRequestException('生成Joi Schema失败: ' + error.message);
    }
  }

  /**
   * 生成OpenAPI Schema
   */
  @Post(':id/generate-openapi-schema')
  @ApiOperation({
    summary: '生成OpenAPI Schema',
    description: '根据接口配置生成OpenAPI Schema定义',
  })
  @ApiParam({
    name: 'id',
    description: '接口配置ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '生成成功',
  })
  @AmisResponse()
  async generateOpenApiSchema(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const config = await this.apiParameterConfigService.findApiConfigById(id);

      const inputSchema = this.apiParameterConfigService.generateOpenApiSchema(config.inputParameters);
      const outputSchema = this.apiParameterConfigService.generateOpenApiSchema(config.outputParameters);

      return {
        data: {
          inputSchema,
          outputSchema,
          fullApiSpec: this.generateFullOpenApiSpec(config, inputSchema, outputSchema),
        },
        message: 'OpenAPI Schema生成成功',
      };
    } catch (error) {
      throw new BadRequestException('生成OpenAPI Schema失败: ' + error.message);
    }
  }

  /**
   * 生成接口文档
   */
  @Get(':id/documentation')
  @ApiOperation({
    summary: '生成接口文档',
    description: '生成接口的详细文档',
  })
  @ApiParam({
    name: 'id',
    description: '接口配置ID',
  })
  @ApiQuery({
    name: 'format',
    required: false,
    description: '文档格式',
    enum: ['html', 'markdown', 'json'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '生成成功',
  })
  @AmisResponse()
  async generateDocumentation(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('format') format: 'html' | 'markdown' | 'json' = 'json',
  ) {
    try {
      const config = await this.apiParameterConfigService.findApiConfigById(id);
      const documentation = this.apiParameterConfigService.generateApiDocumentation(config);

      let formattedDoc: any;
      switch (format) {
        case 'html':
          formattedDoc = this.generateHtmlDocumentation(documentation);
          break;
        case 'markdown':
          formattedDoc = this.generateMarkdownDocumentation(documentation);
          break;
        default:
          formattedDoc = documentation;
      }

      return {
        data: {
          format,
          documentation: formattedDoc,
          generatedAt: new Date().toISOString(),
        },
        message: '接口文档生成成功',
      };
    } catch (error) {
      throw new BadRequestException('生成接口文档失败: ' + error.message);
    }
  }

  /**
   * 获取参数模板
   */
  @Get('templates/parameters')
  @ApiOperation({
    summary: '获取参数模板',
    description: '获取预定义的参数配置模板',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: '参数类型',
    enum: ['string', 'number', 'boolean', 'date', 'array', 'object', 'enum'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
  })
  @AmisResponse()
  async getParameterTemplates(@Query('type') type?: string) {
    try {
      const templates = this.apiParameterConfigService.getParameterTemplates();

      const filteredTemplates = type
        ? Object.fromEntries(
            Object.entries(templates).filter(([_, template]) => template.type === type)
          )
        : templates;

      return {
        data: {
          templates: filteredTemplates,
          total: Object.keys(filteredTemplates).length,
          types: [...new Set(Object.values(templates).map(t => t.type))],
        },
        message: '参数模板获取成功',
      };
    } catch (error) {
      throw new BadRequestException('获取参数模板失败: ' + error.message);
    }
  }

  /**
   * 获取响应格式模板
   */
  @Get('templates/response-formats')
  @ApiOperation({
    summary: '获取响应格式模板',
    description: '获取预定义的响应格式模板',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
  })
  @AmisResponse()
  async getResponseFormatTemplates() {
    try {
      const templates = this.apiParameterConfigService.getResponseFormatTemplates();

      return {
        data: {
          templates,
          total: Object.keys(templates).length,
        },
        message: '响应格式模板获取成功',
      };
    } catch (error) {
      throw new BadRequestException('获取响应格式模板失败: ' + error.message);
    }
  }

  /**
   * 导入接口配置
   */
  @Post('import')
  @ApiOperation({
    summary: '导入接口配置',
    description: '批量导入接口配置',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        configs: {
          type: 'array',
          items: { type: 'object' },
          description: '接口配置列表',
        },
        overwrite: {
          type: 'boolean',
          description: '是否覆盖已存在的配置',
          default: false,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '导入完成',
  })
  @AmisResponse()
  async importApiConfigs(@Body() body: {
    configs: ApiConfig[];
    overwrite?: boolean;
  }) {
    try {
      const result = await this.apiParameterConfigService.importApiConfigs(body.configs);

      return {
        data: {
          success: result.success,
          failed: result.failed,
          errors: result.errors,
          total: body.configs.length,
        },
        message: `导入完成: 成功 ${result.success} 个，失败 ${result.failed} 个`,
      };
    } catch (error) {
      throw new BadRequestException('导入接口配置失败: ' + error.message);
    }
  }

  /**
   * 导出接口配置
   */
  @Post('export')
  @ApiOperation({
    summary: '导出接口配置',
    description: '导出指定的接口配置',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
          description: '要导出的配置ID列表，为空则导出全部',
        },
        format: {
          type: 'string',
          enum: ['json', 'yaml'],
          description: '导出格式',
          default: 'json',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '导出成功',
  })
  @AmisResponse()
  async exportApiConfigs(@Body() body: {
    ids?: string[];
    format?: 'json' | 'yaml';
  }) {
    try {
      const configs = await this.apiParameterConfigService.exportApiConfigs(body.ids);

      let exportData: any;
      const format = body.format || 'json';

      if (format === 'yaml') {
        // 这里可以使用yaml库转换
        exportData = configs; // 简化处理，实际应该转换为YAML格式
      } else {
        exportData = configs;
      }

      return {
        data: {
          configs: exportData,
          format,
          total: configs.length,
          exportedAt: new Date().toISOString(),
        },
        message: `导出成功: ${configs.length} 个配置`,
      };
    } catch (error) {
      throw new BadRequestException('导出接口配置失败: ' + error.message);
    }
  }

  /**
   * 生成Joi Schema代码
   */
  private generateJoiSchemaCode(parameters: ParameterConfig[], prefix: string): string {
    const schemaLines: string[] = [];
    schemaLines.push(`const ${prefix}Schema = Joi.object({`);

    for (const param of parameters) {
      let schemaLine = `  ${param.name}: `;

      switch (param.type) {
        case 'string':
          schemaLine += 'Joi.string()';
          break;
        case 'number':
          schemaLine += 'Joi.number()';
          break;
        case 'boolean':
          schemaLine += 'Joi.boolean()';
          break;
        case 'date':
        case 'datetime':
          schemaLine += 'Joi.date()';
          break;
        case 'array':
          schemaLine += 'Joi.array()';
          break;
        case 'object':
          schemaLine += 'Joi.object()';
          break;
        case 'enum':
          if (param.enumOptions) {
            const values = param.enumOptions.map(opt => `'${opt.value}'`).join(', ');
            schemaLine += `Joi.valid(${values})`;
          } else {
            schemaLine += 'Joi.any()';
          }
          break;
        default:
          schemaLine += 'Joi.any()';
      }

      // 添加验证规则
      for (const rule of param.validationRules) {
        if (!rule.enabled) continue;

        switch (rule.type) {
          case 'required':
            schemaLine += '.required()';
            break;
          case 'minLength':
          case 'min':
            schemaLine += `.min(${rule.value})`;
            break;
          case 'maxLength':
          case 'max':
            schemaLine += `.max(${rule.value})`;
            break;
          case 'pattern':
            schemaLine += `.pattern(/${rule.value}/)`;
            break;
          case 'email':
            schemaLine += '.email()';
            break;
          case 'url':
            schemaLine += '.uri()';
            break;
        }
      }

      if (param.defaultValue !== undefined) {
        schemaLine += `.default(${JSON.stringify(param.defaultValue)})`;
      }

      if (!param.required) {
        schemaLine += '.optional()';
      }

      schemaLine += ',';
      schemaLines.push(schemaLine);
    }

    schemaLines.push('});');
    return schemaLines.join('\n');
  }

  /**
   * 生成完整的OpenAPI规范
   */
  private generateFullOpenApiSpec(config: ApiConfig, inputSchema: any, outputSchema: any): any {
    return {
      paths: {
        [config.path]: {
          [config.method.toLowerCase()]: {
            summary: config.name,
            description: config.description,
            parameters: config.method === 'GET' ? this.generateOpenApiParameters(config.inputParameters) : undefined,
            requestBody: config.method !== 'GET' ? {
              required: true,
              content: {
                'application/json': {
                  schema: inputSchema,
                },
              },
            } : undefined,
            responses: {
              '200': {
                description: '成功响应',
                content: {
                  'application/json': {
                    schema: outputSchema,
                  },
                },
              },
              '400': {
                description: '请求参数错误',
              },
              '500': {
                description: '服务器内部错误',
              },
            },
            tags: [config.name.split(' ')[0] || 'API'],
          },
        },
      },
    };
  }

  /**
   * 生成OpenAPI参数
   */
  private generateOpenApiParameters(parameters: ParameterConfig[]): any[] {
    return parameters.map(param => ({
      name: param.name,
      in: 'query',
      description: param.description,
      required: param.required,
      schema: {
        type: this.mapTypeToOpenApi(param.type),
        default: param.defaultValue,
        example: param.example,
      },
    }));
  }

  /**
   * 映射类型到OpenAPI
   */
  private mapTypeToOpenApi(type: string): string {
    switch (type) {
      case 'string':
      case 'enum':
        return 'string';
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'date':
      case 'datetime':
        return 'string';
      case 'array':
        return 'array';
      case 'object':
        return 'object';
      default:
        return 'string';
    }
  }

  /**
   * 生成HTML文档
   */
  private generateHtmlDocumentation(documentation: any): string {
    // 简化的HTML生成，实际应该使用模板引擎
    return `
      <html>
        <head><title>${documentation.name}</title></head>
        <body>
          <h1>${documentation.name}</h1>
          <p>${documentation.description}</p>
          <h2>请求参数</h2>
          <pre>${JSON.stringify(documentation.parameters.input, null, 2)}</pre>
          <h2>响应参数</h2>
          <pre>${JSON.stringify(documentation.parameters.output, null, 2)}</pre>
        </body>
      </html>
    `;
  }

  /**
   * 生成Markdown文档
   */
  private generateMarkdownDocumentation(documentation: any): string {
    const lines: string[] = [];
    lines.push(`# ${documentation.name}`);
    lines.push('');
    lines.push(documentation.description || '');
    lines.push('');
    lines.push(`**路径:** \`${documentation.method} ${documentation.path}\``);
    lines.push('');
    lines.push('## 请求参数');
    lines.push('');
    lines.push('| 参数名 | 类型 | 必填 | 描述 |');
    lines.push('|--------|------|------|------|');

    for (const param of documentation.parameters.input) {
      lines.push(`| ${param.name} | ${param.type} | ${param.required ? '是' : '否'} | ${param.description || ''} |`);
    }

    lines.push('');
    lines.push('## 响应参数');
    lines.push('');
    lines.push('| 参数名 | 类型 | 描述 |');
    lines.push('|--------|------|------|');

    for (const param of documentation.parameters.output) {
      lines.push(`| ${param.name} | ${param.type} | ${param.description || ''} |`);
    }

    return lines.join('\n');
  }
}
