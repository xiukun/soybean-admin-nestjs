import { Controller, Get, Inject, UseGuards, Query } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';

import {
  ApiKeyAuthSource,
  ApiKeyAuthStrategy,
} from '@lib/constants/api-key.constant';
import { ApiKeyAuth } from '@lib/infra/decorators/api-key.decorator';
import { BypassTransform } from '@lib/infra/decorators/bypass-transform.decorator';
import { Public } from '@lib/infra/decorators/public.decorator';
import { ApiJwtAuth } from '@lib/infra/decorators/api-bearer-auth.decorator';
import {
  ComplexApiKeyServiceToken,
  SimpleApiKeyServiceToken,
} from '@lib/infra/guard/api-key/api-key.constants';
import { ApiKeyGuard } from '@lib/infra/guard/api-key/api-key.guard';
import { IApiKeyService } from '@lib/infra/guard/api-key/services/api-key.interface';
import { ApiRes } from '@lib/infra/rest/res.response';
import { PrismaService } from '@lib/shared/prisma/prisma.service';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
    private readonly http: HttpHealthIndicator,
    private readonly health: HealthCheckService,
    private readonly db: PrismaHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    @Inject(SimpleApiKeyServiceToken)
    private readonly simpleApiKeyService: IApiKeyService,
    @Inject(ComplexApiKeyServiceToken)
    private readonly complexApiKeyService: IApiKeyService,
  ) {}

  @Get()
  @Public()
  @BypassTransform()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/healthy')
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
      () => this.db.pingCheck('database', this.prisma, { timeout: 1000 }),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }

  @Get('/system-info')
  @ApiJwtAuth() // 添加Bearer认证装饰器
  async getSystemInfo() {
    const result = await this.appService.getSystemInfo();
    return ApiRes.success(result);
  }

  @Get('/redis-info')
  @ApiJwtAuth() // 添加Bearer认证装饰器
  async getRedisInfo() {
    const result = await this.appService.getRedisInfo();
    return ApiRes.success(result);
  }

  @Get('apikey-protected-set')
  @Public()
  async apiKeySet() {
    await this.simpleApiKeyService.addKey('soybean-api-key');
  }

  @Get('apikey-protected')
  @Public()
  @ApiKeyAuth({
    strategy: ApiKeyAuthStrategy.ApiKey,
    keyName: 'api-key',
    source: ApiKeyAuthSource.Header,
  })
  @UseGuards(ApiKeyGuard)
  async apiKey() {
    return this.appService.getHello();
  }

  @Get('sign-protected-set')
  @Public()
  async signProtectedSet() {
    await this.complexApiKeyService.addKey(
      'soybean-api-key',
      'soybean-api-secret',
    );
  }

  @Get('sign-protected')
  @Public()
  @ApiKeyAuth({
    strategy: ApiKeyAuthStrategy.SignedRequest,
    keyName: 'AccessKeyId',
  })
  @UseGuards(ApiKeyGuard)
  async apiKeyAndSecret() {
    return this.appService.getHello();
  }

  @Get('code-templates')
  @Public()
  async getCodeTemplates(
    @Query('type') type?: string,
    @Query('language') language?: string,
    @Query('framework') framework?: string,
  ) {
    // 返回模拟数据，因为当前数据库中没有 CodeTemplate 表
    const mockTemplates = [
      {
        id: '1',
        name: 'React Component Template',
        code: 'import React from "react";\n\nexport const {{componentName}} = () => {\n  return (\n    <div>\n      <h1>{{title}}</h1>\n    </div>\n  );\n};',
        type: 'component',
        language: 'typescript',
        framework: 'react',
        description: 'Basic React component template',
        variables: {
          componentName: { type: 'string', description: 'Component name' },
          title: { type: 'string', description: 'Component title' }
        },
        version: '1.0.0',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'Vue Component Template',
        code: '<template>\n  <div>\n    <h1>{{ title }}</h1>\n  </div>\n</template>\n\n<script>\nexport default {\n  name: "{{componentName}}",\n  props: {\n    title: String\n  }\n}\n</script>',
        type: 'component',
        language: 'typescript',
        framework: 'vue',
        description: 'Basic Vue component template',
        variables: {
          componentName: { type: 'string', description: 'Component name' },
          title: { type: 'string', description: 'Component title' }
        },
        version: '1.0.0',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    // 根据查询参数过滤
    let filteredTemplates = mockTemplates;

    if (type) {
      filteredTemplates = filteredTemplates.filter(t => t.type === type);
    }

    if (language) {
      filteredTemplates = filteredTemplates.filter(t => t.language === language);
    }

    if (framework) {
      filteredTemplates = filteredTemplates.filter(t => t.framework === framework);
    }

    return ApiRes.success(filteredTemplates);
  }
}
