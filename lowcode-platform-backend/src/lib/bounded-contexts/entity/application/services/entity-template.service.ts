import { Injectable } from '@nestjs/common';
import { FieldDataType } from '@lib/bounded-contexts/field/domain/field.model';
import { CommonFieldService, CommonFieldDefinition } from './common-field.service';

export interface EntityTemplate {
  id: string;
  name: string;
  code: string;
  description: string;
  category: 'BUSINESS' | 'SYSTEM' | 'REFERENCE';
  icon?: string;
  fields: EntityTemplateField[];
  tags: string[];
  isBuiltIn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EntityTemplateField {
  name: string;
  code: string;
  dataType: FieldDataType;
  required: boolean;
  unique: boolean;
  defaultValue?: string;
  description: string;
  displayOrder: number;
  length?: number;
  precision?: number;
  options?: string[]; // 用于枚举类型
}

export interface CreateEntityFromTemplateRequest {
  templateId: string;
  entityName: string;
  entityCode: string;
  projectId: string;
  customizations?: {
    includeCommonFields: boolean;
    fieldCustomizations: {
      fieldCode: string;
      name?: string;
      required?: boolean;
      defaultValue?: string;
    }[];
    additionalFields: EntityTemplateField[];
  };
}

@Injectable()
export class EntityTemplateService {
  constructor(private readonly commonFieldService: CommonFieldService) {}

