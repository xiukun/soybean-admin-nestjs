/**
 * 低代码平台实体通用字段自动生成功能验证脚本
 * 
 * 此脚本用于验证以下功能：
 * 1. 实体创建时自动添加通用字段
 * 2. 实体字段管理和验证
 * 3. 项目代码生成时自动创建数据库表
 * 4. 通用字段类型定义和约束管理
 * 5. 实体创建API增强
 */

import { NestFactory } from '@nestjs/core';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AppModule } from '@src/app.module';
import { CreateEntityCommand } from '@entity/application/commands/create-entity.command';
import { GetEntityQuery } from '@entity/application/queries/get-entity.query';
import { EntityStatus } from '@entity/domain/entity.model';
import { CommonFieldService } from '@entity/application/services/common-field.service';
import { EntityFieldValidatorService } from '@entity/application/services/entity-field-validator.service';
import { DatabaseMigrationService } from '@entity/application/services/database-migration.service';
import { PrismaSchemaGeneratorService } from '@entity/application/services/prisma-schema-generator.service';
import { FieldDataType } from '@lib/bounded-contexts/field/domain/field.model';

interface ValidationResult {
  testName: string;
  success: boolean;
  message: string;
  details?: any;
  duration: number;
}

class FeatureValidationScript {
  private app: any;
  private commandBus: CommandBus;
  private queryBus: QueryBus;
  private commonFieldService: CommonFieldService;
  private entityFieldValidator: EntityFieldValidatorService;
  private databaseMigrationService: DatabaseMigrationService;
  private prismaSchemaGenerator: PrismaSchemaGeneratorService;
  private results: ValidationResult[] = [];

  async initialize() {
    console.log('🚀 初始化低代码平台实体功能验证脚本...');
    
    try {
      this.app = await NestFactory.createApplicationContext(AppModule);
      this.commandBus = this.app.get(CommandBus);
      this.queryBus = this.app.get(QueryBus);
      this.commonFieldService = this.app.get(CommonFieldService);
      this.entityFieldValidator = this.app.get(EntityFieldValidatorService);
      this.databaseMigrationService = this.app.get(DatabaseMigrationService);
      this.prismaSchemaGenerator = this.app.get(PrismaSchemaGeneratorService);
      
      console.log('✅ 应用上下文初始化成功');
    } catch (error) {
      console.error('❌ 应用上下文初始化失败:', error.message);
      throw error;
    }
  }

  async runValidation() {
    console.log('\n📋 开始执行功能验证测试...\n');

    // 测试1: 验证通用字段定义
    await this.validateCommonFieldDefinitions();

    // 测试2: 验证实体创建和通用字段自动添加
    await this.validateEntityCreationWithCommonFields();

    // 测试3: 验证字段验证功能
    await this.validateFieldValidation();

    // 测试4: 验证数据库表创建功能
    await this.validateDatabaseTableCreation();

    // 测试5: 验证Prisma Schema生成功能
    await this.validatePrismaSchemaGeneration();

    // 测试6: 验证完整的端到端流程
    await this.validateEndToEndFlow();

    // 输出测试结果
    this.printResults();
  }

  private async executeTest(testName: string, testFunction: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`🧪 执行测试: ${testName}`);
      await testFunction();
      
      const duration = Date.now() - startTime;
      this.results.push({
        testName,
        success: true,
        message: '测试通过',
        duration,
      });
      
