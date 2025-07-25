/*
 * @Description: 关联查询生成命令
 * @Autor: henry.xiukun
 * @Date: 2025-07-26 00:45:00
 * @LastEditors: henry.xiukun
 */

import { JoinQueryConfig } from '../services/join-query-generator.service';

export class GenerateJoinQueryCommand {
  constructor(
    public readonly projectId: string,
    public readonly config: JoinQueryConfig,
    public readonly outputPath: string,
    public readonly options: {
      generateController?: boolean;
      generateService?: boolean;
      generateTypes?: boolean;
      generateDocumentation?: boolean;
      overwriteExisting?: boolean;
    } = {},
    public readonly userId?: string,
  ) {}
}

export class ValidateJoinQueryConfigCommand {
  constructor(
    public readonly projectId: string,
    public readonly config: JoinQueryConfig,
  ) {}
}

export class SaveJoinQueryConfigCommand {
  constructor(
    public readonly projectId: string,
    public readonly name: string,
    public readonly description: string,
    public readonly config: JoinQueryConfig,
    public readonly userId: string,
  ) {}
}

export class DeleteJoinQueryConfigCommand {
  constructor(
    public readonly configId: string,
    public readonly userId: string,
  ) {}
}

export class BatchGenerateJoinQueriesCommand {
  constructor(
    public readonly projectId: string,
    public readonly configs: Array<{
      name: string;
      description: string;
      config: JoinQueryConfig;
    }>,
    public readonly outputPath: string,
    public readonly options: {
      generateController?: boolean;
      generateService?: boolean;
      generateTypes?: boolean;
      generateDocumentation?: boolean;
      overwriteExisting?: boolean;
    } = {},
    public readonly userId: string,
  ) {}
}

export class OptimizeJoinQueryCommand {
  constructor(
    public readonly configId: string,
    public readonly optimizationOptions: {
      addIndexes?: boolean;
      optimizeJoinOrder?: boolean;
      addCaching?: boolean;
      addPagination?: boolean;
    } = {},
    public readonly userId?: string,
  ) {}
}

export class GenerateJoinQueryTestsCommand {
  constructor(
    public readonly configId: string,
    public readonly testOptions: {
      generateUnitTests?: boolean;
      generateIntegrationTests?: boolean;
      generatePerformanceTests?: boolean;
      generateMockData?: boolean;
    } = {},
    public readonly userId?: string,
  ) {}
}
