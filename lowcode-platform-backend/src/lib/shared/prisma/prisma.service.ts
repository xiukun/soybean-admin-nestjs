import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';

// Fallback Prisma Service with mock data
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    this.logger.log('PrismaService initialized with mock data');
  }

  async onModuleDestroy() {
    this.logger.log('PrismaService destroyed');
  }

  // Mock project table with sample data
  project = {
    findMany: async () => {
      this.logger.log('Mock: project.findMany called');
      return [
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
          createdBy: 'hr-admin',
          createdAt: new Date('2023-12-01'),
          updatedAt: new Date('2024-01-30'),
        },
      ];
    },
    findUnique: async (args: any) => {
      this.logger.log('Mock: project.findUnique called');
      const projects = await this.project.findMany();
      return projects.find(p => p.id === args.where.id) || null;
    },
    findFirst: async () => {
      this.logger.log('Mock: project.findFirst called');
      const projects = await this.project.findMany();
      return projects[0] || null;
    },
    create: async (args: any) => {
      this.logger.log('Mock: project.create called');
      return {
        id: Date.now().toString(),
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
    update: async (args: any) => {
      this.logger.log('Mock: project.update called');
      return {
        id: args.where.id,
        ...args.data,
        updatedAt: new Date(),
      };
    },
    delete: async (args: any) => {
      this.logger.log('Mock: project.delete called');
      return { id: args.where.id };
    },
    count: async () => {
      this.logger.log('Mock: project.count called');
      const projects = await this.project.findMany();
      return projects.length;
    }
  };

  // Mock other tables
  entity = { findMany: async () => [], findUnique: async () => null, create: async (args: any) => ({ id: '1', ...args.data }) };
  field = { findMany: async () => [], findUnique: async () => null, create: async (args: any) => ({ id: '1', ...args.data }) };
  relation = { findMany: async () => [], findUnique: async () => null, create: async (args: any) => ({ id: '1', ...args.data }) };
  apiConfig = { findMany: async () => [], findUnique: async () => null, create: async (args: any) => ({ id: '1', ...args.data }) };
  api = { findMany: async () => [], findUnique: async () => null, create: async (args: any) => ({ id: '1', ...args.data }) };
  lowcodeQuery = { findMany: async () => [], findUnique: async () => null, create: async (args: any) => ({ id: '1', ...args.data }) };
  codegenTask = { findMany: async () => [], findUnique: async () => null, create: async (args: any) => ({ id: '1', ...args.data }) };
  codeTemplate = { findMany: async () => [], findUnique: async () => null, create: async (args: any) => ({ id: '1', ...args.data }) };
  templateVersion = { findMany: async () => [], findUnique: async () => null, create: async (args: any) => ({ id: '1', ...args.data }) };

  // Mock Prisma methods
  $queryRaw = async <T = any>(): Promise<T> => [] as T;
  $queryRawUnsafe = async <T = any>(): Promise<T> => [] as T;
  $executeRaw = async () => 0;
  $transaction = async (fn: any) => await fn(this);
  $connect = async () => {};
  $disconnect = async () => {};
}