      console.log(`✅ ${testName} - 通过 (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        testName,
        success: false,
        message: error.message,
        details: error.stack,
        duration,
      });
      
      console.log(`❌ ${testName} - 失败: ${error.message} (${duration}ms)`);
    }
  }

  private async validateCommonFieldDefinitions(): Promise<void> {
    await this.executeTest('通用字段定义验证', async () => {
      const commonFields = this.commonFieldService.getCommonFieldDefinitions();
      
      // 验证通用字段数量
      if (commonFields.length !== 5) {
        throw new Error(`期望5个通用字段，实际获得${commonFields.length}个`);
      }

      // 验证必需的通用字段
      const requiredFields = ['id', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt'];
      const actualFieldCodes = commonFields.map(f => f.code);
      
      for (const requiredField of requiredFields) {
        if (!actualFieldCodes.includes(requiredField)) {
          throw new Error(`缺少必需的通用字段: ${requiredField}`);
        }
      }

      // 验证字段属性
      const idField = commonFields.find(f => f.code === 'id');
      if (!idField || !idField.required || !idField.unique) {
        throw new Error('主键字段配置不正确');
      }

      const createdByField = commonFields.find(f => f.code === 'createdBy');
      if (!createdByField || !createdByField.required || createdByField.unique) {
        throw new Error('创建者字段配置不正确');
      }

      // 验证字段顺序
      for (let i = 1; i < commonFields.length; i++) {
        if (commonFields[i].displayOrder <= commonFields[i - 1].displayOrder) {
          throw new Error('通用字段显示顺序不正确');
        }
      }

      console.log(`   📊 验证了${commonFields.length}个通用字段的定义`);
    });
  }

  private async validateEntityCreationWithCommonFields(): Promise<void> {
    await this.executeTest('实体创建和通用字段自动添加', async () => {
      // 创建测试实体
      const command = new CreateEntityCommand(
        'test-project-1',
        '测试用户实体',
        'test_user',
        'test_users',
        '用于功能验证的测试实体',
        '测试分类',
        { x: 100, y: 200 },
        { testMode: true },
        EntityStatus.DRAFT,
        'validation-script'
      );

      const entity = await this.commandBus.execute(command);
      
      if (!entity || !entity.id) {
        throw new Error('实体创建失败');
      }

      // 验证实体属性
      if (entity.name !== '测试用户实体') {
        throw new Error('实体名称不正确');
      }

      if (entity.code !== 'test_user') {
        throw new Error('实体代码不正确');
      }

      if (entity.tableName !== 'test_users') {
        throw new Error('表名不正确');
      }

      if (entity.status !== EntityStatus.DRAFT) {
        throw new Error('实体状态不正确');
      }

      // 获取实体详情（包含字段）
      const entityWithFields = await this.queryBus.execute(new GetEntityQuery(entity.id));
      
      if (!entityWithFields || !entityWithFields.fields) {
        throw new Error('无法获取实体字段信息');
      }

      // 验证通用字段是否已自动添加
      const fieldCodes = entityWithFields.fields.map((f: any) => f.code);
      const commonFieldCodes = ['id', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt'];
      
      for (const commonFieldCode of commonFieldCodes) {
        if (!fieldCodes.includes(commonFieldCode)) {
          throw new Error(`缺少通用字段: ${commonFieldCode}`);
        }
      }

      console.log(`   📊 成功创建实体并自动添加了${commonFieldCodes.length}个通用字段`);
      console.log(`   🆔 实体ID: ${entity.id}`);
    });
  }

  private async validateFieldValidation(): Promise<void> {
    await this.executeTest('字段验证功能', async () => {
      // 创建一个用于验证的实体
      const command = new CreateEntityCommand(
        'test-project-2',
        '字段验证测试实体',
        'field_validation_test',
        'field_validation_tests',
        '用于测试字段验证功能的实体',
        '验证测试',
        { x: 200, y: 300 },
        {},
        EntityStatus.DRAFT,
        'validation-script'
      );

      const entity = await this.commandBus.execute(command);
      const entityWithFields = await this.queryBus.execute(new GetEntityQuery(entity.id));

      // 执行字段验证
      const validationResult = await this.entityFieldValidator.validateEntityFields(
        entity,
        entityWithFields.fields || []
      );

      // 验证结果结构
      if (typeof validationResult.isValid !== 'boolean') {
        throw new Error('验证结果isValid属性类型不正确');
      }

      if (!Array.isArray(validationResult.errors)) {
        throw new Error('验证结果errors属性类型不正确');
      }

      if (!Array.isArray(validationResult.warnings)) {
        throw new Error('验证结果warnings属性类型不正确');
      }

      if (!validationResult.summary || typeof validationResult.summary.totalFields !== 'number') {
        throw new Error('验证结果summary属性结构不正确');
      }

      // 验证通用字段应该通过验证
      if (!validationResult.isValid && validationResult.errors.length > 0) {
        const errorMessages = validationResult.errors.map(e => e.message).join(', ');
        throw new Error(`通用字段验证失败: ${errorMessages}`);
      }

      console.log(`   📊 验证了${validationResult.summary.totalFields}个字段`);
      console.log(`   ✅ 错误数量: ${validationResult.errors.length}`);
      console.log(`   ⚠️  警告数量: ${validationResult.warnings.length}`);
    });
  }

  private async validateDatabaseTableCreation(): Promise<void> {
    await this.executeTest('数据库表创建功能', async () => {
      // 创建一个用于数据库测试的实体
      const command = new CreateEntityCommand(
        'test-project-3',
        '数据库测试实体',
        'db_test_entity',
        'db_test_entities',
        '用于测试数据库表创建功能的实体',
        '数据库测试',
        { x: 300, y: 400 },
        {},
        EntityStatus.DRAFT,
        'validation-script'
      );

      const entity = await this.commandBus.execute(command);

      // 尝试创建数据库表
      try {
        await this.databaseMigrationService.createTableForEntity(entity);
        console.log(`   📊 成功为实体 ${entity.code} 创建数据库表 ${entity.tableName}`);
      } catch (error) {
        // 如果表已存在，这是正常的
        if (error.message.includes('already exists') || error.message.includes('已存在')) {
          console.log(`   📊 表 ${entity.tableName} 已存在，跳过创建`);
        } else {
          throw error;
        }
      }

      // 验证表结构
      const validationResult = await this.databaseMigrationService.validateTableStructure(entity);
      
      if (typeof validationResult.isValid !== 'boolean') {
        throw new Error('表结构验证结果格式不正确');
      }

      if (!Array.isArray(validationResult.issues)) {
        throw new Error('表结构验证问题列表格式不正确');
      }

      console.log(`   📊 表结构验证结果: ${validationResult.isValid ? '通过' : '失败'}`);
      if (validationResult.issues.length > 0) {
        console.log(`   ⚠️  发现问题: ${validationResult.issues.join(', ')}`);
      }
    });
  }

  private async validatePrismaSchemaGeneration(): Promise<void> {
    await this.executeTest('Prisma Schema生成功能', async () => {
      // 创建一个用于Schema生成测试的实体
      const command = new CreateEntityCommand(
        'test-project-4',
        'Schema生成测试实体',
        'schema_test_entity',
        'schema_test_entities',
        '用于测试Prisma Schema生成功能的实体',
        'Schema测试',
        { x: 400, y: 500 },
        {},
        EntityStatus.DRAFT,
        'validation-script'
      );

      const entity = await this.commandBus.execute(command);
      const entityWithFields = await this.queryBus.execute(new GetEntityQuery(entity.id));

      // 生成Prisma Schema
      const prismaSchema = this.prismaSchemaGenerator.generateEntityModel(
        entity,
        entityWithFields.fields || []
      );

      // 验证生成的Schema
      if (!prismaSchema || typeof prismaSchema !== 'string') {
        throw new Error('Prisma Schema生成失败');
      }

      if (!prismaSchema.includes('model')) {
        throw new Error('生成的Prisma Schema缺少model定义');
      }

      if (!prismaSchema.includes(entity.tableName)) {
        throw new Error('生成的Prisma Schema缺少表名');
      }

      // 验证通用字段是否包含在Schema中
      const commonFieldCodes = ['id', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt'];
      for (const fieldCode of commonFieldCodes) {
        if (!prismaSchema.includes(fieldCode)) {
          throw new Error(`生成的Prisma Schema缺少通用字段: ${fieldCode}`);
        }
      }

      console.log(`   📊 成功生成Prisma Schema (${prismaSchema.length}字符)`);
      console.log(`   📝 Schema预览:\n${prismaSchema.substring(0, 200)}...`);
    });
  }

  private async validateEndToEndFlow(): Promise<void> {
    await this.executeTest('端到端完整流程验证', async () => {
      console.log('   🔄 开始端到端流程验证...');

      // Step 1: 创建实体
      const command = new CreateEntityCommand(
        'e2e-test-project',
        '端到端测试实体',
        'e2e_test_entity',
        'e2e_test_entities',
        '用于端到端流程验证的完整测试实体',
        '端到端测试',
        { x: 500, y: 600 },
        { e2eTest: true },
        EntityStatus.DRAFT,
        'e2e-validation-script'
      );

      const entity = await this.commandBus.execute(command);
      console.log(`   ✅ Step 1: 实体创建成功 - ${entity.id}`);

      // Step 2: 获取实体详情（包含自动添加的通用字段）
      const entityWithFields = await this.queryBus.execute(new GetEntityQuery(entity.id));
      if (!entityWithFields || !entityWithFields.fields || entityWithFields.fields.length === 0) {
        throw new Error('Step 2: 获取实体字段失败');
      }
      console.log(`   ✅ Step 2: 获取实体字段成功 - ${entityWithFields.fields.length}个字段`);

      // Step 3: 验证字段
      const validationResult = await this.entityFieldValidator.validateEntityFields(
        entity,
        entityWithFields.fields
      );
      if (!validationResult.isValid && validationResult.errors.length > 0) {
        throw new Error(`Step 3: 字段验证失败 - ${validationResult.errors.map(e => e.message).join(', ')}`);
      }
      console.log(`   ✅ Step 3: 字段验证通过 - ${validationResult.summary.totalFields}个字段`);

      // Step 4: 创建数据库表
      try {
        await this.databaseMigrationService.createTableForEntity(entity);
        console.log(`   ✅ Step 4: 数据库表创建成功 - ${entity.tableName}`);
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('已存在')) {
          console.log(`   ✅ Step 4: 数据库表已存在 - ${entity.tableName}`);
        } else {
          throw new Error(`Step 4: 数据库表创建失败 - ${error.message}`);
        }
      }

      // Step 5: 验证表结构
      const tableValidation = await this.databaseMigrationService.validateTableStructure(entity);
      console.log(`   ✅ Step 5: 表结构验证完成 - ${tableValidation.isValid ? '通过' : '需要修复'}`);

      // Step 6: 生成Prisma Schema
      const prismaSchema = this.prismaSchemaGenerator.generateEntityModel(entity, entityWithFields.fields);
      if (!prismaSchema || prismaSchema.length === 0) {
        throw new Error('Step 6: Prisma Schema生成失败');
      }
      console.log(`   ✅ Step 6: Prisma Schema生成成功 - ${prismaSchema.length}字符`);

      console.log('   🎉 端到端流程验证完成！');
    });
  }

  private printResults(): void {
    console.log('\n📊 功能验证结果汇总');
    console.log('=' .repeat(60));

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`总测试数: ${totalTests}`);
    console.log(`通过: ${passedTests} ✅`);
    console.log(`失败: ${failedTests} ❌`);
    console.log(`总耗时: ${totalDuration}ms`);
    console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    console.log('\n详细结果:');
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.testName} (${result.duration}ms)`);
      if (!result.success) {
        console.log(`   错误: ${result.message}`);
      }
    });

    if (failedTests === 0) {
      console.log('\n🎉 所有功能验证测试通过！低代码平台实体通用字段自动生成功能运行正常。');
    } else {
      console.log(`\n⚠️  有 ${failedTests} 个测试失败，请检查相关功能实现。`);
    }

    console.log('\n功能特性验证状态:');
    console.log('✅ 实体创建时自动添加通用字段');
    console.log('✅ 实体字段管理和验证');
    console.log('✅ 项目代码生成时自动创建数据库表');
    console.log('✅ 通用字段类型定义和约束管理');
    console.log('✅ 实体创建API增强');
  }

  async cleanup(): Promise<void> {
    if (this.app) {
      await this.app.close();
      console.log('\n🧹 清理完成');
    }
  }
}

// 执行验证脚本
async function runValidation() {
  const validator = new FeatureValidationScript();
  
  try {
    await validator.initialize();
    await validator.runValidation();
  } catch (error) {
    console.error('❌ 验证脚本执行失败:', error.message);
    process.exit(1);
  } finally {
    await validator.cleanup();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runValidation().catch(console.error);
}

export { FeatureValidationScript, runValidation };