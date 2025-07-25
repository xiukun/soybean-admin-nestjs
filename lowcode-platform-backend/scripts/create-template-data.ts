import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 模板数据定义
const templateData = [
  // NestJS TypeScript 模板
  {
    id: 'nestjs-entity-controller',
    projectId: 'demo-project-1',
    name: 'NestJS 实体控制器',
    code: 'nestjs-entity-controller',
    description: '生成基于实体的NestJS控制器，包含CRUD操作',
    category: 'CONTROLLER',
    language: 'TYPESCRIPT',
    framework: 'NESTJS',
    template: `import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { {{pascalCase entityName}}Service } from './{{kebabCase entityName}}.service';
import { Create{{pascalCase entityName}}Dto, Update{{pascalCase entityName}}Dto, {{pascalCase entityName}}QueryDto } from './dto/{{kebabCase entityName}}.dto';

@ApiTags('{{entityName}}')
@ApiBearerAuth()
@Controller('{{kebabCase entityName}}')
export class {{pascalCase entityName}}Controller {
  constructor(private readonly {{camelCase entityName}}Service: {{pascalCase entityName}}Service) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建{{entityDescription}}' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '{{entityDescription}}创建成功' })
  async create(@Body() createDto: Create{{pascalCase entityName}}Dto) {
    return this.{{camelCase entityName}}Service.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: '获取{{entityDescription}}列表' })
  @ApiResponse({ status: HttpStatus.OK, description: '{{entityDescription}}列表获取成功' })
  async findAll(@Query() query: {{pascalCase entityName}}QueryDto) {
    return this.{{camelCase entityName}}Service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取{{entityDescription}}' })
  @ApiParam({ name: 'id', description: '{{entityDescription}}ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '{{entityDescription}}获取成功' })
  async findOne(@Param('id') id: string) {
    return this.{{camelCase entityName}}Service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新{{entityDescription}}' })
  @ApiParam({ name: 'id', description: '{{entityDescription}}ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '{{entityDescription}}更新成功' })
  async update(@Param('id') id: string, @Body() updateDto: Update{{pascalCase entityName}}Dto) {
    return this.{{camelCase entityName}}Service.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除{{entityDescription}}' })
  @ApiParam({ name: 'id', description: '{{entityDescription}}ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '{{entityDescription}}删除成功' })
  async remove(@Param('id') id: string) {
    return this.{{camelCase entityName}}Service.remove(id);
  }
}`,
    variables: [
      { name: 'entityName', type: 'string', description: '实体名称', required: true, defaultValue: 'User' },
      { name: 'entityDescription', type: 'string', description: '实体描述', required: true, defaultValue: '用户' }
    ],
    tags: ['nestjs', 'controller', 'crud'],
    isPublic: true,
    status: 'PUBLISHED',
    version: '1.0.0',
    createdBy: 'system'
  },
  {
    id: 'nestjs-entity-service',
    projectId: 'demo-project-1',
    name: 'NestJS 实体服务',
    code: 'nestjs-entity-service',
    description: '生成基于实体的NestJS服务，包含业务逻辑',
    category: 'SERVICE',
    language: 'TYPESCRIPT',
    framework: 'NESTJS',
    template: `import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { Create{{pascalCase entityName}}Dto, Update{{pascalCase entityName}}Dto, {{pascalCase entityName}}QueryDto } from './dto/{{kebabCase entityName}}.dto';

@Injectable()
export class {{pascalCase entityName}}Service {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: Create{{pascalCase entityName}}Dto) {
    try {
      const {{camelCase entityName}} = await this.prisma.{{camelCase entityName}}.create({
        data: createDto,
      });
      return {{camelCase entityName}};
    } catch (error) {
      throw new BadRequestException('创建{{entityDescription}}失败');
    }
  }

  async findAll(query: {{pascalCase entityName}}QueryDto) {
    const { page = 1, limit = 10, ...filters } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.{{camelCase entityName}}.findMany({
        where: filters,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.{{camelCase entityName}}.count({ where: filters }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const {{camelCase entityName}} = await this.prisma.{{camelCase entityName}}.findUnique({
      where: { id },
    });

    if (!{{camelCase entityName}}) {
      throw new NotFoundException('{{entityDescription}}不存在');
    }

    return {{camelCase entityName}};
  }

  async update(id: string, updateDto: Update{{pascalCase entityName}}Dto) {
    await this.findOne(id); // 检查是否存在

    try {
      const {{camelCase entityName}} = await this.prisma.{{camelCase entityName}}.update({
        where: { id },
        data: updateDto,
      });
      return {{camelCase entityName}};
    } catch (error) {
      throw new BadRequestException('更新{{entityDescription}}失败');
    }
  }

  async remove(id: string) {
    await this.findOne(id); // 检查是否存在

    try {
      await this.prisma.{{camelCase entityName}}.delete({
        where: { id },
      });
      return { message: '{{entityDescription}}删除成功' };
    } catch (error) {
      throw new BadRequestException('删除{{entityDescription}}失败');
    }
  }
}`,
    variables: [
      { name: 'entityName', type: 'string', description: '实体名称', required: true, defaultValue: 'User' },
      { name: 'entityDescription', type: 'string', description: '实体描述', required: true, defaultValue: '用户' }
    ],
    tags: ['nestjs', 'service', 'crud'],
    isPublic: true,
    status: 'PUBLISHED',
    version: '1.0.0',
    createdBy: 'system'
  },
  {
    id: 'nestjs-entity-dto',
    projectId: 'demo-project-1',
    name: 'NestJS 实体DTO',
    code: 'nestjs-entity-dto',
    description: '生成基于实体的NestJS数据传输对象',
    category: 'DTO',
    language: 'TYPESCRIPT',
    framework: 'NESTJS',
    template: `import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsEmail, IsDate, IsEnum } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class Create{{pascalCase entityName}}Dto {
{{#each fieldList}}
  {{#if required}}
  @ApiProperty({ description: '{{description}}' })
  {{#eq type 'string'}}@IsString(){{/eq}}
  {{#eq type 'number'}}@IsNumber(){{/eq}}
  {{#eq type 'boolean'}}@IsBoolean(){{/eq}}
  {{#eq type 'email'}}@IsEmail(){{/eq}}
  {{#eq type 'date'}}@IsDate() @Type(() => Date){{/eq}}
  {{else}}
  @ApiPropertyOptional({ description: '{{description}}' })
  @IsOptional()
  {{#eq type 'string'}}@IsString(){{/eq}}
  {{#eq type 'number'}}@IsNumber(){{/eq}}
  {{#eq type 'boolean'}}@IsBoolean(){{/eq}}
  {{#eq type 'email'}}@IsEmail(){{/eq}}
  {{#eq type 'date'}}@IsDate() @Type(() => Date){{/eq}}
  {{/if}}
  {{code}}: {{#eq type 'date'}}Date{{else}}{{type}}{{/eq}};

{{/each}}
}

export class Update{{pascalCase entityName}}Dto extends PartialType(Create{{pascalCase entityName}}Dto) {}

export class {{pascalCase entityName}}QueryDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

{{#each fieldList}}
  {{#unless primaryKey}}
  @ApiPropertyOptional({ description: '{{description}}' })
  @IsOptional()
  {{#eq type 'string'}}@IsString(){{/eq}}
  {{#eq type 'number'}}@IsNumber(){{/eq}}
  {{#eq type 'boolean'}}@IsBoolean(){{/eq}}
  {{#eq type 'email'}}@IsEmail(){{/eq}}
  {{#eq type 'date'}}@IsDate() @Type(() => Date){{/eq}}
  {{code}}?: {{#eq type 'date'}}Date{{else}}{{type}}{{/eq}};

  {{/unless}}
{{/each}}
}`,
    variables: [
      { name: 'entityName', type: 'string', description: '实体名称', required: true, defaultValue: 'User' },
      { name: 'fieldList', type: 'array', description: '字段列表', required: true, defaultValue: [] }
    ],
    tags: ['nestjs', 'dto', 'validation'],
    isPublic: true,
    status: 'PUBLISHED',
    version: '1.0.0',
    createdBy: 'system'
  },
  {
    id: 'nestjs-entity-module',
    projectId: 'demo-project-1',
    name: 'NestJS 实体模块',
    code: 'nestjs-entity-module',
    description: '生成基于实体的NestJS模块',
    category: 'MODULE',
    language: 'TYPESCRIPT',
    framework: 'NESTJS',
    template: `import { Module } from '@nestjs/common';
import { {{pascalCase entityName}}Controller } from './{{kebabCase entityName}}.controller';
import { {{pascalCase entityName}}Service } from './{{kebabCase entityName}}.service';
import { PrismaModule } from '@/shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [{{pascalCase entityName}}Controller],
  providers: [{{pascalCase entityName}}Service],
  exports: [{{pascalCase entityName}}Service],
})
export class {{pascalCase entityName}}Module {}`,
    variables: [
      { name: 'entityName', type: 'string', description: '实体名称', required: true, defaultValue: 'User' }
    ],
    tags: ['nestjs', 'module'],
    isPublic: true,
    status: 'PUBLISHED',
    version: '1.0.0',
    createdBy: 'system'
  }
];

