import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ApiRes } from '@lib/infra/rest/res.response';

// Queries
import { GetLowcodePageByIdQuery } from '@lowcode/page/queries/get-lowcode-page-by-id.query';
import { GetLowcodePageByCodeQuery } from '@lowcode/page/queries/get-lowcode-page-by-code.query';

// Commands
import { LowcodePageCreateCommand } from '@lowcode/page/commands/lowcode-page-create.command';
import { LowcodePageUpdateCommand } from '@lowcode/page/commands/lowcode-page-update.command';

import { Status } from '@prisma/client';

@ApiTags('Lowcode Designer')
@Controller('designer')
export class DesignerController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('page/:id/url')
  @ApiOperation({ summary: 'Get designer URL for editing an existing page' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Page not found' })
  async getPageDesignerUrl(@Param('id') id: string): Promise<ApiRes<{ url: string }>> {
    // Verify the page exists
    await this.queryBus.execute(new GetLowcodePageByIdQuery(id));
    
    // Generate designer URL
    const designerBaseUrl = process.env.LOWCODE_DESIGNER_URL || 'http://localhost:3001/designer';
    const designerUrl = `${designerBaseUrl}?pageId=${id}&mode=edit`;
    
    return ApiRes.success({ url: designerUrl });
  }

  @Get('template/:templateType/url')
  @ApiOperation({ summary: 'Get designer URL for creating a new page from template' })
  @ApiResponse({ status: 200, description: 'Success' })
  async getTemplateDesignerUrl(
    @Param('templateType') templateType: string,
    @Query('templateId') templateId?: string,
    @Query('name') name?: string,
  ): Promise<ApiRes<{ url: string }>> {
    // Generate designer URL for template-based creation
    const designerBaseUrl = process.env.LOWCODE_DESIGNER_URL || 'http://localhost:3001/designer';
    let designerUrl = `${designerBaseUrl}?mode=create&templateType=${templateType}`;
    
    if (templateId) {
      designerUrl += `&templateId=${templateId}`;
    }
    
    if (name) {
      designerUrl += `&name=${encodeURIComponent(name)}`;
    }
    
    return ApiRes.success({ url: designerUrl });
  }

  @Post('page/save')
  @ApiOperation({ summary: 'Save page from designer' })
  @ApiResponse({ status: 200, description: 'Page saved successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async savePageFromDesigner(
    @Body() dto: {
      pageId?: string;
      name: string;
      title: string;
      code: string;
      description?: string;
      schema: any;
      changelog?: string;
    },
    @Request() req: any,
  ): Promise<ApiRes<{ pageId: string; versionId?: string }>> {
    if (dto.pageId) {
      // Update existing page
      const result = await this.commandBus.execute(
        new LowcodePageUpdateCommand(
          dto.pageId,
          dto.name,
          dto.title,
          dto.description,
          dto.schema,
          undefined, // status
          dto.changelog,
          req.user.uid,
        ),
      );
      
      return ApiRes.success({ pageId: result.pageId, versionId: result.versionId });
    } else {
      // Create new page
      const result = await this.commandBus.execute(
        new LowcodePageCreateCommand(
          dto.name,
          dto.title,
          dto.code,
          dto.description || null,
          dto.schema,
          Status.ENABLED,
          dto.changelog || null,
          req.user.uid,
        ),
      );
      
      return ApiRes.success({ pageId: result.pageId, versionId: result.versionId });
    }
  }

  @Get('page/:id/schema')
  @ApiOperation({ summary: 'Get page schema for designer' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Page not found' })
  async getPageSchema(@Param('id') id: string): Promise<ApiRes<{ schema: any }>> {
    const page = await this.queryBus.execute(new GetLowcodePageByIdQuery(id));
    
    return ApiRes.success({ schema: page.schema });
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get available page templates' })
  @ApiResponse({ status: 200, description: 'Success' })
  async getPageTemplates(): Promise<ApiRes<any[]>> {
    // This would typically come from a database or configuration
    const templates = [
      {
        id: 'basic-form',
        name: 'Basic Form',
        type: 'form',
        description: 'A basic form template with common form controls',
        schema: {
          type: 'page',
          title: 'Basic Form',
          body: [
            {
              type: 'form',
              api: '/api/save',
              body: [
                {
                  type: 'input-text',
                  name: 'name',
                  label: 'Name',
                  required: true,
                },
                {
                  type: 'input-email',
                  name: 'email',
                  label: 'Email',
                  required: true,
                },
              ],
            },
          ],
        },
      },
      {
        id: 'data-table',
        name: 'Data Table',
        type: 'table',
        description: 'A data table template with CRUD operations',
        schema: {
          type: 'page',
          title: 'Data Table',
          body: [
            {
              type: 'crud',
              api: '/api/data',
              columns: [
                {
                  name: 'id',
                  label: 'ID',
                  type: 'text',
                },
                {
                  name: 'name',
                  label: 'Name',
                  type: 'text',
                },
                {
                  name: 'status',
                  label: 'Status',
                  type: 'status',
                },
              ],
            },
          ],
        },
      },
      {
        id: 'dashboard',
        name: 'Dashboard',
        type: 'dashboard',
        description: 'A dashboard template with charts and metrics',
        schema: {
          type: 'page',
          title: 'Dashboard',
          body: [
            {
              type: 'grid',
              columns: [
                {
                  type: 'panel',
                  title: 'Metrics',
                  body: [
                    {
                      type: 'tpl',
                      tpl: '<div class="text-center"><h2>100</h2><p>Total Users</p></div>',
                    },
                  ],
                },
                {
                  type: 'panel',
                  title: 'Chart',
                  body: [
                    {
                      type: 'chart',
                      api: '/api/chart-data',
                      config: {
                        type: 'line',
                        data: {
                          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
                          datasets: [
                            {
                              label: 'Sales',
                              data: [10, 20, 30, 40, 50],
                            },
                          ],
                        },
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    ];
    
    return ApiRes.success(templates);
  }
}
