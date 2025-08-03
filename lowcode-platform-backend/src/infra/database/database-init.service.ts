import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class DatabaseInitService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseInitService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const autoInit = this.configService.get<string>('AUTO_INIT_DATA', 'false');
    const isDocker = this.configService.get<string>('DOCKER_ENV', 'false');
    
    if (autoInit === 'true') {
      await this.initializeDatabase();
    }
  }

  async initializeDatabase(): Promise<void> {
    try {
      this.logger.log('🔍 检查数据库初始化状态...');

      // 检查数据库连接
      await this.checkDatabaseConnection();

      // 检查是否需要初始化
      const needsInit = await this.checkIfInitializationNeeded();

      if (needsInit) {
        this.logger.log('🚀 开始数据库初始化...');
        
        // 运行Prisma迁移
        await this.runPrismaMigrations();
        
        // 运行种子数据
        await this.runSeedData();
        
        this.logger.log('✅ 数据库初始化完成');
      } else {
        this.logger.log('📋 数据库已初始化，跳过初始化步骤');
      }
    } catch (error) {
      this.logger.error('❌ 数据库初始化失败:', error);
      throw error;
    }
  }

  private async checkDatabaseConnection(): Promise<void> {
    try {
      await this.prisma.$connect();
      this.logger.log('✅ 数据库连接成功');
    } catch (error) {
      this.logger.error('❌ 数据库连接失败:', error);
      throw new Error('Database connection failed');
    }
  }

  private async checkIfInitializationNeeded(): Promise<boolean> {
    try {
      // 检查是否存在项目表和数据
      const projectCount = await this.prisma.project.count();
      return projectCount === 0;
    } catch (error) {
      // 如果表不存在，说明需要初始化
      this.logger.log('📋 数据库表不存在，需要初始化');
      return true;
    }
  }

  private async runPrismaMigrations(): Promise<void> {
    try {
      this.logger.log('🔧 跳过Prisma迁移（表已存在）...');
      
      // 跳过迁移，因为表结构已经通过其他方式创建
      // 只生成 Prisma 客户端
      await execAsync('npx prisma generate');
      
      this.logger.log('✅ Prisma客户端生成完成');
    } catch (error) {
      this.logger.error('❌ Prisma客户端生成失败:', error);
      throw error;
    }
  }

  private async runSeedData(): Promise<void> {
    try {
      this.logger.log('🌱 运行种子数据...');
      
      await execAsync('npx prisma db seed');
      
      this.logger.log('✅ 种子数据运行完成');
    } catch (error) {
      this.logger.warn('⚠️ 种子数据运行失败，但继续启动:', error.message);
      // 不抛出错误，允许应用继续启动
    }
  }

  async getInitializationStatus(): Promise<{
    isInitialized: boolean;
    projectCount: number;
    entityCount: number;
    templateCount: number;
  }> {
    try {
      const [projectCount, entityCount, templateCount] = await Promise.all([
        this.prisma.project.count(),
        this.prisma.entity.count(),
        this.prisma.codeTemplate.count(),
      ]);

      return {
        isInitialized: projectCount > 0,
        projectCount,
        entityCount,
        templateCount,
      };
    } catch (error) {
      return {
        isInitialized: false,
        projectCount: 0,
        entityCount: 0,
        templateCount: 0,
      };
    }
  }

  async forceReinitialize(): Promise<void> {
    this.logger.warn('🔄 强制重新初始化数据库...');
    
    try {
      // 清空相关表
      await this.prisma.field.deleteMany();
      await this.prisma.entity.deleteMany();
      await this.prisma.apiConfig.deleteMany();
      await this.prisma.codeTemplate.deleteMany();
      await this.prisma.project.deleteMany();
      
      // 重新运行种子数据
      await this.runSeedData();
      
      this.logger.log('✅ 强制重新初始化完成');
    } catch (error) {
      this.logger.error('❌ 强制重新初始化失败:', error);
      throw error;
    }
  }
}
