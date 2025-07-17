#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/lib/shared/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';

interface ProjectConfig {
  name: string;
  code: string;
  description: string;
  version: string;
  status: string;
  category?: string;
  tags?: string[];
  config?: any;
  metadata?: any;
}

interface EntityConfig {
  name: string;
  code: string;
  tableName: string;
  description: string;
  category: string;
  status: string;
  config?: any;
  fields: FieldConfig[];
}

interface FieldConfig {
  name: string;
  code: string;
  type: string;
  length?: number;
  precision?: number;
  scale?: number;
  nullable: boolean;
  unique?: boolean;
  primaryKey?: boolean;
  defaultValue?: string;
  comment?: string;
  order: number;
}

interface RelationshipConfig {
  name: string;
  code: string;
  description: string;
  type: string;
  sourceEntity: string;
  targetEntity: string;
  sourceField: string;
  targetField: string;
  throughEntity?: string;
  throughSourceField?: string;
  throughTargetField?: string;
  onDelete: string;
  onUpdate: string;
  config?: any;
}

class ExampleImporter {
  private prisma: PrismaService;
  private app: any;

  constructor() {}

  async initialize() {
    this.app = await NestFactory.createApplicationContext(AppModule);
    this.prisma = this.app.get(PrismaService);
  }

  async importExample(exampleName: string, userId?: string) {
    console.log(`🚀 开始导入示例项目: ${exampleName}`);

    const examplePath = path.join(__dirname, '../../examples', exampleName);
    
    if (!fs.existsSync(examplePath)) {
      throw new Error(`示例项目不存在: ${exampleName}`);
    }

    try {
      // 1. 导入项目配置
      const project = await this.importProject(examplePath, userId);
      console.log(`✅ 项目创建成功: ${project.name} (${project.id})`);

      // 2. 导入实体
      const entities = await this.importEntities(examplePath, project.id, userId);
      console.log(`✅ 实体导入成功: ${entities.length} 个实体`);

      // 3. 导入关系
      const relationships = await this.importRelationships(examplePath, project.id, entities, userId);
      console.log(`✅ 关系导入成功: ${relationships.length} 个关系`);

      // 4. 导入API配置（如果存在）
      await this.importApiConfigs(examplePath, project.id, entities, userId);

      // 5. 导入模板（如果存在）
      await this.importTemplates(examplePath, project.id, userId);

      console.log(`🎉 示例项目 "${exampleName}" 导入完成！`);
      console.log(`📊 项目统计:`);
      console.log(`   - 项目ID: ${project.id}`);
      console.log(`   - 实体数量: ${entities.length}`);
      console.log(`   - 关系数量: ${relationships.length}`);

      return {
        project,
        entities,
        relationships,
      };
    } catch (error) {
      console.error(`❌ 导入失败:`, error.message);
      throw error;
    }
  }

  private async importProject(examplePath: string, userId?: string): Promise<any> {
    const configPath = path.join(examplePath, 'project-config.json');
    
    if (!fs.existsSync(configPath)) {
      throw new Error('项目配置文件不存在: project-config.json');
    }

    const config: ProjectConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // 检查项目是否已存在
    const existingProject = await this.prisma.project.findFirst({
      where: { code: config.code },
    });

    if (existingProject) {
      console.log(`⚠️  项目已存在，将更新: ${config.name}`);
      return this.prisma.project.update({
        where: { id: existingProject.id },
        data: {
          name: config.name,
          description: config.description,
          version: config.version,
          status: config.status,
          config: config.config || {},
          metadata: config.metadata || {},
          updatedBy: userId,
        },
      });
    }

    return this.prisma.project.create({
      data: {
        name: config.name,
        code: config.code,
        description: config.description,
        version: config.version,
        status: config.status,
        config: config.config || {},
        metadata: config.metadata || {},
        createdBy: userId,
      },
    });
  }

  private async importEntities(examplePath: string, projectId: string, userId?: string): Promise<any[]> {
    const entitiesPath = path.join(examplePath, 'entities.json');
    
    if (!fs.existsSync(entitiesPath)) {
      console.log('⚠️  实体配置文件不存在，跳过实体导入');
      return [];
    }

    const entitiesConfig: EntityConfig[] = JSON.parse(fs.readFileSync(entitiesPath, 'utf8'));
    const createdEntities = [];

    for (const entityConfig of entitiesConfig) {
      // 检查实体是否已存在
      const existingEntity = await this.prisma.entity.findFirst({
        where: {
          projectId,
          code: entityConfig.code,
        },
      });

      let entity;
      if (existingEntity) {
        console.log(`⚠️  实体已存在，将更新: ${entityConfig.name}`);
        entity = await this.prisma.entity.update({
          where: { id: existingEntity.id },
          data: {
            name: entityConfig.name,
            tableName: entityConfig.tableName,
            description: entityConfig.description,
            category: entityConfig.category,
            status: entityConfig.status,
            config: entityConfig.config || {},
            updatedBy: userId,
          },
        });

        // 删除现有字段
        await this.prisma.field.deleteMany({
          where: { entityId: existingEntity.id },
        });
      } else {
        entity = await this.prisma.entity.create({
          data: {
            projectId,
            name: entityConfig.name,
            code: entityConfig.code,
            tableName: entityConfig.tableName,
            description: entityConfig.description,
            category: entityConfig.category,
            status: entityConfig.status,
            config: entityConfig.config || {},
            createdBy: userId,
          },
        });
      }

      // 创建字段
      for (const fieldConfig of entityConfig.fields) {
        await this.prisma.field.create({
          data: {
            entityId: entity.id,
            name: fieldConfig.name,
            code: fieldConfig.code,
            type: fieldConfig.type,
            length: fieldConfig.length,
            precision: fieldConfig.precision,
            scale: fieldConfig.scale,
            nullable: fieldConfig.nullable,
            unique: fieldConfig.unique || false,
            primaryKey: fieldConfig.primaryKey || false,
            defaultValue: fieldConfig.defaultValue,
            comment: fieldConfig.comment,
            order: fieldConfig.order,
            createdBy: userId,
          },
        });
      }

      createdEntities.push(entity);
      console.log(`   ✓ 实体: ${entity.name} (${entityConfig.fields.length} 个字段)`);
    }

    return createdEntities;
  }

