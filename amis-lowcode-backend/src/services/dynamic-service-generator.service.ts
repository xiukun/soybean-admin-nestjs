import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@shared/services/prisma.service';
import { ModuleRef } from '@nestjs/core';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface DynamicServiceConfig {
  projectId: string;
  projectName: string;
  entities: DynamicEntityConfig[];
  apiPrefix: string;
  enableAuth: boolean;
  corsOrigin: string[];
}

export interface DynamicEntityConfig {
  id: string;
  name: string;
  code: string;
  tableName: string;
  fields: DynamicFieldConfig[];
  relationships: DynamicRelationshipConfig[];
}

export interface DynamicFieldConfig {
  code: string;
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  validation?: any;
}

export interface DynamicRelationshipConfig {
  type: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';
  targetEntity: string;
  foreignKey?: string;
  mappedBy?: string;
}

@Injectable()
export class DynamicServiceGenerator implements OnModuleInit {
  private readonly logger = new Logger(DynamicServiceGenerator.name);
  private generatedServices = new Map<string, any>();
  private generatedControllers = new Map<string, any>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly moduleRef: ModuleRef,
  ) {}

  async onModuleInit() {
    // 启动时加载所有已部署的项目
    await this.loadDeployedProjects();
  }

  /**
   * 生成动态服务
   */
  async generateDynamicService(config: DynamicServiceConfig): Promise<boolean> {
    try {
      this.logger.log(`Generating dynamic service for project: ${config.projectName}`);

      // 1. 生成服务类
      for (const entity of config.entities) {
        await this.generateEntityService(entity, config);
        await this.generateEntityController(entity, config);
      }

      // 2. 注册路由
      await this.registerDynamicRoutes(config);

      // 3. 更新OpenAPI文档
      await this.updateOpenAPISpec(config);

      this.logger.log(`Successfully generated dynamic service for project: ${config.projectName}`);
      return true;

    } catch (error) {
      this.logger.error(`Failed to generate dynamic service: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * 移除动态服务
   */
  async removeDynamicService(projectId: string): Promise<boolean> {
    try {
      this.logger.log(`Removing dynamic service for project: ${projectId}`);

      // 移除生成的服务和控制器
      this.generatedServices.delete(projectId);
      this.generatedControllers.delete(projectId);

      // 注销路由
      await this.unregisterDynamicRoutes(projectId);

      this.logger.log(`Successfully removed dynamic service for project: ${projectId}`);
      return true;

    } catch (error) {
      this.logger.error(`Failed to remove dynamic service: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * 生成实体服务
   */
  private async generateEntityService(entity: DynamicEntityConfig, config: DynamicServiceConfig) {
    const serviceName = `${this.pascalCase(entity.code)}DynamicService`;
    
    // 创建动态服务类
    const ServiceClass = class {
      constructor(private readonly prisma: PrismaService) {}

      async findAll(query: any = {}) {
        const { page = 1, pageSize = 10, ...filters } = query;
        const skip = (page - 1) * pageSize;
        
        const where = this.buildWhereClause(filters, entity);
        
        const [data, total] = await Promise.all([
          this.prisma[entity.tableName].findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
          }),
          this.prisma[entity.tableName].count({ where }),
        ]);

        return {
          data,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        };
      }

      async findById(id: string) {
        return await this.prisma[entity.tableName].findUnique({
          where: { id },
        });
      }

      async create(data: any) {
        // 数据验证
        const validatedData = this.validateCreateData(data, entity);
        
        return await this.prisma[entity.tableName].create({
          data: {
            ...validatedData,
            id: this.generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'system',
          },
        });
      }

      async update(id: string, data: any) {
        // 检查记录是否存在
        const existing = await this.findById(id);
        if (!existing) {
          throw new Error(`${entity.name} not found`);
        }

        const validatedData = this.validateUpdateData(data, entity);
        
        return await this.prisma[entity.tableName].update({
          where: { id },
          data: {
            ...validatedData,
            updatedAt: new Date(),
            updatedBy: 'system',
          },
        });
      }

      async delete(id: string) {
        // 检查记录是否存在
        const existing = await this.findById(id);
        if (!existing) {
          throw new Error(`${entity.name} not found`);
        }

        await this.prisma[entity.tableName].delete({
          where: { id },
        });

        return { success: true, id };
      }

      async batchCreate(dataList: any[]) {
        const results = [];
        
        for (const data of dataList) {
          try {
            const result = await this.create(data);
            results.push({ success: true, data: result });
          } catch (error) {
            results.push({ success: false, error: error.message, input: data });
          }
        }

        return results;
      }

      async batchDelete(ids: string[]) {
        const results = [];
        
        for (const id of ids) {
          try {
            await this.delete(id);
            results.push({ success: true, id });
          } catch (error) {
            results.push({ success: false, error: error.message, id });
          }
        }

        return results;
      }

      private buildWhereClause(filters: any, entity: DynamicEntityConfig) {
        const where: any = {};
        
        for (const [key, value] of Object.entries(filters)) {
          if (value === undefined || value === null) continue;
          
          const field = entity.fields.find(f => f.code === key);
          if (!field) continue;
          
          // 根据字段类型构建查询条件
          switch (field.type) {
            case 'STRING':
            case 'TEXT':
              if (typeof value === 'string') {
                where[key] = { contains: value, mode: 'insensitive' };
              }
              break;
            case 'INTEGER':
            case 'DECIMAL':
              if (typeof value === 'number') {
                where[key] = value;
              }
              break;
            case 'BOOLEAN':
              if (typeof value === 'boolean') {
                where[key] = value;
              }
              break;
            case 'ENUM':
              if (typeof value === 'string') {
                where[key] = value;
              }
              break;
            default:
              where[key] = value;
          }
        }
        
        return where;
      }

      private validateCreateData(data: any, entity: DynamicEntityConfig) {
        const validated: any = {};
        
        for (const field of entity.fields) {
          const value = data[field.code];
          
          // 检查必填字段
          if (!field.nullable && (value === undefined || value === null)) {
            if (!field.defaultValue) {
              throw new Error(`Field ${field.name} is required`);
            }
            validated[field.code] = field.defaultValue;
            continue;
          }
          
          // 类型验证
          if (value !== undefined && value !== null) {
            validated[field.code] = this.validateFieldValue(value, field);
          }
        }
        
        return validated;
      }

      private validateUpdateData(data: any, entity: DynamicEntityConfig) {
        const validated: any = {};
        
        for (const [key, value] of Object.entries(data)) {
          const field = entity.fields.find(f => f.code === key);
          if (!field) continue;
          
          if (value !== undefined && value !== null) {
            validated[key] = this.validateFieldValue(value, field);
          }
        }
        
        return validated;
      }

      private validateFieldValue(value: any, field: DynamicFieldConfig) {
        // 基础类型验证
        switch (field.type) {
          case 'STRING':
          case 'TEXT':
            if (typeof value !== 'string') {
              throw new Error(`Field ${field.name} must be a string`);
            }
            break;
          case 'INTEGER':
            if (!Number.isInteger(value)) {
              throw new Error(`Field ${field.name} must be an integer`);
            }
            break;
          case 'DECIMAL':
            if (typeof value !== 'number') {
              throw new Error(`Field ${field.name} must be a number`);
            }
            break;
          case 'BOOLEAN':
            if (typeof value !== 'boolean') {
              throw new Error(`Field ${field.name} must be a boolean`);
            }
            break;
        }

        // 自定义验证规则
        if (field.validation) {
          this.applyValidationRules(value, field);
        }

        return value;
      }

      private applyValidationRules(value: any, field: DynamicFieldConfig) {
        const rules = field.validation;
        
        if (rules.pattern && typeof value === 'string') {
          const regex = new RegExp(rules.pattern);
          if (!regex.test(value)) {
            throw new Error(rules.message || `Field ${field.name} format is invalid`);
          }
        }
        
        if (rules.min !== undefined && typeof value === 'number') {
          if (value < rules.min) {
            throw new Error(`Field ${field.name} must be at least ${rules.min}`);
          }
        }
        
        if (rules.max !== undefined && typeof value === 'number') {
          if (value > rules.max) {
            throw new Error(`Field ${field.name} must be at most ${rules.max}`);
          }
        }
      }

      private generateId(): string {
        return `${entity.code.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
    };

    // 注册服务
    const serviceInstance = new ServiceClass(this.prisma);
    this.generatedServices.set(`${config.projectId}-${entity.code}`, serviceInstance);

    return serviceInstance;
  }

  /**
   * 生成实体控制器
   */
  private async generateEntityController(entity: DynamicEntityConfig, config: DynamicServiceConfig) {
    const controllerName = `${this.pascalCase(entity.code)}DynamicController`;
    const serviceName = `${config.projectId}-${entity.code}`;
    
    const ControllerClass = class {
      constructor(private readonly service: any) {}

      async findAll(query: any) {
        const result = await this.service.findAll(query);
        return {
          status: 0,
          msg: 'success',
          data: result,
        };
      }

      async findById(id: string) {
        const result = await this.service.findById(id);
        if (!result) {
          return {
            status: 1,
            msg: `${entity.name} not found`,
            data: null,
          };
        }
        return {
          status: 0,
          msg: 'success',
          data: result,
        };
      }

      async create(data: any) {
        try {
          const result = await this.service.create(data);
          return {
            status: 0,
            msg: 'success',
            data: result,
          };
        } catch (error) {
          return {
            status: 1,
            msg: error.message,
            data: null,
          };
        }
      }

      async update(id: string, data: any) {
        try {
          const result = await this.service.update(id, data);
          return {
            status: 0,
            msg: 'success',
            data: result,
          };
        } catch (error) {
          return {
            status: 1,
            msg: error.message,
            data: null,
          };
        }
      }

      async delete(id: string) {
        try {
          const result = await this.service.delete(id);
          return {
            status: 0,
            msg: 'success',
            data: result,
          };
        } catch (error) {
          return {
            status: 1,
            msg: error.message,
            data: null,
          };
        }
      }

      async batchCreate(dataList: any[]) {
        const results = await this.service.batchCreate(dataList);
        return {
          status: 0,
          msg: 'success',
          data: results,
        };
      }

      async batchDelete(ids: string[]) {
        const results = await this.service.batchDelete(ids);
        return {
          status: 0,
          msg: 'success',
          data: results,
        };
      }
    };

    // 获取服务实例
    const serviceInstance = this.generatedServices.get(serviceName);
    const controllerInstance = new ControllerClass(serviceInstance);
    
    this.generatedControllers.set(`${config.projectId}-${entity.code}`, controllerInstance);

    return controllerInstance;
  }

  /**
   * 注册动态路由
   */
  private async registerDynamicRoutes(config: DynamicServiceConfig) {
    // 这里需要与NestJS的路由系统集成
    // 由于是动态路由，需要特殊处理
    this.logger.log(`Registering dynamic routes for project: ${config.projectName}`);
  }

  /**
   * 注销动态路由
   */
  private async unregisterDynamicRoutes(projectId: string) {
    this.logger.log(`Unregistering dynamic routes for project: ${projectId}`);
  }

  /**
   * 更新OpenAPI规范
   */
  private async updateOpenAPISpec(config: DynamicServiceConfig) {
    this.logger.log(`Updating OpenAPI spec for project: ${config.projectName}`);
  }

  /**
   * 加载已部署的项目
   */
  private async loadDeployedProjects() {
    try {
      // 这里应该从lowcode-platform-backend获取已部署的项目信息
      this.logger.log('Loading deployed projects...');
    } catch (error) {
      this.logger.error('Failed to load deployed projects:', error);
    }
  }

  /**
   * 获取动态服务实例
   */
  getDynamicService(projectId: string, entityCode: string) {
    return this.generatedServices.get(`${projectId}-${entityCode}`);
  }

  /**
   * 获取动态控制器实例
   */
  getDynamicController(projectId: string, entityCode: string) {
    return this.generatedControllers.get(`${projectId}-${entityCode}`);
  }

  // 工具方法
  private pascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
  }
}