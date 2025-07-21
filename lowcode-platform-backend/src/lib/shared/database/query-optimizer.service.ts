import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { EnhancedLoggerService } from '../logging/enhanced-logger.service';
import { ConfigService } from '@nestjs/config';

export interface QueryOptions {
  useCache?: boolean;
  cacheTtl?: number;
  includeDeleted?: boolean;
  orderBy?: Record<string, 'asc' | 'desc'>;
  take?: number;
  skip?: number;
}

export interface PaginationOptions {
  current?: number;
  size?: number;
  maxSize?: number;
}

export interface PaginatedResult<T> {
  records: T[];
  meta: {
    current: number;
    size: number;
    total: number;
    pages: number;
  };
}

@Injectable()
export class QueryOptimizerService {
  private readonly defaultPageSize: number;
  private readonly maxPageSize: number;
  private readonly enableQueryCache: boolean;
  private readonly defaultCacheTtl: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly logger: EnhancedLoggerService,
    private readonly configService: ConfigService,
  ) {
    this.logger = this.logger.child('QueryOptimizer');
    this.defaultPageSize = this.configService.get('DEFAULT_PAGE_SIZE', 10);
    this.maxPageSize = this.configService.get('MAX_PAGE_SIZE', 100);
    this.enableQueryCache = this.configService.get('ENABLE_QUERY_CACHE', 'true') === 'true';
    this.defaultCacheTtl = this.configService.get('QUERY_CACHE_TTL', 300); // 5 minutes
  }

  /**
   * Execute a paginated query with caching
   */
  async findManyPaginated<T>(
    model: string,
    where: any = {},
    pagination: PaginationOptions = {},
    options: QueryOptions = {},
  ): Promise<PaginatedResult<T>> {
    const current = Math.max(1, pagination.current || 1);
    const size = Math.min(
      pagination.maxSize || this.maxPageSize,
      Math.max(1, pagination.size || this.defaultPageSize)
    );
    const skip = (current - 1) * size;

    // Build cache key
    const cacheKey = this.buildQueryCacheKey(model, 'findManyPaginated', {
      where,
      current,
      size,
      orderBy: options.orderBy,
      includeDeleted: options.includeDeleted,
    });

    // Try to get from cache first
    if (options.useCache !== false && this.enableQueryCache) {
      const cached = await this.cache.get<PaginatedResult<T>>(cacheKey, {
        ttl: options.cacheTtl || this.defaultCacheTtl,
        namespace: 'query',
      });

      if (cached) {
        this.logger.debug(`Query cache hit for ${model}`, {
          operation: 'findManyPaginated',
          model,
          cacheKey,
        });
        return cached;
      }
    }

    const timer = this.logger.startTimer(`query_${model}_findManyPaginated`);

    try {
      // Build query conditions
      const queryWhere = this.buildWhereCondition(where, options.includeDeleted);
      const queryOptions = {
        where: queryWhere,
        orderBy: options.orderBy || { createdAt: 'desc' as const },
        take: size,
        skip,
      };

      // Execute queries in parallel
      const [records, total] = await Promise.all([
        this.prisma[model].findMany(queryOptions),
        this.prisma[model].count({ where: queryWhere }),
      ]);

      const result: PaginatedResult<T> = {
        records: records as T[],
        meta: {
          current,
          size,
          total,
          pages: Math.ceil(total / size),
        },
      };

      // Cache the result
      if (options.useCache !== false && this.enableQueryCache) {
        await this.cache.set(cacheKey, result, {
          ttl: options.cacheTtl || this.defaultCacheTtl,
          namespace: 'query',
        });
      }

      timer();

      this.logger.debug(`Query executed for ${model}`, {
        operation: 'findManyPaginated',
        model,
        total,
        size,
        current,
        cached: false,
      });

      return result;
    } catch (error) {
      timer();
      this.logger.error(`Query failed for ${model}`, error.stack, {
        operation: 'findManyPaginated',
        model,
        where,
        pagination,
      });
      throw error;
    }
  }

  /**
   * Find a single record with caching
   */
  async findUnique<T>(
    model: string,
    where: any,
    include?: any,
    options: QueryOptions = {},
  ): Promise<T | null> {
    const cacheKey = this.buildQueryCacheKey(model, 'findUnique', {
      where,
      include,
      includeDeleted: options.includeDeleted,
    });

    // Try to get from cache first
    if (options.useCache !== false && this.enableQueryCache) {
      const cached = await this.cache.get<T>(cacheKey, {
        ttl: options.cacheTtl || this.defaultCacheTtl,
        namespace: 'query',
      });

      if (cached) {
        this.logger.debug(`Query cache hit for ${model}`, {
          operation: 'findUnique',
          model,
          cacheKey,
        });
        return cached;
      }
    }

    const timer = this.logger.startTimer(`query_${model}_findUnique`);

    try {
      const queryWhere = this.buildWhereCondition(where, options.includeDeleted);
      const queryOptions: any = { where: queryWhere };
      
      if (include) {
        queryOptions.include = include;
      }

      const result = await this.prisma[model].findUnique(queryOptions);

      // Cache the result
      if (options.useCache !== false && this.enableQueryCache && result) {
        await this.cache.set(cacheKey, result, {
          ttl: options.cacheTtl || this.defaultCacheTtl,
          namespace: 'query',
        });
      }

      timer();

      this.logger.debug(`Query executed for ${model}`, {
        operation: 'findUnique',
        model,
        found: !!result,
        cached: false,
      });

      return result as T;
    } catch (error) {
      timer();
      this.logger.error(`Query failed for ${model}`, error.stack, {
        operation: 'findUnique',
        model,
        where,
      });
      throw error;
    }
  }

  /**
   * Find multiple records with caching
   */
  async findMany<T>(
    model: string,
    where: any = {},
    include?: any,
    options: QueryOptions = {},
  ): Promise<T[]> {
    const cacheKey = this.buildQueryCacheKey(model, 'findMany', {
      where,
      include,
      orderBy: options.orderBy,
      take: options.take,
      skip: options.skip,
      includeDeleted: options.includeDeleted,
    });

    // Try to get from cache first
    if (options.useCache !== false && this.enableQueryCache) {
      const cached = await this.cache.get<T[]>(cacheKey, {
        ttl: options.cacheTtl || this.defaultCacheTtl,
        namespace: 'query',
      });

      if (cached) {
        this.logger.debug(`Query cache hit for ${model}`, {
          operation: 'findMany',
          model,
          cacheKey,
        });
        return cached;
      }
    }

    const timer = this.logger.startTimer(`query_${model}_findMany`);

    try {
      const queryWhere = this.buildWhereCondition(where, options.includeDeleted);
      const queryOptions: any = { where: queryWhere };
      
      if (include) {
        queryOptions.include = include;
      }
      
      if (options.orderBy) {
        queryOptions.orderBy = options.orderBy;
      }
      
      if (options.take) {
        queryOptions.take = options.take;
      }
      
      if (options.skip) {
        queryOptions.skip = options.skip;
      }

      const result = await this.prisma[model].findMany(queryOptions);

      // Cache the result
      if (options.useCache !== false && this.enableQueryCache) {
        await this.cache.set(cacheKey, result, {
          ttl: options.cacheTtl || this.defaultCacheTtl,
          namespace: 'query',
        });
      }

      timer();

      this.logger.debug(`Query executed for ${model}`, {
        operation: 'findMany',
        model,
        count: result.length,
        cached: false,
      });

      return result as T[];
    } catch (error) {
      timer();
      this.logger.error(`Query failed for ${model}`, error.stack, {
        operation: 'findMany',
        model,
        where,
      });
      throw error;
    }
  }

  /**
   * Invalidate cache for a model
   */
  async invalidateModelCache(model: string, id?: string): Promise<void> {
    try {
      if (id) {
        // Invalidate specific record cache
        const patterns = [
          `query:${model}_findUnique_*${id}*`,
          `query:${model}_findMany_*`,
          `query:${model}_findManyPaginated_*`,
        ];
        
        // In a real implementation with Redis, we would use pattern matching
        // For now, we'll clear the entire query namespace
        await this.cache.clearNamespace('query');
      } else {
        // Invalidate all cache for the model
        await this.cache.clearNamespace('query');
      }

      this.logger.debug(`Cache invalidated for model ${model}`, {
        operation: 'invalidateCache',
        model,
        id,
      });
    } catch (error) {
      this.logger.warn(`Failed to invalidate cache for model ${model}`, {
        operation: 'invalidateCache',
        model,
        id,
        error: error.message,
      });
    }
  }

  /**
   * Build cache key for queries
   */
  private buildQueryCacheKey(model: string, operation: string, params: any): string {
    const paramsHash = this.hashObject(params);
    return `${model}_${operation}_${paramsHash}`;
  }

  /**
   * Build where condition with soft delete support
   */
  private buildWhereCondition(where: any, includeDeleted?: boolean): any {
    const queryWhere = { ...where };

    // Add soft delete condition if not explicitly including deleted records
    if (!includeDeleted) {
      queryWhere.deletedAt = null;
    }

    return queryWhere;
  }

  /**
   * Simple hash function for objects
   */
  private hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get query statistics
   */
  async getQueryStats(): Promise<{
    slowQueries: number;
    cacheHitRate: number;
    averageQueryTime: number;
    totalQueries: number;
  }> {
    // This would be implemented with actual metrics collection
    // For now, return mock data
    return {
      slowQueries: 0,
      cacheHitRate: 85.5,
      averageQueryTime: 45.2,
      totalQueries: 1250,
    };
  }
}
