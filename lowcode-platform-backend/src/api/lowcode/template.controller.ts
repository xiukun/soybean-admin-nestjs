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
  Req,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateResponseDto,
  TemplateListQueryDto,
  TemplateListResponseDto,
  TemplateVersionDto,
  TemplateCategory,
  TemplateLanguage,
  TemplateFramework,
  TemplateStatus,
} from '@api/lowcode/dto/template.dto';
import {
  GetTemplatesQuery,
  GetTemplateByIdQuery,
  GetTemplateByCodeQuery,
  GetTemplateVersionsQuery,
} from '@lib/bounded-contexts/template/application/queries/get-templates.query';
import {
  CreateTemplateCommand,
  UpdateTemplateCommand,
  DeleteTemplateCommand,
  CreateTemplateVersionCommand,
  RestoreTemplateVersionCommand,
} from '@lib/bounded-contexts/template/application/commands/template.commands';

@ApiTags('templates')
@ApiBearerAuth()
@Controller({ path: 'templates', version: '1' })
export class TemplateController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new template' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Template created successfully',
    type: TemplateResponseDto,
  })
  async createTemplate(@Body() createTemplateDto: CreateTemplateDto, @Req() req: any): Promise<any> {
    const command = new CreateTemplateCommand({
      name: createTemplateDto.name,
      code: `${createTemplateDto.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      type: createTemplateDto.category === 'CONTROLLER' ? 'ENTITY_CONTROLLER' :
            createTemplateDto.category === 'SERVICE' ? 'ENTITY_SERVICE' :
            createTemplateDto.category === 'DTO' ? 'ENTITY_DTO' :
            createTemplateDto.category === 'MODEL' ? 'ENTITY_MODEL' :
            'API_CONTROLLER', // 映射category到正确的type值
      category: createTemplateDto.category,
      language: createTemplateDto.language,
      framework: createTemplateDto.framework,
      description: createTemplateDto.description,
      content: createTemplateDto.content,
      variables: createTemplateDto.variables || [],
      tags: createTemplateDto.tags || [],
      isPublic: createTemplateDto.isPublic || false,
      createdBy: req.user?.uid || 'system',
    });

    const template = await this.commandBus.execute(command);

    return {
      status: 0,
      msg: 'success',
      data: template,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all templates' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Templates retrieved successfully',
    type: TemplateListResponseDto,
  })
  async getTemplates(@Query() query: TemplateListQueryDto): Promise<any> {
    const templatesQuery = new GetTemplatesQuery(
      {
        category: query.category,
        language: query.language,
        framework: query.framework,
        status: query.status === TemplateStatus.PUBLISHED ? 'ACTIVE' : 'INACTIVE',
        search: query.search,
      },
      {
        page: query.current || 1,
        limit: query.size || 10,
        orderBy: 'createdAt',
        orderDir: 'desc',
      },
    );

    const result = await this.queryBus.execute(templatesQuery);

    return {
      status: 0,
      msg: 'success',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template found',
    type: TemplateResponseDto,
  })
  async getTemplateById(@Param('id') id: string): Promise<any> {
    const query = new GetTemplateByIdQuery(id);
    const template = await this.queryBus.execute(query);

    if (!template) {
      return {
        status: 404,
        msg: 'Template not found',
        data: null,
      };
    }

    return {
      status: 0,
      msg: 'success',
      data: template,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template updated successfully',
    type: TemplateResponseDto,
  })
  async updateTemplate(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
    @Req() req: any,
  ): Promise<any> {
    const command = new UpdateTemplateCommand(id, {
      name: updateTemplateDto.name,
      category: updateTemplateDto.category,
      language: updateTemplateDto.language,
      framework: updateTemplateDto.framework,
      description: updateTemplateDto.description,
      content: updateTemplateDto.content,
      variables: updateTemplateDto.variables,
      tags: updateTemplateDto.tags,
      isPublic: updateTemplateDto.isPublic,
      updatedBy: req.user?.uid || 'system',
    });

    const template = await this.commandBus.execute(command);

    return {
      status: 0,
      msg: 'success',
      data: template,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template deleted successfully',
  })
  async deleteTemplate(@Param('id') id: string, @Req() req: any): Promise<any> {
    const command = new DeleteTemplateCommand(id, req.user?.uid || 'system');
    await this.commandBus.execute(command);

    return {
      status: 0,
      msg: 'success',
      data: null,
    };
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get all templates by project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Templates found',
    type: [TemplateResponseDto],
  })
  async getTemplatesByProject(@Param('projectId') projectId: string): Promise<TemplateResponseDto[]> {
    // TODO: Implement get templates by project query
    throw new Error('Not implemented yet');
  }

  @Get('project/:projectId/paginated')
  @ApiOperation({ summary: 'Get paginated templates by project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated templates found',
    type: TemplateListResponseDto,
  })
  async getTemplatesByProjectPaginated(
    @Param('projectId') projectId: string,
    @Query() query: TemplateListQueryDto,
  ): Promise<TemplateListResponseDto> {
    // TODO: Implement get paginated templates by project query
    
    // 临时返回模拟数据
    return {
      records: [
        {
          id: 'template-1',
          projectId,
          name: 'Basic Controller Template',
          description: 'A basic NestJS controller template',
          category: TemplateCategory.CONTROLLER,
          language: TemplateLanguage.TYPESCRIPT,
          framework: TemplateFramework.NESTJS,
          content: `import { Controller, Get } from '@nestjs/common';

@Controller('{{entityName}}')
export class {{pascalCase entityName}}Controller {
  @Get()
  findAll() {
    return 'This action returns all {{entityName}}';
  }
}`,
          variables: [
            {
              name: 'entityName',
              type: 'string',
              description: 'Entity name',
              required: true,
            },
          ],
          tags: ['controller', 'nestjs'],
          isPublic: true,
          status: TemplateStatus.PUBLISHED,
          versions: [],
          currentVersion: '1.0.0',
          usageCount: 5,
          rating: 4.5,
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'template-2',
          projectId,
          name: 'Basic Service Template',
          description: 'A basic NestJS service template',
          category: TemplateCategory.SERVICE,
          language: TemplateLanguage.TYPESCRIPT,
          framework: TemplateFramework.NESTJS,
          content: `import { Injectable } from '@nestjs/common';

@Injectable()
export class {{pascalCase entityName}}Service {
  findAll() {
    return 'This action returns all {{entityName}}';
  }
}`,
          variables: [
            {
              name: 'entityName',
              type: 'string',
              description: 'Entity name',
              required: true,
            },
          ],
          tags: ['service', 'nestjs'],
          isPublic: true,
          status: TemplateStatus.PUBLISHED,
          versions: [],
          currentVersion: '1.0.0',
          usageCount: 3,
          rating: 4.0,
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      total: 2,
      current: query.current || 1,
      size: query.size || 10,
    };
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template published successfully',
    type: TemplateResponseDto,
  })
  async publishTemplate(@Param('id') id: string): Promise<any> {
    const { PublishTemplateCommand } = await import('@lib/bounded-contexts/template/application/commands/update-template.command');

    const command = new PublishTemplateCommand(
      id,
      'system', // TODO: Get from authenticated user
    );

    await this.commandBus.execute(command);

    return {
      status: 0,
      msg: 'success',
      data: { id },
    };
  }

  @Post(':id/versions')
  @ApiOperation({ summary: 'Create template version' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Template version created successfully',
    type: TemplateResponseDto,
  })
  async createTemplateVersion(
    @Param('id') id: string,
    @Body() versionData: any,
  ): Promise<any> {
    const { CreateTemplateVersionCommand } = await import('@lib/bounded-contexts/template/application/commands/update-template.command');

    const command = new CreateTemplateVersionCommand(
      id,
      versionData.version,
      versionData.content,
      versionData.variables || [],
      versionData.changelog,
      'system', // TODO: Get from authenticated user
    );

    await this.commandBus.execute(command);

    return {
      status: 0,
      msg: 'success',
      data: { id, version: versionData.version },
    };
  }

  @Post(':id/validate')
  @ApiOperation({ summary: 'Validate template content' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template validation result',
  })
  async validateTemplate(
    @Param('id') id: string,
    @Body() validationData: { content: string; variables: any[] },
  ): Promise<any> {
    try {
      const { TemplateEngineService } = await import('@lib/bounded-contexts/code-generation/infrastructure/template-engine.service');
      const templateEngine = new TemplateEngineService();

      // Generate sample data for validation
      const sampleData: Record<string, any> = {};
      validationData.variables.forEach(variable => {
        switch (variable.type) {
          case 'string':
            sampleData[variable.name] = variable.defaultValue || 'SampleString';
            break;
          case 'number':
          case 'integer':
            sampleData[variable.name] = variable.defaultValue || 42;
            break;
          case 'boolean':
            sampleData[variable.name] = variable.defaultValue !== undefined ? variable.defaultValue : true;
            break;
          case 'array':
            sampleData[variable.name] = variable.defaultValue || ['item1', 'item2'];
            break;
          case 'object':
            sampleData[variable.name] = variable.defaultValue || { key: 'value' };
            break;
          default:
            sampleData[variable.name] = variable.defaultValue || 'defaultValue';
        }
      });

      // Test compile
      const compiledContent = templateEngine.compileTemplateFromString(validationData.content, sampleData);

      return {
        status: 0,
        msg: 'success',
        data: {
          isValid: true,
          compiledContent,
          sampleData,
          errors: [],
        },
      };
    } catch (error) {
      return {
        status: 1,
        msg: 'Validation failed',
        data: {
          isValid: false,
          errors: [error.message],
        },
      };
    }
  }
}
