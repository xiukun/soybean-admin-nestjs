import { IQuery } from '@nestjs/cqrs';

/**
 * 获取查询统计信息的查询
 */
export class GetQueryStatsQuery implements IQuery {
  constructor(public readonly projectId: string) {}
}