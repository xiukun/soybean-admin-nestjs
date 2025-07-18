import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@src/app.module';
import { PrismaService } from '@prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as fs from 'fs';
import * as path from 'path';

describe('Code Generation Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let authToken: string;
  let testUserId: string;
  let testProjectId: string;
  let testEntityId: string;
  let testTemplateId: string;
  let generatedFiles: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        username: 'codegenuser',
        email: 'codegen@example.com',
        password: 'hashedpassword',
        status: 'ACTIVE',
      },
    });
    testUserId = testUser.id;

    // Create test project
    const testProject = await prisma.project.create({
      data: {
        name: 'Code Generation Test Project',
        description: 'Test project for code generation',
        version: '1.0.0',
        status: 'ACTIVE',
        createdBy: testUserId,
      },
    });
    testProjectId = testProject.id;

    // Create test entity
    const testEntity = await prisma.entity.create({
      data: {
        projectId: testProjectId,
        name: 'User',
        code: 'user',
        tableName: 'users',
        category: 'core',
        status: 'PUBLISHED',
        createdBy: testUserId,
      },
    });
    testEntityId = testEntity.id;

    // Add fields to the entity
    await prisma.field.createMany({
      data: [
        {
          entityId: testEntityId,
          name: 'ID',
          code: 'id',
          type: 'UUID',
          nullable: false,
          unique: true,
          primaryKey: true,
          order: 1,
          createdBy: testUserId,
        },
        {
          entityId: testEntityId,
          name: 'Username',
          code: 'username',
          type: 'VARCHAR',
          length: 50,
          nullable: false,
          unique: true,
          order: 2,
          createdBy: testUserId,
        },
        {
          entityId: testEntityId,
          name: 'Email',
          code: 'email',
          type: 'VARCHAR',
          length: 255,
          nullable: false,
          unique: true,
          order: 3,
          createdBy: testUserId,
        },
        {
          entityId: testEntityId,
          name: 'Age',
          code: 'age',
          type: 'INTEGER',
          nullable: true,
          order: 4,
          createdBy: testUserId,
        },
        {
          entityId: testEntityId,
          name: 'Active',
          code: 'active',
          type: 'BOOLEAN',
          nullable: false,
          defaultValue: 'true',
          order: 5,
          createdBy: testUserId,
        },
      ],
    });

    // Create test template
    const testTemplate = await prisma.codeTemplate.create({
      data: {
        projectId: testProjectId,
        name: 'NestJS Service Template',
        code: 'nestjs_service',
        description: 'Template for generating NestJS services',
        category: 'SERVICE',
        language: 'TYPESCRIPT',
        framework: 'NESTJS',
        content: `import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@test/prisma/prisma.service';
import { Create{{pascalCase entityName}}Dto, Update{{pascalCase entityName}}Dto } from './dto';

@Injectable()
export class {{pascalCase entityName}}Service {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: any = {}) {
    const { page = 1, size = 10, ...filters } = query;
    const skip = (page - 1) * size;

    const [records, total] = await Promise.all([
      this.prisma.{{camelCase entityName}}.findMany({
        skip,
        take: size,
        where: {
          {{#each filterFields}}
          {{#if (eq type 'string')}}
          {{name}}: filters.{{name}} ? { contains: filters.{{name}}, mode: 'insensitive' } : undefined,
          {{else}}
          {{name}}: filters.{{name}},
          {{/if}}
          {{/each}}
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.{{camelCase entityName}}.count({
        where: {
          {{#each filterFields}}
          {{#if (eq type 'string')}}
          {{name}}: filters.{{name}} ? { contains: filters.{{name}}, mode: 'insensitive' } : undefined,
          {{else}}
          {{name}}: filters.{{name}},
          {{/if}}
          {{/each}}
        },
      }),
    ]);

    return {
      records,
      total,
      current: page,
      size,
    };
  }

  async findOne(id: string) {
    const {{camelCase entityName}} = await this.prisma.{{camelCase entityName}}.findUnique({
      where: { id },
    });

    if (!{{camelCase entityName}}) {
      throw new NotFoundException('{{entityName}} not found');
    }

    return {{camelCase entityName}};
  }

  async create(createDto: Create{{pascalCase entityName}}Dto) {
    return this.prisma.{{camelCase entityName}}.create({
      data: createDto,
    });
  }

  async update(id: string, updateDto: Update{{pascalCase entityName}}Dto) {
    await this.findOne(id); // Check if exists

    return this.prisma.{{camelCase entityName}}.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check if exists

    return this.prisma.{{camelCase entityName}}.delete({
      where: { id },
    });
  }
}`,
        variables: {
          entityName: {
            type: 'string',
            description: 'Entity name',
            required: true,
          },
          filterFields: {
            type: 'array',
            description: 'Fields that can be filtered',
            required: false,
          },
        },
        status: 'PUBLISHED',
        createdBy: testUserId,
      },
    });
    testTemplateId = testTemplate.id;

    authToken = jwtService.sign({
      sub: testUserId,
      username: testUser.username,
      email: testUser.email,
    });
  });

  afterAll(async () => {
    // Clean up generated files
    for (const filePath of generatedFiles) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.warn(`Failed to delete file ${filePath}:`, error.message);
      }
    }

    // Clean up test data
    await prisma.field.deleteMany({ where: { entityId: testEntityId } });
    await prisma.codeTemplate.delete({ where: { id: testTemplateId } });
    await prisma.entity.delete({ where: { id: testEntityId } });
    await prisma.project.delete({ where: { id: testProjectId } });
    await prisma.user.delete({ where: { id: testUserId } });

    await app.close();
  });

  describe('Code Generation Process', () => {
    it('should generate code from template and entity', async () => {
      const generationRequest = {
        templateId: testTemplateId,
        entityId: testEntityId,
        outputPath: './generated/test',
        variables: {
          entityName: 'User',
          filterFields: [
            { name: 'username', type: 'string' },
            { name: 'email', type: 'string' },
            { name: 'active', type: 'boolean' },
          ],
        },
        options: {
          overwrite: true,
          createDirectories: true,
        },
      };

      const response = await request(app.getHttpServer())
        .post('/code-generation/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generationRequest)
        .expect(201);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('generatedFiles');
      expect(response.body).toHaveProperty('generationId');

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.generatedFiles)).toBe(true);
      expect(response.body.generatedFiles.length).toBeGreaterThan(0);

      // Verify generated file content
      const generatedFile = response.body.generatedFiles[0];
      expect(generatedFile).toHaveProperty('path');
      expect(generatedFile).toHaveProperty('content');
      expect(generatedFile.content).toContain('UserService');
      expect(generatedFile.content).toContain('findAll');
      expect(generatedFile.content).toContain('findOne');
      expect(generatedFile.content).toContain('create');
      expect(generatedFile.content).toContain('update');
      expect(generatedFile.content).toContain('remove');

      // Track generated files for cleanup
      generatedFiles.push(...response.body.generatedFiles.map((f: any) => f.path));
    });

    it('should generate multiple files from multiple templates', async () => {
      // Create additional templates
      const controllerTemplate = await prisma.codeTemplate.create({
        data: {
          projectId: testProjectId,
          name: 'NestJS Controller Template',
          code: 'nestjs_controller',
          description: 'Template for generating NestJS controllers',
          category: 'CONTROLLER',
          language: 'TYPESCRIPT',
          framework: 'NESTJS',
          content: `import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { {{pascalCase entityName}}Service } from './{{kebabCase entityName}}.service';

@Controller('{{kebabCase entityName}}s')
export class {{pascalCase entityName}}Controller {
  constructor(private readonly {{camelCase entityName}}Service: {{pascalCase entityName}}Service) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.{{camelCase entityName}}Service.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.{{camelCase entityName}}Service.findOne(id);
  }

  @Post()
  async create(@Body() createDto: any) {
    return this.{{camelCase entityName}}Service.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: any) {
    return this.{{camelCase entityName}}Service.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.{{camelCase entityName}}Service.remove(id);
  }
}`,
          variables: {
            entityName: {
              type: 'string',
              description: 'Entity name',
              required: true,
            },
          },
          status: 'PUBLISHED',
          createdBy: testUserId,
        },
      });

      const batchGenerationRequest = {
        templates: [
          {
            templateId: testTemplateId,
            outputPath: './generated/batch/user.service.ts',
            variables: { entityName: 'User' },
          },
          {
            templateId: controllerTemplate.id,
            outputPath: './generated/batch/user.controller.ts',
            variables: { entityName: 'User' },
          },
        ],
        entityId: testEntityId,
        options: {
          overwrite: true,
          createDirectories: true,
        },
      };

      const response = await request(app.getHttpServer())
        .post('/code-generation/batch-generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(batchGenerationRequest)
        .expect(201);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('results');
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(response.body.results.length).toBe(2);

      // Verify both files were generated
      response.body.results.forEach((result: any) => {
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('generatedFiles');
        expect(result.success).toBe(true);
      });

      // Clean up
      await prisma.codeTemplate.delete({ where: { id: controllerTemplate.id } });
    });

    it('should preview generated code without saving files', async () => {
      const previewRequest = {
        templateId: testTemplateId,
        entityId: testEntityId,
        variables: {
          entityName: 'User',
          filterFields: [
            { name: 'username', type: 'string' },
            { name: 'email', type: 'string' },
          ],
        },
      };

      const response = await request(app.getHttpServer())
        .post('/code-generation/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send(previewRequest)
        .expect(200);

      expect(response.body).toHaveProperty('preview');
      expect(response.body).toHaveProperty('templateName');
      expect(response.body).toHaveProperty('entityName');

      expect(response.body.preview).toContain('UserService');
      expect(response.body.preview).toContain('username');
      expect(response.body.preview).toContain('email');
      expect(response.body.templateName).toBe('NestJS Service Template');
      expect(response.body.entityName).toBe('User');
    });

    it('should validate template variables before generation', async () => {
      const invalidRequest = {
        templateId: testTemplateId,
        entityId: testEntityId,
        outputPath: './generated/invalid',
        variables: {
          // Missing required entityName variable
          filterFields: [],
        },
      };

      const response = await request(app.getHttpServer())
        .post('/code-generation/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRequest)
        .expect(200);

      expect(response.body).toHaveProperty('valid');
      expect(response.body).toHaveProperty('errors');

      expect(response.body.valid).toBe(false);
      expect(Array.isArray(response.body.errors)).toBe(true);
      expect(response.body.errors.length).toBeGreaterThan(0);
      expect(response.body.errors.some((error: any) => 
        error.field === 'entityName' && error.message.includes('required')
      )).toBe(true);
    });

    it('should handle template compilation errors', async () => {
      // Create template with invalid syntax
      const invalidTemplate = await prisma.codeTemplate.create({
        data: {
          projectId: testProjectId,
          name: 'Invalid Template',
          code: 'invalid_template',
          description: 'Template with invalid syntax',
          category: 'SERVICE',
          language: 'TYPESCRIPT',
          content: `{{#invalid syntax}}
This template has invalid Handlebars syntax
{{/invalid}}`,
          variables: {},
          status: 'PUBLISHED',
          createdBy: testUserId,
        },
      });

      const generationRequest = {
        templateId: invalidTemplate.id,
        entityId: testEntityId,
        outputPath: './generated/invalid',
        variables: {},
      };

      const response = await request(app.getHttpServer())
        .post('/code-generation/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generationRequest)
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('error');
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('template');

      // Clean up
      await prisma.codeTemplate.delete({ where: { id: invalidTemplate.id } });
    });
  });

  describe('Generation History and Management', () => {
    it('should save generation history', async () => {
      const generationRequest = {
        templateId: testTemplateId,
        entityId: testEntityId,
        outputPath: './generated/history-test',
        variables: { entityName: 'User' },
        saveHistory: true,
      };

      const response = await request(app.getHttpServer())
        .post('/code-generation/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generationRequest)
        .expect(201);

      expect(response.body).toHaveProperty('generationId');
      const generationId = response.body.generationId;

      // Get generation history
      const historyResponse = await request(app.getHttpServer())
        .get(`/code-generation/history/${generationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(historyResponse.body).toHaveProperty('id');
      expect(historyResponse.body).toHaveProperty('templateId');
      expect(historyResponse.body).toHaveProperty('entityId');
      expect(historyResponse.body).toHaveProperty('variables');
      expect(historyResponse.body).toHaveProperty('generatedFiles');
      expect(historyResponse.body).toHaveProperty('createdAt');

      expect(historyResponse.body.id).toBe(generationId);
      expect(historyResponse.body.templateId).toBe(testTemplateId);
      expect(historyResponse.body.entityId).toBe(testEntityId);
    });

    it('should get generation history for project', async () => {
      const response = await request(app.getHttpServer())
        .get(`/code-generation/project/${testProjectId}/history`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          page: 1,
          size: 10,
        })
        .expect(200);

      expect(response.body).toHaveProperty('records');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.records)).toBe(true);

      if (response.body.records.length > 0) {
        const record = response.body.records[0];
        expect(record).toHaveProperty('id');
        expect(record).toHaveProperty('templateName');
        expect(record).toHaveProperty('entityName');
        expect(record).toHaveProperty('createdAt');
      }
    });

    it('should get generation statistics', async () => {
      const response = await request(app.getHttpServer())
        .get(`/code-generation/project/${testProjectId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalGenerations');
      expect(response.body).toHaveProperty('byTemplate');
      expect(response.body).toHaveProperty('byEntity');
      expect(response.body).toHaveProperty('recentGenerations');

      expect(typeof response.body.totalGenerations).toBe('number');
      expect(typeof response.body.byTemplate).toBe('object');
      expect(typeof response.body.byEntity).toBe('object');
      expect(Array.isArray(response.body.recentGenerations)).toBe(true);
    });
  });

  describe('File Management', () => {
    it('should handle file conflicts with overwrite option', async () => {
      const filePath = './generated/conflict-test/user.service.ts';
      
      // First generation
      const firstRequest = {
        templateId: testTemplateId,
        entityId: testEntityId,
        outputPath: filePath,
        variables: { entityName: 'User' },
        options: { overwrite: false },
      };

      await request(app.getHttpServer())
        .post('/code-generation/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(firstRequest)
        .expect(201);

      // Second generation with same path (should fail without overwrite)
      const secondRequest = {
        ...firstRequest,
        variables: { entityName: 'UpdatedUser' },
      };

      await request(app.getHttpServer())
        .post('/code-generation/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(secondRequest)
        .expect(409); // Conflict

      // Third generation with overwrite enabled (should succeed)
      const thirdRequest = {
        ...secondRequest,
        options: { overwrite: true },
      };

      const response = await request(app.getHttpServer())
        .post('/code-generation/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(thirdRequest)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.generatedFiles[0].content).toContain('UpdatedUserService');

      generatedFiles.push(filePath);
    });

    it('should create directories automatically', async () => {
      const deepPath = './generated/deep/nested/directory/user.service.ts';
      
      const generationRequest = {
        templateId: testTemplateId,
        entityId: testEntityId,
        outputPath: deepPath,
        variables: { entityName: 'User' },
        options: { createDirectories: true },
      };

      const response = await request(app.getHttpServer())
        .post('/code-generation/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generationRequest)
        .expect(201);

      expect(response.body.success).toBe(true);
      
      // Verify directory was created
      const dirPath = path.dirname(deepPath);
      expect(fs.existsSync(dirPath)).toBe(true);

      generatedFiles.push(deepPath);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent template', async () => {
      const nonExistentTemplateId = '00000000-0000-0000-0000-000000000000';

      const generationRequest = {
        templateId: nonExistentTemplateId,
        entityId: testEntityId,
        outputPath: './generated/non-existent',
        variables: {},
      };

      await request(app.getHttpServer())
        .post('/code-generation/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generationRequest)
        .expect(404);
    });

    it('should handle non-existent entity', async () => {
      const nonExistentEntityId = '00000000-0000-0000-0000-000000000000';

      const generationRequest = {
        templateId: testTemplateId,
        entityId: nonExistentEntityId,
        outputPath: './generated/non-existent',
        variables: { entityName: 'User' },
      };

      await request(app.getHttpServer())
        .post('/code-generation/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generationRequest)
        .expect(404);
    });

    it('should require authentication', async () => {
      const generationRequest = {
        templateId: testTemplateId,
        entityId: testEntityId,
        outputPath: './generated/unauthorized',
        variables: { entityName: 'User' },
      };

      await request(app.getHttpServer())
        .post('/code-generation/generate')
        .send(generationRequest)
        .expect(401);
    });

    it('should validate required fields', async () => {
      const invalidRequest = {
        // Missing templateId, entityId, outputPath
        variables: { entityName: 'User' },
      };

      await request(app.getHttpServer())
        .post('/code-generation/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRequest)
        .expect(400);
    });
  });
});
