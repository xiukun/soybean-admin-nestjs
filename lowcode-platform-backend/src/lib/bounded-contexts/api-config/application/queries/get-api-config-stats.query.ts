import { IQuery } from '@nestjs/cqrs';

/**
 * 获取API配置统计信息的查询
 */
export class GetApiConfigStatsQuery implements IQuery {
  constructor(public readonly projectId: string) {}
}