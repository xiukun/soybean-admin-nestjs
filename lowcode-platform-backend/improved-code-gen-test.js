#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

/**
 * 改进的代码生成测试脚本
 * 包含更智能的Prisma Schema合并策略
 */

class ImprovedCodeGenerationTester {
  constructor() {
    this.handlebars = Handlebars.create();
    this.amisBackendPath = path.join(__dirname, '../amis-lowcode-backend');
    this.templatePath = path.join(__dirname, 'src/resources/templates');
    this.registerHelpers();
    this.loadTestEntityData();
  }

  registerHelpers() {
    // String transformation helpers
    this.handlebars.registerHelper('camelCase', (str) => {
      if (!str) return '';
      return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      }).replace(/\s+/g, '');
    });

    this.handlebars.registerHelper('pascalCase', (str) => {
      if (!str) return '';
      return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => {
        return word.toUpperCase();
      }).replace(/\s+/g, '');
    });

    this.handlebars.registerHelper('kebabCase', (str) => {
      if (!str) return '';
      return str.replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/\s+/g, '-')
        .toLowerCase();
    });

    this.handlebars.registerHelper('snakeCase', (str) => {
      if (!str) return '';
      return str.replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/\s+/g, '_')
        .toLowerCase();
    });

    // Type mapping helpers
    this.handlebars.registerHelper('typescriptType', (type) => {
      const typeMap = {
        'STRING': 'string', 'TEXT': 'string', 'INTEGER': 'number',
        'DECIMAL': 'number', 'BOOLEAN': 'boolean', 'DATE': 'Date',
        'DATETIME': 'Date', 'TIME': 'Date', 'UUID': 'string', 'JSON': 'any'
      };
      return typeMap[type] || 'any';
    });

    this.handlebars.registerHelper('prismaType', (type) => {
      const typeMap = {
        'STRING': 'String', 'TEXT': 'String', 'INTEGER': 'Int',
        'DECIMAL': 'Float', 'BOOLEAN': 'Boolean', 'DATE': 'DateTime',
        'DATETIME': 'DateTime', 'TIME': 'DateTime', 'UUID': 'String', 'JSON': 'Json'
      };
      return typeMap[type] || 'String';
    });

    this.handlebars.registerHelper('amisFormType', (type) => {
      const typeMap = {
        'STRING': 'text', 'TEXT': 'textarea', 'INTEGER': 'number',
        'DECIMAL': 'number', 'BOOLEAN': 'switch', 'DATE': 'date',
        'DATETIME': 'datetime', 'TIME': 'time', 'UUID': 'text', 'JSON': 'json'
      };
      return typeMap[type] || 'text';
    });

    this.handlebars.registerHelper('amisColumnType', (type) => {
      const typeMap = {
        'STRING': 'text', 'TEXT': 'text', 'INTEGER': 'number',
        'DECIMAL': 'number', 'BOOLEAN': 'status', 'DATE': 'date',
        'DATETIME': 'datetime', 'TIME': 'time', 'UUID': 'text', 'JSON': 'json'
      };
      return typeMap[type] || 'text';
    });

    // Conditional helpers
    this.handlebars.registerHelper('eq', (a, b) => a === b);
    this.handlebars.registerHelper('ne', (a, b) => a !== b);
    this.handlebars.registerHelper('or', (a, b) => a || b);
    this.handlebars.registerHelper('and', (a, b) => a && b);
    this.handlebars.registerHelper('json', (obj) => JSON.stringify(obj));

    // Default value formatting helper
    this.handlebars.registerHelper('formatDefaultValue', (value, type) => {
      if (value === null || value === undefined) return 'null';
      switch (type) {
        case 'STRING': case 'TEXT': case 'UUID': return `"${value}"`;
        case 'BOOLEAN': return value ? 'true' : 'false';
        case 'INTEGER': case 'DECIMAL': return value.toString();
        case 'DATE': case 'DATETIME': case 'TIMESTAMP': return `"${value}"`;
        case 'JSON': return JSON.stringify(value);
        default: return `"${value}"`;
      }
    });
  }

  loadTestEntityData() {
    const testDataPath = path.join(__dirname, '../test-data/test-entity-definition.json');
    try {
      const rawData = fs.readFileSync(testDataPath, 'utf-8');
      this.testEntityData = JSON.parse(rawData);
      // 使用不同的实体名称避免冲突
      this.testEntityData.entity.code = 'TestUser';
      this.testEntityData.entity.name = '测试用户';
      this.testEntityData.entity.tableName = 'test_users';
      console.log('✅ 测试实体数据加载成功');
    } catch (error) {
      console.error('❌ 测试实体数据加载失败:', error.message);
      process.exit(1);
    }
  }

  async runImprovedCodeGeneration() {
    console.log('\n🚀 开始改进的代码生成测试...\n');

    const tasks = [
      { name: '生成Base控制器', method: 'generateBaseController' },
      { name: '生成Base服务', method: 'generateBaseService' },
      { name: '生成Biz控制器', method: 'generateBizController' },
      { name: '生成Biz服务', method: 'generateBizService' },
      { name: '生成模块文件', method: 'generateModule' },
      { name: '生成DTO文件', method: 'generateDto' },
      { name: '智能更新Prisma Schema', method: 'smartUpdatePrismaSchema' },
      { name: '生成Amis页面配置', method: 'generateAmisPage' },
      { name: '验证生成的代码', method: 'validateGeneratedCode' }
    ];

    const results = [];
    for (const task of tasks) {
      console.log(`📝 ${task.name}...`);
      try {
        await this[task.method]();
        console.log(`✅ ${task.name} 成功`);
        results.push({ task: task.name, success: true });
      } catch (error) {
        console.log(`❌ ${task.name} 失败: ${error.message}`);
        results.push({ task: task.name, success: false, error: error.message });
      }
    }

    return results;
  }

  async generateBaseController() {
    const templateContent = fs.readFileSync(path.join(this.templatePath, 'entity-base-controller.hbs'), 'utf-8');
    const template = this.handlebars.compile(templateContent);
    const content = template(this.prepareTemplateData());
    
    const outputPath = path.join(this.amisBackendPath, 'src/base/controllers', `${this.getEntityCode()}.base.controller.ts`);
    this.ensureDirectoryExists(path.dirname(outputPath));
    fs.writeFileSync(outputPath, content, 'utf-8');
  }

  async generateBaseService() {
    const templateContent = fs.readFileSync(path.join(this.templatePath, 'entity-base-service.hbs'), 'utf-8');
    const template = this.handlebars.compile(templateContent);
    const content = template(this.prepareTemplateData());
    
    const outputPath = path.join(this.amisBackendPath, 'src/base/services', `${this.getEntityCode()}.base.service.ts`);
    this.ensureDirectoryExists(path.dirname(outputPath));
    fs.writeFileSync(outputPath, content, 'utf-8');
  }

  async generateBizController() {
    const templateContent = fs.readFileSync(path.join(this.templatePath, 'entity-controller.hbs'), 'utf-8');
    const template = this.handlebars.compile(templateContent);
    const content = template(this.prepareTemplateData());
    
    const outputPath = path.join(this.amisBackendPath, 'src/biz/controllers', `${this.getEntityCode()}.controller.ts`);
    this.ensureDirectoryExists(path.dirname(outputPath));
    fs.writeFileSync(outputPath, content, 'utf-8');
  }

  async generateBizService() {
    const content = this.generateBizServiceContent();
    const outputPath = path.join(this.amisBackendPath, 'src/biz/services', `${this.getEntityCode()}.service.ts`);
    this.ensureDirectoryExists(path.dirname(outputPath));
    fs.writeFileSync(outputPath, content, 'utf-8');
  }

  async generateModule() {
    const templateContent = fs.readFileSync(path.join(this.templatePath, 'entity-module.hbs'), 'utf-8');
    const template = this.handlebars.compile(templateContent);
    const content = template(this.prepareTemplateData());
    
    const outputPath = path.join(this.amisBackendPath, 'src/biz/modules', `${this.getEntityCode()}.module.ts`);
    this.ensureDirectoryExists(path.dirname(outputPath));
    fs.writeFileSync(outputPath, content, 'utf-8');
  }

  async generateDto() {
    const content = this.generateDtoContent();
    const outputPath = path.join(this.amisBackendPath, 'src/base/dto', `${this.getEntityCode()}.dto.ts`);
    this.ensureDirectoryExists(path.dirname(outputPath));
    fs.writeFileSync(outputPath, content, 'utf-8');
  }

  async smartUpdatePrismaSchema() {
    const templateContent = fs.readFileSync(path.join(this.templatePath, 'prisma-schema.hbs'), 'utf-8');
    const template = this.handlebars.compile(templateContent);
    const newModelContent = template(this.prepareTemplateData());
    
    const schemaPath = path.join(this.amisBackendPath, 'prisma/schema.prisma');
    let existingSchema = '';
    if (fs.existsSync(schemaPath)) {
      existingSchema = fs.readFileSync(schemaPath, 'utf-8');
    }

    // 智能合并策略
    const entityName = this.testEntityData.entity.code;
    const modelRegex = new RegExp(`model\\s+${entityName}\\s*{[^}]*}`, 'gs');
    
    if (modelRegex.test(existingSchema)) {
      // 如果模型已存在，替换它
      const updatedSchema = existingSchema.replace(modelRegex, newModelContent.trim());
      fs.writeFileSync(schemaPath, updatedSchema, 'utf-8');
      console.log(`  📝 替换了现有的 ${entityName} 模型`);
    } else {
      // 如果模型不存在，添加到末尾
      const updatedSchema = existingSchema.trim() + '\n\n' + newModelContent.trim() + '\n';
      fs.writeFileSync(schemaPath, updatedSchema, 'utf-8');
      console.log(`  📝 添加了新的 ${entityName} 模型`);
    }
  }

  async generateAmisPage() {
    const templateContent = fs.readFileSync(path.join(this.templatePath, 'amis-page.hbs'), 'utf-8');
    const template = this.handlebars.compile(templateContent);
    const content = template(this.prepareTemplateData());
    
    const outputPath = path.join(this.amisBackendPath, 'src/config/pages', `${this.getEntityCode()}-page.json`);
    this.ensureDirectoryExists(path.dirname(outputPath));
    fs.writeFileSync(outputPath, content, 'utf-8');
  }

  async validateGeneratedCode() {
    const entityCode = this.getEntityCode();
    const filesToCheck = [
      `src/base/controllers/${entityCode}.base.controller.ts`,
      `src/base/services/${entityCode}.base.service.ts`,
      `src/biz/controllers/${entityCode}.controller.ts`,
      `src/biz/services/${entityCode}.service.ts`,
      `src/biz/modules/${entityCode}.module.ts`,
      `src/base/dto/${entityCode}.dto.ts`,
      `src/config/pages/${entityCode}-page.json`
    ];

    let allFilesExist = true;
    for (const file of filesToCheck) {
      const filePath = path.join(this.amisBackendPath, file);
      if (!fs.existsSync(filePath)) {
        console.log(`  ❌ 文件不存在: ${file}`);
        allFilesExist = false;
      } else {
        console.log(`  ✅ 文件存在: ${file}`);
      }
    }

    if (!allFilesExist) {
      throw new Error('部分文件生成失败');
    }
  }

  generateBizServiceContent() {
    const entityCode = this.testEntityData.entity.code;
    return `import { Injectable } from '@nestjs/common';
import { ${entityCode}BaseService } from '../../base/services/${entityCode.toLowerCase()}.base.service';
import { PrismaService } from '../../shared/services/prisma.service';

/**
 * ${this.testEntityData.entity.name}业务服务
 * 继承Base服务，可以在此添加自定义业务逻辑
 */
@Injectable()
export class ${entityCode}Service extends ${entityCode}BaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  // 在此添加自定义业务方法
  // 例如：
  // async customMethod() {
  //   // 自定义业务逻辑
  // }
}
`;
  }

  generateDtoContent() {
    const entity = this.testEntityData.entity;
    const fields = entity.fields.filter(f => f.code !== 'id');
    
    return `import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsBoolean, IsNumber, IsDateString } from 'class-validator';

/**
 * 创建${entity.name}DTO
 */
export class Create${entity.code}Dto {
${fields.map(field => {
  const isOptional = field.nullable;
  const decorator = isOptional ? '@ApiPropertyOptional' : '@ApiProperty';
  const validation = this.getValidationDecorator(field);
  
  return `  ${decorator}({ description: '${field.comment || field.name}' })
  ${validation}
  ${isOptional ? '@IsOptional()' : ''}
  ${field.code}${isOptional ? '?' : ''}: ${this.getTypescriptType(field.type)};`;
}).join('\n\n')}
}

/**
 * 更新${entity.name}DTO
 */
export class Update${entity.code}Dto extends PartialType(Create${entity.code}Dto) {}

/**
 * ${entity.name}查询DTO
 */
export class ${entity.code}QueryDto {
  @ApiPropertyOptional({ description: '当前页码', example: 1 })
  @IsOptional()
  @IsNumber()
  current?: number;

  @ApiPropertyOptional({ description: '每页大小', example: 10 })
  @IsOptional()
  @IsNumber()
  size?: number;

  @ApiPropertyOptional({ description: '排序字段', example: 'createdAt:desc' })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  search?: string;
}
`;
  }

  getValidationDecorator(field) {
    switch (field.type) {
      case 'STRING':
      case 'TEXT':
        if (field.code === 'email') return '@IsEmail()';
        return '@IsString()';
      case 'INTEGER':
      case 'DECIMAL':
        return '@IsNumber()';
      case 'BOOLEAN':
        return '@IsBoolean()';
      case 'DATE':
      case 'DATETIME':
        return '@IsDateString()';
      default:
        return '@IsString()';
    }
  }

  getTypescriptType(fieldType) {
    const typeMap = {
      'STRING': 'string', 'TEXT': 'string', 'INTEGER': 'number',
      'DECIMAL': 'number', 'BOOLEAN': 'boolean', 'DATE': 'Date',
      'DATETIME': 'Date', 'TIME': 'Date', 'UUID': 'string', 'JSON': 'any'
    };
    return typeMap[fieldType] || 'any';
  }

  prepareTemplateData() {
    const { entity } = this.testEntityData;
    
    return {
      entity: {
        ...entity,
        fields: entity.fields.map(field => ({
          ...field,
          typescriptType: this.getTypescriptType(field.type),
          prismaType: this.getPrismaType(field.type),
          amisFormType: this.getAmisFormType(field.type),
          amisColumnType: this.getAmisColumnType(field.type)
        }))
      },
      fields: entity.fields,
      relationships: entity.relationships || [],
      indexes: entity.indexes || [],
      uniqueConstraints: entity.uniqueConstraints || [],
      entities: [entity]
    };
  }

  getPrismaType(fieldType) {
    const typeMap = {
      'STRING': 'String', 'TEXT': 'String', 'INTEGER': 'Int',
      'DECIMAL': 'Float', 'BOOLEAN': 'Boolean', 'DATE': 'DateTime',
      'DATETIME': 'DateTime', 'TIME': 'DateTime', 'UUID': 'String', 'JSON': 'Json'
    };
    return typeMap[fieldType] || 'String';
  }

  getAmisFormType(fieldType) {
    const typeMap = {
      'STRING': 'text', 'TEXT': 'textarea', 'INTEGER': 'number',
      'DECIMAL': 'number', 'BOOLEAN': 'switch', 'DATE': 'date',
      'DATETIME': 'datetime', 'TIME': 'time', 'UUID': 'text', 'JSON': 'json'
    };
    return typeMap[fieldType] || 'text';
  }

  getAmisColumnType(fieldType) {
    const typeMap = {
      'STRING': 'text', 'TEXT': 'text', 'INTEGER': 'number',
      'DECIMAL': 'number', 'BOOLEAN': 'status', 'DATE': 'date',
      'DATETIME': 'datetime', 'TIME': 'time', 'UUID': 'text', 'JSON': 'json'
    };
    return typeMap[fieldType] || 'text';
  }

  getEntityCode() {
    return this.kebabCase(this.testEntityData.entity.code);
  }

  kebabCase(str) {
    if (!str) return '';
    return str.replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/\s+/g, '-')
      .toLowerCase();
  }

  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  printSummary(results) {
    console.log('\n📊 改进的代码生成结果汇总:');
    console.log('='.repeat(50));
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    console.log(`✅ 成功: ${successCount}`);
    console.log(`❌ 失败: ${failureCount}`);
    console.log(`📁 目标目录: ${this.amisBackendPath}`);
    
    if (failureCount > 0) {
      console.log('\n❌ 失败详情:');
      results.filter(r => !r.success).forEach(result => {
        console.log(`  - ${result.task}: ${result.error}`);
      });
    }
    
    console.log('\n✨ 改进的代码生成完成!');
    console.log('\n📋 生成的文件位置:');
    console.log(`  - Base控制器: src/base/controllers/${this.getEntityCode()}.base.controller.ts`);
    console.log(`  - Base服务: src/base/services/${this.getEntityCode()}.base.service.ts`);
    console.log(`  - Biz控制器: src/biz/controllers/${this.getEntityCode()}.controller.ts`);
    console.log(`  - Biz服务: src/biz/services/${this.getEntityCode()}.service.ts`);
    console.log(`  - 模块: src/biz/modules/${this.getEntityCode()}.module.ts`);
    console.log(`  - DTO: src/base/dto/${this.getEntityCode()}.dto.ts`);
    console.log(`  - Prisma Schema: prisma/schema.prisma (智能更新)`);
    console.log(`  - Amis页面: src/config/pages/${this.getEntityCode()}-page.json`);
  }
}

// 运行测试
async function main() {
  const tester = new ImprovedCodeGenerationTester();
  const results = await tester.runImprovedCodeGeneration();
  tester.printSummary(results);
  
  const hasFailures = results.some(r => !r.success);
  process.exit(hasFailures ? 1 : 0);
}

if (require.main === module) {
  main().catch(console.error);
}
