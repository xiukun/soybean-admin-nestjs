import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/lib/shared/prisma/prisma.service';
import { BaseBizArchitectureTemplate } from '../../src/lib/bounded-contexts/code-generation/templates/base-biz-architecture.template';

describe('Generated Code Structure Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let authToken: string;
  let testUserId: string;
  let testProjectId: string;
  let architectureTemplate: BaseBizArchitectureTemplate;
  let generatedFiles: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [BaseBizArchitectureTemplate],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    architectureTemplate = moduleFixture.get<BaseBizArchitectureTemplate>(BaseBizArchitectureTemplate);

    await app.init();

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        username: 'codestructureuser',
        email: 'codestructure@example.com',
        password: 'hashedpassword',
        status: 'ACTIVE',
      },
    });
    testUserId = testUser.id;

    // Create test project
    const testProject = await prisma.project.create({
      data: {
        name: 'Code Structure Test Project',
        description: 'Test project for code structure validation',
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

    // Clean up directories
    const testDir = './generated/code-structure-test';
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }

    // Clean up test data
    await prisma.project.delete({ where: { id: testProjectId } });
    await prisma.user.delete({ where: { id: testUserId } });

    await app.close();
  });

  describe('Base/Biz Architecture Generation', () => {
    it('should generate proper base directory structure', async () => {
      const entities = [
        {
          code: 'user',
          name: 'User',
          tableName: 'users',
          fields: [
            { code: 'id', name: 'ID', type: 'UUID', primaryKey: true, nullable: false },
            { code: 'username', name: 'Username', type: 'VARCHAR', length: 50, nullable: false },
            { code: 'email', name: 'Email', type: 'VARCHAR', length: 255, nullable: false },
            { code: 'active', name: 'Active', type: 'BOOLEAN', nullable: false, defaultValue: 'true' },
          ],
        },
      ];

      const baseTemplates = architectureTemplate.generateBaseStructure('test-project', entities);

      expect(baseTemplates).toBeDefined();
      expect(baseTemplates.length).toBeGreaterThan(0);

      // Check that all expected base files are generated
      const expectedFiles = [
        'test-project/base/README.md',
        'test-project/base/models/user.base.ts',
        'test-project/base/services/user.base.service.ts',
        'test-project/base/controllers/user.base.controller.ts',
        'test-project/base/dto/user.base.dto.ts',
      ];

      expectedFiles.forEach(expectedFile => {
        const template = baseTemplates.find(t => t.path === expectedFile);
        expect(template).toBeDefined();
        expect(template.content).toBeDefined();
        expect(template.content.length).toBeGreaterThan(0);
      });
    });

    it('should generate proper biz directory structure', async () => {
      const entities = [
        {
          code: 'user',
          name: 'User',
          tableName: 'users',
          fields: [
            { code: 'id', name: 'ID', type: 'UUID', primaryKey: true, nullable: false },
            { code: 'username', name: 'Username', type: 'VARCHAR', length: 50, nullable: false },
          ],
        },
      ];

      const bizTemplates = architectureTemplate.generateBizStructure('test-project', entities);

      expect(bizTemplates).toBeDefined();
      expect(bizTemplates.length).toBeGreaterThan(0);

      // Check that all expected biz files are generated
      const expectedFiles = [
        'test-project/biz/README.md',
        'test-project/biz/services/user.service.ts',
        'test-project/biz/controllers/user.controller.ts',
        'test-project/biz/dto/user.dto.ts',
        'test-project/biz/test-project.module.ts',
      ];

      expectedFiles.forEach(expectedFile => {
        const template = bizTemplates.find(t => t.path === expectedFile);
        expect(template).toBeDefined();
        expect(template.content).toBeDefined();
        expect(template.content.length).toBeGreaterThan(0);
      });
    });

    it('should generate valid TypeScript code', async () => {
      const entities = [
        {
          code: 'product',
          name: 'Product',
          tableName: 'products',
          fields: [
            { code: 'id', name: 'ID', type: 'UUID', primaryKey: true, nullable: false },
            { code: 'name', name: 'Name', type: 'VARCHAR', length: 200, nullable: false },
            { code: 'price', name: 'Price', type: 'DECIMAL', precision: 10, scale: 2, nullable: false },
            { code: 'active', name: 'Active', type: 'BOOLEAN', nullable: false, defaultValue: 'true' },
          ],
        },
      ];

      const baseTemplates = architectureTemplate.generateBaseStructure('test-project', entities);
      const bizTemplates = architectureTemplate.generateBizStructure('test-project', entities);

      // Check base service contains proper TypeScript syntax
      const baseService = baseTemplates.find(t => t.path.includes('product.base.service.ts'));
      expect(baseService.content).toContain('export class ProductBaseService');
      expect(baseService.content).toContain('@Injectable()');
      expect(baseService.content).toContain('async findAll(');
      expect(baseService.content).toContain('async create(');
      expect(baseService.content).toContain('async update(');
      expect(baseService.content).toContain('async remove(');

      // Check base controller contains proper decorators
      const baseController = baseTemplates.find(t => t.path.includes('product.base.controller.ts'));
      expect(baseController.content).toContain('@Controller(');
      expect(baseController.content).toContain('@ApiTags(');
      expect(baseController.content).toContain('@Get()');
      expect(baseController.content).toContain('@Post()');
      expect(baseController.content).toContain('@Put(');
      expect(baseController.content).toContain('@Delete(');

      // Check biz service extends base service
      const bizService = bizTemplates.find(t => t.path.includes('product.service.ts'));
      expect(bizService.content).toContain('extends ProductBaseService');
      expect(bizService.content).toContain('import { ProductBaseService }');
    });

    it('should generate proper field mappings for different data types', async () => {
      const entities = [
        {
          code: 'complex_entity',
          name: 'Complex Entity',
          tableName: 'complex_entities',
          fields: [
            { code: 'id', name: 'ID', type: 'UUID', primaryKey: true, nullable: false },
            { code: 'title', name: 'Title', type: 'VARCHAR', length: 100, nullable: false },
            { code: 'description', name: 'Description', type: 'TEXT', nullable: true },
            { code: 'count', name: 'Count', type: 'INTEGER', nullable: false, defaultValue: '0' },
            { code: 'amount', name: 'Amount', type: 'DECIMAL', precision: 10, scale: 2, nullable: true },
            { code: 'is_active', name: 'Is Active', type: 'BOOLEAN', nullable: false, defaultValue: 'true' },
            { code: 'created_date', name: 'Created Date', type: 'DATE', nullable: false },
            { code: 'updated_timestamp', name: 'Updated Timestamp', type: 'TIMESTAMP', nullable: true },
            { code: 'file_size', name: 'File Size', type: 'BIGINT', nullable: true },
          ],
        },
      ];

      const baseTemplates = architectureTemplate.generateBaseStructure('test-project', entities);

      // Check base model contains proper TypeORM decorators and types
      const baseModel = baseTemplates.find(t => t.path.includes('complex_entity.base.ts'));
      expect(baseModel.content).toContain('title: string');
      expect(baseModel.content).toContain('description?: string');
      expect(baseModel.content).toContain('count: number');
      expect(baseModel.content).toContain('amount?: number');
      expect(baseModel.content).toContain('is_active: boolean');
      expect(baseModel.content).toContain('created_date: Date');
      expect(baseModel.content).toContain('updated_timestamp?: Date');
      expect(baseModel.content).toContain('file_size?: number');

      // Check DTO contains proper validation decorators
      const baseDto = baseTemplates.find(t => t.path.includes('complex_entity.base.dto.ts'));
      expect(baseDto.content).toContain('@IsString()');
      expect(baseDto.content).toContain('@IsNumber()');
      expect(baseDto.content).toContain('@IsBoolean()');
      expect(baseDto.content).toContain('@IsDateString()');
      expect(baseDto.content).toContain('@IsOptional()');
    });
  });

  describe('Code Quality and Structure Validation', () => {
    it('should generate code with proper imports and dependencies', async () => {
      const entities = [
        {
          code: 'order',
          name: 'Order',
          tableName: 'orders',
          fields: [
            { code: 'id', name: 'ID', type: 'UUID', primaryKey: true, nullable: false },
            { code: 'order_number', name: 'Order Number', type: 'VARCHAR', length: 50, nullable: false },
            { code: 'total_amount', name: 'Total Amount', type: 'DECIMAL', precision: 10, scale: 2, nullable: false },
          ],
        },
      ];

      const baseTemplates = architectureTemplate.generateBaseStructure('test-project', entities);

      // Check service imports
      const baseService = baseTemplates.find(t => t.path.includes('order.base.service.ts'));
      expect(baseService.content).toContain("import { Injectable, NotFoundException } from '@nestjs/common'");
      expect(baseService.content).toContain("import { PrismaService } from '../../../prisma/prisma.service'");
      expect(baseService.content).toContain("import { Order } from '@prisma/client'");

      // Check controller imports
      const baseController = baseTemplates.find(t => t.path.includes('order.base.controller.ts'));
      expect(baseController.content).toContain("import { Controller, Get, Post, Put, Delete");
      expect(baseController.content).toContain("import { ApiTags, ApiOperation, ApiResponse");
      expect(baseController.content).toContain("import { JwtAuthGuard }");

      // Check model schema
      const baseModel = baseTemplates.find(t => t.path.includes('order.base.ts'));
      expect(baseModel.content).toContain("model Order {");
      expect(baseModel.content).toContain("@@map(");
    });

    it('should generate README files with proper documentation', async () => {
      const entities = [{ code: 'test', name: 'Test', tableName: 'tests', fields: [] }];

      const baseTemplates = architectureTemplate.generateBaseStructure('test-project', entities);
      const bizTemplates = architectureTemplate.generateBizStructure('test-project', entities);

      // Check base README
      const baseReadme = baseTemplates.find(t => t.path.includes('base/README.md'));
      expect(baseReadme.content).toContain('DO NOT MODIFY FILES IN THIS DIRECTORY');
      expect(baseReadme.content).toContain('Base/Biz Architecture Pattern');
      expect(baseReadme.content).toContain('Benefits');
      expect(baseReadme.content).toContain('Example Usage');

      // Check biz README
      const bizReadme = bizTemplates.find(t => t.path.includes('biz/README.md'));
      expect(bizReadme.content).toContain('Your Customizations Go Here');
      expect(bizReadme.content).toContain('How to Extend Base Classes');
      expect(bizReadme.content).toContain('Best Practices');
      expect(bizReadme.content).toContain('Custom Business Logic');
    });

    it('should generate module with proper dependency injection', async () => {
      const entities = [
        {
          code: 'customer',
          name: 'Customer',
          tableName: 'customers',
          fields: [
            { code: 'id', name: 'ID', type: 'UUID', primaryKey: true, nullable: false },
            { code: 'name', name: 'Name', type: 'VARCHAR', length: 100, nullable: false },
          ],
        },
        {
          code: 'invoice',
          name: 'Invoice',
          tableName: 'invoices',
          fields: [
            { code: 'id', name: 'ID', type: 'UUID', primaryKey: true, nullable: false },
            { code: 'invoice_number', name: 'Invoice Number', type: 'VARCHAR', length: 50, nullable: false },
          ],
        },
      ];

      const bizTemplates = architectureTemplate.generateBizStructure('test-project', entities);

      const moduleFile = bizTemplates.find(t => t.path.includes('test-project.module.ts'));
      expect(moduleFile.content).toContain('@Module({');
      expect(moduleFile.content).toContain('imports: [');
      expect(moduleFile.content).toContain('TypeOrmModule.forFeature([');
      expect(moduleFile.content).toContain('CustomerBaseEntity,');
      expect(moduleFile.content).toContain('InvoiceBaseEntity,');
      expect(moduleFile.content).toContain('controllers: [');
      expect(moduleFile.content).toContain('CustomerController,');
      expect(moduleFile.content).toContain('InvoiceController,');
      expect(moduleFile.content).toContain('providers: [');
      expect(moduleFile.content).toContain('CustomerService,');
      expect(moduleFile.content).toContain('InvoiceService,');
      expect(moduleFile.content).toContain('exports: [');
    });
  });

  describe('File System Integration', () => {
    it('should create files with proper directory structure', async () => {
      const entities = [
        {
          code: 'file_test',
          name: 'File Test',
          tableName: 'file_tests',
          fields: [
            { code: 'id', name: 'ID', type: 'UUID', primaryKey: true, nullable: false },
            { code: 'name', name: 'Name', type: 'VARCHAR', length: 100, nullable: false },
          ],
        },
      ];

      const baseTemplates = architectureTemplate.generateBaseStructure('file-system-test', entities);
      const bizTemplates = architectureTemplate.generateBizStructure('file-system-test', entities);

      const testDir = './generated/file-system-test';
      
      // Create directories and files
      for (const template of [...baseTemplates, ...bizTemplates]) {
        const fullPath = path.join(testDir, template.path.replace('file-system-test/', ''));
        const dir = path.dirname(fullPath);
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Write file
        fs.writeFileSync(fullPath, template.content);
        generatedFiles.push(fullPath);
      }

      // Verify directory structure
      expect(fs.existsSync(path.join(testDir, 'base'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, 'base/models'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, 'base/services'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, 'base/controllers'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, 'base/dto'))).toBe(true);

      expect(fs.existsSync(path.join(testDir, 'biz'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, 'biz/services'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, 'biz/controllers'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, 'biz/dto'))).toBe(true);

      // Verify files exist
      expect(fs.existsSync(path.join(testDir, 'base/README.md'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, 'base/models/file_test.base.ts'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, 'biz/README.md'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, 'biz/services/file_test.service.ts'))).toBe(true);
    });

    it('should generate syntactically valid TypeScript files', async () => {
      const entities = [
        {
          code: 'syntax_test',
          name: 'Syntax Test',
          tableName: 'syntax_tests',
          fields: [
            { code: 'id', name: 'ID', type: 'UUID', primaryKey: true, nullable: false },
            { code: 'title', name: 'Title', type: 'VARCHAR', length: 100, nullable: false },
            { code: 'count', name: 'Count', type: 'INTEGER', nullable: false },
          ],
        },
      ];

      const baseTemplates = architectureTemplate.generateBaseStructure('syntax-test', entities);

      // Check that generated code doesn't have obvious syntax errors
      for (const template of baseTemplates) {
        if (template.path.endsWith('.ts')) {
          // Basic syntax checks
          expect(template.content).not.toContain('undefined');
          expect(template.content).not.toContain('null');
          
          // Check for balanced braces
          const openBraces = (template.content.match(/{/g) || []).length;
          const closeBraces = (template.content.match(/}/g) || []).length;
          expect(openBraces).toBe(closeBraces);

          // Check for balanced parentheses
          const openParens = (template.content.match(/\(/g) || []).length;
          const closeParens = (template.content.match(/\)/g) || []).length;
          expect(openParens).toBe(closeParens);

          // Check for proper imports (no circular references)
          const importLines = template.content.split('\n').filter(line => line.trim().startsWith('import'));
          importLines.forEach(importLine => {
            expect(importLine).toContain('from');
            expect(importLine).toMatch(/from ['"][^'"]+['"];?$/);
          });
        }
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle entities with no fields gracefully', async () => {
      const entities = [
        {
          code: 'empty_entity',
          name: 'Empty Entity',
          tableName: 'empty_entities',
          fields: [],
        },
      ];

      expect(() => {
        architectureTemplate.generateBaseStructure('test-project', entities);
      }).not.toThrow();

      expect(() => {
        architectureTemplate.generateBizStructure('test-project', entities);
      }).not.toThrow();
    });

    it('should handle special characters in entity names', async () => {
      const entities = [
        {
          code: 'special_chars_entity',
          name: 'Special-Chars & Entity',
          tableName: 'special_chars_entities',
          fields: [
            { code: 'id', name: 'ID', type: 'UUID', primaryKey: true, nullable: false },
            { code: 'special_field', name: 'Special & Field', type: 'VARCHAR', length: 100, nullable: false },
          ],
        },
      ];

      const baseTemplates = architectureTemplate.generateBaseStructure('test-project', entities);
      
      // Should generate valid class names despite special characters in display names
      const baseService = baseTemplates.find(t => t.path.includes('special_chars_entity.base.service.ts'));
      expect(baseService.content).toContain('export class SpecialCharsEntityBaseService');
      expect(baseService.content).not.toContain('Special-Chars & Entity'); // Should not use display name in class
    });

    it('should handle very long entity and field names', async () => {
      const entities = [
        {
          code: 'very_long_entity_name_that_exceeds_normal_limits',
          name: 'Very Long Entity Name That Exceeds Normal Limits',
          tableName: 'very_long_entity_names',
          fields: [
            { code: 'id', name: 'ID', type: 'UUID', primaryKey: true, nullable: false },
            { 
              code: 'very_long_field_name_that_also_exceeds_limits', 
              name: 'Very Long Field Name That Also Exceeds Limits', 
              type: 'VARCHAR', 
              length: 500, 
              nullable: false 
            },
          ],
        },
      ];

      expect(() => {
        architectureTemplate.generateBaseStructure('test-project', entities);
      }).not.toThrow();

      const baseTemplates = architectureTemplate.generateBaseStructure('test-project', entities);
      const baseModel = baseTemplates.find(t => t.path.includes('very_long_entity_name_that_exceeds_normal_limits.base.ts'));
      
      expect(baseModel.content).toContain('VeryLongEntityNameThatExceedsNormalLimitsBaseEntity');
      expect(baseModel.content).toContain('very_long_field_name_that_also_exceeds_limits');
    });
  });
});
