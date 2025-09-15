import { IQuery } from '@nestjs/cqrs';

/**
 * 获取实体统计信息的查询
 */
export class GetEntityStatsQuery implements IQuery {
  constructor(public readonly projectId: string) {}
}