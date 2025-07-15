import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiRes } from '@lib/infra/rest/res.response';

// 简化的低代码页面控制器，用于测试基本功能
@ApiTags('Simple Lowcode Pages')
@Controller('simple-lowcode-pages')
export class SimpleLowcodeController {
  
  // 模拟数据存储
  private pages: any[] = [];
  private nextId = 1;

  @Post()
  @ApiOperation({ summary: 'Create a simple lowcode page' })
  @ApiResponse({ status: 201, description: 'Page created successfully' })
  async createPage(@Body() dto: any): Promise<ApiRes<any>> {
    const page = {
      id: (this.nextId++).toString(),
      name: dto.name,
      title: dto.title,
      code: dto.code,
      description: dto.description || null,
      schema: typeof dto.schema === 'string' ? JSON.parse(dto.schema) : dto.schema,
      status: dto.status || 'ENABLED',
      createdAt: new Date(),
      createdBy: 'test-user',
      updatedAt: null,
      updatedBy: null,
    };

    // 检查代码唯一性
    const existingPage = this.pages.find(p => p.code === page.code);
    if (existingPage) {
      return ApiRes.error(400, 'Page code already exists');
    }

    this.pages.push(page);

    // 创建初始版本
    const version = {
      id: `version-${this.nextId++}`,
      pageId: page.id,
      version: '1.0.0',
      schema: page.schema,
      changelog: dto.changelog || 'Initial version',
      createdAt: new Date(),
      createdBy: 'test-user',
    };

    return ApiRes.success({
      pageId: page.id,
      versionId: version.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get pages list' })
  @ApiResponse({ status: 200, description: 'Success' })
  async getPages(@Query() query: any): Promise<ApiRes<any>> {
    const current = parseInt(query.current) || 1;
    const size = parseInt(query.size) || 10;
    const search = query.search;

    let filteredPages = this.pages;
    
    if (search) {
      filteredPages = this.pages.filter(page => 
        page.name.includes(search) || 
        page.title.includes(search) ||
        page.code.includes(search)
      );
    }

    const total = filteredPages.length;
    const start = (current - 1) * size;
    const items = filteredPages.slice(start, start + size);

    return ApiRes.success({
      items,
      total,
      current,
      size,
      pages: Math.ceil(total / size),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get page by ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Page not found' })
  async getPageById(@Param('id') id: string): Promise<ApiRes<any>> {
    const page = this.pages.find(p => p.id === id);
    if (!page) {
      return ApiRes.error(404, 'Page not found');
    }
    return ApiRes.success(page);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get page by code' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Page not found' })
  async getPageByCode(@Param('code') code: string): Promise<ApiRes<any>> {
    const page = this.pages.find(p => p.code === code);
    if (!page) {
      return ApiRes.error(404, 'Page not found');
    }
    return ApiRes.success(page);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update page' })
  @ApiResponse({ status: 200, description: 'Page updated successfully' })
  @ApiResponse({ status: 404, description: 'Page not found' })
  async updatePage(@Param('id') id: string, @Body() dto: any): Promise<ApiRes<any>> {
    const pageIndex = this.pages.findIndex(p => p.id === id);
    if (pageIndex === -1) {
      return ApiRes.error(404, 'Page not found');
    }

    const page = this.pages[pageIndex];
    
    // 更新页面信息
    if (dto.name) page.name = dto.name;
    if (dto.title) page.title = dto.title;
    if (dto.description !== undefined) page.description = dto.description;
    if (dto.schema) {
      page.schema = typeof dto.schema === 'string' ? JSON.parse(dto.schema) : dto.schema;
    }
    if (dto.status) page.status = dto.status;
    
    page.updatedAt = new Date();
    page.updatedBy = 'test-user';

    this.pages[pageIndex] = page;

    // 创建新版本（如果有schema更新）
    let versionId = undefined;
    if (dto.schema) {
      versionId = `version-${this.nextId++}`;
    }

    return ApiRes.success({
      pageId: page.id,
      versionId,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete page' })
  @ApiResponse({ status: 200, description: 'Page deleted successfully' })
  @ApiResponse({ status: 404, description: 'Page not found' })
  async deletePage(@Param('id') id: string): Promise<ApiRes<null>> {
    const pageIndex = this.pages.findIndex(p => p.id === id);
    if (pageIndex === -1) {
      return ApiRes.error(404, 'Page not found');
    }

    this.pages.splice(pageIndex, 1);
    return ApiRes.ok();
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get page versions' })
  @ApiResponse({ status: 200, description: 'Success' })
  async getPageVersions(@Param('id') id: string): Promise<ApiRes<any>> {
    const page = this.pages.find(p => p.id === id);
    if (!page) {
      return ApiRes.error(404, 'Page not found');
    }

    // 模拟版本数据
    const versions = [
      {
        id: 'version-1',
        pageId: id,
        version: '1.0.0',
        schema: page.schema,
        changelog: 'Initial version',
        createdAt: page.createdAt,
        createdBy: page.createdBy,
      }
    ];

    return ApiRes.success({ versions });
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset test data' })
  @ApiResponse({ status: 200, description: 'Data reset successfully' })
  async resetData(): Promise<ApiRes<null>> {
    this.pages = [];
    this.nextId = 1;
    return ApiRes.success(null);
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get statistics' })
  @ApiResponse({ status: 200, description: 'Success' })
  async getStats(): Promise<ApiRes<any>> {
    const stats = {
      totalPages: this.pages.length,
      enabledPages: this.pages.filter(p => p.status === 'ENABLED').length,
      disabledPages: this.pages.filter(p => p.status === 'DISABLED').length,
      lastCreated: this.pages.length > 0 ? this.pages[this.pages.length - 1].createdAt : null,
    };

    return ApiRes.success(stats);
  }
}
