import { Controller, Get, Render, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '@decorators/public.decorator';
import { AmisResponseInterceptor } from '@interceptors/amis-response.interceptor';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('Code Generation Pages')
@Controller('lowcode/code-generation')
@ApiBearerAuth()
@UseInterceptors(AmisResponseInterceptor)
export class CodeGenerationPageController {

  @Get('page')
  @Public() // 临时禁用认证以便测试
  @ApiOperation({ summary: 'Get code generation page configuration' })
  async getCodeGenerationPage() {
    try {
      const pagePath = path.join(__dirname, '../../views/lowcode/code-generation.json');
      const pageConfig = JSON.parse(fs.readFileSync(pagePath, 'utf-8'));
      
      return {
        success: true,
        data: pageConfig,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to load page configuration: ${error.message}`,
        data: {
          type: 'page',
          title: '代码生成器',
          body: [
            {
              type: 'alert',
              level: 'danger',
              body: '页面配置加载失败，请检查服务器配置。'
            }
          ]
        }
      };
    }
  }

  @Get('dashboard')
  @Public() // 临时禁用认证以便测试
  @ApiOperation({ summary: 'Get code generation dashboard' })
  async getCodeGenerationDashboard() {
    return {
      success: true,
      data: {
        type: 'page',
        title: '代码生成器仪表板',
        subTitle: '低代码平台代码生成统计和监控',
        body: [
          {
            type: 'grid',
            columns: [
              {
                type: 'panel',
                title: '生成统计',
                body: [
                  {
                    type: 'service',
                    api: {
                      method: 'get',
                      url: '/api/v1/code-generation/status'
                    },
                    body: [
                      {
                        type: 'cards',
                        source: '${status}',
                        card: {
                          body: [
                            {
                              type: 'tpl',
                              tpl: '<div class="text-center"><h3>${value}</h3><p>${label}</p></div>'
                            }
                          ]
                        }
                      }
                    ]
                  }
                ]
              },
              {
                type: 'panel',
                title: '快速操作',
                body: [
                  {
                    type: 'button-group',
                    buttons: [
                      {
                        type: 'button',
                        label: '生成代码',
                        level: 'primary',
                        actionType: 'link',
                        link: '/lowcode/code-generation/page'
                      },
                      {
                        type: 'button',
                        label: '管理实体',
                        level: 'info',
                        actionType: 'link',
                        link: '/lowcode/entities'
                      },
                      {
                        type: 'button',
                        label: '项目管理',
                        level: 'success',
                        actionType: 'link',
                        link: '/lowcode/projects'
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            type: 'panel',
            title: '最近生成记录',
            body: [
              {
                type: 'service',
                api: {
                  method: 'get',
                  url: '/api/v1/code-generation/history?limit=5'
                },
                body: [
                  {
                    type: 'table',
                    source: '${data.items}',
                    columns: [
                      {
                        name: 'timestamp',
                        label: '生成时间',
                        type: 'datetime'
                      },
                      {
                        name: 'entities',
                        label: '实体',
                        type: 'text'
                      },
                      {
                        name: 'targetProject',
                        label: '目标项目',
                        type: 'text'
                      },
                      {
                        name: 'totalFiles',
                        label: '文件数',
                        type: 'text'
                      },
                      {
                        name: 'success',
                        label: '状态',
                        type: 'mapping',
                        map: {
                          'true': '<span class="label label-success">成功</span>',
                          'false': '<span class="label label-danger">失败</span>'
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    };
  }

  @Get('wizard')
  @Public() // 临时禁用认证以便测试
  @ApiOperation({ summary: 'Get code generation wizard' })
  async getCodeGenerationWizard() {
    return {
      success: true,
      data: {
        type: 'page',
        title: '代码生成向导',
        subTitle: '逐步引导您完成代码生成过程',
        body: [
          {
            type: 'wizard',
            api: {
              method: 'post',
              url: '/api/v1/code-generation/generate'
            },
            steps: [
              {
                title: '选择实体',
                body: [
                  {
                    type: 'alert',
                    level: 'info',
                    body: '请选择要生成代码的实体。您可以选择一个或多个实体。'
                  },
                  {
                    type: 'select',
                    name: 'entityIds',
                    label: '实体列表',
                    multiple: true,
                    required: true,
                    source: {
                      method: 'get',
                      url: '/api/v1/entities?size=100',
                      adaptor: 'return {\n  options: payload.data.items.map(item => ({\n    label: `${item.name} (${item.code})`,\n    value: item.id,\n    description: item.description\n  }))\n};'
                    },
                    description: '选择要生成代码的实体'
                  }
                ]
              },
              {
                title: '配置项目',
                body: [
                  {
                    type: 'alert',
                    level: 'info',
                    body: '选择代码生成的目标项目和相关配置。'
                  },
                  {
                    type: 'select',
                    name: 'targetProject',
                    label: '目标项目',
                    required: true,
                    value: 'amis-lowcode-backend',
                    source: {
                      method: 'get',
                      url: '/api/v1/target-projects',
                      adaptor: 'return {\n  options: payload.data.projects.map(item => ({\n    label: `${item.displayName} (${item.type})`,\n    value: item.name,\n    description: item.description\n  }))\n};'
                    }
                  },
                  {
                    type: 'group',
                    body: [
                      {
                        type: 'switch',
                        name: 'options.overwrite',
                        label: '覆盖现有文件',
                        value: true
                      },
                      {
                        type: 'switch',
                        name: 'options.createDirectories',
                        label: '自动创建目录',
                        value: true
                      }
                    ]
                  }
                ]
              },
              {
                title: 'Git 配置',
                body: [
                  {
                    type: 'alert',
                    level: 'info',
                    body: '配置 Git 版本控制选项（可选）。'
                  },
                  {
                    type: 'switch',
                    name: 'git.enabled',
                    label: '启用 Git 集成',
                    value: false
                  },
                  {
                    type: 'switch',
                    name: 'git.autoCommit',
                    label: '自动提交',
                    value: true,
                    visibleOn: '${git.enabled}'
                  },
                  {
                    type: 'switch',
                    name: 'git.createBranch',
                    label: '创建新分支',
                    value: true,
                    visibleOn: '${git.enabled && git.autoCommit}'
                  }
                ]
              },
              {
                title: '确认生成',
                body: [
                  {
                    type: 'alert',
                    level: 'warning',
                    body: '请确认以下配置信息，点击完成开始生成代码。'
                  },
                  {
                    type: 'property',
                    title: '生成配置',
                    items: [
                      {
                        label: '选择的实体',
                        content: '${entityIds | join:","}'
                      },
                      {
                        label: '目标项目',
                        content: '${targetProject}'
                      },
                      {
                        label: '覆盖文件',
                        content: '${options.overwrite ? "是" : "否"}'
                      },
                      {
                        label: 'Git 集成',
                        content: '${git.enabled ? "启用" : "禁用"}'
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    };
  }
}
