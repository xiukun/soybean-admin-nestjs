import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '@decorators/public.decorator';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { AmisResponse } from '@decorators/amis-response.decorator';
import { AmisResponseInterceptor } from '@interceptors/amis-response.interceptor';

@ApiTags('code-generation')
@ApiBearerAuth()
@Public() // 临时禁用认证以便测试
@Controller({ path: 'code-generation', version: '1' })
@UseInterceptors(AmisResponseInterceptor)
export class CodeGenerationController {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  @Get('templates')
  @AmisResponse({
    description: 'Get available code templates',
    dataKey: 'templates'
  })
  @ApiOperation({ summary: 'Get available code templates' })
  async getTemplates(
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
