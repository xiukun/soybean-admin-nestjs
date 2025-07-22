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
  Logger,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AmisResponse } from '@decorators/amis-response.decorator';
import { AmisResponseInterceptor } from '@interceptors/amis-response.interceptor';
import { 
  TargetProjectService, 
  TargetProject, 
  CreateTargetProjectDto, 
  UpdateTargetProjectDto 
} from '@lib/code-generation/services/target-project.service';

@ApiTags('Target Projects')
@Controller('api/v1/target-projects')
@ApiBearerAuth()
@UseInterceptors(AmisResponseInterceptor)
export class TargetProjectController {
  private readonly logger = new Logger(TargetProjectController.name);

  constructor(private readonly targetProjectService: TargetProjectService) {}

  @Get()
  @AmisResponse({
    description: 'Get all target projects',
    dataKey: 'projects'
  })
  @ApiOperation({ summary: 'Get all target projects' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Target projects retrieved successfully',
  })
  async findAll(): Promise<TargetProject[]> {
    try {
      return await this.targetProjectService.findAll();
    } catch (error) {
      this.logger.error('Failed to get target projects:', error);
      throw error;
    }
  }

  @Get(':id')
  @AmisResponse({
    description: 'Get target project by ID',
    dataKey: 'project'
  })
  @ApiOperation({ summary: 'Get target project by ID' })
  @ApiParam({ name: 'id', description: 'Target project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Target project retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Target project not found',
  })
  async findById(@Param('id') id: string): Promise<TargetProject> {
    try {
      const project = await this.targetProjectService.findById(id);
      if (!project) {
        throw new Error(`Target project not found: ${id}`);
      }
      return project;
    } catch (error) {
      this.logger.error(`Failed to get target project ${id}:`, error);
      throw error;
    }
  }

  @Post()
  @AmisResponse({
    description: 'Create new target project',
    dataKey: 'project'
  })
  @ApiOperation({ summary: 'Create new target project' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'my-project' },
        displayName: { type: 'string', example: 'My Project' },
        description: { type: 'string', example: 'My custom project' },
        path: { type: 'string', example: '/path/to/project' },
        type: { type: 'string', enum: ['nestjs', 'react', 'vue', 'angular', 'other'] },
        framework: { type: 'string', example: 'NestJS' },
        language: { type: 'string', enum: ['typescript', 'javascript', 'other'] },
        config: { type: 'object' },
      },
      required: ['name', 'displayName', 'path', 'type', 'framework', 'language'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Target project created successfully',
  })
  async create(@Body() dto: CreateTargetProjectDto): Promise<TargetProject> {
    try {
      return await this.targetProjectService.create(dto);
    } catch (error) {
      this.logger.error('Failed to create target project:', error);
      throw error;
    }
  }

  @Put(':id')
  @AmisResponse({
    description: 'Update target project',
    dataKey: 'project'
  })
  @ApiOperation({ summary: 'Update target project' })
  @ApiParam({ name: 'id', description: 'Target project ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        displayName: { type: 'string' },
        description: { type: 'string' },
        path: { type: 'string' },
        type: { type: 'string', enum: ['nestjs', 'react', 'vue', 'angular', 'other'] },
        framework: { type: 'string' },
        language: { type: 'string', enum: ['typescript', 'javascript', 'other'] },
        status: { type: 'string', enum: ['active', 'inactive'] },
        config: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Target project updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTargetProjectDto,
  ): Promise<TargetProject> {
    try {
      return await this.targetProjectService.update(id, dto);
    } catch (error) {
      this.logger.error(`Failed to update target project ${id}:`, error);
      throw error;
    }
  }

  @Delete(':id')
  @AmisResponse({
    description: 'Delete target project',
    dataKey: 'result'
  })
  @ApiOperation({ summary: 'Delete target project' })
  @ApiParam({ name: 'id', description: 'Target project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Target project deleted successfully',
  })
  async delete(@Param('id') id: string): Promise<{ success: boolean }> {
    try {
      await this.targetProjectService.delete(id);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete target project ${id}:`, error);
      throw error;
    }
  }

  @Get(':id/validate')
  @AmisResponse({
    description: 'Validate target project',
    dataKey: 'validation'
  })
  @ApiOperation({ summary: 'Validate target project configuration' })
  @ApiParam({ name: 'id', description: 'Target project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Target project validation completed',
  })
  async validate(@Param('id') id: string): Promise<{ valid: boolean; errors: string[] }> {
    try {
      return await this.targetProjectService.validate(id);
    } catch (error) {
      this.logger.error(`Failed to validate target project ${id}:`, error);
      throw error;
    }
  }

  @Get(':id/statistics')
  @AmisResponse({
    description: 'Get target project statistics',
    dataKey: 'statistics'
  })
  @ApiOperation({ summary: 'Get target project statistics' })
  @ApiParam({ name: 'id', description: 'Target project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Target project statistics retrieved successfully',
  })
  async getStatistics(@Param('id') id: string): Promise<any> {
    try {
      return await this.targetProjectService.getStatistics(id);
    } catch (error) {
      this.logger.error(`Failed to get statistics for target project ${id}:`, error);
      throw error;
    }
  }

  @Get('by-name/:name')
  @AmisResponse({
    description: 'Get target project by name',
    dataKey: 'project'
  })
  @ApiOperation({ summary: 'Get target project by name' })
  @ApiParam({ name: 'name', description: 'Target project name' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Target project retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Target project not found',
  })
  async findByName(@Param('name') name: string): Promise<TargetProject> {
    try {
      const project = await this.targetProjectService.findByName(name);
      if (!project) {
        throw new Error(`Target project not found: ${name}`);
      }
      return project;
    } catch (error) {
      this.logger.error(`Failed to get target project ${name}:`, error);
      throw error;
    }
  }

  @Get('types/supported')
  @AmisResponse({
    description: 'Get supported project types',
    dataKey: 'types'
  })
  @ApiOperation({ summary: 'Get supported project types' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Supported project types retrieved successfully',
  })
  async getSupportedTypes(): Promise<any[]> {
    return [
      {
        type: 'nestjs',
        displayName: 'NestJS',
        description: 'Node.js framework for building scalable server-side applications',
        language: 'typescript',
        features: ['crud-operations', 'batch-operations', 'amis-integration', 'prisma-orm', 'swagger-docs'],
      },
      {
        type: 'react',
        displayName: 'React',
        description: 'JavaScript library for building user interfaces',
        language: 'typescript',
        features: ['components', 'hooks', 'routing'],
      },
      {
        type: 'vue',
        displayName: 'Vue.js',
        description: 'Progressive JavaScript framework',
        language: 'typescript',
        features: ['components', 'composition-api', 'routing'],
      },
      {
        type: 'angular',
        displayName: 'Angular',
        description: 'Platform for building mobile and desktop web applications',
        language: 'typescript',
        features: ['components', 'services', 'routing', 'forms'],
      },
      {
        type: 'other',
        displayName: 'Other',
        description: 'Generic project type for custom configurations',
        language: 'typescript',
        features: ['basic-generation'],
      },
    ];
  }
}
