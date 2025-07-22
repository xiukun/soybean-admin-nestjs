import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs-extra';
import * as path from 'path';
import { ProjectMetadata, EntityMetadata, FieldMetadata, GeneratedFile } from '../../../shared/types/metadata.types';
import { FieldTypeMapperService } from './field-type-mapper.service';

const execAsync = promisify(exec);

@Injectable()
export class AmisBackendManagerService {
  private readonly amisBackendPath = path.resolve(__dirname, '../../../../../../../amis-lowcode-backend');
  private readonly logger = new Logger(AmisBackendManagerService.name);

  constructor(private readonly fieldTypeMapper: FieldTypeMapperService) {}

  async writeGeneratedFiles(files: GeneratedFile[]): Promise<void> {
    this.logger.log(`Writing ${files.length} generated files to amis-lowcode-backend`);

    // 创建备份目录
    const backupPath = path.join(this.amisBackendPath, '.backup', new Date().toISOString().replace(/[:.]/g, '-'));
    await fs.ensureDir(backupPath);

    const writtenFiles: string[] = [];
    const backupFiles: string[] = [];

    try {
      for (const file of files) {
        const fullPath = path.join(this.amisBackendPath, file.path);
        const dir = path.dirname(fullPath);

        // 确保目录存在
        await fs.ensureDir(dir);

        // 备份现有文件
        if (await fs.pathExists(fullPath)) {
          const backupFilePath = path.join(backupPath, file.path);
          const backupDir = path.dirname(backupFilePath);
          await fs.ensureDir(backupDir);
          await fs.copy(fullPath, backupFilePath);
          backupFiles.push(backupFilePath);
          this.logger.debug(`Backed up existing file: ${fullPath} -> ${backupFilePath}`);
        }

        // 写入文件
        await fs.writeFile(fullPath, file.content, 'utf8');
        writtenFiles.push(fullPath);

        this.logger.debug(`Generated file: ${file.path} (${file.content.length} bytes)`);
      }

      this.logger.log(`Successfully wrote ${writtenFiles.length} files to amis-lowcode-backend`);
      if (backupFiles.length > 0) {
        this.logger.log(`Backed up ${backupFiles.length} existing files to ${backupPath}`);
      }

    } catch (writeError) {
      // 如果写入失败，尝试恢复备份文件
      this.logger.error('Failed to write files, attempting to restore backups', writeError);

      for (const backupFile of backupFiles) {
        try {
          const relativePath = path.relative(backupPath, backupFile);
          const originalPath = path.join(this.amisBackendPath, relativePath);
          await fs.copy(backupFile, originalPath);
          this.logger.log(`Restored backup: ${backupFile} -> ${originalPath}`);
        } catch (restoreError) {
          this.logger.error(`Failed to restore backup ${backupFile}`, restoreError);
        }
      }

      throw new Error(`Failed to write generated files: ${writeError.message}`);
    }
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

    try {
      // 确保prisma目录存在
      await fs.ensureDir(path.dirname(schemaPath));

      // 备份现有schema
      if (await fs.pathExists(schemaPath)) {
        const backupPath = `${schemaPath}.backup.${Date.now()}`;
        await fs.copy(schemaPath, backupPath);
        this.logger.log(`Backed up existing schema to ${backupPath}`);
      }

      // 写入新schema
      await fs.writeFile(schemaPath, schemaContent, 'utf8');
      this.logger.log(`Generated Prisma schema (${schemaContent.length} bytes)`);

      // 验证schema语法
      try {
        const validateCommand = `cd ${this.amisBackendPath} && npx prisma validate`;
        await execAsync(validateCommand);
        this.logger.log('Prisma schema validation passed');
      } catch (validateError) {
        this.logger.warn('Prisma schema validation failed', validateError.message);
        // 不抛出错误，继续生成客户端
      }

      // 生成Prisma客户端
      const generateCommand = `cd ${this.amisBackendPath} && npx prisma generate`;
      const { stdout, stderr } = await execAsync(generateCommand);

      if (stdout) this.logger.log(`Prisma generate output: ${stdout}`);
      if (stderr) this.logger.warn(`Prisma generate warnings: ${stderr}`);

      this.logger.log('Generated Prisma client successfully');

      // 处理数据库迁移（可选）
      await this.handleDatabaseMigration();

    } catch (error) {
      this.logger.error('Failed to generate Prisma schema or client', error);
      throw new Error(`Failed to generate Prisma schema: ${error.message}`);
    }
  }

