import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from '@src/app.service';
import { PrismaService } from '@lib/shared/prisma/prisma.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Application info' })
  @ApiResponse({ status: 200, description: 'Application information' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('code-templates')
  @ApiOperation({ summary: 'Get code templates' })
  @ApiResponse({ status: 200, description: 'Code templates retrieved successfully' })
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

    return {
      status: 0,
      msg: 'success',
      data: templates.map(template => ({
        ...template,
        variables: typeof template.variables === 'string'
          ? JSON.parse(template.variables)
          : template.variables,
      })),
    };
  }
}
