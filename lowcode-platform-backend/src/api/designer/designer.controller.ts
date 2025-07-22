import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AmisResponse } from '@decorators/amis-response.decorator';
import { ServiceRegistry, DesignerDataDTO, MicroserviceCall } from '@lib/shared/microservices/service-registry';

interface DesignerEntity {
  id: string;
  name: string;
  code: string;
  description?: string;
  position: { x: number; y: number };
  fields: DesignerField[];
  relationships: DesignerRelationship[];
  config: any;
}

interface DesignerField {
  id: string;
  name: string;
  code: string;
  type: string;
  required: boolean;
  defaultValue?: any;
  validation?: any;
  position?: { x: number; y: number };
}

interface DesignerRelationship {
  id: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  sourceEntityId: string;
  targetEntityId: string;
  sourceFieldId?: string;
  targetFieldId?: string;
  points: { x: number; y: number }[];
}

interface DesignerProject {
  id: string;
  name: string;
  description?: string;
  entities: DesignerEntity[];
  canvas: {
    zoom: number;
    offset: { x: number; y: number };
    grid: boolean;
  };
  metadata: any;
}

@ApiTags('Visual Designer')
@Controller('api/v1/designer')
export class DesignerController {
  constructor(private readonly serviceRegistry: ServiceRegistry) {}

  @Get('projects')
  @AmisResponse()
  @ApiOperation({
    summary: 'Get designer projects',
    description: 'Retrieve all visual designer projects',
  })
  @ApiResponse({
    status: 200,
    description: 'Projects retrieved successfully',
  })
  @MicroserviceCall('lowcode-designer')
  async getDesignerProjects(): Promise<{ projects: DesignerProject[] }> {
    const response = await this.serviceRegistry.makeRequest({
      service: 'lowcode-designer',
      endpoint: '/api/projects',
      method: 'GET',
    });

    if (!response.success) {
      throw new Error(`Failed to get designer projects: ${response.message}`);
    }

    return { projects: response.data || [] };
  }