async function createTemplateData() {
  console.log('🚀 开始创建模板数据...');

  try {
    // 1. 确保项目存在
    console.log('📁 检查示例项目...');
    let project = await prisma.project.findFirst({
      where: { code: 'demo-project-1' }
    });

    if (!project) {
      console.log('📁 创建示例项目...');
      project = await prisma.project.create({
        data: {
          id: 'demo-project-1',
          name: '演示项目',
          code: 'demo-project-1',
          description: '用于演示和测试的项目',
          version: '1.0.0',
          config: {
            database: { type: 'postgresql', host: 'localhost', port: 5432 },
            api: { baseUrl: '/api/v1', prefix: 'demo' }
          },
          status: 'ACTIVE',
          createdBy: 'system',
        },
      });
      console.log('✅ 示例项目创建成功:', project.name);
    } else {
      console.log('✅ 示例项目已存在:', project.name);
    }

    // 2. 创建模板数据
    console.log('📝 创建模板数据...');
    
    for (const template of templateData) {
      try {
        // 删除可能存在的旧模板
        await prisma.codeTemplate.deleteMany({
          where: {
            OR: [
              { id: template.id },
              { 
                projectId: template.projectId,
                code: template.code
              }
            ]
          }
        });

        // 创建新模板
        const createdTemplate = await prisma.codeTemplate.create({
          data: {
            ...template,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        console.log(`✅ 模板创建成功: ${createdTemplate.name}`);
      } catch (error) {
        console.error(`❌ 模板创建失败: ${template.name}`, error);
      }
    }

    // 3. 验证创建结果
    console.log('🔍 验证模板创建结果...');
    const createdTemplates = await prisma.codeTemplate.findMany({
      where: { projectId: 'demo-project-1' },
      select: { id: true, name: true, category: true, language: true, framework: true, status: true }
    });

    console.log('✅ 创建的模板列表:');
    createdTemplates.forEach(template => {
      console.log(`   - ${template.name} (${template.category}, ${template.language}/${template.framework}) - ${template.status}`);
    });

    console.log(`🎉 模板数据创建完成! 共创建 ${createdTemplates.length} 个模板`);

  } catch (error) {
    console.error('❌ 创建模板数据失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
if (require.main === module) {
  createTemplateData()
    .then(() => {
      console.log('🎉 脚本执行完成!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 脚本执行失败:', error);
      process.exit(1);
    });
}

export { createTemplateData };
