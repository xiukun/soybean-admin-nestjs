#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

/**
 * 简化的模板生成测试脚本
 * 直接使用Handlebars测试模板生成功能
 */

class SimpleTemplateTester {
  constructor() {
    this.handlebars = Handlebars.create();
    this.outputDir = path.join(__dirname, '../test-output');
    this.registerHelpers();
    this.loadTestEntityData();
    this.ensureOutputDirectory();
  }

  registerHelpers() {
    // String transformation helpers
    this.handlebars.registerHelper('camelCase', (str) => {
      return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      }).replace(/\s+/g, '');
    });

    this.handlebars.registerHelper('pascalCase', (str) => {
      return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => {
        return word.toUpperCase();
      }).replace(/\s+/g, '');
    });

    this.handlebars.registerHelper('kebabCase', (str) => {
      return str.replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/\s+/g, '-')
        .toLowerCase();
    });

    this.handlebars.registerHelper('snakeCase', (str) => {
      return str.replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/\s+/g, '_')
        .toLowerCase();
    });

    // Type mapping helpers
    this.handlebars.registerHelper('typescriptType', (type) => {
      const typeMap = {
        'STRING': 'string',
        'TEXT': 'string',
        'INTEGER': 'number',
        'DECIMAL': 'number',
        'BOOLEAN': 'boolean',
        'DATE': 'Date',
        'DATETIME': 'Date',
        'TIME': 'Date',
        'UUID': 'string',
        'JSON': 'any'
      };
      return typeMap[type] || 'any';
    });

    this.handlebars.registerHelper('prismaType', (type) => {
      const typeMap = {
        'STRING': 'String',
        'TEXT': 'String',
        'INTEGER': 'Int',
        'DECIMAL': 'Float',
        'BOOLEAN': 'Boolean',
        'DATE': 'DateTime',
        'DATETIME': 'DateTime',
        'TIME': 'DateTime',
        'UUID': 'String',
        'JSON': 'Json'
      };
      return typeMap[type] || 'String';
    });

    this.handlebars.registerHelper('amisFormType', (type) => {
      const typeMap = {
        'STRING': 'text',
        'TEXT': 'textarea',
        'INTEGER': 'number',
        'DECIMAL': 'number',
        'BOOLEAN': 'switch',
        'DATE': 'date',
        'DATETIME': 'datetime',
        'TIME': 'time',
        'UUID': 'text',
        'JSON': 'json'
      };
      return typeMap[type] || 'text';
    });

    this.handlebars.registerHelper('amisColumnType', (type) => {
      const typeMap = {
        'STRING': 'text',
        'TEXT': 'text',
        'INTEGER': 'number',
        'DECIMAL': 'number',
        'BOOLEAN': 'status',
        'DATE': 'date',
        'DATETIME': 'datetime',
        'TIME': 'time',
        'UUID': 'text',
        'JSON': 'json'
      };
      return typeMap[type] || 'text';
    });

    // Conditional helpers
    this.handlebars.registerHelper('eq', (a, b) => a === b);
    this.handlebars.registerHelper('ne', (a, b) => a !== b);
    this.handlebars.registerHelper('or', (a, b) => a || b);
    this.handlebars.registerHelper('and', (a, b) => a && b);

    // JSON helper
    this.handlebars.registerHelper('json', (obj) => {
      return JSON.stringify(obj);
    });
  }

  loadTestEntityData() {
    const testDataPath = path.join(__dirname, '../test-data/test-entity-definition.json');
    try {
      const rawData = fs.readFileSync(testDataPath, 'utf-8');
      this.testEntityData = JSON.parse(rawData);
      console.log('✅ 测试实体数据加载成功');
    } catch (error) {
      console.error('❌ 测试实体数据加载失败:', error.message);
      process.exit(1);
    }
  }

  ensureOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async runAllTests() {
    console.log('\n🚀 开始模板生成测试...\n');

    const templates = [
      'entity-controller.hbs',
      'entity-module.hbs',
      'entity-base-controller.hbs',
      'entity-base-service.hbs',
      'prisma-schema.hbs',
      'amis-page.hbs'
    ];

    const results = [];

    for (const templateName of templates) {
      console.log(`📝 测试模板: ${templateName}`);
      const result = await this.testTemplate(templateName);
      results.push(result);
      
      if (result.success) {
        console.log(`✅ ${templateName} 生成成功`);
      } else {
        console.log(`❌ ${templateName} 生成失败: ${result.error}`);
      }
    }

    return results;
  }

  async testTemplate(templateName) {
    try {
      const templatePath = path.join(
        __dirname,
        '../lowcode-platform-backend/src/resources/templates',
        templateName
      );

      // 检查模板文件是否存在
      if (!fs.existsSync(templatePath)) {
        return {
          templateName,
          success: false,
          error: `模板文件不存在: ${templatePath}`
        };
      }

      // 读取模板内容
      const templateContent = fs.readFileSync(templatePath, 'utf-8');

      // 准备模板数据
      const templateData = this.prepareTemplateData();

      // 编译并生成代码
      const template = this.handlebars.compile(templateContent);
      const generatedContent = template(templateData);

      // 保存生成的内容到输出目录
      const outputFileName = this.getOutputFileName(templateName);
      const outputPath = path.join(this.outputDir, outputFileName);
      fs.writeFileSync(outputPath, generatedContent, 'utf-8');

      return {
        templateName,
        success: true,
        generatedContent,
        outputPath
      };

    } catch (error) {
      return {
        templateName,
        success: false,
        error: error.message
      };
    }
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
      entities: [entity] // For prisma schema template
    };
  }

  getTypescriptType(fieldType) {
    const typeMap = {
      'STRING': 'string',
      'TEXT': 'string',
      'INTEGER': 'number',
      'DECIMAL': 'number',
      'BOOLEAN': 'boolean',
      'DATE': 'Date',
      'DATETIME': 'Date',
      'TIME': 'Date',
      'UUID': 'string',
      'JSON': 'any'
    };
    return typeMap[fieldType] || 'any';
  }

  getPrismaType(fieldType) {
    const typeMap = {
      'STRING': 'String',
      'TEXT': 'String',
      'INTEGER': 'Int',
      'DECIMAL': 'Float',
      'BOOLEAN': 'Boolean',
      'DATE': 'DateTime',
      'DATETIME': 'DateTime',
      'TIME': 'DateTime',
      'UUID': 'String',
      'JSON': 'Json'
    };
    return typeMap[fieldType] || 'String';
  }

  getAmisFormType(fieldType) {
    const typeMap = {
      'STRING': 'text',
      'TEXT': 'textarea',
      'INTEGER': 'number',
      'DECIMAL': 'number',
      'BOOLEAN': 'switch',
      'DATE': 'date',
      'DATETIME': 'datetime',
      'TIME': 'time',
      'UUID': 'text',
      'JSON': 'json'
    };
    return typeMap[fieldType] || 'text';
  }

  getAmisColumnType(fieldType) {
    const typeMap = {
      'STRING': 'text',
      'TEXT': 'text',
      'INTEGER': 'number',
      'DECIMAL': 'number',
      'BOOLEAN': 'status',
      'DATE': 'date',
      'DATETIME': 'datetime',
      'TIME': 'time',
      'UUID': 'text',
      'JSON': 'json'
    };
    return typeMap[fieldType] || 'text';
  }

  getOutputFileName(templateName) {
    const entity = this.testEntityData.entity;
    const baseName = templateName.replace('.hbs', '');
    
    switch (baseName) {
      case 'entity-controller':
        return `${entity.code.toLowerCase()}.controller.ts`;
      case 'entity-module':
        return `${entity.code.toLowerCase()}.module.ts`;
      case 'entity-base-controller':
        return `${entity.code.toLowerCase()}.base.controller.ts`;
      case 'entity-base-service':
        return `${entity.code.toLowerCase()}.base.service.ts`;
      case 'prisma-schema':
        return 'schema.prisma';
      case 'amis-page':
        return `${entity.code.toLowerCase()}-page.json`;
      default:
        return `${baseName}.generated`;
    }
  }

  printSummary(results) {
    console.log('\n📊 测试结果汇总:');
    console.log('='.repeat(50));
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    console.log(`✅ 成功: ${successCount}`);
    console.log(`❌ 失败: ${failureCount}`);
    console.log(`📁 输出目录: ${this.outputDir}`);
    
    if (failureCount > 0) {
      console.log('\n❌ 失败详情:');
      results.filter(r => !r.success).forEach(result => {
        console.log(`  - ${result.templateName}: ${result.error}`);
      });
    }
    
    console.log('\n✨ 测试完成!');
  }
}

// 运行测试
async function main() {
  const tester = new SimpleTemplateTester();
  const results = await tester.runAllTests();
  tester.printSummary(results);
  
  // 如果有失败的测试，退出码为1
  const hasFailures = results.some(r => !r.success);
  process.exit(hasFailures ? 1 : 0);
}

if (require.main === module) {
  main().catch(console.error);
}
