import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs-extra';
import * as path from 'path';
import { ProjectMetadata, EntityMetadata, FieldMetadata, RelationshipMetadata, GeneratedFile } from '../../../shared/types/metadata.types';

const execAsync = promisify(exec);

@Injectable()
export class AmisBackendManagerService {
  private readonly amisBackendPath = path.resolve(__dirname, '../../../../../../../amis-lowcode-backend');
  private readonly logger = new Logger(AmisBackendManagerService.name);

  async writeGeneratedFiles(files: GeneratedFile[]): Promise<void> {
    this.logger.log(`Writing ${files.length} generated files to amis-lowcode-backend`);

    for (const file of files) {
      const fullPath = path.join(this.amisBackendPath, file.path);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, file.content);
      this.logger.debug(`Generated file: ${file.path}`);
    }

    this.logger.log('All files written successfully');
  }

  async updateAppModule(entities: EntityMetadata[]): Promise<void> {
    const appModulePath = path.join(this.amisBackendPath, 'src/app.module.ts');

    const moduleImports = entities.map(entity => {
      const moduleName = entity.code; // 直接使用code字段，它应该是英文的
      return `import { ${moduleName}Module } from '@modules/${moduleName.toLowerCase()}.module';`;
    }).join('\n');

    const moduleList = entities.map(entity => {
      const moduleName = entity.code; // 直接使用code字段，它应该是英文的
      return `${moduleName}Module`;
    }).join(',\n    ');

    const appModuleContent = `import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from '@shared/services/prisma.service';
${moduleImports}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ${moduleList}
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {
  // This module is dynamically updated by the code generator
}`;

    await fs.writeFile(appModulePath, appModuleContent);
    this.logger.log('Updated app.module.ts with generated modules');
  }

  async generatePrismaSchema(metadata: ProjectMetadata): Promise<void> {
    const schemaPath = path.join(this.amisBackendPath, 'prisma/schema.prisma');
    const schemaContent = this.buildPrismaSchema(metadata);
    
    await fs.writeFile(schemaPath, schemaContent);
    this.logger.log('Generated Prisma schema');
    
    try {
      // 生成Prisma客户端
      const generateCommand = `cd ${this.amisBackendPath} && npx prisma generate`;
      await execAsync(generateCommand);
      this.logger.log('Generated Prisma client');
    } catch (error) {
      this.logger.error('Failed to generate Prisma client', error);
      throw error;
    }
  }

  async restartAmisBackend(): Promise<void> {
    try {
      this.logger.log('Restarting amis-lowcode-backend service...');
      
      // 发送重启信号
      const restartCommand = `cd ${this.amisBackendPath} && npm run restart:dev`;
      await execAsync(restartCommand);
      
      this.logger.log('Amis backend service restarted successfully');
    } catch (error) {
      this.logger.warn('Failed to restart amis backend service automatically', error.message);
      // 不抛出错误，因为重启失败不应该影响代码生成的成功状态
    }
  }

  private buildPrismaSchema(metadata: ProjectMetadata): string {
    let schema = `// Auto-generated Prisma schema for ${metadata.project.name}
// Generated at: ${new Date().toISOString()}

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;

    // 生成实体模型
    for (const entity of metadata.entities) {
      schema += this.generatePrismaModel(entity);
      schema += '\n';
    }

    return schema;
  }

  private generatePrismaModel(entity: EntityMetadata): string {
    // 使用英文名称避免中文字符问题
    const modelName = entity.code || entity.name.replace(/[^\w]/g, '');
    let model = `model ${modelName} {\n`;

    // 生成字段
    for (const field of entity.fields) {
      const fieldType = this.mapFieldTypeToPrisma(field);
      const attributes = this.buildFieldAttributes(field);
      model += `  ${field.code} ${fieldType}${attributes}\n`;
    }

    // 生成关系
    for (const relation of entity.relationships.outgoing) {
      const relationType = relation.relationType === 'oneToMany' ? '[]' :
                          relation.relationType === 'manyToOne' ? '?' : '';
      model += `  ${relation.relationshipName} ${relation.targetEntityName}${relationType}\n`;
    }

    model += `\n  @@map("${entity.tableName}")\n`;
    model += '}';

    return model;
  }

  private mapFieldTypeToPrisma(field: FieldMetadata): string {
    const typeMap: Record<string, string> = {
      'STRING': 'String',
      'TEXT': 'String',
      'INTEGER': 'Int',
      'BIGINT': 'BigInt',
      'DECIMAL': 'Decimal',
      'BOOLEAN': 'Boolean',
      'DATE': 'DateTime',
      'DATETIME': 'DateTime',
      'TIMESTAMP': 'DateTime',
      'JSON': 'Json',
      'UUID': 'String',
      // 兼容小写
      'string': 'String',
      'text': 'String',
      'integer': 'Int',
      'bigint': 'BigInt',
      'decimal': 'Decimal',
      'boolean': 'Boolean',
      'date': 'DateTime',
      'datetime': 'DateTime',
      'timestamp': 'DateTime',
      'json': 'Json',
      'uuid': 'String',
    };

    return typeMap[field.type] || 'String';
  }

  private buildFieldAttributes(field: FieldMetadata): string {
    let attributes = '';
    
    if (field.isPrimaryKey) {
      attributes += ' @id';
      if (field.type === 'string') {
        attributes += ' @default(cuid())';
      }
    }
    
    if (field.isUnique && !field.isPrimaryKey) {
      attributes += ' @unique';
    }
    
    if (!field.nullable && !field.isPrimaryKey) {
      // Prisma默认字段为必填，只有可空字段需要标记
    } else if (field.nullable) {
      attributes += '?';
    }
    
    if (field.defaultValue && !field.isPrimaryKey) {
      if (field.type === 'datetime' && field.defaultValue === 'now()') {
        attributes += ' @default(now())';
      } else if (field.type === 'datetime' && field.code === 'updatedAt') {
        attributes += ' @updatedAt';
      } else {
        attributes += ` @default(${field.defaultValue})`;
      }
    }
    
    if (field.length && (field.type === 'string' || field.type === 'text')) {
      attributes += ` @db.VarChar(${field.length})`;
    }

    return attributes;
  }

  async getFileTree(basePath: string = 'src'): Promise<any[]> {
    const fullPath = path.join(this.amisBackendPath, basePath);
    return await this.buildFileTree(fullPath, basePath);
  }

  private async buildFileTree(dirPath: string, relativePath: string): Promise<any[]> {
    const items: any[] = [];
    
    if (await fs.pathExists(dirPath)) {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const itemPath = path.join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
          const children = await this.buildFileTree(
            path.join(dirPath, entry.name),
            itemPath
          );
          
          items.push({
            name: entry.name,
            path: itemPath,
            type: 'directory',
            children
          });
        } else {
          const stats = await fs.stat(path.join(dirPath, entry.name));
          
          items.push({
            name: entry.name,
            path: itemPath,
            type: 'file',
            size: stats.size,
            lastModified: stats.mtime
          });
        }
      }
    }
    
    return items;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const healthUrl = 'http://localhost:9522/api/v1/health';
      const { stdout } = await execAsync(`curl -s ${healthUrl}`);
      const response = JSON.parse(stdout);
      return response.status === 0;
    } catch {
      return false;
    }
  }
}
