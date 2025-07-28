import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@src/app.module';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Template Management Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let authToken: string;
  let testUserId: string;
  let testProjectId: string;
  let createdTemplateIds: string[] = [];

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
        username: 'templatetestuser',
        email: 'templatetest@example.com',
        password: 'hashedpassword',
        status: 'ACTIVE',
      },
    });
    testUserId = testUser.id;

    // Create test project
    const testProject = await prisma.project.create({
      data: {
        name: 'Template Test Project',
        description: 'Test project for template management',
        version: '1.0.0',
        status: 'ACTIVE',
        createdBy: testUserId,
      },
    });
    testProjectId = testProject.id;

    authToken = jwtService.sign({
      sub: testUserId,
      username: testUser.username,
      email: testUser.email,
    });
  });

  afterAll(async () => {
    // Clean up test data in reverse order
    for (const templateId of createdTemplateIds) {
      try {
        await prisma.codeTemplate.delete({ where: { id: templateId } });
      } catch (error) {
        console.warn(`Failed to delete template ${templateId}:`, error.message);
      }
    }

    await prisma.project.delete({ where: { id: testProjectId } });
    await prisma.user.delete({ where: { id: testUserId } });

    await app.close();
  });

  describe('Template CRUD Operations', () => {
    it('should create different types of code templates', async () => {
      const templates = [
        {
          projectId: testProjectId,
          name: 'NestJS Controller Template',
          code: 'nestjs_controller',
          description: 'Template for generating NestJS controllers',
          category: 'CONTROLLER',
          language: 'TYPESCRIPT',
          framework: 'NESTJS',
          content: `import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { {{pascalCase entityName}}Service } from './{{kebabCase entityName}}.service';
import { Create{{pascalCase entityName}}Dto, Update{{pascalCase entityName}}Dto, {{pascalCase entityName}}QueryDto } from './dto';

@Controller('{{kebabCase entityName}}s')
@ApiTags('{{entityName}}')
export class {{pascalCase entityName}}Controller {
  constructor(private readonly {{camelCase entityName}}Service: {{pascalCase entityName}}Service) {}

  @Get()
  @ApiOperation({ summary: 'Get all {{entityName}}s' })
  async findAll(@Query() query: {{pascalCase entityName}}QueryDto) {
    return this.{{camelCase entityName}}Service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get {{entityName}} by id' })
  async findOne(@Param('id') id: string) {
    return this.{{camelCase entityName}}Service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create {{entityName}}' })
  async create(@Body() createDto: Create{{pascalCase entityName}}Dto) {
    return this.{{camelCase entityName}}Service.create(createDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update {{entityName}}' })
  async update(@Param('id') id: string, @Body() updateDto: Update{{pascalCase entityName}}Dto) {
    return this.{{camelCase entityName}}Service.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete {{entityName}}' })
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
          tags: ['nestjs', 'controller', 'typescript'],
          isPublic: false,
          status: 'ACTIVE',
        },
        {
          projectId: testProjectId,
          name: 'Vue Component Template',
          code: 'vue_component',
          description: 'Template for generating Vue 3 components',
          category: 'COMPONENT',
          language: 'TYPESCRIPT',
          framework: 'VUE',
          content: `<template>
  <div class="{{kebabCase componentName}}">
    <div class="header">
      <h1>{{ title }}</h1>
      <n-button @click="handleAdd" type="primary">
        {{ $t('common.add') }}
      </n-button>
    </div>
    
    <div class="content">
      <n-data-table
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        @update:page="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import type { {{pascalCase entityName}} } from '@/types';

interface Props {
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '{{entityName}} Management',
});

const { t } = useI18n();

const data = ref<{{pascalCase entityName}}[]>([]);
const loading = ref(false);
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0,
});

const columns = [
  {{#each fields}}
  {
    title: '{{label}}',
    key: '{{name}}',
    {{#if sortable}}sorter: true,{{/if}}
  },
  {{/each}}
  {
    title: t('common.actions'),
    key: 'actions',
    render: (row: {{pascalCase entityName}}) => [
      h(NButton, { onClick: () => handleEdit(row) }, { default: () => t('common.edit') }),
      h(NButton, { onClick: () => handleDelete(row.id) }, { default: () => t('common.delete') }),
    ],
  },
];

const handleAdd = () => {
  // Add logic
};

const handleEdit = (row: {{pascalCase entityName}}) => {
  // Edit logic
};

const handleDelete = (id: string) => {
  // Delete logic
};

const handlePageChange = (page: number) => {
  pagination.value.page = page;
  loadData();
};

const loadData = async () => {
  loading.value = true;
  try {
    // Load data logic
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.{{kebabCase componentName}} {
  padding: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.content {
  background: white;
  border-radius: 8px;
  padding: 16px;
}
</style>`,
          variables: {
            componentName: {
              type: 'string',
              description: 'Component name',
              required: true,
            },
            entityName: {
              type: 'string',
              description: 'Entity name',
              required: true,
            },
            fields: {
              type: 'array',
              description: 'Entity fields',
              required: true,
            },
          },
          tags: ['vue', 'component', 'typescript'],
          isPublic: true,
          status: 'ACTIVE',
        },
        {
          projectId: testProjectId,
          name: 'Prisma Model Template',
          code: 'prisma_model',
          description: 'Template for generating Prisma models',
          category: 'MODEL',
          language: 'TYPESCRIPT',
          framework: 'PRISMA',
          content: `model {{pascalCase modelName}} {
  {{#each fields}}
  {{name}} {{type}}{{#if optional}}?{{/if}}{{#if unique}} @unique{{/if}}{{#if id}} @id{{/if}}{{#if defaultValue}} @default({{defaultValue}}){{/if}}
  {{/each}}

  {{#each relations}}
  {{name}} {{type}}{{#if optional}}?{{/if}}{{#if array}}[]{{/if}}{{#if relation}} @relation("{{relation}}"){{/if}}
  {{/each}}

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  {{#if softDelete}}
  deletedAt DateTime?
  {{/if}}

  @@map("{{tableName}}")
  {{#each indexes}}
  @@index([{{fields}}])
  {{/each}}
  {{#each uniqueConstraints}}
  @@unique([{{fields}}])
  {{/each}}
}`,
          variables: {
            modelName: {
              type: 'string',
              description: 'Model name',
              required: true,
            },
            tableName: {
              type: 'string',
              description: 'Database table name',
              required: true,
            },
            fields: {
              type: 'array',
              description: 'Model fields',
              required: true,
            },
            relations: {
              type: 'array',
              description: 'Model relations',
              required: false,
            },
            indexes: {
              type: 'array',
              description: 'Database indexes',
              required: false,
            },
            uniqueConstraints: {
              type: 'array',
              description: 'Unique constraints',
              required: false,
            },
            softDelete: {
              type: 'boolean',
              description: 'Enable soft delete',
              required: false,
              defaultValue: false,
            },
          },
          tags: ['prisma', 'model', 'database'],
          isPublic: true,
          status: 'ACTIVE',
        },
        {
          projectId: testProjectId,
          name: 'Jest Test Template',
          code: 'jest_test',
          description: 'Template for generating Jest unit tests',
          category: 'TEST',
          language: 'TYPESCRIPT',
          framework: 'JEST',
          content: `import { Test, TestingModule } from '@nestjs/testing';
import { {{pascalCase serviceName}} } from './{{kebabCase serviceName}}.service';
import { {{pascalCase repositoryName}} } from './{{kebabCase repositoryName}}.repository';

describe('{{pascalCase serviceName}}', () => {
  let service: {{pascalCase serviceName}};
  let repository: {{pascalCase repositoryName}};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {{pascalCase serviceName}},
        {
          provide: {{pascalCase repositoryName}},
          useValue: {
            {{#each methods}}
            {{name}}: jest.fn(),
            {{/each}}
          },
        },
      ],
    }).compile();

    service = module.get<{{pascalCase serviceName}}>({{pascalCase serviceName}});
    repository = module.get<{{pascalCase repositoryName}}>({{pascalCase repositoryName}});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  {{#each testCases}}
  describe('{{method}}', () => {
    it('{{description}}', async () => {
      // Arrange
      const {{inputVariable}} = {{inputData}};
      const expected{{outputVariable}} = {{expectedData}};
      
      jest.spyOn(repository, '{{repositoryMethod}}').mockResolvedValue(expected{{outputVariable}});

      // Act
      const result = await service.{{method}}({{inputVariable}});

      // Assert
      expect(repository.{{repositoryMethod}}).toHaveBeenCalledWith({{inputVariable}});
      expect(result).toEqual(expected{{outputVariable}});
    });

    it('should handle errors', async () => {
      // Arrange
      const {{inputVariable}} = {{inputData}};
      const error = new Error('{{errorMessage}}');
      
      jest.spyOn(repository, '{{repositoryMethod}}').mockRejectedValue(error);

      // Act & Assert
      await expect(service.{{method}}({{inputVariable}})).rejects.toThrow('{{errorMessage}}');
    });
  });
  {{/each}}
});`,
          variables: {
            serviceName: {
              type: 'string',
              description: 'Service name',
              required: true,
            },
            repositoryName: {
              type: 'string',
              description: 'Repository name',
              required: true,
            },
            methods: {
              type: 'array',
              description: 'Repository methods',
              required: true,
            },
            testCases: {
              type: 'array',
              description: 'Test cases',
              required: true,
            },
          },
          tags: ['jest', 'test', 'unit-test'],
          isPublic: true,
          status: 'ACTIVE',
        },
      ];

      for (const templateData of templates) {
        const response = await request(app.getHttpServer())
          .post('/code-templates')
          .set('Authorization', `Bearer ${authToken}`)
          .send(templateData)
          .expect(201);

        expect(response.body).toMatchObject({
          projectId: testProjectId,
          name: templateData.name,
          code: templateData.code,
          description: templateData.description,
          category: templateData.category,
          language: templateData.language,
          framework: templateData.framework,
          isPublic: templateData.isPublic,
          status: templateData.status,
          createdBy: testUserId,
        });

        expect(response.body.id).toBeDefined();
        expect(response.body.version).toBe(1);
        createdTemplateIds.push(response.body.id);
      }
    });

    it('should get templates by project', async () => {
      const response = await request(app.getHttpServer())
        .get(`/code-templates/project/${testProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(4); // All created templates

      // Verify each template has required properties
      response.body.forEach((template: any) => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('code');
        expect(template).toHaveProperty('category');
        expect(template.projectId).toBe(testProjectId);
      });
    });

    it('should get paginated templates', async () => {
      const response = await request(app.getHttpServer())
        .get(`/code-templates/project/${testProjectId}/paginated`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          current: 1,
          size: 2,
        })
        .expect(200);

      expect(response.body).toHaveProperty('records');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('current');
      expect(response.body).toHaveProperty('size');

      expect(Array.isArray(response.body.records)).toBe(true);
      expect(response.body.records.length).toBeLessThanOrEqual(2);
      expect(response.body.total).toBe(4);
      expect(response.body.current).toBe(1);
      expect(response.body.size).toBe(2);
    });

    it('should update template', async () => {
      const templateId = createdTemplateIds[0];
      const updateData = {
        name: 'Updated NestJS Controller Template',
        description: 'Updated template for generating NestJS controllers',
        content: 'Updated template content...',
        tags: ['nestjs', 'controller', 'typescript', 'updated'],
      };

      const response = await request(app.getHttpServer())
        .put(`/code-templates/${templateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: templateId,
        name: updateData.name,
        description: updateData.description,
        content: updateData.content,
        tags: updateData.tags,
        updatedBy: testUserId,
      });

      expect(response.body.version).toBe(2);
    });

    it('should search templates by name', async () => {
      const response = await request(app.getHttpServer())
        .get(`/code-templates/project/${testProjectId}/paginated`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          current: 1,
          size: 10,
          search: 'Vue',
        })
        .expect(200);

      expect(response.body.records.length).toBeGreaterThan(0);
      expect(response.body.records[0].name).toContain('Vue');
    });

    it('should filter templates by category', async () => {
      const response = await request(app.getHttpServer())
        .get(`/code-templates/project/${testProjectId}/paginated`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          current: 1,
          size: 10,
          category: 'CONTROLLER',
        })
        .expect(200);

      expect(response.body.records.length).toBeGreaterThan(0);
      response.body.records.forEach((template: any) => {
        expect(template.category).toBe('CONTROLLER');
      });
    });

    it('should filter templates by language', async () => {
      const response = await request(app.getHttpServer())
        .get(`/code-templates/project/${testProjectId}/paginated`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          current: 1,
          size: 10,
          language: 'TYPESCRIPT',
        })
        .expect(200);

      expect(response.body.records.length).toBeGreaterThan(0);
      response.body.records.forEach((template: any) => {
        expect(template.language).toBe('TYPESCRIPT');
      });
    });

    it('should filter templates by framework', async () => {
      const response = await request(app.getHttpServer())
        .get(`/code-templates/project/${testProjectId}/paginated`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          current: 1,
          size: 10,
          framework: 'NESTJS',
        })
        .expect(200);

      expect(response.body.records.length).toBeGreaterThan(0);
      response.body.records.forEach((template: any) => {
        expect(template.framework).toBe('NESTJS');
      });
    });
  });

  describe('Template Validation', () => {
    it('should validate required fields', async () => {
      const invalidData = {
        projectId: testProjectId,
        // Missing name, code, content
        description: 'Invalid template',
      };

      await request(app.getHttpServer())
        .post('/code-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should validate code uniqueness within project', async () => {
      const duplicateData = {
        projectId: testProjectId,
        name: 'Duplicate Template',
        code: 'nestjs_controller', // Same code as existing template
        description: 'Duplicate template',
        category: 'CONTROLLER',
        language: 'TYPESCRIPT',
        content: 'Duplicate content',
        status: 'ACTIVE',
      };

      await request(app.getHttpServer())
        .post('/code-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateData)
        .expect(409);
    });

    it('should validate template category', async () => {
      const invalidCategoryData = {
        projectId: testProjectId,
        name: 'Invalid Category Template',
        code: 'invalid_category',
        description: 'Template with invalid category',
        category: 'INVALID_CATEGORY',
        language: 'TYPESCRIPT',
        content: 'Template content',
        status: 'ACTIVE',
      };

      await request(app.getHttpServer())
        .post('/code-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidCategoryData)
        .expect(400);
    });

    it('should validate template language', async () => {
      const invalidLanguageData = {
        projectId: testProjectId,
        name: 'Invalid Language Template',
        code: 'invalid_language',
        description: 'Template with invalid language',
        category: 'CONTROLLER',
        language: 'INVALID_LANGUAGE',
        content: 'Template content',
        status: 'ACTIVE',
      };

      await request(app.getHttpServer())
        .post('/code-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidLanguageData)
        .expect(400);
    });
  });

  describe('Template Operations', () => {
    it('should preview template with variables', async () => {
      const templateId = createdTemplateIds[0]; // NestJS Controller template

      const previewData = {
        variables: {
          entityName: 'User',
        },
      };

      const response = await request(app.getHttpServer())
        .post(`/code-templates/${templateId}/preview`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(previewData)
        .expect(200);

      expect(response.body).toHaveProperty('preview');
      expect(response.body.preview).toContain('UserController');
      expect(response.body.preview).toContain('UserService');
      expect(response.body.preview).toContain('users');
    });

    it('should validate template variables', async () => {
      const templateId = createdTemplateIds[0];

      const response = await request(app.getHttpServer())
        .post(`/code-templates/${templateId}/validate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('valid');
      expect(response.body).toHaveProperty('errors');
      expect(response.body).toHaveProperty('variables');

      if (!response.body.valid) {
        expect(Array.isArray(response.body.errors)).toBe(true);
      }
    });

    it('should duplicate template', async () => {
      const originalTemplateId = createdTemplateIds[1]; // Vue Component template

      const response = await request(app.getHttpServer())
        .post(`/code-templates/${originalTemplateId}/duplicate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Duplicated Vue Component Template',
          code: 'vue_component_duplicate',
        })
        .expect(201);

      expect(response.body.name).toBe('Duplicated Vue Component Template');
      expect(response.body.code).toBe('vue_component_duplicate');
      expect(response.body.category).toBe('COMPONENT'); // Same as original
      expect(response.body.language).toBe('TYPESCRIPT'); // Same as original
      expect(response.body.framework).toBe('VUE'); // Same as original
      expect(response.body.projectId).toBe(testProjectId);

      createdTemplateIds.push(response.body.id);
    });

    it('should publish template', async () => {
      // First create a draft template
      const draftTemplate = await request(app.getHttpServer())
        .post('/code-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          name: 'Draft Template',
          code: 'draft_template',
          description: 'Draft template',
          category: 'COMPONENT',
          language: 'TYPESCRIPT',
          content: 'Draft content',
          status: 'DRAFT',
        })
        .expect(201);

      // Then publish it
      const response = await request(app.getHttpServer())
        .post(`/code-templates/${draftTemplate.body.id}/publish`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('PUBLISHED');
      createdTemplateIds.push(draftTemplate.body.id);
    });

    it('should archive template', async () => {
      // First create a published template
      const publishedTemplate = await request(app.getHttpServer())
        .post('/code-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          name: 'Published Template',
          code: 'published_template',
          description: 'Published template',
          category: 'COMPONENT',
          language: 'TYPESCRIPT',
          content: 'Published content',
          status: 'PUBLISHED',
        })
        .expect(201);

      // Then archive it
      const response = await request(app.getHttpServer())
        .post(`/code-templates/${publishedTemplate.body.id}/archive`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('ARCHIVED');
      createdTemplateIds.push(publishedTemplate.body.id);
    });
  });

  describe('Template Statistics', () => {
    it('should get template statistics for project', async () => {
      const response = await request(app.getHttpServer())
        .get(`/code-templates/project/${testProjectId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('byCategory');
      expect(response.body).toHaveProperty('byLanguage');
      expect(response.body).toHaveProperty('byFramework');
      expect(response.body).toHaveProperty('byStatus');

      expect(typeof response.body.total).toBe('number');
      expect(response.body.total).toBeGreaterThan(0);
      expect(response.body.byCategory).toHaveProperty('CONTROLLER');
      expect(response.body.byCategory).toHaveProperty('COMPONENT');
      expect(response.body.byLanguage).toHaveProperty('TYPESCRIPT');
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent template', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/code-templates/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should handle non-existent project for template', async () => {
      const nonExistentProjectId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/code-templates/project/${nonExistentProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/code-templates')
        .expect(401);
    });
  });
});
