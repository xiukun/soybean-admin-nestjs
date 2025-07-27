import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';

// Mock Prisma Service for development
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  // Create a generic mock table function
  private createMockTable(tableName: string, mockData: any[] = []) {
    return {
      findMany: async (args?: any) => {
        this.logger.log(`Mock: ${tableName}.findMany called`);
        return mockData;
      },
      findUnique: async (args: any) => {
        this.logger.log(`Mock: ${tableName}.findUnique called`);
        return mockData.find(item => item.id === args.where.id) || null;
      },
      findFirst: async (args?: any) => {
        this.logger.log(`Mock: ${tableName}.findFirst called`);
        return mockData[0] || null;
      },
      create: async (args: any) => {
        this.logger.log(`Mock: ${tableName}.create called`);
        return {
          id: Date.now().toString(),
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      },
      update: async (args: any) => {
        this.logger.log(`Mock: ${tableName}.update called`);
        return {
          id: args.where.id,
          ...args.data,
          updatedAt: new Date(),
        };
      },
      upsert: async (args: any) => {
        this.logger.log(`Mock: ${tableName}.upsert called`);
        return {
          id: args.where.id || Date.now().toString(),
          ...args.create,
          ...args.update,
          updatedAt: new Date(),
        };
      },
      delete: async (args: any) => {
        this.logger.log(`Mock: ${tableName}.delete called`);
        return { id: args.where.id };
      },
      deleteMany: async (args?: any) => {
        this.logger.log(`Mock: ${tableName}.deleteMany called`);
        return { count: 0 };
      },
      count: async (args?: any) => {
        this.logger.log(`Mock: ${tableName}.count called`);
        return mockData.length;
      },
      aggregate: async (args?: any) => {
        this.logger.log(`Mock: ${tableName}.aggregate called`);
        return {
          _count: { _all: mockData.length },
          _max: { sortOrder: 100 },
          _min: { sortOrder: 1 },
          _avg: { sortOrder: 50 },
          _sum: { sortOrder: 150 }
        };
      },
      groupBy: async (args?: any) => {
        this.logger.log(`Mock: ${tableName}.groupBy called`);
        return [];
      },
    };
  }

  // Mock project data
  project = this.createMockTable('project', [
    {
      id: '1',
      name: 'E-commerce Platform',
      code: 'ecommerce',
      description: '电商平台低代码项目，包含商品管理、订单处理、用户管理等核心功能',
      version: '1.0.0',
      config: {
        framework: 'nestjs',
        architecture: 'base-biz',
        language: 'typescript',
        database: 'postgresql'
      },
      status: 'ACTIVE',
      entityCount: 15,
      templateCount: 8,
      createdBy: 'admin',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      name: 'CRM System',
      code: 'crm',
      description: '客户关系管理系统，帮助企业管理客户信息、销售流程和客户服务',
      version: '1.2.0',
      config: {
        framework: 'nestjs',
        architecture: 'ddd',
        language: 'typescript',
        database: 'postgresql'
      },
      status: 'ACTIVE',
      entityCount: 12,
      templateCount: 6,
      createdBy: 'admin',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-20'),
    },
    {
      id: '3',
      name: 'Blog Management System',
      code: 'blog',
      description: '博客管理系统，支持文章发布、分类管理、评论系统等功能',
      version: '1.0.0',
      config: {
        framework: 'express',
        architecture: 'clean',
        language: 'javascript',
        database: 'mysql'
      },
      status: 'INACTIVE',
      entityCount: 8,
      templateCount: 4,
      createdBy: 'user1',
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-05'),
    },
    {
      id: '4',
      name: 'Inventory Management',
      code: 'inventory',
      description: '库存管理系统，实现商品入库、出库、盘点等库存管理功能',
      version: '2.1.0',
      config: {
        framework: 'nestjs',
        architecture: 'hexagonal',
        language: 'typescript',
        database: 'postgresql'
      },
      status: 'ACTIVE',
      entityCount: 20,
      templateCount: 12,
      createdBy: 'manager',
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-02-10'),
    },
    {
      id: '5',
      name: 'HR Management Portal',
      code: 'hr-portal',
      description: '人力资源管理门户，包含员工信息管理、考勤管理、薪资管理等模块',
      version: '1.5.0',
      config: {
        framework: 'nestjs',
        architecture: 'base-biz',
        language: 'typescript',
        database: 'postgresql'
      },
      status: 'ARCHIVED',
      entityCount: 18,
      templateCount: 10,
      createdBy: 'hr-admin',
      createdAt: new Date('2023-12-01'),
      updatedAt: new Date('2024-01-30'),
    },
  ]);

  // All other tables as empty mock tables
  entity = this.createMockTable('entity');
  field = this.createMockTable('field');
  relation = this.createMockTable('relation');
  apiConfig = this.createMockTable('apiConfig');
  api = this.createMockTable('api');
  lowcodeQuery = this.createMockTable('lowcodeQuery');
  codegenTask = this.createMockTable('codegenTask');
  codeTemplate = this.createMockTable('codeTemplate');
  templateVersion = this.createMockTable('templateVersion');

  // Mock Prisma methods
  $queryRaw = async <T = any>(query: any, ...values: any[]): Promise<T> => {
    this.logger.log('Mock: $queryRaw called');
    return [] as T;
  };

  $queryRawUnsafe = async <T = any>(query: string, ...values: any[]): Promise<T> => {
    this.logger.log('Mock: $queryRawUnsafe called');
    return [] as T;
  };

  async $executeRaw(query: any) {
    this.logger.log('Mock: $executeRaw called');
    return 0;
  }

  async $transaction(fn: any) {
    this.logger.log('Mock: $transaction called');
    return await fn(this);
  }

  async onModuleInit() {
    this.logger.log('Mock PrismaService initialized');
  }

  async onModuleDestroy() {
    this.logger.log('Mock PrismaService destroyed');
  }

  async enableShutdownHooks(app: any) {
    // Mock implementation
  }

  async $connect() {
    this.logger.log('Mock: $connect called');
  }

  async $disconnect() {
    this.logger.log('Mock: $disconnect called');
  }
}
