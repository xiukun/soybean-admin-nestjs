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
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { TemplateIntegrationService } from '@lib/bounded-contexts/template/application/services/template-integration.service';
import { CodeGenerationRequest } from '@lib/bounded-contexts/template/application/services/code-generation.service';
import { TemplateValidationService, TemplateTestCase } from '../../modules/template/services/template-validation.service';
import { Public, GlobalApiJwtAuth } from '../../shared/decorators/api-jwt-auth.decorator';
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
@GlobalApiJwtAuth()
@Controller({ path: 'templates', version: '1' })
export class TemplateController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly prisma: PrismaService,
    private readonly templateIntegration: TemplateIntegrationService,
    private readonly templateValidation: TemplateValidationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all templates' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Templates retrieved successfully',
    type: [TemplateResponseDto],
  })
  async findAll(@Query() query?: { language?: string; framework?: string; type?: string }): Promise<any> {
    try {
      const where: any = {};

      if (query?.language) {
        where.language = query.language;
      }
      if (query?.framework) {
        where.framework = query.framework;
      }
      if (query?.type) {
        where.type = query.type;
      }

      const templates = await this.prisma.codeTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      return {
        status: 0,
        msg: 'success',
        data: templates
      };
    } catch (error) {
      return {
        status: 1,
        msg: error.message,
        data: null
      };
    }
  }

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

  @Public()
  @Post(':id/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate template syntax and variables' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template validation result',
  })
  async validateTemplate(@Param('id') id: string, @Body() validationData?: any): Promise<any> {
    try {
      // 获取模板内容
      const template = await this.prisma.codeTemplate.findUnique({
        where: { id }
      });

      if (!template) {
        return {
          status: 1,
          msg: 'Template not found',
          data: null
        };
      }

      // 使用验证服务验证模板
      const validationResult = await this.templateValidation.validateTemplate(
        template.template,
        template.type
      );

      return {
        status: 0,
        msg: 'success',
        data: validationResult
      };
    } catch (error) {
      return {
        status: 1,
        msg: 'Validation failed',
        data: {
          isValid: false,
          errors: [error.message]
        }
      };
    }
  }

  @Public()
  @Post(':id/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test template with test cases' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template test results',
  })
  async testTemplate(@Param('id') id: string, @Body() testData: {
    testCases?: TemplateTestCase[];
    generateDefaultTests?: boolean;
  }): Promise<any> {
    try {
      // 获取模板内容
      const template = await this.prisma.codeTemplate.findUnique({
        where: { id }
      });

      if (!template) {
        return {
          status: 1,
          msg: 'Template not found',
          data: null
        };
      }

      let testCases = testData.testCases || [];

      // 如果没有提供测试用例，生成默认测试用例
      if (testCases.length === 0 || testData.generateDefaultTests) {
        // 先验证模板以获取变量信息
        const validationResult = await this.templateValidation.validateTemplate(
          template.template,
          template.type
        );

        const defaultTestCases = this.templateValidation.generateDefaultTestCases(
          validationResult.variables
        );

        testCases = testData.generateDefaultTests ?
          [...defaultTestCases, ...testCases] :
          defaultTestCases;
      }

      // 执行测试
      const testResults = await this.templateValidation.testTemplate(
        template.template,
        testCases
      );

      return {
        status: 0,
        msg: 'success',
        data: {
          templateId: id,
          templateName: template.name,
          totalTests: testResults.length,
          passedTests: testResults.filter(r => r.passed).length,
          failedTests: testResults.filter(r => !r.passed).length,
          results: testResults
        }
      };
    } catch (error) {
      return {
        status: 1,
        msg: 'Test execution failed',
        data: {
          error: error.message
        }
      };
    }
  }

  @Public()
  @Post(':id/preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Preview generated code from template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Generated code preview',
  })
  async previewTemplate(
    @Param('id') id: string,
    @Body() previewData: { entityId?: string; variables?: Record<string, any> }
  ): Promise<any> {
    try {
      const previewResult = await this.templateIntegration.previewTemplate(
        id,
        previewData.entityId,
        previewData.variables
      );

      return {
        status: 0,
        msg: 'success',
        data: previewResult
      };
    } catch (error) {
      return {
        status: 1,
        msg: error.message,
        data: null
      };
    }
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template published successfully',
  })
  async publishTemplate(@Param('id') id: string): Promise<any> {
    try {
      // Validate template before publishing
      const validationResult = await this.templateIntegration.validateTemplate(id);
      if (!validationResult.isValid) {
        return {
          status: 1,
          msg: 'Template validation failed',
          data: validationResult
        };
      }

      // Update template status
      const updatedTemplate = await this.prisma.codeTemplate.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          updatedAt: new Date()
        }
      });

      return {
        status: 0,
        msg: 'Template published successfully',
        data: { id: updatedTemplate.id, status: updatedTemplate.status }
      };
    } catch (error) {
      return {
        status: 1,
        msg: error.message,
        data: null
      };
    }
  }

  @Public()
  @Post(':id/generate')
  @ApiOperation({ summary: 'Generate code from template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Code generation result',
  })
  async generateCode(@Param('id') id: string, @Body() generateRequest: {
    variables: Record<string, any>;
    outputPath?: string;
    projectType?: 'amis-lowcode' | 'nestjs' | 'vue' | 'react';
    generateOptions?: {
      includeBase?: boolean;
      includeBiz?: boolean;
      overwriteExisting?: boolean;
      createDirectories?: boolean;
    };
  }): Promise<any> {
    try {
      const request: CodeGenerationRequest = {
        templateId: id,
        variables: generateRequest.variables,
        outputPath: generateRequest.outputPath || '/tmp/generated',
        projectType: generateRequest.projectType || 'amis-lowcode',
        generateOptions: generateRequest.generateOptions || {
          includeBase: true,
          includeBiz: true,
          overwriteExisting: false,
          createDirectories: false,
        },
      };

      const result = await this.templateIntegration.generateBusinessCode(request);

      return {
        status: 0,
        msg: 'success',
        data: result,
      };
    } catch (error) {
      return {
        status: 1,
        msg: error.message,
        data: null,
      };
    }
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




}
