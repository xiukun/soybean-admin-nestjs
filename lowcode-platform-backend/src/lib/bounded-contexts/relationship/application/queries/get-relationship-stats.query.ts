import { IQuery } from '@nestjs/cqrs';

/**
 * 获取关系统计信息的查询
 */
export class GetRelationshipStatsQuery implements IQuery {
  constructor(public readonly projectId: string) {}
}