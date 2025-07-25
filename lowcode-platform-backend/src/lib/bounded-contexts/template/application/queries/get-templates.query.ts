/*
 * @Description: 
 * @Autor: henry.xiukun
 * @Date: 2025-07-25 20:45:38
 * @LastEditors: henry.xiukun
 */
export class GetTemplatesQuery {
  constructor(
    public readonly filters?: {
      category?: string;
      language?: string;
      framework?: string;
      status?: string;
      isPublic?: boolean;
      search?: string;
    },
    public readonly pagination?: {
      page?: number;
      limit?: number;
      orderBy?: string;
      orderDir?: 'asc' | 'desc';
    },
  ) {}
}

export class GetTemplateByIdQuery {
  constructor(public readonly id: string) {}
}

export class GetTemplateByCodeQuery {
  constructor(public readonly code: string) {}
}

export class GetTemplateVersionsQuery {
  constructor(
    public readonly templateId: string,
    public readonly pagination?: {
      page?: number;
      limit?: number;
    },
  ) {}
}
