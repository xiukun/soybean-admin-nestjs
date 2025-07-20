# 查询管理功能实现指南

## 🏗️ 技术架构设计

### 核心组件架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Query Management System                  │
├─────────────────────────────────────────────────────────────┤
│  API Layer (Controllers)                                   │
│  ├── QueryController                                       │
│  ├── QueryTemplateController                               │
│  └── QueryAnalyticsController                              │
├─────────────────────────────────────────────────────────────┤
│  Application Layer (Services & Handlers)                   │
│  ├── QueryExecutionService                                 │
│  ├── SQLGeneratorService                                   │
│  ├── ParameterValidatorService                             │
│  ├── CacheManagerService                                   │
│  └── AnalyticsService                                      │
├─────────────────────────────────────────────────────────────┤
│  Domain Layer (Models & Business Logic)                    │
│  ├── MultiTableQuery (Aggregate Root)                      │
│  ├── QueryParameter (Value Object)                         │
│  ├── ExecutionStats (Value Object)                         │
│  └── QueryTemplate (Entity)                                │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure Layer (Data Access)                        │
│  ├── QueryRepository                                       │
│  ├── QueryCacheService                                     │
│  ├── DatabaseExecutor                                      │
│  └── MetricsCollector                                      │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 核心功能实现

### 1. 动态SQL生成器

**文件**: `src/lib/bounded-contexts/query/domain/sql-generator.service.ts`

```typescript
export interface SQLGeneratorConfig {
  baseEntity: string;
  fields: FieldSelection[];
  joins: JoinConfig[];
  filters: FilterCondition[];
  groupBy?: string[];
  having?: FilterCondition[];
  orderBy?: SortConfig[];
  limit?: number;
  offset?: number;
}

export class SQLGeneratorService {
  generateSQL(config: SQLGeneratorConfig): string {
    const parts = {
      select: this.buildSelectClause(config.fields),
      from: this.buildFromClause(config.baseEntity),
      joins: this.buildJoinClauses(config.joins),
      where: this.buildWhereClause(config.filters),
      groupBy: this.buildGroupByClause(config.groupBy),
      having: this.buildHavingClause(config.having),
      orderBy: this.buildOrderByClause(config.orderBy),
      limit: this.buildLimitClause(config.limit, config.offset)
    };

    return this.assembleSQLParts(parts);
  }

  private buildSelectClause(fields: FieldSelection[]): string {
    if (!fields.length) return 'SELECT *';
    
    return 'SELECT ' + fields.map(field => {
      const fieldExpr = field.aggregation 
        ? `${field.aggregation}(${field.name})`
        : field.name;
      
      return field.alias 
        ? `${fieldExpr} AS ${field.alias}`
        : fieldExpr;
    }).join(', ');
  }

  private buildJoinClauses(joins: JoinConfig[]): string {
    return joins.map(join => {
      const joinType = join.type.toUpperCase();
      return `${joinType} JOIN ${join.targetTable} AS ${join.alias} 
              ON ${join.sourceField} = ${join.targetField}`;
    }).join(' ');
  }

  // ... 其他构建方法
}
```

### 2. 参数化查询系统

**文件**: `src/lib/bounded-contexts/query/domain/parameter.model.ts`

```typescript
export enum ParameterType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  BOOLEAN = 'BOOLEAN',
  ARRAY = 'ARRAY'
}

export class QueryParameter {
  constructor(
    public readonly name: string,
    public readonly type: ParameterType,
    public readonly isRequired: boolean = false,
    public readonly defaultValue?: any,
    public readonly description?: string,
    public readonly validation?: ParameterValidation
  ) {}

  validate(value: any): ValidationResult {
    // 类型验证
    if (!this.isValidType(value)) {
      return { isValid: false, error: `Invalid type for parameter ${this.name}` };
    }

    // 必填验证
    if (this.isRequired && (value === null || value === undefined)) {
      return { isValid: false, error: `Parameter ${this.name} is required` };
    }

    // 自定义验证
    if (this.validation) {
      return this.validation.validate(value);
    }

    return { isValid: true };
  }

  private isValidType(value: any): boolean {
    switch (this.type) {
      case ParameterType.STRING:
        return typeof value === 'string';
      case ParameterType.NUMBER:
        return typeof value === 'number' && !isNaN(value);
      case ParameterType.DATE:
        return value instanceof Date || !isNaN(Date.parse(value));
      case ParameterType.BOOLEAN:
        return typeof value === 'boolean';
      case ParameterType.ARRAY:
        return Array.isArray(value);
      default:
        return false;
    }
  }
}
```

