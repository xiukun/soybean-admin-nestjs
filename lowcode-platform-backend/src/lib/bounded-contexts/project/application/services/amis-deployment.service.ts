import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as net from 'net';

const execAsync = promisify(exec);

@Injectable()
export class AmisDeploymentService {
  private readonly logger = new Logger(AmisDeploymentService.name);
  private readonly amisBackendPath: string;
  private readonly deployedProjects = new Map<string, { port: number; process?: any }>();

  constructor(private readonly configService: ConfigService) {
    this.amisBackendPath = this.configService.get<string>('AMIS_BACKEND_PATH') ||
                          path.join(process.cwd(), '../amis-lowcode-backend');

    this.logger.log(`Amis backend path: ${this.amisBackendPath}`);
  }

  /**
   * 检查端口是否可用
   */
  async checkPortAvailability(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, () => {
        server.once('close', () => {
          resolve(true);
        });
        server.close();
      });
      
      server.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * 部署项目到 amis-lowcode-backend
   */
  async deployProject(projectId: string, port?: number, config?: any): Promise<void> {
    try {
      this.logger.log(`Starting deployment for project ${projectId}`);

      // 1. 确保 amis-lowcode-backend 目录存在
      await this.ensureAmisBackendExists();

      // 2. 复制生成的代码到 amis-lowcode-backend
      await this.copyGeneratedCode(projectId);

      // 3. 更新 Prisma schema
      await this.updatePrismaSchema(projectId);

      // 4. 更新 app.module.ts
      await this.updateAppModule(projectId);

      // 5. 安装依赖并生成 Prisma 客户端
      await this.installDependencies();

      // 6. 启动服务
      const deploymentPort = port || await this.findAvailablePort();
      await this.startService(projectId, deploymentPort, config);

      // 6. 记录部署信息
      this.deployedProjects.set(projectId, { port: deploymentPort });

      this.logger.log(`Project ${projectId} deployed successfully on port ${deploymentPort}`);
    } catch (error) {
      this.logger.error(`Failed to deploy project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 停止项目部署
   */
  async stopProject(projectId: string): Promise<void> {
    try {
      this.logger.log(`Stopping deployment for project ${projectId}`);

      const deployment = this.deployedProjects.get(projectId);
      if (!deployment) {
        throw new Error(`Project ${projectId} is not deployed`);
      }

      // 停止服务进程
      if (deployment.process) {
        deployment.process.kill();
      }

      // 清理部署记录
      this.deployedProjects.delete(projectId);

      this.logger.log(`Project ${projectId} stopped successfully`);
    } catch (error) {
      this.logger.error(`Failed to stop project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 获取项目部署状态
   */
  getProjectDeploymentInfo(projectId: string): { port: number; isRunning: boolean } | null {
    const deployment = this.deployedProjects.get(projectId);
    if (!deployment) {
      return null;
    }

    return {
      port: deployment.port,
      isRunning: deployment.process ? !deployment.process.killed : false
    };
  }

  /**
   * 确保 amis-lowcode-backend 目录存在
   */
  private async ensureAmisBackendExists(): Promise<void> {
    if (!await fs.pathExists(this.amisBackendPath)) {
      throw new Error(`Amis backend path does not exist: ${this.amisBackendPath}`);
    }
  }

  /**
   * 复制生成的代码到 amis-lowcode-backend
   */
  private async copyGeneratedCode(projectId: string): Promise<void> {
    const generatedCodePath = path.join(process.cwd(), 'generated', projectId);
    const targetBizPath = path.join(this.amisBackendPath, 'src', 'biz');
    const targetBasePath = path.join(this.amisBackendPath, 'src', 'base');

    if (await fs.pathExists(generatedCodePath)) {
      // 复制业务代码到 biz 目录
      const bizCodePath = path.join(generatedCodePath, 'src', 'biz');
      if (await fs.pathExists(bizCodePath)) {
        await fs.copy(bizCodePath, targetBizPath, { overwrite: true });
        this.logger.log(`Copied biz code from ${bizCodePath} to ${targetBizPath}`);
      }

      // 复制基础代码到 base 目录
      const baseCodePath = path.join(generatedCodePath, 'src', 'base');
      if (await fs.pathExists(baseCodePath)) {
        await fs.copy(baseCodePath, targetBasePath, { overwrite: true });
        this.logger.log(`Copied base code from ${baseCodePath} to ${targetBasePath}`);
      }

      // 复制配置文件
      const configPath = path.join(generatedCodePath, 'src', 'config');
      const targetConfigPath = path.join(this.amisBackendPath, 'src', 'config');
      if (await fs.pathExists(configPath)) {
        await fs.copy(configPath, targetConfigPath, { overwrite: true });
        this.logger.log(`Copied config from ${configPath} to ${targetConfigPath}`);
      }
    } else {
      this.logger.warn(`Generated code path does not exist: ${generatedCodePath}`);
    }
  }

  /**
   * 更新 Prisma schema
   */
  private async updatePrismaSchema(projectId: string): Promise<void> {
    const schemaPath = path.join(this.amisBackendPath, 'prisma', 'schema.prisma');
    const generatedSchemaPath = path.join(process.cwd(), 'generated', projectId, 'prisma', 'schema.prisma');

    if (await fs.pathExists(generatedSchemaPath)) {
      await fs.copy(generatedSchemaPath, schemaPath, { overwrite: true });
      this.logger.log(`Updated Prisma schema for project ${projectId}`);
    }
  }

  /**
   * 安装依赖并生成 Prisma 客户端
   */
  private async installDependencies(): Promise<void> {
    try {
      // 生成 Prisma 客户端
      await execAsync('npx prisma generate', { cwd: this.amisBackendPath });
      this.logger.log('Generated Prisma client');

      // 运行数据库迁移
      await execAsync('npx prisma db push', { cwd: this.amisBackendPath });
      this.logger.log('Applied database migrations');
    } catch (error) {
      this.logger.error('Failed to install dependencies:', error);
      throw error;
    }
  }

  /**
   * 启动服务
   */
  private async startService(projectId: string, port: number, config?: any): Promise<void> {
    try {
      // 更新环境配置
      await this.updateEnvironmentConfig(port, config);

      // 重启服务
      await this.restartAmisBackend();

      this.logger.log(`Service started for project ${projectId} on port ${port}`);
    } catch (error) {
      this.logger.error(`Failed to start service for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 更新环境配置
   */
  private async updateEnvironmentConfig(port: number, config?: any): Promise<void> {
    const envPath = path.join(this.amisBackendPath, '.env');

    try {
      let envContent = '';
      if (await fs.pathExists(envPath)) {
        envContent = await fs.readFile(envPath, 'utf-8');
      }

      // 更新端口配置
      if (envContent.includes('PORT=')) {
        envContent = envContent.replace(/PORT=\d+/, `PORT=${port}`);
      } else {
        envContent += `\nPORT=${port}`;
      }

      // 添加其他配置
      if (config) {
        for (const [key, value] of Object.entries(config)) {
          const envKey = key.toUpperCase();
          if (envContent.includes(`${envKey}=`)) {
            envContent = envContent.replace(new RegExp(`${envKey}=.*`), `${envKey}=${value}`);
          } else {
            envContent += `\n${envKey}=${value}`;
          }
        }
      }

      await fs.writeFile(envPath, envContent, 'utf-8');
      this.logger.log(`Updated environment configuration for port ${port}`);
    } catch (error) {
      this.logger.error('Failed to update environment configuration:', error);
      throw error;
    }
  }

  /**
   * 重启 Amis 后端服务
   */
  private async restartAmisBackend(): Promise<void> {
    try {
      // 停止现有服务
      await execAsync('pkill -f "nest start" || true', { cwd: this.amisBackendPath });

      // 等待一秒确保进程完全停止
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 启动服务（后台运行）
      const child = spawn('npm', ['run', 'start:dev'], {
        cwd: this.amisBackendPath,
        detached: true,
        stdio: 'ignore'
      });

      child.unref();

      this.logger.log('Amis backend service restarted');
    } catch (error) {
      this.logger.error('Failed to restart Amis backend service:', error);
      throw error;
    }
  }

  /**
   * 更新 app.module.ts 以包含生成的模块
   */
  private async updateAppModule(projectId: string): Promise<void> {
    try {
      const appModulePath = path.join(this.amisBackendPath, 'src', 'app.module.ts');
      const generatedModulesPath = path.join(this.amisBackendPath, 'src', 'biz', 'modules');

      // 检查是否有生成的模块
      if (!await fs.pathExists(generatedModulesPath)) {
        this.logger.warn('No generated modules found, skipping app.module.ts update');
        return;
      }

      // 获取所有模块文件
      const moduleFiles = await fs.readdir(generatedModulesPath);
      const modules = moduleFiles
        .filter(file => file.endsWith('.module.ts'))
        .map(file => {
          const moduleName = file.replace('.module.ts', '');
          const className = moduleName.split('-').map(part =>
            part.charAt(0).toUpperCase() + part.slice(1)
          ).join('') + 'Module';
          return { moduleName, className, file };
        });

      if (modules.length === 0) {
        this.logger.warn('No module files found in generated code');
        return;
      }

      // 生成导入语句
      const imports = modules.map(m =>
        `import { ${m.className} } from './biz/modules/${m.file.replace('.ts', '')}';`
      ).join('\n');

      // 生成模块列表
      const moduleList = modules.map(m => `    ${m.className}`).join(',\n');

      // 生成新的 app.module.ts 内容
      const appModuleContent = `import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from '@shared/services/prisma.service';
import { DatabaseInitService } from '@shared/database/database-init.service';
import { JwtStrategy } from '@shared/strategies/jwt.strategy';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
${imports}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // 认证模块
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d'),
        },
      }),
      inject: [ConfigService],
    }),

    // 生成的业务模块
${moduleList}
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    DatabaseInitService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {
  // This module is dynamically updated by the code generator
  // Project: ${projectId}
  // Updated: ${new Date().toISOString()}
}`;

      await fs.writeFile(appModulePath, appModuleContent, 'utf-8');
      this.logger.log(`Updated app.module.ts with ${modules.length} generated modules`);
    } catch (error) {
      this.logger.error('Failed to update app.module.ts:', error);
      throw error;
    }
  }

  /**
   * 查找可用端口
   */
  private async findAvailablePort(startPort: number = 9522): Promise<number> {
    for (let port = startPort; port < startPort + 100; port++) {
      if (await this.checkPortAvailability(port)) {
        return port;
      }
    }
    throw new Error('No available ports found');
  }
}