  async restartAmisBackend(): Promise<void> {
    try {
      this.logger.log('Restarting amis-lowcode-backend service...');

      // 检查服务是否正在运行
      const isRunning = await this.healthCheck();
      if (!isRunning) {
        this.logger.log('Amis backend service is not running, starting it...');
        const startCommand = `cd ${this.amisBackendPath} && npm run start:dev`;
        execAsync(startCommand).catch(error => {
          this.logger.warn('Failed to start amis backend service', error.message);
        });
        return;
      }

      // 尝试优雅重启
      try {
        const restartCommand = `cd ${this.amisBackendPath} && npm run restart:dev`;
        const { stdout, stderr } = await execAsync(restartCommand, { timeout: 30000 });

        if (stdout) this.logger.log(`Restart output: ${stdout}`);
        if (stderr) this.logger.warn(`Restart warnings: ${stderr}`);

        // 等待服务重新启动
        await this.waitForServiceReady(10000);

        this.logger.log('Amis backend service restarted successfully');
      } catch (restartError) {
        this.logger.warn('Graceful restart failed, attempting force restart', restartError.message);

        // 强制重启
        try {
          const killCommand = `cd ${this.amisBackendPath} && pkill -f "nest start" || true`;
          await execAsync(killCommand);

          // 等待进程结束
          await new Promise(resolve => setTimeout(resolve, 2000));

          const startCommand = `cd ${this.amisBackendPath} && npm run start:dev`;
          execAsync(startCommand).catch(error => {
            this.logger.warn('Failed to start amis backend service after force kill', error.message);
          });

          this.logger.log('Amis backend service force restarted');
        } catch (forceError) {
          this.logger.error('Failed to force restart amis backend service', forceError.message);
        }
      }

    } catch (error) {
      this.logger.warn('Failed to restart amis backend service automatically', error.message);
      // 不抛出错误，因为重启失败不应该影响代码生成的成功状态
    }
  }