### 3. 查询缓存服务

**文件**: `src/lib/bounded-contexts/query/infrastructure/query-cache.service.ts`

```typescript
@Injectable()
export class QueryCacheService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly configService: ConfigService
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(this.buildKey(key));
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const cacheKey = this.buildKey(key);
      const serialized = JSON.stringify(value);
      const cacheTTL = ttl || this.getDefaultTTL();
      
      await this.redis.setex(cacheKey, cacheTTL, serialized);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(this.buildKey(pattern));
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  generateCacheKey(queryId: string, parameters?: Record<string, any>): string {
    const paramHash = parameters 
      ? this.hashParameters(parameters)
      : 'no-params';
    
    return `query:${queryId}:${paramHash}`;
  }

  private buildKey(key: string): string {
    const prefix = this.configService.get('CACHE_PREFIX', 'lowcode');
    return `${prefix}:${key}`;
  }

  private hashParameters(params: Record<string, any>): string {
    const sorted = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {});
    
    return require('crypto')
      .createHash('md5')
      .update(JSON.stringify(sorted))
      .digest('hex');
  }

  private getDefaultTTL(): number {
    return this.configService.get('QUERY_CACHE_TTL', 3600); // 1小时
  }
}
```

### 4. 查询执行服务增强

**文件**: `src/lib/bounded-contexts/query/application/services/query-execution.service.ts`

```typescript
@Injectable()
export class QueryExecutionService {
  constructor(
    private readonly sqlGenerator: SQLGeneratorService,
    private readonly parameterValidator: ParameterValidatorService,
    private readonly cacheService: QueryCacheService,
    private readonly databaseExecutor: DatabaseExecutorService,
    private readonly metricsCollector: MetricsCollectorService
  ) {}

  async executeQuery(
    query: MultiTableQuery, 
    parameters?: Record<string, any>
  ): Promise<QueryExecutionResult> {
    const startTime = Date.now();
    const executionId = this.generateExecutionId();

    try {
      // 1. 参数验证
      await this.validateParameters(query, parameters);

      // 2. 检查缓存
      const cacheKey = this.cacheService.generateCacheKey(query.id, parameters);
      const cachedResult = await this.cacheService.get<QueryExecutionResult>(cacheKey);
      
      if (cachedResult) {
        await this.recordCacheHit(query.id, executionId);
        return cachedResult;
      }

      // 3. 生成SQL
      const sql = await this.generateExecutableSQL(query, parameters);

      // 4. 执行查询
      const rawResult = await this.databaseExecutor.execute(sql, parameters);

      // 5. 处理结果
      const result = this.processQueryResult(rawResult, query);

      // 6. 缓存结果
      await this.cacheService.set(cacheKey, result, this.getCacheTTL(query));

      // 7. 记录执行统计
      await this.recordExecution(query.id, executionId, Date.now() - startTime, result);

      return result;

    } catch (error) {
      await this.recordExecutionError(query.id, executionId, error);
      throw error;
    }
  }

  private async validateParameters(
    query: MultiTableQuery, 
    parameters?: Record<string, any>
  ): Promise<void> {
    if (!query.parameters?.length) return;

    for (const param of query.parameters) {
      const value = parameters?.[param.name];
      const validation = param.validate(value);
      
      if (!validation.isValid) {
        throw new BadRequestException(validation.error);
      }
    }
  }

  private async generateExecutableSQL(
    query: MultiTableQuery, 
    parameters?: Record<string, any>
  ): Promise<string> {
    if (query.sqlQuery) {
      return this.interpolateParameters(query.sqlQuery, parameters);
    }

    const config: SQLGeneratorConfig = {
      baseEntity: query.baseEntityId,
      fields: query.fields,
      joins: query.joins,
      filters: query.filters,
      groupBy: query.groupBy,
      having: query.having,
      orderBy: query.sorting,
      limit: query.limit,
      offset: query.offset
    };

    return this.sqlGenerator.generateSQL(config);
  }

  // ... 其他辅助方法
}
```

