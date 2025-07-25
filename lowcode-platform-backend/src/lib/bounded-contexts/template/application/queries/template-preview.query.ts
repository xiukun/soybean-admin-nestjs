/*
 * @Description: 模板预览查询
 * @Autor: henry.xiukun
 * @Date: 2025-07-25 21:40:00
 * @LastEditors: henry.xiukun
 */

export class PreviewTemplateQuery {
  constructor(
    public readonly templateId: string,
    public readonly variables?: Record<string, any>,
  ) {}
}

export class ValidateTemplateQuery {
  constructor(
    public readonly content: string,
    public readonly variables?: any[],
  ) {}
}

export class TestTemplateQuery {
  constructor(
    public readonly templateId: string,
    public readonly testData: {
      variables: Record<string, any>;
      expectedOutput?: string;
    },
  ) {}
}
