import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ApiRes } from '@lib/infra/rest/res.response';

import {
  CreateLowcodePageDto,
  GetLowcodePageByCodeDto,
  GetLowcodePageDto,
  LowcodePageVersionDto,
  UpdateLowcodePageDto,
  PaginationQueryDto,
} from '../dto/lowcode-page.dto';

// Commands
import { LowcodePageCreateCommand } from '@lowcode/page/commands/lowcode-page-create.command';
import { LowcodePageUpdateCommand } from '@lowcode/page/commands/lowcode-page-update.command';
import { LowcodePageDeleteCommand } from '@lowcode/page/commands/lowcode-page-delete.command';
import { LowcodePageVersionCreateCommand } from '@lowcode/page/commands/lowcode-page-version-create.command';

// Queries
import { GetLowcodePagesQuery } from '@lowcode/page/queries/get-lowcode-pages.query';
import { GetLowcodePageByIdQuery } from '@lowcode/page/queries/get-lowcode-page-by-id.query';
import { GetLowcodePageByCodeQuery } from '@lowcode/page/queries/get-lowcode-page-by-code.query';
import { GetLowcodePageByMenuQuery } from '@lowcode/page/queries/get-lowcode-page-by-menu.query';
import { GetLowcodePageVersionsQuery } from '@lowcode/page/queries/get-lowcode-page-versions.query';

import { Status } from '@prisma/client';

@ApiTags('Lowcode Page Management')
@Controller('lowcode-pages')
export class LowcodePageController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new lowcode page' })
  @ApiResponse({
    status: 201,
    description: 'The lowcode page has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async createPage(
    @Body() dto: CreateLowcodePageDto,
    @Request() req: any,
  ): Promise<ApiRes<{ id: string }>> {
    const result = await this.commandBus.execute(
      new LowcodePageCreateCommand(
        dto.name,
        dto.title,
        dto.code,
        dto.description || null,
        JSON.parse(dto.schema),
        dto.status || Status.ENABLED,
        dto.changelog || null,
        req.user.uid,
      ),
    );

    return ApiRes.success({ id: result.pageId });
  }

  @Get()
  @ApiOperation({ summary: 'Get lowcode pages list' })
  @ApiResponse({ status: 200, description: 'Success' })
  async getPages(@Query() query: PaginationQueryDto): Promise<ApiRes<any>> {
    const result = await this.queryBus.execute(
      new GetLowcodePagesQuery(query.current, query.size, query.search),
    );

    return ApiRes.success(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lowcode page by ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Page not found' })
  async getPageById(@Param() params: GetLowcodePageDto): Promise<ApiRes<any>> {
    const result = await this.queryBus.execute(
      new GetLowcodePageByIdQuery(params.id),
    );

    return ApiRes.success(result);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get lowcode page by code' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Page not found' })
  async getPageByCode(@Param() params: GetLowcodePageByCodeDto): Promise<ApiRes<any>> {
    const result = await this.queryBus.execute(
      new GetLowcodePageByCodeQuery(params.code),
    );

    return ApiRes.success(result);
  }

  @Get('menu/:menuId')
  @ApiOperation({ summary: 'Get lowcode page by menu ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Page not found' })
  async getPageByMenuId(@Param('menuId') menuId: string): Promise<ApiRes<any>> {
    const result = await this.queryBus.execute(
      new GetLowcodePageByMenuQuery(parseInt(menuId, 10)),
    );

    return ApiRes.success(result);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update lowcode page' })
  @ApiResponse({
    status: 200,
    description: 'The lowcode page has been successfully updated.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'Page not found' })
  async updatePage(
    @Param() params: GetLowcodePageDto,
    @Body() dto: UpdateLowcodePageDto,
    @Request() req: any,
  ): Promise<ApiRes<null>> {
    await this.commandBus.execute(
      new LowcodePageUpdateCommand(
        params.id,
        dto.name,
        dto.title,
        dto.description,
        dto.schema ? JSON.parse(dto.schema) : undefined,
        dto.status,
        dto.changelog,
        req.user.uid,
      ),
    );

    return ApiRes.ok();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete lowcode page' })
  @ApiResponse({
    status: 200,
    description: 'The lowcode page has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Page not found' })
  async deletePage(@Param() params: GetLowcodePageDto): Promise<ApiRes<null>> {
    await this.commandBus.execute(new LowcodePageDeleteCommand(params.id));

    return ApiRes.ok();
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get page version history' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Page not found' })
  async getPageVersions(@Param() params: GetLowcodePageDto): Promise<ApiRes<any>> {
    const result = await this.queryBus.execute(
      new GetLowcodePageVersionsQuery(params.id),
    );

    return ApiRes.success({ versions: result });
  }

  @Post(':id/versions')
  @ApiOperation({ summary: 'Create a new page version' })
  @ApiResponse({
    status: 201,
    description: 'The page version has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'Page not found' })
  async createPageVersion(
    @Param() params: GetLowcodePageDto,
    @Body() dto: LowcodePageVersionDto,
    @Request() req: any,
  ): Promise<ApiRes<{ id: string }>> {
    const result = await this.commandBus.execute(
      new LowcodePageVersionCreateCommand(
        params.id,
        dto.version,
        JSON.parse(dto.schema),
        dto.changelog || null,
        req.user.uid,
      ),
    );

    return ApiRes.success({ id: result.versionId });
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update page status' })
  @ApiResponse({
    status: 200,
    description: 'The page status has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Page not found' })
  async updatePageStatus(
    @Param() params: GetLowcodePageDto,
    @Body() dto: { status: string },
    @Request() req: any,
  ): Promise<ApiRes<null>> {
    await this.commandBus.execute(
      new LowcodePageUpdateCommand(
        params.id,
        undefined, // name
        undefined, // title
        undefined, // description
        undefined, // schema
        dto.status as Status,
        undefined, // changelog
        req.user.uid,
      ),
    );

    return ApiRes.ok();
  }

  @Get(':id/designer-url')
  @ApiOperation({ summary: 'Get designer URL for a lowcode page' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Page not found' })
  async getDesignerUrl(@Param() params: GetLowcodePageDto): Promise<ApiRes<{ url: string }>> {
    // Get the page to ensure it exists
    const page = await this.queryBus.execute(
      new GetLowcodePageByIdQuery(params.id),
    );

    // Generate designer URL (this would typically be configurable)
    const designerBaseUrl = process.env.LOWCODE_DESIGNER_URL || 'http://localhost:3001/designer';
    const designerUrl = `${designerBaseUrl}?pageId=${params.id}&mode=edit`;

    return ApiRes.success({ url: designerUrl });
  }

  @Post('templates/:templateType/designer-url')
  @ApiOperation({ summary: 'Get designer URL for creating a new page from template' })
  @ApiResponse({ status: 200, description: 'Success' })
  async getTemplateDesignerUrl(
    @Param('templateType') templateType: string,
    @Body() dto: { templateId?: string; name?: string },
  ): Promise<ApiRes<{ url: string }>> {
    // Generate designer URL for template-based creation
    const designerBaseUrl = process.env.LOWCODE_DESIGNER_URL || 'http://localhost:3001/designer';
    let designerUrl = `${designerBaseUrl}?mode=create&templateType=${templateType}`;

    if (dto.templateId) {
      designerUrl += `&templateId=${dto.templateId}`;
    }

    if (dto.name) {
      designerUrl += `&name=${encodeURIComponent(dto.name)}`;
    }

    return ApiRes.success({ url: designerUrl });
  }
}
