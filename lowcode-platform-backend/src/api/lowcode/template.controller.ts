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
  TemplateCategory,
  TemplateLanguage,
  TemplateFramework,
  TemplateStatus,
} from '@api/lowcode/dto/template.dto';

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
  async createTemplate(@Body() createTemplateDto: CreateTemplateDto): Promise<any> {
    const { CreateTemplateCommand } = await import('@lib/bounded-contexts/template/application/commands/create-template.command');

    const command = new CreateTemplateCommand(
      createTemplateDto.projectId,
      createTemplateDto.name,
      createTemplateDto.description,
      createTemplateDto.category,
      createTemplateDto.language,
      createTemplateDto.framework,
      createTemplateDto.content,
      createTemplateDto.variables || [],
      createTemplateDto.tags || [],
      createTemplateDto.isPublic || false,
      'system', // TODO: Get from authenticated user
    );

    const templateId = await this.commandBus.execute(command);

    return {
      status: 0,
      msg: 'success',
      data: { id: templateId },
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
  async getTemplateById(@Param('id') id: string): Promise<TemplateResponseDto> {
    // TODO: Implement get template query
    throw new Error('Not implemented yet');
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
  ): Promise<any> {
    const { UpdateTemplateCommand } = await import('@lib/bounded-contexts/template/application/commands/update-template.command');

    const command = new UpdateTemplateCommand(
      id,
      updateTemplateDto.name,
      updateTemplateDto.description,
      updateTemplateDto.category,
      updateTemplateDto.language,
      updateTemplateDto.framework,
      updateTemplateDto.content,
      updateTemplateDto.variables,
      updateTemplateDto.tags,
      updateTemplateDto.isPublic,
      'system', // TODO: Get from authenticated user
    );

    await this.commandBus.execute(command);

    return {
      status: 0,
      msg: 'success',
      data: { id },
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Template deleted successfully',
  })
  async deleteTemplate(@Param('id') id: string): Promise<void> {
    // TODO: Implement delete template command
    throw new Error('Not implemented yet');
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