  @Get('projects/:id')
  @AmisResponse()
  @ApiOperation({
    summary: 'Get designer project by ID',
    description: 'Retrieve a specific visual designer project',
  })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Project retrieved successfully',
  })
  @MicroserviceCall('lowcode-designer')
  async getDesignerProject(@Param('id') id: string): Promise<{ project: DesignerProject }> {
    const response = await this.serviceRegistry.makeRequest({
      service: 'lowcode-designer',
      endpoint: `/api/projects/${id}`,
      method: 'GET',
    });

    if (!response.success) {
      throw new Error(`Failed to get designer project: ${response.message}`);
    }

    return { project: response.data };
  }

  @Post('projects')
  @AmisResponse()
  @ApiOperation({
    summary: 'Create designer project',
    description: 'Create a new visual designer project',
  })
  @ApiResponse({
    status: 201,
    description: 'Project created successfully',
  })
  @MicroserviceCall('lowcode-designer')
  async createDesignerProject(@Body() projectData: Partial<DesignerProject>): Promise<{ project: DesignerProject }> {
    const response = await this.serviceRegistry.makeRequest({
      service: 'lowcode-designer',
      endpoint: '/api/projects',
      method: 'POST',
      data: projectData,
    });

    if (!response.success) {
      throw new Error(`Failed to create designer project: ${response.message}`);
    }

    return { project: response.data };
  }

  @Put('projects/:id')
  @AmisResponse()
  @ApiOperation({
    summary: 'Update designer project',
    description: 'Update a visual designer project',
  })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Project updated successfully',
  })
  @MicroserviceCall('lowcode-designer')
  async updateDesignerProject(
    @Param('id') id: string,
    @Body() projectData: Partial<DesignerProject>
  ): Promise<{ project: DesignerProject }> {
    const response = await this.serviceRegistry.makeRequest({
      service: 'lowcode-designer',
      endpoint: `/api/projects/${id}`,
      method: 'PUT',
      data: projectData,
    });

    if (!response.success) {
      throw new Error(`Failed to update designer project: ${response.message}`);
    }

    return { project: response.data };
  }

  @Delete('projects/:id')
  @AmisResponse()
  @ApiOperation({
    summary: 'Delete designer project',
    description: 'Delete a visual designer project',
  })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Project deleted successfully',
  })
  @MicroserviceCall('lowcode-designer')
  async deleteDesignerProject(@Param('id') id: string): Promise<{ success: boolean }> {
    const response = await this.serviceRegistry.makeRequest({
      service: 'lowcode-designer',
      endpoint: `/api/projects/${id}`,
      method: 'DELETE',
    });

    if (!response.success) {
      throw new Error(`Failed to delete designer project: ${response.message}`);
    }

    return { success: true };
  }

  @Post('projects/:id/sync')
  @AmisResponse()
  @ApiOperation({
    summary: 'Sync designer project to platform',
    description: 'Synchronize visual designer project data to lowcode platform',
  })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Project synced successfully',
  })
  async syncDesignerProject(@Param('id') id: string): Promise<{ syncResult: any }> {
    // 1. 获取设计器项目数据
    const projectResponse = await this.serviceRegistry.makeRequest({
      service: 'lowcode-designer',
      endpoint: `/api/projects/${id}`,
      method: 'GET',
    });

    if (!projectResponse.success) {
      throw new Error(`Failed to get designer project: ${projectResponse.message}`);
    }

    const designerProject: DesignerProject = projectResponse.data;

    // 2. 转换设计器数据为平台实体数据
    const syncData = await this.convertDesignerDataToPlatform(designerProject);

    // 3. 同步到平台
    const syncResponse = await this.serviceRegistry.makeRequest({
      service: 'lowcode-platform-backend',
      endpoint: '/api/v1/sync/designer-data',
      method: 'POST',
      data: syncData,
    });

    if (!syncResponse.success) {
      throw new Error(`Failed to sync designer data: ${syncResponse.message}`);
    }

    return { syncResult: syncResponse.data };
  }

  @Get('entities/:id/design')
  @AmisResponse()
  @ApiOperation({
    summary: 'Get entity design data',
    description: 'Get visual design data for a specific entity',
  })
  @ApiParam({ name: 'id', description: 'Entity ID' })
  @ApiResponse({
    status: 200,
    description: 'Entity design data retrieved successfully',
  })
  @MicroserviceCall('lowcode-designer')
  async getEntityDesign(@Param('id') id: string): Promise<{ designData: DesignerEntity }> {
    const response = await this.serviceRegistry.makeRequest({
      service: 'lowcode-designer',
      endpoint: `/api/entities/${id}/design`,
      method: 'GET',
    });

    if (!response.success) {
      throw new Error(`Failed to get entity design: ${response.message}`);
    }

    return { designData: response.data };
  }

  @Post('entities/:id/design')
  @AmisResponse()
  @ApiOperation({
    summary: 'Update entity design data',
    description: 'Update visual design data for a specific entity',
  })
  @ApiParam({ name: 'id', description: 'Entity ID' })
  @ApiResponse({
    status: 200,
    description: 'Entity design data updated successfully',
  })
  @MicroserviceCall('lowcode-designer')
  async updateEntityDesign(
    @Param('id') id: string,
    @Body() designData: Partial<DesignerEntity>
  ): Promise<{ designData: DesignerEntity }> {
    const response = await this.serviceRegistry.makeRequest({
      service: 'lowcode-designer',
      endpoint: `/api/entities/${id}/design`,
      method: 'POST',
      data: designData,
    });

    if (!response.success) {
      throw new Error(`Failed to update entity design: ${response.message}`);
    }

    return { designData: response.data };
  }

  @Get('preview/:projectId')
  @AmisResponse()
  @ApiOperation({
    summary: 'Preview designer project',
    description: 'Generate preview of the designer project',
  })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({ name: 'format', required: false, description: 'Preview format (json, diagram, code)' })
  @ApiResponse({
    status: 200,
    description: 'Preview generated successfully',
  })
  async previewDesignerProject(
    @Param('projectId') projectId: string,
    @Query('format') format: string = 'json'
  ): Promise<{ preview: any }> {
    const response = await this.serviceRegistry.makeRequest({
      service: 'lowcode-designer',
      endpoint: `/api/projects/${projectId}/preview`,
      method: 'GET',
      headers: {
        'X-Preview-Format': format,
      },
    });

    if (!response.success) {
      throw new Error(`Failed to generate preview: ${response.message}`);
    }

    return { preview: response.data };
  }

  /**
   * 转换设计器数据为平台数据格式
   */
  private async convertDesignerDataToPlatform(designerProject: DesignerProject) {
    const entities = designerProject.entities.map(entity => ({
      id: entity.id,
      name: entity.name,
      code: entity.code,
      description: entity.description,
      fields: entity.fields.map(field => ({
        id: field.id,
        name: field.name,
        code: field.code,
        type: field.type,
        required: field.required,
        defaultValue: field.defaultValue,
        validation: field.validation,
      })),
      config: {
        ...entity.config,
        designerPosition: entity.position,
      },
    }));

    const relationships = designerProject.entities.flatMap(entity =>
      entity.relationships.map(rel => ({
        id: rel.id,
        type: rel.type,
        sourceEntityId: rel.sourceEntityId,
        targetEntityId: rel.targetEntityId,
        sourceFieldId: rel.sourceFieldId,
        targetFieldId: rel.targetFieldId,
        config: {
          designerPoints: rel.points,
        },
      }))
    );

    return {
      projectId: designerProject.id,
      projectName: designerProject.name,
      entities,
      relationships,
      metadata: {
        ...designerProject.metadata,
        canvas: designerProject.canvas,
        syncTimestamp: new Date().toISOString(),
      },
    };
  }
}