  private async importRelationships(
    examplePath: string,
    projectId: string,
    entities: any[],
    userId?: string
  ): Promise<any[]> {
    const relationshipsPath = path.join(examplePath, 'relationships.json');
    
    if (!fs.existsSync(relationshipsPath)) {
      console.log('⚠️  关系配置文件不存在，跳过关系导入');
      return [];
    }

    const relationshipsConfig: RelationshipConfig[] = JSON.parse(fs.readFileSync(relationshipsPath, 'utf8'));
    const createdRelationships = [];

    // 创建实体代码到ID的映射
    const entityMap = new Map();
    entities.forEach(entity => {
      entityMap.set(entity.code, entity.id);
    });

    for (const relationConfig of relationshipsConfig) {
      const sourceEntityId = entityMap.get(relationConfig.sourceEntity);
      const targetEntityId = entityMap.get(relationConfig.targetEntity);

      if (!sourceEntityId || !targetEntityId) {
        console.log(`⚠️  跳过关系 ${relationConfig.name}: 找不到相关实体`);
        continue;
      }

      // 检查关系是否已存在
      const existingRelationship = await this.prisma.relationship.findFirst({
        where: {
          projectId,
          code: relationConfig.code,
        },
      });

      let relationship;
      if (existingRelationship) {
        console.log(`⚠️  关系已存在，将更新: ${relationConfig.name}`);
        relationship = await this.prisma.relationship.update({
          where: { id: existingRelationship.id },
          data: {
            name: relationConfig.name,
            description: relationConfig.description,
            type: relationConfig.type,
            sourceEntityId,
            targetEntityId,
            sourceField: relationConfig.sourceField,
            targetField: relationConfig.targetField,
            onDelete: relationConfig.onDelete,
            onUpdate: relationConfig.onUpdate,
            config: relationConfig.config || {},
            updatedBy: userId,
          },
        });
      } else {
        relationship = await this.prisma.relationship.create({
          data: {
            projectId,
            name: relationConfig.name,
            code: relationConfig.code,
            description: relationConfig.description,
            type: relationConfig.type,
            sourceEntityId,
            targetEntityId,
            sourceField: relationConfig.sourceField,
            targetField: relationConfig.targetField,
            onDelete: relationConfig.onDelete,
            onUpdate: relationConfig.onUpdate,
            config: relationConfig.config || {},
            createdBy: userId,
          },
        });
      }

      createdRelationships.push(relationship);
      console.log(`   ✓ 关系: ${relationship.name}`);
    }

    return createdRelationships;
  }

  private async importApiConfigs(examplePath: string, projectId: string, entities: any[], userId?: string) {
    const apiConfigsPath = path.join(examplePath, 'api-configs.json');
    
    if (!fs.existsSync(apiConfigsPath)) {
      console.log('⚠️  API配置文件不存在，跳过API配置导入');
      return;
    }

    // TODO: 实现API配置导入
    console.log('⚠️  API配置导入功能待实现');
  }

  private async importTemplates(examplePath: string, projectId: string, userId?: string) {
    const templatesPath = path.join(examplePath, 'templates');
    
    if (!fs.existsSync(templatesPath)) {
      console.log('⚠️  模板目录不存在，跳过模板导入');
      return;
    }

    // TODO: 实现模板导入
    console.log('⚠️  模板导入功能待实现');
  }

  async close() {
    if (this.app) {
      await this.app.close();
    }
  }
}

// CLI 程序
async function main() {
  const program = new Command();

  program
    .name('import-example')
    .description('导入示例项目到低代码平台')
    .version('1.0.0');

  program
    .option('-p, --project <name>', '示例项目名称')
    .option('-u, --user <id>', '用户ID（可选）')
    .option('-l, --list', '列出所有可用的示例项目')
    .parse();

  const options = program.opts();

  if (options.list) {
    console.log('📋 可用的示例项目:');
    const examplesPath = path.join(__dirname, '../../examples');
    
    if (fs.existsSync(examplesPath)) {
      const examples = fs.readdirSync(examplesPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      examples.forEach((example, index) => {
        console.log(`   ${index + 1}. ${example}`);
      });
    } else {
      console.log('   暂无可用的示例项目');
    }
    return;
  }

  if (!options.project) {
    console.error('❌ 请指定要导入的示例项目名称');
    console.log('使用 --help 查看帮助信息');
    process.exit(1);
  }

  const importer = new ExampleImporter();
  
  try {
    await importer.initialize();
    await importer.importExample(options.project, options.user);
  } catch (error) {
    console.error('❌ 导入失败:', error.message);
    process.exit(1);
  } finally {
    await importer.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

export { ExampleImporter };
