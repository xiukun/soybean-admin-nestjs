#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

/**
 * 调试Base控制器生成问题
 */

class BaseControllerDebugger {
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

    // Conditional helpers
    this.handlebars.registerHelper('eq', (a, b) => a === b);
    this.handlebars.registerHelper('ne', (a, b) => a !== b);
    this.handlebars.registerHelper('or', (a, b) => a || b);
    this.handlebars.registerHelper('and', (a, b) => a && b);
  }

  loadTestEntityData() {
    const testDataPath = path.join(__dirname, '../test-data/test-entity-definition.json');
    try {
      const rawData = fs.readFileSync(testDataPath, 'utf-8');
      this.testEntityData = JSON.parse(rawData);
      // 使用简单的实体名称
      this.testEntityData.entity.code = 'TestUser';
      this.testEntityData.entity.name = '测试用户';
      console.log('✅ 测试实体数据加载成功');
    } catch (error) {
      console.error('❌ 测试实体数据加载失败:', error.message);
      process.exit(1);
    }
  }

  async debugBaseController() {
    console.log('\n🔍 开始调试Base控制器生成...\n');

    try {
      // 1. 检查模板文件
      console.log('📝 步骤1: 检查模板文件');
      const templatePath = path.join(this.templatePath, 'entity-base-controller.hbs');
      if (!fs.existsSync(templatePath)) {
        throw new Error(`模板文件不存在: ${templatePath}`);
      }
      console.log(`✅ 模板文件存在: ${templatePath}`);

      // 2. 读取模板内容
      console.log('\n📝 步骤2: 读取模板内容');
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      console.log(`✅ 模板内容长度: ${templateContent.length} 字符`);

      // 3. 准备模板数据
      console.log('\n📝 步骤3: 准备模板数据');
      const templateData = this.prepareTemplateData();
      console.log('✅ 模板数据准备完成');
      console.log('实体信息:', {
        code: templateData.entity.code,
        name: templateData.entity.name,
        fieldsCount: templateData.entity.fields.length
      });

      // 4. 编译模板
      console.log('\n📝 步骤4: 编译模板');
      const template = this.handlebars.compile(templateContent);
      console.log('✅ 模板编译成功');

      // 5. 生成内容
      console.log('\n📝 步骤5: 生成内容');
      const generatedContent = template(templateData);
      console.log(`✅ 内容生成成功，长度: ${generatedContent.length} 字符`);

      // 6. 显示生成的内容前100行
      console.log('\n📝 步骤6: 显示生成内容预览');
      const lines = generatedContent.split('\n');
      console.log('生成内容预览 (前20行):');
      console.log('='.repeat(50));
      lines.slice(0, 20).forEach((line, index) => {
        console.log(`${(index + 1).toString().padStart(3, ' ')}: ${line}`);
      });
      console.log('='.repeat(50));

      // 7. 检查输出目录
      console.log('\n📝 步骤7: 检查输出目录');
      const outputPath = path.join(this.amisBackendPath, 'src/base/controllers', `${this.getEntityCode()}.base.controller.ts`);
      const outputDir = path.dirname(outputPath);
      console.log(`输出路径: ${outputPath}`);
      console.log(`输出目录: ${outputDir}`);

      if (!fs.existsSync(outputDir)) {
        console.log('⚠️ 输出目录不存在，正在创建...');
        fs.mkdirSync(outputDir, { recursive: true });
        console.log('✅ 输出目录创建成功');
      } else {
        console.log('✅ 输出目录已存在');
      }

      // 8. 写入文件
      console.log('\n📝 步骤8: 写入文件');
      fs.writeFileSync(outputPath, generatedContent, 'utf-8');
      console.log('✅ 文件写入成功');

      // 9. 验证文件
      console.log('\n📝 步骤9: 验证文件');
      if (fs.existsSync(outputPath)) {
        const fileStats = fs.statSync(outputPath);
        console.log(`✅ 文件验证成功，大小: ${fileStats.size} 字节`);
      } else {
        throw new Error('文件写入后不存在');
      }

      console.log('\n🎉 Base控制器生成调试完成！');
      return { success: true, outputPath, contentLength: generatedContent.length };

    } catch (error) {
      console.error('\n❌ Base控制器生成调试失败:', error.message);
      console.error('错误堆栈:', error.stack);
      return { success: false, error: error.message };
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
      entities: [entity]
    };
  }

  getTypescriptType(fieldType) {
    const typeMap = {
      'STRING': 'string', 'TEXT': 'string', 'INTEGER': 'number',
      'DECIMAL': 'number', 'BOOLEAN': 'boolean', 'DATE': 'Date',
      'DATETIME': 'Date', 'TIME': 'Date', 'UUID': 'string', 'JSON': 'any'
    };
    return typeMap[fieldType] || 'any';
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
}

// 运行调试
async function main() {
  const tester = new BaseControllerDebugger();
  const result = await tester.debugBaseController();
  
  if (result.success) {
    console.log('\n✨ 调试成功完成！');
    console.log(`生成文件: ${result.outputPath}`);
    console.log(`内容长度: ${result.contentLength} 字符`);
  } else {
    console.log('\n💥 调试失败！');
    console.log(`错误: ${result.error}`);
  }
  
  process.exit(result.success ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}
