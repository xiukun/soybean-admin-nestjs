import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiRes } from '@lib/infra/rest/res.response';
import { ApiJwtAuth } from '@lib/infra/decorators/api-bearer-auth.decorator';

// 简化的设计器控制器，用于测试设计器集成功能
@ApiTags('Simple Designer')
@ApiJwtAuth() // 添加Bearer认证装饰器
@Controller('simple-designer')
export class SimpleDesignerController {

  @Get('page/:id/url')
  @ApiOperation({ summary: 'Get designer URL for editing a page' })
  @ApiResponse({ status: 200, description: 'Success' })
  async getPageDesignerUrl(@Param('id') id: string): Promise<ApiRes<{ url: string }>> {
    // 生成设计器URL
    const designerBaseUrl = process.env.LOWCODE_DESIGNER_URL || 'http://localhost:3001/designer';
    const designerUrl = `${designerBaseUrl}?pageId=${id}&mode=edit`;
    
    return ApiRes.success({ url: designerUrl });
  }

  @Get('template/:templateType/url')
  @ApiOperation({ summary: 'Get designer URL for creating from template' })
  @ApiResponse({ status: 200, description: 'Success' })
  async getTemplateDesignerUrl(
    @Param('templateType') templateType: string,
    @Query('templateId') templateId?: string,
    @Query('name') name?: string,
  ): Promise<ApiRes<{ url: string }>> {
    // 生成模板设计器URL
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
  async savePageFromDesigner(@Body() dto: any): Promise<ApiRes<{ pageId: string; versionId?: string }>> {
    // 模拟保存逻辑
    const pageId = dto.pageId || `page-${Date.now()}`;
    const versionId = `version-${Date.now()}`;
    
    console.log('Designer save request:', {
      pageId,
      name: dto.name,
      title: dto.title,
      code: dto.code,
      schemaSize: JSON.stringify(dto.schema || {}).length,
    });
    
    return ApiRes.success({ pageId, versionId });
  }

  @Get('page/:id/schema')
  @ApiOperation({ summary: 'Get page schema for designer' })
  @ApiResponse({ status: 200, description: 'Success' })
  async getPageSchema(@Param('id') id: string): Promise<ApiRes<{ schema: any }>> {
    // 模拟返回页面schema
    const mockSchema = {
      type: 'page',
      title: `Page ${id}`,
      body: [
        {
          type: 'tpl',
          tpl: `<h1>Hello from Page ${id}</h1><p>This is a mock schema for testing.</p>`,
        },
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
    };
    
    return ApiRes.success({ schema: mockSchema });
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get available templates' })
  @ApiResponse({ status: 200, description: 'Success' })
  async getTemplates(): Promise<ApiRes<any[]>> {
    const templates = [
      {
        id: 'basic-form',
        name: '基础表单',
        type: 'form',
        description: '包含常用表单控件的基础模板',
        preview: '/images/templates/basic-form.png',
        schema: {
          type: 'page',
          title: '基础表单',
          body: [
            {
              type: 'form',
              api: '/api/save',
              body: [
                {
                  type: 'input-text',
                  name: 'name',
                  label: '姓名',
                  required: true,
                },
                {
                  type: 'input-email',
                  name: 'email',
                  label: '邮箱',
                  required: true,
                },
                {
                  type: 'select',
                  name: 'status',
                  label: '状态',
                  options: [
                    { label: '启用', value: 'enabled' },
                    { label: '禁用', value: 'disabled' },
                  ],
                },
              ],
            },
          ],
        },
      },
      {
        id: 'data-table',
        name: '数据表格',
        type: 'table',
        description: '支持CRUD操作的数据表格模板',
        preview: '/images/templates/data-table.png',
        schema: {
          type: 'page',
          title: '数据表格',
          body: [
            {
              type: 'crud',
              api: '/api/data',
              headerToolbar: ['bulkActions', 'statistics'],
              footerToolbar: ['pagination'],
              columns: [
                {
                  name: 'id',
                  label: 'ID',
                  type: 'text',
                },
                {
                  name: 'name',
                  label: '名称',
                  type: 'text',
                },
                {
                  name: 'email',
                  label: '邮箱',
                  type: 'text',
                },
                {
                  name: 'status',
                  label: '状态',
                  type: 'status',
                },
                {
                  type: 'operation',
                  label: '操作',
                  buttons: [
                    {
                      type: 'button',
                      label: '编辑',
                      actionType: 'dialog',
                      dialog: {
                        title: '编辑',
                        body: {
                          type: 'form',
                          api: '/api/update',
                          body: [
                            {
                              type: 'input-text',
                              name: 'name',
                              label: '名称',
                            },
                          ],
                        },
                      },
                    },
                    {
                      type: 'button',
                      label: '删除',
                      actionType: 'ajax',
                      api: 'delete:/api/delete/${id}',
                      confirmText: '确定要删除吗？',
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      {
        id: 'dashboard',
        name: '仪表板',
        type: 'dashboard',
        description: '包含图表和指标的仪表板模板',
        preview: '/images/templates/dashboard.png',
        schema: {
          type: 'page',
          title: '仪表板',
          body: [
            {
              type: 'grid',
              columns: [
                {
                  type: 'panel',
                  title: '用户统计',
                  body: [
                    {
                      type: 'tpl',
                      tpl: '<div class="text-center"><h2 class="text-info">1,234</h2><p>总用户数</p></div>',
                    },
                  ],
                },
                {
                  type: 'panel',
                  title: '订单统计',
                  body: [
                    {
                      type: 'tpl',
                      tpl: '<div class="text-center"><h2 class="text-success">5,678</h2><p>总订单数</p></div>',
                    },
                  ],
                },
                {
                  type: 'panel',
                  title: '收入统计',
                  body: [
                    {
                      type: 'tpl',
                      tpl: '<div class="text-center"><h2 class="text-warning">¥123,456</h2><p>总收入</p></div>',
                    },
                  ],
                },
              ],
            },
            {
              type: 'panel',
              title: '趋势图表',
              body: [
                {
                  type: 'chart',
                  api: '/api/chart-data',
                  config: {
                    type: 'line',
                    data: {
                      labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
                      datasets: [
                        {
                          label: '销售额',
                          data: [12, 19, 3, 5, 2, 3],
                          borderColor: 'rgb(75, 192, 192)',
                          tension: 0.1,
                        },
                      ],
                    },
                  },
                },
              ],
            },
          ],
        },
      },
    ];
    
    return ApiRes.success(templates);
  }

  @Get('components')
  @ApiOperation({ summary: 'Get available components' })
  @ApiResponse({ status: 200, description: 'Success' })
  async getComponents(): Promise<ApiRes<any[]>> {
    const components = [
      {
        type: 'input-text',
        label: '文本输入',
        icon: 'fa fa-text-width',
        description: '单行文本输入框',
        scaffold: {
          type: 'input-text',
          label: '文本',
          name: 'text',
        },
      },
      {
        type: 'textarea',
        label: '多行文本',
        icon: 'fa fa-text-height',
        description: '多行文本输入框',
        scaffold: {
          type: 'textarea',
          label: '多行文本',
          name: 'textarea',
        },
      },
      {
        type: 'select',
        label: '下拉选择',
        icon: 'fa fa-th-list',
        description: '下拉选择框',
        scaffold: {
          type: 'select',
          label: '选择',
          name: 'select',
          options: [
            { label: '选项1', value: 'option1' },
            { label: '选项2', value: 'option2' },
          ],
        },
      },
      {
        type: 'button',
        label: '按钮',
        icon: 'fa fa-hand-pointer-o',
        description: '操作按钮',
        scaffold: {
          type: 'button',
          label: '按钮',
          actionType: 'submit',
        },
      },
    ];
    
    return ApiRes.success(components);
  }
}
