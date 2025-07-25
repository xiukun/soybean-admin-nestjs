/*
 * @Description: 代码生成查询
 * @Autor: henry.xiukun
 * @Date: 2025-07-25 22:30:00
 * @LastEditors: henry.xiukun
 */

export class GetGenerationConfigQuery {
  constructor(
    public readonly projectId: string,
  ) {}
}

export class GetAvailableTemplatesQuery {
  constructor(
    public readonly projectId: string,
    public readonly category?: string,
    public readonly language?: string,
    public readonly framework?: string,
  ) {}
}

export class GetProjectEntitiesQuery {
  constructor(
    public readonly projectId: string,
    public readonly includeFields: boolean = true,
    public readonly includeRelations: boolean = true,
  ) {}
}

export class GetGenerationPreviewQuery {
  constructor(
    public readonly entityId: string,
    public readonly templateId: string,
    public readonly variables?: Record<string, any>,
  ) {}
}

export class GetGenerationStatusQuery {
  constructor(
    public readonly taskId: string,
  ) {}
}

export class GetGeneratedFilesQuery {
  constructor(
    public readonly outputPath: string,
    public readonly type?: 'base' | 'biz' | 'all',
  ) {}
}

// 配置管理查询
export class GetProjectConfigsQuery {
  constructor(
    public readonly projectId: string,
    public readonly page: number = 1,
    public readonly size: number = 10,
  ) {}
}

export class GetConfigTemplatesQuery {
  constructor(
    public readonly category?: string,
    public readonly framework?: string,
    public readonly language?: string,
  ) {}
}

export class LoadConfigQuery {
  constructor(
    public readonly configId: string,
  ) {}
}

export class ValidateConfigQuery {
  constructor(
    public readonly config: any,
  ) {}
}

export class CompareConfigsQuery {
  constructor(
    public readonly config1: any,
    public readonly config2: any,
  ) {}
}
