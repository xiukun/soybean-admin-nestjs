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
  async createTemplate(@Body() createTemplateDto: CreateTemplateDto): Promise<TemplateResponseDto> {
    // TODO: Implement create template command
    throw new Error('Not implemented yet');
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
  ): Promise<TemplateResponseDto> {
    // TODO: Implement update template command
    throw new Error('Not implemented yet');
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
  async publishTemplate(@Param('id') id: string): Promise<TemplateResponseDto> {
    // TODO: Implement publish template command
    throw new Error('Not implemented yet');
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
  ): Promise<TemplateResponseDto> {
    // TODO: Implement create template version command
    throw new Error('Not implemented yet');
  }
}
