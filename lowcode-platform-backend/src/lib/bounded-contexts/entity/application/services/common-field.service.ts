import { Injectable } from '@nestjs/common';
import { FieldDataType } from '@lib/bounded-contexts/field/domain/field.model';

// 通用字段定义接口
export interface CommonFieldDefinition {
  name: string;
  code: string;
  dataType: FieldDataType;
  required: boolean;
  unique: boolean;
  defaultValue?: string;
  comment: string;
  displayOrder: number;
  isCommon: boolean;
}

@Injectable()
export class CommonFieldService {
  /**
   * 获取通用字段定义
   */
  getCommonFieldDefinitions(): CommonFieldDefinition[] {
    return [
      {
        name: '主键',
        code: 'id',
        dataType: FieldDataType.STRING,
        required: true,
        unique: true,
        defaultValue: 'gen_random_uuid()',
        comment: '实体唯一标识符',
        displayOrder: 1,
        isCommon: true,
      },
      {
        name: '创建者',
        code: 'createdBy',
        dataType: FieldDataType.STRING,
        required: true,
        unique: false,
        comment: '记录创建者用户ID',
        displayOrder: 2,
        isCommon: true,
      },
      {
        name: '创建时间',
        code: 'createdAt',
        dataType: FieldDataType.DATETIME,
        required: true,
        unique: false,
        defaultValue: 'now()',
        comment: '记录创建时间戳',
        displayOrder: 3,
        isCommon: true,
      },
      {
        name: '更新者',
        code: 'updatedBy',
        dataType: FieldDataType.STRING,
        required: false,
        unique: false,
        comment: '记录最后更新者用户ID',
        displayOrder: 4,
        isCommon: true,
      },
      {
        name: '更新时间',
        code: 'updatedAt',
        dataType: FieldDataType.DATETIME,
        required: false,
        unique: false,
        defaultValue: 'now()',
        comment: '记录最后更新时间戳',
        displayOrder: 5,
        isCommon: true,
      },
    ];
  }

  /**
   * 验证通用字段约束
   */
  validateCommonFieldConstraints(field: CommonFieldDefinition): boolean {
    // 验证字段代码格式
    const codeRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    if (!codeRegex.test(field.code)) {
      throw new Error(`通用字段代码格式不正确: ${field.code}`);
    }

    // 验证字段名称
    if (!field.name || field.name.trim().length === 0) {
      throw new Error('通用字段名称不能为空');
    }

    // 验证字段类型
    if (!Object.values(FieldDataType).includes(field.dataType)) {
      throw new Error(`不支持的字段类型: ${field.dataType}`);
    }

    return true;
  }

  /**
   * 检查字段代码是否与通用字段冲突
   */
  isCommonFieldCode(code: string): boolean {
    const commonFieldCodes = this.getCommonFieldDefinitions().map(field => field.code);
    return commonFieldCodes.includes(code);
  }

  /**
   * 获取通用字段的排序起始值
   */
  getCommonFieldMaxSortOrder(): number {
    const commonFields = this.getCommonFieldDefinitions();
    return Math.max(...commonFields.map(field => field.displayOrder));
  }

  /**
   * 验证业务字段是否与通用字段冲突
   */
  validateBusinessFieldConflict(fieldCode: string): void {
    if (this.isCommonFieldCode(fieldCode)) {
      throw new Error(`字段代码 '${fieldCode}' 与系统通用字段冲突，请使用其他名称`);
    }
  }
}