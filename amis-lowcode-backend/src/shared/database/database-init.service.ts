import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
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
    
    if (autoInit === 'true') {
      await this.initializeDatabase();
    }
  }

  async initializeDatabase(): Promise<void> {
    try {
      this.logger.log('🔍 检查amis数据库初始化状态...');

      // 检查数据库连接
      await this.checkDatabaseConnection();

      // 检查是否需要初始化
      const needsInit = await this.checkIfInitializationNeeded();

      if (needsInit) {
        this.logger.log('🚀 开始amis数据库初始化...');
        
        // 运行Prisma迁移
        await this.runPrismaMigrations();
        
        // 运行种子数据
        await this.runSeedData();
        
        this.logger.log('✅ amis数据库初始化完成');
      } else {
        this.logger.log('📋 amis数据库已初始化，跳过初始化步骤');
      }
    } catch (error) {
      this.logger.error('❌ amis数据库初始化失败:', error);
      throw error;
    }
  }

  private async checkDatabaseConnection(): Promise<void> {
    try {
      await this.prisma.$connect();
      this.logger.log('✅ amis数据库连接成功');
    } catch (error) {
      this.logger.error('❌ amis数据库连接失败:', error);
      throw new Error('Amis database connection failed');
    }
  }

  private async checkIfInitializationNeeded(): Promise<boolean> {
    try {
      // 检查是否存在用户表和数据
      const userCount = await this.prisma.user.count();
      return userCount === 0;
    } catch (error) {
      // 如果表不存在，说明需要初始化
      this.logger.log('📋 amis数据库表不存在，需要初始化');
      return true;
    }
  }

  private async runPrismaMigrations(): Promise<void> {
    try {
      this.logger.log('🔧 运行amis Prisma迁移...');
      
      const isDocker = this.configService.get<string>('DOCKER_ENV', 'false');
      
      if (isDocker === 'true') {
        // Docker环境使用db push
        await execAsync('npx prisma db push --accept-data-loss');
      } else {
        // 非Docker环境使用migrate deploy
        await execAsync('npx prisma migrate deploy');
      }
      
      this.logger.log('✅ amis Prisma迁移完成');
    } catch (error) {
      this.logger.error('❌ amis Prisma迁移失败:', error);
      throw error;
    }
  }

  private async runSeedData(): Promise<void> {
    try {
      this.logger.log('🌱 运行amis种子数据...');
      
      await execAsync('npx prisma db seed');
      
      this.logger.log('✅ amis种子数据运行完成');
    } catch (error) {
      this.logger.warn('⚠️ amis种子数据运行失败，但继续启动:', error.message);
      // 不抛出错误，允许应用继续启动
    }
  }

  async getInitializationStatus(): Promise<{
    isInitialized: boolean;
    userCount: number;
    roleCount: number;
    templateCount: number;
  }> {
    try {
      const [userCount, roleCount, templateCount] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.role.count(),
        this.prisma.pageTemplate.count(),
      ]);

      return {
        isInitialized: userCount > 0,
        userCount,
        roleCount,
        templateCount,
      };
    } catch (error) {
      return {
        isInitialized: false,
        userCount: 0,
        roleCount: 0,
        templateCount: 0,
      };
    }
  }

  async forceReinitialize(): Promise<void> {
    this.logger.warn('🔄 强制重新初始化amis数据库...');
    
    try {
      // 清空相关表
      await this.prisma.userRole.deleteMany();
      await this.prisma.pageTemplate.deleteMany();
      await this.prisma.role.deleteMany();
      await this.prisma.user.deleteMany();
      
      // 重新运行种子数据
      await this.runSeedData();
      
      this.logger.log('✅ amis强制重新初始化完成');
    } catch (error) {
      this.logger.error('❌ amis强制重新初始化失败:', error);
      throw error;
    }
  }
}
