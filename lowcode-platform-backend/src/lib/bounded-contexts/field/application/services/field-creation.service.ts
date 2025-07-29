import { Injectable, Inject } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Field, FieldDataType } from '@lib/bounded-contexts/field/domain/field.model';
import { FieldRepository } from '@lib/bounded-contexts/field/domain/field.repository';
import { CreateFieldCommand } from '@lib/bounded-contexts/field/application/commands/create-field.command';
import { CommonFieldService, CommonFieldDefinition } from '@lib/bounded-contexts/entity/application/services/common-field.service';

export interface CreateFieldRequest {
  entityId: string;
  name: string;
  code: string;
  dataType: FieldDataType;
  required?: boolean;
  unique?: boolean;
  defaultValue?: string;
  description?: string;
  displayOrder?: number;
  createdBy: string;
}

@Injectable()
export class FieldCreationService {
  constructor(
    @Inject('FieldRepository')
    private readonly fieldRepository: FieldRepository,
    private readonly commandBus: CommandBus,
    private readonly commonFieldService: CommonFieldService,
  ) {}

  /**
   * 为实体创建通用字段
   */
  async createCommonFieldsForEntity(entityId: string, createdBy: string): Promise<Field[]> {
    const commonFieldDefinitions = this.commonFieldService.getCommonFieldDefinitions();
    const createdFields: Field[] = [];

    for (const fieldDef of commonFieldDefinitions) {
      try {
        const createFieldRequest: CreateFieldRequest = {
          entityId,
          name: fieldDef.name,
          code: fieldDef.code,
          dataType: fieldDef.dataType,
          required: fieldDef.required,
          unique: fieldDef.unique,
          defaultValue: fieldDef.defaultValue,
          description: fieldDef.comment,
          displayOrder: fieldDef.displayOrder,
          createdBy,
        };

        const field = await this.createField(createFieldRequest);
        createdFields.push(field);
      } catch (error) {
        // 记录错误但继续创建其他字段
        console.error(`创建通用字段失败 [${fieldDef.code}]:`, error.message);
        throw new Error(`创建通用字段 '${fieldDef.name}' 失败: ${error.message}`);
      }
    }

    return createdFields;
  }

  /**
   * 创建单个字段
   */
  async createField(request: CreateFieldRequest): Promise<Field> {
    // 验证字段代码唯一性
    const existingField = await this.fieldRepository.findByCode(request.entityId, request.code);
    if (existingField) {
      throw new Error(`字段代码 '${request.code}' 在该实体中已存在`);
    }

    // 创建字段
    const field = Field.create({
      entityId: request.entityId,
      name: request.name,
      code: request.code,
      dataType: request.dataType,
      required: request.required ?? false,
      unique: request.unique ?? false,
      defaultValue: request.defaultValue,
      description: request.description,
      displayOrder: request.displayOrder ?? 0,
      createdBy: request.createdBy,
    });

    // 保存字段
    return await this.fieldRepository.save(field);
  }

  /**
   * 批量创建字段
   */
  async createFieldsBatch(requests: CreateFieldRequest[]): Promise<Field[]> {
    const createdFields: Field[] = [];

    for (const request of requests) {
      try {
        const field = await this.createField(request);
        createdFields.push(field);
      } catch (error) {
        console.error(`创建字段失败 [${request.code}]:`, error.message);
        throw new Error(`创建字段 '${request.name}' 失败: ${error.message}`);
      }
    }

    return createdFields;
  }

  /**
   * 验证业务字段列表
   */
  validateBusinessFields(fields: CreateFieldRequest[]): void {
    for (const field of fields) {
      // 检查是否与通用字段冲突
      this.commonFieldService.validateBusinessFieldConflict(field.code);
      
      // 验证字段代码格式
      const codeRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
      if (!codeRegex.test(field.code)) {
        throw new Error(`字段代码格式不正确: ${field.code}`);
      }

      // 验证字段名称
      if (!field.name || field.name.trim().length === 0) {
        throw new Error(`字段名称不能为空: ${field.code}`);
      }
    }

    // 检查业务字段之间的代码重复
    const fieldCodes = fields.map(f => f.code);
    const duplicates = fieldCodes.filter((code, index) => fieldCodes.indexOf(code) !== index);
    if (duplicates.length > 0) {
      throw new Error(`业务字段代码重复: ${duplicates.join(', ')}`);
    }
  }
}