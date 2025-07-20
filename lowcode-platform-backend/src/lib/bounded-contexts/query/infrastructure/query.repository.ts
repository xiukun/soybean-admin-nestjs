import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { MultiTableQuery } from '../domain/multi-table-query.model';

@Injectable()
export class QueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get client() {
    return this.prisma as any;
  }

  async save(query: MultiTableQuery): Promise<MultiTableQuery> {
    const data = query.toPersistence();

    const saved = await this.client.lowcodeQuery.upsert({
      where: { id: data.id },
      update: {
        name: data.name,
        description: data.description,
        baseEntityId: data.baseEntityId,
        baseEntityAlias: data.baseEntityAlias,
        joins: data.joins as any,
        fields: data.fields as any,
        filters: data.filters as any,
        sorting: data.sorting as any,
        groupBy: data.groupBy as any,
        having: data.having as any,
        limit: data.limit,
        offset: data.offset,
        status: data.status,
        sqlQuery: data.sqlQuery,
        executionStats: data.executionStats as any,
        updatedBy: data.updatedBy,
        updatedAt: data.updatedAt,
      },
      create: {
        id: data.id,
        projectId: data.projectId,
        name: data.name,
        description: data.description,
        baseEntityId: data.baseEntityId,
        baseEntityAlias: data.baseEntityAlias,
        joins: data.joins as any,
        fields: data.fields as any,
        filters: data.filters as any,
        sorting: data.sorting as any,
        groupBy: data.groupBy as any,
        having: data.having as any,
        limit: data.limit,
        offset: data.offset,
        status: data.status,
        sqlQuery: data.sqlQuery,
        executionStats: data.executionStats as any,
        createdBy: data.createdBy,
        createdAt: data.createdAt,
        updatedBy: data.updatedBy,
        updatedAt: data.updatedAt,
      },
    });

    return MultiTableQuery.fromPersistence(saved as any);
  }

  async findById(id: string): Promise<MultiTableQuery | null> {
    const query = await this.client.lowcodeQuery.findUnique({
      where: { id },
    });

    return query ? MultiTableQuery.fromPersistence(query as any) : null;
  }

  async findByProject(projectId: string): Promise<MultiTableQuery[]> {
    const queries = await this.client.lowcodeQuery.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return queries.map(query => MultiTableQuery.fromPersistence(query as any));
  }

  async findByProjectAndName(projectId: string, name: string): Promise<MultiTableQuery | null> {
    const query = await this.client.lowcodeQuery.findFirst({
      where: {
        projectId,
        name,
      },
    });

    return query ? MultiTableQuery.fromPersistence(query as any) : null;
  }

  async findPaginated(
    projectId: string,
    page: number = 1,
    limit: number = 10,
    filters?: any,
  ): Promise<{
    queries: MultiTableQuery[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    
    const where: any = { projectId };
    
    if (filters?.status) {
      where.status = filters.status;
    }
    
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [queries, total] = await Promise.all([
      this.client.lowcodeQuery.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.client.lowcodeQuery.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      queries: queries.map(query => MultiTableQuery.fromPersistence(query as any)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async delete(id: string): Promise<void> {
    await this.client.lowcodeQuery.delete({
      where: { id },
    });
  }

  async execute(id: string, parameters?: Record<string, any>): Promise<any> {
    // TODO: 实现查询执行逻辑
    // 这里需要根据查询配置生成SQL并执行
    throw new Error('Query execution not implemented yet');
  }

  async getStats(projectId: string): Promise<any> {
    const stats = await this.client.lowcodeQuery.groupBy({
      by: ['status'],
      where: { projectId },
      _count: {
        status: true,
      },
    });

    return {
      total: stats.reduce((sum, stat) => sum + stat._count.status, 0),
      byStatus: stats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.status;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