  private async waitForServiceReady(timeoutMs: number = 10000): Promise<boolean> {
    const startTime = Date.now();
    const checkInterval = 1000;

    while (Date.now() - startTime < timeoutMs) {
      try {
        const isReady = await this.healthCheck();
        if (isReady) {
          this.logger.log('Amis backend service is ready');
          return true;
        }
      } catch (error) {
        // 忽略健康检查错误，继续等待
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    this.logger.warn(`Service not ready after ${timeoutMs}ms timeout`);
    return false;
  }

  private buildPrismaSchema(metadata: ProjectMetadata): string {
    let schema = `// Auto-generated Prisma schema for ${metadata.name}
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
      const typeMapping = this.fieldTypeMapper.getTypeMappingResult(field);
      const fieldType = typeMapping.prismaType;
      const nullable = field.nullable && !field.isPrimaryKey ? '?' : '';
      const attributes = typeMapping.attributes.length > 0 ? ' ' + typeMapping.attributes.join(' ') : '';

      model += `  ${field.code} ${fieldType}${nullable}${attributes}\n`;
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

  private async handleDatabaseMigration(): Promise<void> {
    try {
      this.logger.log('Handling database migration...');

      // 检查是否需要迁移
      const statusCommand = `cd ${this.amisBackendPath} && npx prisma migrate status`;
      try {
        const { stdout } = await execAsync(statusCommand);
        if (stdout.includes('Database is up to date')) {
          this.logger.log('Database is already up to date');
          return;
        }
      } catch (statusError) {
        this.logger.debug('Migration status check failed, proceeding with migration');
      }

      // 在开发环境中使用 db push，在生产环境中使用 migrate deploy
      const isDevelopment = process.env.NODE_ENV !== 'production';

      if (isDevelopment) {
        // 开发环境：使用 db push 快速同步
        const pushCommand = `cd ${this.amisBackendPath} && npx prisma db push --accept-data-loss`;
        const { stdout: pushStdout, stderr: pushStderr } = await execAsync(pushCommand);

        if (pushStdout) this.logger.log(`DB push output: ${pushStdout}`);
        if (pushStderr) this.logger.warn(`DB push warnings: ${pushStderr}`);

        this.logger.log('Database schema synchronized successfully');
      } else {
        // 生产环境：使用 migrate deploy
        const deployCommand = `cd ${this.amisBackendPath} && npx prisma migrate deploy`;
        const { stdout: deployStdout, stderr: deployStderr } = await execAsync(deployCommand);

        if (deployStdout) this.logger.log(`Migration deploy output: ${deployStdout}`);
        if (deployStderr) this.logger.warn(`Migration deploy warnings: ${deployStderr}`);

        this.logger.log('Database migrations applied successfully');
      }

    } catch (error) {
      this.logger.warn('Database migration failed, but continuing with code generation', error.message);
      // 不抛出错误，因为迁移失败不应该阻止代码生成
    }
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
      // 尝试多个可能的端口
      const ports = [9522, 3000, 3001];

      for (const port of ports) {
        try {
          const healthUrl = `http://localhost:${port}/api/v1/health`;
          const { stdout } = await execAsync(`curl -s -m 5 ${healthUrl}`, { timeout: 5000 });

          if (stdout) {
            try {
              const response = JSON.parse(stdout);
              if (response.status === 0 || response.status === 'ok') {
                this.logger.debug(`Health check passed on port ${port}`);
                return true;
              }
            } catch (parseError) {
              // 如果不是JSON响应，检查是否包含成功指示符
              if (stdout.includes('ok') || stdout.includes('healthy') || stdout.includes('running')) {
                this.logger.debug(`Health check passed on port ${port} (non-JSON response)`);
                return true;
              }
            }
          }
        } catch (portError) {
          this.logger.debug(`Health check failed on port ${port}: ${portError.message}`);
          continue;
        }
      }

      // 如果HTTP健康检查失败，尝试检查进程是否存在
      try {
        const { stdout } = await execAsync('ps aux | grep "nest start" | grep -v grep');
        if (stdout && stdout.trim()) {
          this.logger.debug('Found nest process running');
          return true;
        }
      } catch (processError) {
        this.logger.debug('No nest process found');
      }

      return false;
    } catch (error) {
      this.logger.debug(`Health check error: ${error.message}`);
      return false;
    }
  }

  async getServiceInfo(): Promise<{
    isRunning: boolean;
    port?: number;
    version?: string;
    uptime?: number;
  }> {
    const info = {
      isRunning: false,
      port: undefined as number | undefined,
      version: undefined as string | undefined,
      uptime: undefined as number | undefined,
    };

    try {
      const ports = [9522, 3000, 3001];

      for (const port of ports) {
        try {
          const healthUrl = `http://localhost:${port}/api/v1/health`;
          const { stdout } = await execAsync(`curl -s -m 5 ${healthUrl}`, { timeout: 5000 });

          if (stdout) {
            try {
              const response = JSON.parse(stdout);
              if (response.status === 0 || response.status === 'ok') {
                info.isRunning = true;
                info.port = port;
                info.version = response.version;
                info.uptime = response.uptime;
                break;
              }
            } catch (parseError) {
              if (stdout.includes('ok') || stdout.includes('healthy')) {
                info.isRunning = true;
                info.port = port;
                break;
              }
            }
          }
        } catch (portError) {
          continue;
        }
      }
    } catch (error) {
      this.logger.debug(`Failed to get service info: ${error.message}`);
    }

    return info;
  }
}
