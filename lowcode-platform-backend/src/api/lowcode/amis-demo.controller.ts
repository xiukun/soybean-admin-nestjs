import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AmisResponse, AmisPaginationResponse, AmisErrorResponse } from '@decorators/amis-response.decorator';
import { AmisResponseInterceptor } from '@interceptors/amis-response.interceptor';
import { PrismaService } from '@lib/shared/prisma/prisma.service';

@ApiTags('amis-demo')
@ApiBearerAuth()
@Controller({ path: 'amis-demo', version: '1' })
@UseInterceptors(AmisResponseInterceptor)
export class AmisDemoController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('string')
  @AmisResponse({
    description: '返回字符串数据（amis格式）',
    dataKey: 'message'
  })
  @ApiOperation({ summary: '演示字符串数据的amis格式响应' })
  getString(): string {
    return 'Hello, amis!';
  }

  @Get('array')
  @AmisResponse({
    description: '返回数组数据（amis格式）',
    dataKey: 'options'
  })
  @ApiOperation({ summary: '演示数组数据的amis格式响应' })
  getArray(): string[] {
    return ['item1', 'item2', 'item3'];
  }

  @Get('object')
  @AmisResponse({
    description: '返回对象数据（amis格式）'
  })
  @ApiOperation({ summary: '演示对象数据的amis格式响应' })
  getObject(): any {
    return {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      createdAt: new Date().toISOString()
    };
  }

  @Get('users')
  @AmisPaginationResponse({
    description: '返回用户分页列表（amis格式）',
    itemSchema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        name: { type: 'string' },
        email: { type: 'string' }
      }
    }
  })
  @ApiOperation({ summary: '演示分页数据的amis格式响应' })
  getUsers(
    @Query('page') page: number = 1,
    @Query('perPage') perPage?: number,
    @Query('limit') limit?: number // 兼容旧参数名
  ): any {
    // 优先使用perPage，如果没有则使用limit，最后使用默认值10
    const actualPerPage = perPage || limit || 10;
    // 模拟用户数据
    const users = Array.from({ length: actualPerPage }, (_, index) => ({
      id: (page - 1) * actualPerPage + index + 1,
      name: `User ${(page - 1) * actualPerPage + index + 1}`,
      email: `user${(page - 1) * actualPerPage + index + 1}@example.com`
    }));

    return {
      options: users,
      page,
      perPage: actualPerPage,
      total: 1000 // 模拟总数
    };
  }

  @Get('pagination')
  @AmisPaginationResponse({
    description: '返回分页数据演示（amis格式）',
    itemSchema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        name: { type: 'string' },
        email: { type: 'string' },
        createdAt: { type: 'string' },
      }
    }
  })
  @ApiOperation({ summary: '演示分页数据的amis格式响应' })
  getPagination(
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10
  ): any {
    const items = Array.from({ length: perPage }, (_, index) => ({
      id: (page - 1) * perPage + index + 1,
      name: `Item ${(page - 1) * perPage + index + 1}`,
      email: `item${(page - 1) * perPage + index + 1}@example.com`,
      createdAt: new Date().toISOString(),
    }));

    return {
      options: items,
      page: page,
      perPage: perPage,
      total: 100, // 示例总数
    };
  }

  @Post('create-user')
  @AmisResponse({
    description: '创建用户成功响应（amis格式）'
  })
  @AmisErrorResponse(400, '请求参数错误')
  @AmisErrorResponse(409, '用户已存在')
  @ApiOperation({ summary: '演示创建操作的amis格式响应' })
  createUser(@Body() userData: any): any {
    // 模拟创建用户
    return {
      id: Math.floor(Math.random() * 1000),
      name: userData.name,
      email: userData.email,
      createdAt: new Date().toISOString()
    };
  }

  @Get('error-demo')
  @ApiOperation({ summary: '演示错误响应的amis格式' })
  getErrorDemo(@Query('trigger') trigger?: string): any {
    if (trigger === 'error') {
      throw new Error('This is a demo error');
    }

    return {
      message: 'No error triggered'
    };
  }

  @Get('already-amis')
  @ApiOperation({ summary: '演示已经是amis格式的响应' })
  getAlreadyAmis(): any {
    // 返回已经符合amis格式的数据
    return {
      status: 0,
      msg: '操作成功',
      data: {
        id: 1,
        name: 'Already amis format',
        description: 'This response is already in amis format'
      }
    };
  }

  @Get('complex-data')
  @AmisResponse({
    description: '返回复杂数据结构（amis格式）'
  })
  @ApiOperation({ summary: '演示复杂数据结构的amis格式响应' })
  getComplexData(): any {
    return {
      user: {
        id: 1,
        name: 'John Doe',
        profile: {
          avatar: 'https://example.com/avatar.jpg',
          bio: 'Software Developer'
        }
      },
      permissions: ['read', 'write', 'delete'],
      settings: {
        theme: 'dark',
        language: 'zh-CN',
        notifications: {
          email: true,
          sms: false
        }
      },
      statistics: {
        loginCount: 156,
        lastLoginAt: new Date().toISOString()
      }
    };
  }

  @Get('validation-demo')
  @AmisResponse({
    description: '演示amis格式验证'
  })
  @ApiOperation({ summary: '演示amis格式验证' })
  getValidationDemo(@Query('format') format?: string): any {
    const data = {
      id: 1,
      name: 'Validation Demo'
    };

    switch (format) {
      case 'invalid-string':
        // 这会被拦截器转换为正确的amis格式
        return 'This is invalid for amis';
      
      case 'invalid-array':
        // 这会被拦截器转换为正确的amis格式
        return ['invalid', 'array', 'format'];
      
      case 'valid-amis':
        return {
          status: 0,
          msg: '',
          data: data
        };
      
      default:
        return data;
    }
  }

  @Get('code-templates')
  @AmisResponse({
    description: '获取代码模板列表',
    dataKey: 'templates'
  })
  @ApiOperation({ summary: '获取代码模板列表' })
  async getCodeTemplates(
    @Query('type') type?: string,
    @Query('language') language?: string,
    @Query('framework') framework?: string,
  ) {
    const where: any = {
      status: 'ACTIVE',
    };

    if (type) {
      where.type = type;
    }

    if (language) {
      where.language = language;
    }

    if (framework) {
      where.framework = framework;
    }

    const templates = await this.prisma.codeTemplate.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        language: true,
        framework: true,
        description: true,
        variables: true,
        version: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' },
      ],
    });

    return templates.map(template => ({
      ...template,
      variables: typeof template.variables === 'string'
        ? JSON.parse(template.variables)
        : template.variables,
    }));
  }
}