## 📊 数据库设计

### 扩展表结构

```sql
-- 查询参数定义表
CREATE TABLE lowcode_query_parameters (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  query_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('STRING', 'NUMBER', 'DATE', 'BOOLEAN', 'ARRAY')),
  is_required BOOLEAN DEFAULT FALSE,
  default_value TEXT,
  validation_rules JSONB,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (query_id) REFERENCES lowcode_queries(id) ON DELETE CASCADE,
  UNIQUE (query_id, name)
);

-- 查询执行历史表
CREATE TABLE lowcode_query_executions (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  query_id VARCHAR(36) NOT NULL,
  execution_id VARCHAR(36) NOT NULL,
  parameters JSONB,
  execution_time_ms INTEGER,
  result_count INTEGER,
  cache_hit BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'ERROR', 'TIMEOUT')),
  error_message TEXT,
  sql_executed TEXT,
  executed_by VARCHAR(36),
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (query_id) REFERENCES lowcode_queries(id) ON DELETE CASCADE
);

-- 查询模板表
CREATE TABLE lowcode_query_templates (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  tags JSONB DEFAULT '[]',
  template_config JSONB NOT NULL,
  parameter_schema JSONB DEFAULT '[]',
  usage_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT FALSE,
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(36),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_query_parameters_query_id ON lowcode_query_parameters(query_id);
CREATE INDEX idx_query_executions_query_id ON lowcode_query_executions(query_id);
CREATE INDEX idx_query_executions_executed_at ON lowcode_query_executions(executed_at);
CREATE INDEX idx_query_templates_category ON lowcode_query_templates(category);
CREATE INDEX idx_query_templates_created_by ON lowcode_query_templates(created_by);
```

## 🧪 测试实现示例

### 单元测试

**文件**: `src/lib/bounded-contexts/query/domain/__tests__/sql-generator.service.spec.ts`

```typescript
describe('SQLGeneratorService', () => {
  let service: SQLGeneratorService;

  beforeEach(() => {
    service = new SQLGeneratorService();
  });

  describe('generateSQL', () => {
    it('should generate basic SELECT query', () => {
      const config: SQLGeneratorConfig = {
        baseEntity: 'users',
        fields: [
          { name: 'id', type: 'UUID' },
          { name: 'name', type: 'STRING' }
        ],
        joins: [],
        filters: []
      };

      const sql = service.generateSQL(config);
      
      expect(sql).toContain('SELECT id, name');
      expect(sql).toContain('FROM users');
    });

    it('should generate query with JOIN', () => {
      const config: SQLGeneratorConfig = {
        baseEntity: 'users',
        fields: [
          { name: 'users.name', type: 'STRING' },
          { name: 'roles.name', type: 'STRING', alias: 'role_name' }
        ],
        joins: [{
          type: 'INNER',
          targetTable: 'roles',
          alias: 'r',
          sourceField: 'users.role_id',
          targetField: 'r.id'
        }],
        filters: []
      };

      const sql = service.generateSQL(config);
      
      expect(sql).toContain('INNER JOIN roles AS r');
      expect(sql).toContain('ON users.role_id = r.id');
    });

    // ... 更多测试用例
  });
});
```

## 🚀 部署配置

### 环境变量配置

```env
# 查询缓存配置
QUERY_CACHE_TTL=3600
QUERY_CACHE_PREFIX=lowcode_query
REDIS_URL=redis://localhost:6379

# 查询执行配置
QUERY_TIMEOUT_MS=30000
MAX_QUERY_RESULT_SIZE=10000
ENABLE_QUERY_CACHE=true

# 性能监控配置
ENABLE_QUERY_METRICS=true
SLOW_QUERY_THRESHOLD_MS=5000
```

### Docker配置更新

```yaml
# docker-compose.yml 添加Redis服务
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  redis_data:
```

---

**实现优先级建议**:
1. 🔥 动态SQL生成器 (核心功能)
2. 🔥 参数化查询系统 (安全必需)
3. ⚡ 查询结果缓存 (性能优化)
4. 📊 执行统计增强 (监控运维)
5. 🎨 查询模板系统 (用户体验)

每个功能都应该包含完整的单元测试、集成测试和文档。