  /**
   * 获取所有内置实体模板
   */
  getBuiltInTemplates(): EntityTemplate[] {
    return [
      {
        id: 'user-template',
        name: '用户实体',
        code: 'User',
        description: '标准用户实体模板，包含基本用户信息字段',
        category: 'BUSINESS',
        icon: 'user',
        tags: ['用户管理', '认证', '基础'],
        isBuiltIn: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        fields: [
          {
            name: '用户名',
            code: 'username',
            dataType: FieldDataType.STRING,
            required: true,
            unique: true,
            description: '用户登录名',
            displayOrder: 1,
            length: 50,
          },
          {
            name: '邮箱',
            code: 'email',
            dataType: FieldDataType.STRING,
            required: true,
            unique: true,
            description: '用户邮箱地址',
            displayOrder: 2,
            length: 100,
          },
          {
            name: '手机号',
            code: 'phone',
            dataType: FieldDataType.STRING,
            required: false,
            unique: true,
            description: '用户手机号码',
            displayOrder: 3,
            length: 20,
          },
          {
            name: '真实姓名',
            code: 'realName',
            dataType: FieldDataType.STRING,
            required: false,
            unique: false,
            description: '用户真实姓名',
            displayOrder: 4,
            length: 50,
          },
          {
            name: '头像',
            code: 'avatar',
            dataType: FieldDataType.STRING,
            required: false,
            unique: false,
            description: '用户头像URL',
            displayOrder: 5,
            length: 255,
          },
          {
            name: '状态',
            code: 'status',
            dataType: FieldDataType.STRING,
            required: true,
            unique: false,
            defaultValue: 'ACTIVE',
            description: '用户状态',
            displayOrder: 6,
            length: 20,
            options: ['ACTIVE', 'INACTIVE', 'LOCKED', 'DELETED'],
          },
        ],
      },
      {
        id: 'product-template',
        name: '商品实体',
        code: 'Product',
        description: '电商商品实体模板，包含商品基本信息和价格字段',
        category: 'BUSINESS',
        icon: 'shopping-bag',
        tags: ['电商', '商品管理', '库存'],
        isBuiltIn: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        fields: [
          {
            name: '商品名称',
            code: 'name',
            dataType: FieldDataType.STRING,
            required: true,
            unique: false,
            description: '商品名称',
            displayOrder: 1,
            length: 200,
          },
          {
            name: '商品编码',
            code: 'sku',
            dataType: FieldDataType.STRING,
            required: true,
            unique: true,
            description: '商品SKU编码',
            displayOrder: 2,
            length: 50,
          },
          {
            name: '商品描述',
            code: 'description',
            dataType: FieldDataType.TEXT,
            required: false,
            unique: false,
            description: '商品详细描述',
            displayOrder: 3,
          },
          {
            name: '价格',
            code: 'price',
            dataType: FieldDataType.DECIMAL,
            required: true,
            unique: false,
            description: '商品价格',
            displayOrder: 4,
            precision: 10,
          },
          {
            name: '库存数量',
            code: 'stock',
            dataType: FieldDataType.INTEGER,
            required: true,
            unique: false,
            defaultValue: '0',
            description: '库存数量',
            displayOrder: 5,
          },
          {
            name: '分类',
            code: 'category',
            dataType: FieldDataType.STRING,
            required: true,
            unique: false,
            description: '商品分类',
            displayOrder: 6,
            length: 50,
          },
          {
            name: '商品图片',
            code: 'images',
            dataType: FieldDataType.JSON,
            required: false,
            unique: false,
            description: '商品图片URL列表',
            displayOrder: 7,
          },
          {
            name: '上架状态',
            code: 'status',
            dataType: FieldDataType.STRING,
            required: true,
            unique: false,
            defaultValue: 'DRAFT',
            description: '商品上架状态',
            displayOrder: 8,
            length: 20,
            options: ['DRAFT', 'PUBLISHED', 'OFFLINE', 'DELETED'],
          },
        ],
      },
      {
        id: 'order-template',
        name: '订单实体',
        code: 'Order',
        description: '电商订单实体模板，包含订单基本信息和状态管理',
        category: 'BUSINESS',
        icon: 'file-text',
        tags: ['电商', '订单管理', '交易'],
        isBuiltIn: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        fields: [
          {
            name: '订单号',
            code: 'orderNo',
            dataType: FieldDataType.STRING,
            required: true,
            unique: true,
            description: '订单唯一编号',
            displayOrder: 1,
            length: 50,
          },
          {
            name: '用户ID',
            code: 'userId',
            dataType: FieldDataType.STRING,
            required: true,
            unique: false,
            description: '下单用户ID',
            displayOrder: 2,
            length: 36,
          },
          {
            name: '订单总金额',
            code: 'totalAmount',
            dataType: FieldDataType.DECIMAL,
            required: true,
            unique: false,
            description: '订单总金额',
            displayOrder: 3,
            precision: 10,
          },
          {
            name: '实付金额',
            code: 'paidAmount',
            dataType: FieldDataType.DECIMAL,
            required: true,
            unique: false,
            description: '实际支付金额',
            displayOrder: 4,
            precision: 10,
          },
          {
            name: '订单状态',
            code: 'status',
            dataType: FieldDataType.STRING,
            required: true,
            unique: false,
            defaultValue: 'PENDING',
            description: '订单状态',
            displayOrder: 5,
            length: 20,
            options: ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
          },
          {
            name: '收货地址',
            code: 'shippingAddress',
            dataType: FieldDataType.JSON,
            required: true,
            unique: false,
            description: '收货地址信息',
            displayOrder: 6,
          },
          {
            name: '订单备注',
            code: 'remark',
            dataType: FieldDataType.TEXT,
            required: false,
            unique: false,
            description: '订单备注信息',
            displayOrder: 7,
          },
          {
            name: '下单时间',
            code: 'orderTime',
            dataType: FieldDataType.DATETIME,
            required: true,
            unique: false,
            defaultValue: 'now()',
            description: '下单时间',
            displayOrder: 8,
          },
        ],
      },
      {
        id: 'department-template',
        name: '部门实体',
        code: 'Department',
        description: '组织架构部门实体模板，支持树形结构',
        category: 'SYSTEM',
        icon: 'sitemap',
        tags: ['组织架构', '部门管理', '层级'],
        isBuiltIn: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        fields: [
          {
            name: '部门名称',
            code: 'name',
            dataType: FieldDataType.STRING,
            required: true,
            unique: false,
            description: '部门名称',
            displayOrder: 1,
            length: 100,
          },
          {
            name: '部门编码',
            code: 'code',
            dataType: FieldDataType.STRING,
            required: true,
            unique: true,
            description: '部门编码',
            displayOrder: 2,
            length: 50,
          },
          {
            name: '上级部门ID',
            code: 'parentId',
            dataType: FieldDataType.STRING,
            required: false,
            unique: false,
            description: '上级部门ID，根部门为空',
            displayOrder: 3,
            length: 36,
          },
          {
            name: '部门层级',
            code: 'level',
            dataType: FieldDataType.INTEGER,
            required: true,
            unique: false,
            defaultValue: '1',
            description: '部门层级，从1开始',
            displayOrder: 4,
          },
          {
            name: '排序',
            code: 'sort',
            dataType: FieldDataType.INTEGER,
            required: true,
            unique: false,
            defaultValue: '0',
            description: '同级部门排序',
            displayOrder: 5,
          },
          {
            name: '部门描述',
            code: 'description',
            dataType: FieldDataType.TEXT,
            required: false,
            unique: false,
            description: '部门描述信息',
            displayOrder: 6,
          },
          {
            name: '负责人ID',
            code: 'managerId',
            dataType: FieldDataType.STRING,
            required: false,
            unique: false,
            description: '部门负责人用户ID',
            displayOrder: 7,
            length: 36,
          },
          {
            name: '状态',
            code: 'status',
            dataType: FieldDataType.STRING,
            required: true,
            unique: false,
            defaultValue: 'ACTIVE',
            description: '部门状态',
            displayOrder: 8,
            length: 20,
            options: ['ACTIVE', 'INACTIVE', 'DELETED'],
          },
        ],
      },
    ];
  }

  /**
   * 根据分类获取模板
   */
  getTemplatesByCategory(category: 'BUSINESS' | 'SYSTEM' | 'REFERENCE'): EntityTemplate[] {
    return this.getBuiltInTemplates().filter(template => template.category === category);
  }

