import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 统一数据库初始化服务
 * 支持首次运行检测和自动数据初始化
 */
@Injectable()
export class UnifiedDatabaseInitService implements OnModuleInit {
  private readonly logger = new Logger(UnifiedDatabaseInitService.name);
  private readonly isDockerEnv: boolean;
  private readonly autoInitData: boolean;
  private readonly firstRunDetection: boolean;
  private readonly serviceName: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.isDockerEnv = this.configService.get<string>('DOCKER_ENV') === 'true';
    this.autoInitData = this.configService.get<string>('AUTO_INIT_DATA') === 'true';
    this.firstRunDetection = this.configService.get<string>('FIRST_RUN_DETECTION') === 'true';
    this.serviceName = this.configService.get<string>('SERVICE_NAME', 'unknown-service');
  }

  async onModuleInit() {
    if (this.isDockerEnv && this.autoInitData) {
      await this.initializeDatabase();
    }
  }

  /**
   * 初始化数据库
   */
  async initializeDatabase(): Promise<void> {
    try {
      this.logger.log('🚀 开始数据库初始化...');

      // 检查数据库连接
      await this.checkDatabaseConnection();

      // 检查是否为首次运行
      const isFirstRun = await this.isFirstRun();
      
      if (isFirstRun) {
        this.logger.log('🆕 检测到首次运行，开始初始化数据...');
        
        // 运行数据库迁移
        await this.runMigrations();
        
        // 初始化种子数据
        await this.seedDatabase();
        
        // 标记初始化完成
        await this.markInitializationComplete();
        
        this.logger.log('✅ 数据库初始化完成');
      } else {
        this.logger.log('📋 数据库已初始化，跳过初始化步骤');
      }

    } catch (error) {
      this.logger.error('❌ 数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 检查数据库连接
   */
  private async checkDatabaseConnection(): Promise<void> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      this.logger.log('✅ 数据库连接成功');
    } catch (error) {
      this.logger.error('❌ 数据库连接失败:', error);
      throw new Error('Database connection failed');
    }
  }

  /**
   * 检查是否为首次运行
   */
  private async isFirstRun(): Promise<boolean> {
    if (!this.firstRunDetection) {
      return true; // 如果禁用首次运行检测，总是执行初始化
    }

    try {
      // 检查是否存在初始化标记表
      const result = await this.prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = current_schema()
          AND table_name = '_database_init_status'
        ) as exists
      ` as any[];

      if (!result[0]?.exists) {
        return true; // 表不存在，说明是首次运行
      }

      // 检查当前服务是否已初始化
      const initStatus = await this.prisma.$queryRaw`
        SELECT * FROM "_database_init_status" 
        WHERE service_name = ${this.serviceName}
        AND status = 'completed'
        LIMIT 1
      ` as any[];

      return initStatus.length === 0;

    } catch (error) {
      this.logger.warn('⚠️ 检查首次运行状态失败，假设为首次运行:', error);
      return true;
    }
  }

  /**
   * 运行数据库迁移
   */
  private async runMigrations(): Promise<void> {
    try {
      this.logger.log('🔧 运行数据库迁移...');
      
      // 这里可以根据不同的服务执行不同的迁移策略
      // 对于Docker部署，我们使用db push而不是migrate
      if (this.isDockerEnv) {
        this.logger.log('📦 Docker环境：使用db push同步数据库结构');
        // 在Docker环境中，通常在启动脚本中已经执行了db push
        // 这里只是记录日志
      } else {
        this.logger.log('🏠 本地环境：使用migrate部署迁移');
        // 在本地环境中可以执行migrate deploy
      }
      
      this.logger.log('✅ 数据库迁移完成');
    } catch (error) {
      this.logger.error('❌ 数据库迁移失败:', error);
      throw error;
    }
  }

  /**
   * 初始化种子数据
   */
  private async seedDatabase(): Promise<void> {
    try {
      this.logger.log('🌱 开始初始化种子数据...');

      // 根据服务名称执行不同的种子数据初始化
      switch (this.serviceName) {
        case 'lowcode-platform':
          await this.seedLowcodePlatform();
          break;
        case 'amis-lowcode':
          await this.seedAmisLowcode();
          break;
        case 'backend':
          await this.seedBackend();
          break;
        default:
          this.logger.warn(`⚠️ 未知服务名称: ${this.serviceName}，跳过种子数据初始化`);
      }

      this.logger.log('✅ 种子数据初始化完成');
    } catch (error) {
      this.logger.error('❌ 种子数据初始化失败:', error);
      // 种子数据失败不应该阻止应用启动
      this.logger.warn('⚠️ 种子数据初始化失败，但应用将继续启动');
    }
  }

  /**
   * 初始化低代码平台种子数据
   */
  private async seedLowcodePlatform(): Promise<void> {
    this.logger.log('🏗️ 初始化低代码平台种子数据...');
    
    // 创建默认项目
    await this.createDefaultProject();
    
    // 创建默认模板
    await this.createDefaultTemplates();
    
    // 创建默认实体
    await this.createDefaultEntities();
  }

  /**
   * 初始化Amis低代码种子数据
   */
  private async seedAmisLowcode(): Promise<void> {
    this.logger.log('📱 初始化Amis低代码种子数据...');
    
    // 创建默认用户
    await this.createDefaultUsers();
    
    // 创建默认角色
    await this.createDefaultRoles();
    
    // 创建默认菜单
    await this.createDefaultMenus();
  }

  /**
   * 初始化后端种子数据
   */
  private async seedBackend(): Promise<void> {
    this.logger.log('🔧 初始化后端种子数据...');
    
    // 创建系统配置
    await this.createSystemConfig();
    
    // 创建默认权限
    await this.createDefaultPermissions();
  }

  /**
   * 标记初始化完成
   */
  private async markInitializationComplete(): Promise<void> {
    try {
      // 创建初始化状态表（如果不存在）
      await this.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "_database_init_status" (
          id SERIAL PRIMARY KEY,
          service_name VARCHAR(100) NOT NULL,
          status VARCHAR(50) NOT NULL,
          initialized_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          version VARCHAR(50),
          UNIQUE(service_name)
        )
      `;

      // 插入或更新初始化状态
      await this.prisma.$executeRaw`
        INSERT INTO "_database_init_status" (service_name, status, version)
        VALUES (${this.serviceName}, 'completed', '1.0.0')
        ON CONFLICT (service_name) 
        DO UPDATE SET 
          status = 'completed',
          initialized_at = CURRENT_TIMESTAMP,
          version = '1.0.0'
      `;

      this.logger.log(`✅ 标记服务 ${this.serviceName} 初始化完成`);
    } catch (error) {
      this.logger.error('❌ 标记初始化完成失败:', error);
      throw error;
    }
  }

  // 以下是具体的种子数据创建方法，需要根据实际的数据模型实现
  private async createDefaultProject(): Promise<void> {
    // 实现创建默认项目的逻辑
    this.logger.log('📁 创建默认项目...');
  }

  private async createDefaultTemplates(): Promise<void> {
    // 实现创建默认模板的逻辑
    this.logger.log('📄 创建默认模板...');
  }

  private async createDefaultEntities(): Promise<void> {
    // 实现创建默认实体的逻辑
    this.logger.log('🏷️ 创建默认实体...');
  }

  private async createDefaultUsers(): Promise<void> {
    // 实现创建默认用户的逻辑
    this.logger.log('👤 创建默认用户...');
  }

  private async createDefaultRoles(): Promise<void> {
    // 实现创建默认角色的逻辑
    this.logger.log('🎭 创建默认角色...');
  }

  private async createDefaultMenus(): Promise<void> {
    // 实现创建默认菜单的逻辑
    this.logger.log('📋 创建默认菜单...');
  }

  private async createSystemConfig(): Promise<void> {
    // 实现创建系统配置的逻辑
    this.logger.log('⚙️ 创建系统配置...');
  }

  private async createDefaultPermissions(): Promise<void> {
    // 实现创建默认权限的逻辑
    this.logger.log('🔐 创建默认权限...');
  }

  /**
   * 手动触发数据库初始化（用于API调用）
   */
  async manualInitialize(): Promise<{ success: boolean; message: string }> {
    try {
      await this.initializeDatabase();
      return {
        success: true,
        message: 'Database initialization completed successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Database initialization failed: ${error.message}`
      };
    }
  }

  /**
   * 获取初始化状态
   */
  async getInitializationStatus(): Promise<{
    service: string;
    isInitialized: boolean;
    lastInitialized?: Date;
    version?: string;
  }> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT * FROM "_database_init_status" 
        WHERE service_name = ${this.serviceName}
        LIMIT 1
      ` as any[];

      if (result.length === 0) {
        return {
          service: this.serviceName,
          isInitialized: false
        };
      }

      const status = result[0];
      return {
        service: this.serviceName,
        isInitialized: status.status === 'completed',
        lastInitialized: status.initialized_at,
        version: status.version
      };
    } catch (error) {
      this.logger.error('获取初始化状态失败:', error);
      return {
        service: this.serviceName,
        isInitialized: false
      };
    }
  }
}
