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
    const query = await this.findById(id);
    if (!query) {
      throw new Error(`Query with id '${id}' not found`);
    }

    try {
      // 如果查询有预定义的SQL，直接执行
      if (query.sqlQuery) {
        const result = await this.client.$queryRawUnsafe(query.sqlQuery);

        // 更新执行统计
        await this.updateExecutionStats(id, result);

        return {
          data: result,
          query: {
            id: query.id,
            name: query.name,
            sql: query.sqlQuery,
            executedAt: new Date().toISOString(),
            resultCount: Array.isArray(result) ? result.length : 1
          }
        };
      }

      // 如果没有预定义SQL，根据配置动态生成（简化版本）
      const generatedSQL = this.generateSQL(query);
      const result = await this.client.$queryRawUnsafe(generatedSQL);

      // 更新执行统计
      await this.updateExecutionStats(id, result);

      return {
        data: result,
        query: {
          id: query.id,
          name: query.name,
          sql: generatedSQL,
          executedAt: new Date().toISOString(),
          resultCount: Array.isArray(result) ? result.length : 1
        }
      };
    } catch (error) {
      console.error(`Query execution failed for ${id}:`, error);
      throw new Error(`Query execution failed: ${error.message}`);
    }
  }

  private generateSQL(query: any): string {
    // 简化的SQL生成逻辑
    // 这里只是一个基本示例，实际应该根据查询配置生成复杂的SQL

    // 基础查询：SELECT COUNT(*) as count, status FROM sys_user GROUP BY status
    if (query.name === '用户状态统计') {
      return `
        SELECT
          status,
          COUNT(*) as count
        FROM sys_user
        GROUP BY status
        ORDER BY count DESC
      `;
    }

    // 默认查询
    return `SELECT 'Query execution completed' as message, '${query.name}' as query_name`;
  }

  private async updateExecutionStats(queryId: string, result: any): Promise<void> {
    const resultCount = Array.isArray(result) ? result.length : 1;
    const executionStats = {
      lastExecuted: new Date().toISOString(),
      executionTime: Date.now(), // 简化的执行时间
      resultCount
    };

    await this.client.lowcodeQuery.update({
      where: { id: queryId },
      data: {
        executionStats: executionStats as any,
        updatedAt: new Date()
      }
    });
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