  /**
   * 根据标签搜索模板
   */
  searchTemplatesByTags(tags: string[]): EntityTemplate[] {
    return this.getBuiltInTemplates().filter(template => 
      tags.some(tag => template.tags.includes(tag))
    );
  }

  /**
   * 根据ID获取模板
   */
  getTemplateById(templateId: string): EntityTemplate | null {
    return this.getBuiltInTemplates().find(template => template.id === templateId) || null;
  }

  /**
   * 从模板创建实体字段定义
   */
  createEntityFromTemplate(request: CreateEntityFromTemplateRequest): {
    entityName: string;
    entityCode: string;
    fields: EntityTemplateField[];
  } {
    const template = this.getTemplateById(request.templateId);
    if (!template) {
      throw new Error(`模板不存在: ${request.templateId}`);
    }

    let fields: EntityTemplateField[] = [...template.fields];

    // 应用字段自定义
    if (request.customizations?.fieldCustomizations) {
      for (const customization of request.customizations.fieldCustomizations) {
        const fieldIndex = fields.findIndex(f => f.code === customization.fieldCode);
        if (fieldIndex >= 0) {
          if (customization.name) {
            fields[fieldIndex].name = customization.name;
          }
          if (customization.required !== undefined) {
            fields[fieldIndex].required = customization.required;
          }
          if (customization.defaultValue !== undefined) {
            fields[fieldIndex].defaultValue = customization.defaultValue;
          }
        }
      }
    }

    // 添加额外字段
    if (request.customizations?.additionalFields) {
      const maxOrder = Math.max(...fields.map(f => f.displayOrder));
      const additionalFields = request.customizations.additionalFields.map((field, index) => ({
        ...field,
        displayOrder: maxOrder + index + 1,
      }));
      fields.push(...additionalFields);
    }

    // 添加通用字段
    if (request.customizations?.includeCommonFields !== false) {
      const commonFields = this.commonFieldService.getCommonFieldDefinitions();
      const commonTemplateFields: EntityTemplateField[] = commonFields.map(cf => ({
        name: cf.name,
        code: cf.code,
        dataType: cf.dataType,
        required: cf.required,
        unique: cf.unique,
        defaultValue: cf.defaultValue,
        description: cf.comment,
        displayOrder: cf.displayOrder,
        length: cf.length,
        precision: cf.precision,
      }));
      
      // 将通用字段插入到开头
      fields = [...commonTemplateFields, ...fields.map(f => ({
        ...f,
        displayOrder: f.displayOrder + commonTemplateFields.length,
      }))];
    }

    return {
      entityName: request.entityName,
      entityCode: request.entityCode,
      fields,
    };
  }

  /**
   * 验证模板字段的完整性
   */
  validateTemplate(template: EntityTemplate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 验证基本信息
    if (!template.name || template.name.trim().length === 0) {
      errors.push('模板名称不能为空');
    }

    if (!template.code || template.code.trim().length === 0) {
      errors.push('模板代码不能为空');
    }

    // 验证字段
    if (!template.fields || template.fields.length === 0) {
      errors.push('模板必须包含至少一个字段');
    } else {
      // 检查字段代码唯一性
      const fieldCodes = template.fields.map(f => f.code);
      const duplicateCodes = fieldCodes.filter((code, index) => fieldCodes.indexOf(code) !== index);
      if (duplicateCodes.length > 0) {
        errors.push(`模板字段代码重复: ${duplicateCodes.join(', ')}`);
      }

      // 检查字段名称
      for (const field of template.fields) {
        if (!field.name || field.name.trim().length === 0) {
          errors.push(`字段 ${field.code} 的名称不能为空`);
        }
        if (!field.code || field.code.trim().length === 0) {
          errors.push('字段代码不能为空');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 获取模板使用统计
   */
  getTemplateUsageStats(): { templateId: string; name: string; usageCount: number }[] {
    // 这里应该从数据库查询实际使用统计
    // 目前返回模拟数据
    return this.getBuiltInTemplates().map(template => ({
      templateId: template.id,
      name: template.name,
      usageCount: Math.floor(Math.random() * 100), // 模拟使用次数
    }));
  }

  /**
   * 获取推荐模板
   */
  getRecommendedTemplates(projectType?: string): EntityTemplate[] {
    const allTemplates = this.getBuiltInTemplates();
    
    // 根据项目类型推荐模板
    if (projectType === 'ecommerce') {
      return allTemplates.filter(t => 
        t.tags.includes('电商') || t.tags.includes('商品管理') || t.tags.includes('订单管理')
      );
    }
    
    if (projectType === 'cms') {
      return allTemplates.filter(t => 
        t.tags.includes('内容管理') || t.tags.includes('用户管理')
      );
    }
    
    if (projectType === 'hr') {
      return allTemplates.filter(t => 
        t.tags.includes('组织架构') || t.tags.includes('用户管理')
      );
    }
    
    // 默认推荐最常用的模板
    return allTemplates.filter(t => t.tags.includes('基础'));
  }
}