import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs-extra';
import * as path from 'path';
import { EntityDefinition, FieldDefinition, RelationshipDefinition } from './layered-code-generator.service';
import { TemplateEngineService } from './template-engine.service';

/**
 * 多表关联配置
 */
export interface MultiTableRelationConfig {
  /** 项目名称 */
  projectName: string;
  /** 输出目录 */
  outputDir: string;
  /** API前缀 */
  apiPrefix?: string;
  /** 是否生成关联查询接口 */
  generateRelationQueries?: boolean;
  /** 是否生成聚合查询接口 */
  generateAggregateQueries?: boolean;
  /** 是否生成统计接口 */
  generateStatistics?: boolean;
  /** 是否生成报表接口 */
  generateReports?: boolean;
  /** 是否启用深度查询 */
  enableDeepQuery?: boolean;
  /** 最大查询深度 */
  maxQueryDepth?: number;
  /** 是否启用查询缓存 */
  enableQueryCache?: boolean;
  /** 缓存TTL（秒） */
  cacheTtl?: number;
  /** 是否启用查询优化 */
  enableQueryOptimization?: boolean;
  /** 是否生成GraphQL接口 */
  generateGraphQL?: boolean;
}

/**
 * 关联查询配置
 */
export interface RelationQueryConfig {
  /** 查询名称 */
  name: string;
  /** 查询描述 */
  description: string;
  /** 主实体 */
  primaryEntity: string;
  /** 关联实体列表 */
  relatedEntities: string[];
  /** 查询类型 */
  queryType: 'oneToMany' | 'manyToOne' | 'manyToMany' | 'complex';
  /** 查询条件 */
  conditions?: QueryCondition[];
  /** 排序规则 */
  orderBy?: OrderByRule[];
  /** 分页配置 */
  pagination?: PaginationConfig;
  /** 是否启用缓存 */
  enableCache?: boolean;
  /** 权限要求 */
  permissions?: string[];
}

/**
 * 查询条件
 */
export interface QueryCondition {
  /** 字段名 */
  field: string;
  /** 操作符 */
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'notIn' | 'like' | 'between' | 'isNull' | 'isNotNull';
  /** 值 */
  value?: any;
  /** 逻辑操作符 */
  logic?: 'AND' | 'OR';
  /** 是否来自参数 */
  fromParam?: boolean;
  /** 参数名 */
  paramName?: string;
}

/**
 * 排序规则
 */
export interface OrderByRule {
  /** 字段名 */
  field: string;
  /** 排序方向 */
  direction: 'ASC' | 'DESC';
  /** 实体名（用于关联查询） */
  entity?: string;
}

/**
 * 分页配置
 */
export interface PaginationConfig {
  /** 是否启用分页 */
  enabled: boolean;
  /** 默认页大小 */
  defaultPageSize: number;
  /** 最大页大小 */
  maxPageSize: number;
}

/**
 * 聚合查询配置
 */
export interface AggregateQueryConfig {
  /** 查询名称 */
  name: string;
  /** 查询描述 */
  description: string;
  /** 主实体 */
  primaryEntity: string;
  /** 聚合字段 */
  aggregateFields: AggregateField[];
  /** 分组字段 */
  groupByFields?: string[];
  /** 过滤条件 */
  havingConditions?: QueryCondition[];
  /** 时间维度 */
  timeDimension?: TimeDimension;
}

/**
 * 聚合字段
 */
export interface AggregateField {
  /** 字段名 */
  field: string;
  /** 聚合函数 */
  function: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'DISTINCT_COUNT';
  /** 别名 */
  alias?: string;
}

/**
 * 时间维度
 */
export interface TimeDimension {
  /** 时间字段 */
  field: string;
  /** 时间粒度 */
  granularity: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  /** 时间范围 */
  range?: {
    start?: string;
    end?: string;
  };
}

/**
 * 生成的关联文件
 */
export interface RelationGeneratedFile {
  /** 文件路径 */
  filePath: string;
  /** 文件内容 */
  content: string;
  /** 文件类型 */
  type: 'controller' | 'service' | 'dto' | 'query' | 'resolver' | 'schema' | 'config';
  /** 文件描述 */
  description: string;
  /** 是否可编辑 */
  editable: boolean;
  /** 依赖文件 */
  dependencies: string[];
  /** 元数据 */
  metadata: {
    /** 查询类型 */
    queryType: string;
    /** 涉及的实体 */
    entities: string[];
    /** 查询复杂度 */
    complexity: number;
    /** 是否有缓存 */
    hasCache: boolean;
  };
}

/**
 * 多表关联生成器服务
 */
@Injectable()
export class MultiTableRelationGeneratorService {
  private readonly logger = new Logger(MultiTableRelationGeneratorService.name);

  constructor(
    private readonly templateEngine: TemplateEngineService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 生成多表关联代码
   */
  async generateMultiTableRelations(
    entities: EntityDefinition[],
    config: MultiTableRelationConfig,
    relationQueries: RelationQueryConfig[] = [],
    aggregateQueries: AggregateQueryConfig[] = []
  ): Promise<RelationGeneratedFile[]> {
    const generatedFiles: RelationGeneratedFile[] = [];

    try {
      this.logger.log(`开始生成多表关联代码: ${config.projectName}`);

      // 创建输出目录
      await this.createDirectoryStructure(config.outputDir);

      // 分析实体关系
      const relationshipMap = this.analyzeEntityRelationships(entities);

      // 生成关联查询接口
      if (config.generateRelationQueries && relationQueries.length > 0) {
        const relationFiles = await this.generateRelationQueryFiles(
          entities,
          relationQueries,
          config,
          relationshipMap
        );
        generatedFiles.push(...relationFiles);
      }

      // 生成聚合查询接口
      if (config.generateAggregateQueries && aggregateQueries.length > 0) {
        const aggregateFiles = await this.generateAggregateQueryFiles(
          entities,
          aggregateQueries,
          config,
          relationshipMap
        );
        generatedFiles.push(...aggregateFiles);
      }

      // 生成统计接口
      if (config.generateStatistics) {
        const statisticsFiles = await this.generateStatisticsFiles(
          entities,
          config,
          relationshipMap
        );
        generatedFiles.push(...statisticsFiles);
      }

      // 生成报表接口
      if (config.generateReports) {
        const reportFiles = await this.generateReportFiles(
          entities,
          config,
          relationshipMap
        );
        generatedFiles.push(...reportFiles);
      }

      // 生成GraphQL接口
      if (config.generateGraphQL) {
        const graphqlFiles = await this.generateGraphQLFiles(
          entities,
          config,
          relationshipMap
        );
        generatedFiles.push(...graphqlFiles);
      }

      // 生成配置文件
      const configFiles = await this.generateConfigFiles(
        entities,
        config,
        relationQueries,
        aggregateQueries
      );
      generatedFiles.push(...configFiles);

      this.logger.log(`多表关联代码生成完成，共生成 ${generatedFiles.length} 个文件`);
      return generatedFiles;

    } catch (error) {
      this.logger.error('多表关联代码生成失败:', error);
      throw error;
    }
  }

  /**
   * 分析实体关系
   */
  private analyzeEntityRelationships(entities: EntityDefinition[]): Map<string, RelationshipDefinition[]> {
    const relationshipMap = new Map<string, RelationshipDefinition[]>();

    entities.forEach(entity => {
      if (entity.relationships) {
        relationshipMap.set(entity.code, entity.relationships);
      }
    });

    return relationshipMap;
  }

  /**
   * 生成关联查询文件
   */
  private async generateRelationQueryFiles(
    entities: EntityDefinition[],
    relationQueries: RelationQueryConfig[],
    config: MultiTableRelationConfig,
    relationshipMap: Map<string, RelationshipDefinition[]>
  ): Promise<RelationGeneratedFile[]> {
    const files: RelationGeneratedFile[] = [];

    // 生成关联查询控制器
    const controller = await this.generateRelationQueryController(
      entities,
      relationQueries,
      config
    );
    files.push(controller);

    // 生成关联查询服务
    const service = await this.generateRelationQueryService(
      entities,
      relationQueries,
      config,
      relationshipMap
    );
    files.push(service);

    // 生成关联查询DTO
    const dtos = await this.generateRelationQueryDTOs(
      entities,
      relationQueries,
      config
    );
    files.push(...dtos);

    return files;
  }

  /**
   * 生成关联查询控制器
   */
  private async generateRelationQueryController(
    entities: EntityDefinition[],
    relationQueries: RelationQueryConfig[],
    config: MultiTableRelationConfig
  ): Promise<RelationGeneratedFile> {
    const templateData = {
      entities,
      relationQueries,
      config,
      className: 'RelationQueryController',
      serviceName: 'relationQueryService',
      apiPath: config.apiPrefix ? `${config.apiPrefix}/relations` : 'relations',
    };

    const content = await this.templateEngine.render('multi-table-relation-controller', templateData);
    
    return {
      filePath: path.join(config.outputDir, 'controllers', 'relation-query.controller.ts'),
      content,
      type: 'controller',
      description: '多表关联查询控制器',
      editable: true,
      dependencies: [
        path.join(config.outputDir, 'services', 'relation-query.service.ts'),
        path.join(config.outputDir, 'dto', 'relation-query.dto.ts'),
      ],
      metadata: {
        queryType: 'relation',
        entities: entities.map(e => e.code),
        complexity: relationQueries.length * 2,
        hasCache: config.enableQueryCache || false,
      },
    };
  }

  /**
   * 生成关联查询服务
   */
  private async generateRelationQueryService(
    entities: EntityDefinition[],
    relationQueries: RelationQueryConfig[],
    config: MultiTableRelationConfig,
    relationshipMap: Map<string, RelationshipDefinition[]>
  ): Promise<RelationGeneratedFile> {
    const templateData = {
      entities,
      relationQueries,
      config,
      relationshipMap: Object.fromEntries(relationshipMap),
      className: 'RelationQueryService',
      enableCache: config.enableQueryCache,
      enableOptimization: config.enableQueryOptimization,
      maxDepth: config.maxQueryDepth || 3,
    };

    const content = await this.templateEngine.render('multi-table-relation-service', templateData);
    
    return {
      filePath: path.join(config.outputDir, 'services', 'relation-query.service.ts'),
      content,
      type: 'service',
      description: '多表关联查询服务',
      editable: true,
      dependencies: [],
      metadata: {
        queryType: 'relation',
        entities: entities.map(e => e.code),
        complexity: relationQueries.length * 3,
        hasCache: config.enableQueryCache || false,
      },
    };
  }

  /**
   * 生成关联查询DTO
   */
  private async generateRelationQueryDTOs(
    entities: EntityDefinition[],
    relationQueries: RelationQueryConfig[],
    config: MultiTableRelationConfig
  ): Promise<RelationGeneratedFile[]> {
    const files: RelationGeneratedFile[] = [];

    // 为每个关联查询生成DTO
    for (const query of relationQueries) {
      const dto = await this.generateRelationQueryDTO(query, config);
      files.push(dto);
    }

    // 生成通用查询DTO
    const commonDto = await this.generateCommonRelationDTO(entities, config);
    files.push(commonDto);

    return files;
  }

  /**
   * 生成单个关联查询DTO
   */
  private async generateRelationQueryDTO(
    query: RelationQueryConfig,
    config: MultiTableRelationConfig
  ): Promise<RelationGeneratedFile> {
    const templateData = {
      query,
      config,
      className: `${this.toPascalCase(query.name)}QueryDto`,
    };

    const content = await this.templateEngine.render('relation-query-dto', templateData);
    
    return {
      filePath: path.join(config.outputDir, 'dto', `${query.name}-query.dto.ts`),
      content,
      type: 'dto',
      description: `${query.description} 查询DTO`,
      editable: true,
      dependencies: [],
      metadata: {
        queryType: query.queryType,
        entities: [query.primaryEntity, ...query.relatedEntities],
        complexity: query.conditions?.length || 1,
        hasCache: query.enableCache || false,
      },
    };
  }

  /**
   * 生成通用关联DTO
   */
  private async generateCommonRelationDTO(
    entities: EntityDefinition[],
    config: MultiTableRelationConfig
  ): Promise<RelationGeneratedFile> {
    const templateData = {
      entities,
      config,
      className: 'CommonRelationQueryDto',
    };

    const content = await this.templateEngine.render('common-relation-dto', templateData);
    
    return {
      filePath: path.join(config.outputDir, 'dto', 'common-relation-query.dto.ts'),
      content,
      type: 'dto',
      description: '通用关联查询DTO',
      editable: true,
      dependencies: [],
      metadata: {
        queryType: 'common',
        entities: entities.map(e => e.code),
        complexity: 1,
        hasCache: false,
      },
    };
  }

  /**
   * 生成聚合查询文件
   */
  private async generateAggregateQueryFiles(
    entities: EntityDefinition[],
    aggregateQueries: AggregateQueryConfig[],
    config: MultiTableRelationConfig,
    relationshipMap: Map<string, RelationshipDefinition[]>
  ): Promise<RelationGeneratedFile[]> {
    const files: RelationGeneratedFile[] = [];

    // 生成聚合查询控制器
    const controller = await this.generateAggregateQueryController(
      entities,
      aggregateQueries,
      config
    );
    files.push(controller);

    // 生成聚合查询服务
    const service = await this.generateAggregateQueryService(
      entities,
      aggregateQueries,
      config,
      relationshipMap
    );
    files.push(service);

    // 生成聚合查询DTO
    const dtos = await this.generateAggregateQueryDTOs(
      entities,
      aggregateQueries,
      config
    );
    files.push(...dtos);

    return files;
  }

  /**
   * 生成聚合查询控制器
   */
  private async generateAggregateQueryController(
    entities: EntityDefinition[],
    aggregateQueries: AggregateQueryConfig[],
    config: MultiTableRelationConfig
  ): Promise<RelationGeneratedFile> {
    const templateData = {
      entities,
      aggregateQueries,
      config,
      className: 'AggregateQueryController',
      serviceName: 'aggregateQueryService',
      apiPath: config.apiPrefix ? `${config.apiPrefix}/aggregates` : 'aggregates',
    };

    const content = await this.templateEngine.render('aggregate-query-controller', templateData);
    
    return {
      filePath: path.join(config.outputDir, 'controllers', 'aggregate-query.controller.ts'),
      content,
      type: 'controller',
      description: '聚合查询控制器',
      editable: true,
      dependencies: [
        path.join(config.outputDir, 'services', 'aggregate-query.service.ts'),
        path.join(config.outputDir, 'dto', 'aggregate-query.dto.ts'),
      ],
      metadata: {
        queryType: 'aggregate',
        entities: entities.map(e => e.code),
        complexity: aggregateQueries.length * 3,
        hasCache: config.enableQueryCache || false,
      },
    };
  }

  /**
   * 生成聚合查询服务
   */
  private async generateAggregateQueryService(
    entities: EntityDefinition[],
    aggregateQueries: AggregateQueryConfig[],
    config: MultiTableRelationConfig,
    relationshipMap: Map<string, RelationshipDefinition[]>
  ): Promise<RelationGeneratedFile> {
    const templateData = {
      entities,
      aggregateQueries,
      config,
      relationshipMap: Object.fromEntries(relationshipMap),
      className: 'AggregateQueryService',
      enableCache: config.enableQueryCache,
      enableOptimization: config.enableQueryOptimization,
    };

    const content = await this.templateEngine.render('aggregate-query-service', templateData);
    
    return {
      filePath: path.join(config.outputDir, 'services', 'aggregate-query.service.ts'),
      content,
      type: 'service',
      description: '聚合查询服务',
      editable: true,
      dependencies: [],
      metadata: {
        queryType: 'aggregate',
        entities: entities.map(e => e.code),
        complexity: aggregateQueries.length * 4,
        hasCache: config.enableQueryCache || false,
      },
    };
  }

  /**
   * 生成聚合查询DTO
   */
  private async generateAggregateQueryDTOs(
    entities: EntityDefinition[],
    aggregateQueries: AggregateQueryConfig[],
    config: MultiTableRelationConfig
  ): Promise<RelationGeneratedFile[]> {
    const files: RelationGeneratedFile[] = [];

    // 为每个聚合查询生成DTO
    for (const query of aggregateQueries) {
      const dto = await this.generateAggregateQueryDTO(query, config);
      files.push(dto);
    }

    return files;
  }

  /**
   * 生成单个聚合查询DTO
   */
  private async generateAggregateQueryDTO(
    query: AggregateQueryConfig,
    config: MultiTableRelationConfig
  ): Promise<RelationGeneratedFile> {
    const templateData = {
      query,
      config,
      className: `${this.toPascalCase(query.name)}AggregateDto`,
    };

    const content = await this.templateEngine.render('aggregate-query-dto', templateData);
    
    return {
      filePath: path.join(config.outputDir, 'dto', `${query.name}-aggregate.dto.ts`),
      content,
      type: 'dto',
      description: `${query.description} 聚合查询DTO`,
      editable: true,
      dependencies: [],
      metadata: {
        queryType: 'aggregate',
        entities: [query.primaryEntity],
        complexity: query.aggregateFields.length,
        hasCache: false,
      },
    };
  }

  /**
   * 生成统计文件
   */
  private async generateStatisticsFiles(
    entities: EntityDefinition[],
    config: MultiTableRelationConfig,
    relationshipMap: Map<string, RelationshipDefinition[]>
  ): Promise<RelationGeneratedFile[]> {
    const files: RelationGeneratedFile[] = [];

    // 生成统计控制器
    const controller = await this.generateStatisticsController(entities, config);
    files.push(controller);

    // 生成统计服务
    const service = await this.generateStatisticsService(entities, config, relationshipMap);
    files.push(service);

    return files;
  }

  /**
   * 生成统计控制器
   */
  private async generateStatisticsController(
    entities: EntityDefinition[],
    config: MultiTableRelationConfig
  ): Promise<RelationGeneratedFile> {
    const templateData = {
      entities,
      config,
      className: 'StatisticsController',
      serviceName: 'statisticsService',
      apiPath: config.apiPrefix ? `${config.apiPrefix}/statistics` : 'statistics',
    };

    const content = await this.templateEngine.render('statistics-controller', templateData);
    
    return {
      filePath: path.join(config.outputDir, 'controllers', 'statistics.controller.ts'),
      content,
      type: 'controller',
      description: '统计接口控制器',
      editable: true,
      dependencies: [
        path.join(config.outputDir, 'services', 'statistics.service.ts'),
      ],
      metadata: {
        queryType: 'statistics',
        entities: entities.map(e => e.code),
        complexity: entities.length * 2,
        hasCache: config.enableQueryCache || false,
      },
    };
  }

  /**
   * 生成统计服务
   */
  private async generateStatisticsService(
    entities: EntityDefinition[],
    config: MultiTableRelationConfig,
    relationshipMap: Map<string, RelationshipDefinition[]>
  ): Promise<RelationGeneratedFile> {
    const templateData = {
      entities,
      config,
      relationshipMap: Object.fromEntries(relationshipMap),
      className: 'StatisticsService',
      enableCache: config.enableQueryCache,
    };

    const content = await this.templateEngine.render('statistics-service', templateData);
    
    return {
      filePath: path.join(config.outputDir, 'services', 'statistics.service.ts'),
      content,
      type: 'service',
      description: '统计服务',
      editable: true,
      dependencies: [],
      metadata: {
        queryType: 'statistics',
        entities: entities.map(e => e.code),
        complexity: entities.length * 3,
        hasCache: config.enableQueryCache || false,
      },
    };
  }

  /**
   * 生成报表文件
   */
  private async generateReportFiles(
    entities: EntityDefinition[],
    config: MultiTableRelationConfig,
    relationshipMap: Map<string, RelationshipDefinition[]>
  ): Promise<RelationGeneratedFile[]> {
    const files: RelationGeneratedFile[] = [];

    // 生成报表控制器
    const controller = await this.generateReportController(entities, config);
    files.push(controller);

    // 生成报表服务
    const service = await this.generateReportService(entities, config, relationshipMap);
    files.push(service);

    return files;
  }

  /**
   * 生成报表控制器
   */
  private async generateReportController(
    entities: EntityDefinition[],
    config: MultiTableRelationConfig
  ): Promise<RelationGeneratedFile> {
    const templateData = {
      entities,
      config,
      className: 'ReportController',
      serviceName: 'reportService',
      apiPath: config.apiPrefix ? `${config.apiPrefix}/reports` : 'reports',
    };

    const content = await this.templateEngine.render('report-controller', templateData);
    
    return {
      filePath: path.join(config.outputDir, 'controllers', 'report.controller.ts'),
      content,
      type: 'controller',
      description: '报表接口控制器',
      editable: true,
      dependencies: [
        path.join(config.outputDir, 'services', 'report.service.ts'),
      ],
      metadata: {
        queryType: 'report',
        entities: entities.map(e => e.code),
        complexity: entities.length * 2,
        hasCache: config.enableQueryCache || false,
      },
    };
  }

  /**
   * 生成报表服务
   */
  private async generateReportService(
    entities: EntityDefinition[],
    config: MultiTableRelationConfig,
    relationshipMap: Map<string, RelationshipDefinition[]>
  ): Promise<RelationGeneratedFile> {
    const templateData = {
      entities,
      config,
      relationshipMap: Object.fromEntries(relationshipMap),
      className: 'ReportService',
      enableCache: config.enableQueryCache,
    };

    const content = await this.templateEngine.render('report-service', templateData);
    
    return {
      filePath: path.join(config.outputDir, 'services', 'report.service.ts'),
      content,
      type: 'service',
      description: '报表服务',
      editable: true,
      dependencies: [],
      metadata: {
        queryType: 'report',
        entities: entities.map(e => e.code),
        complexity: entities.length * 4,
        hasCache: config.enableQueryCache || false,
      },
    };
  }

  /**
   * 生成GraphQL文件
   */
  private async generateGraphQLFiles(
    entities: EntityDefinition[],
    config: MultiTableRelationConfig,
    relationshipMap: Map<string, RelationshipDefinition[]>
  ): Promise<RelationGeneratedFile[]> {
    const files: RelationGeneratedFile[] = [];

    // 生成GraphQL Schema
    const schema = await this.generateGraphQLSchema(entities, config, relationshipMap);
    files.push(schema);

    // 生成GraphQL Resolver
    const resolver = await this.generateGraphQLResolver(entities, config, relationshipMap);
    files.push(resolver);

    return files;
  }

  /**
   * 生成GraphQL Schema
   */
  private async generateGraphQLSchema(
    entities: EntityDefinition[],
    config: MultiTableRelationConfig,
    relationshipMap: Map<string, RelationshipDefinition[]>
  ): Promise<RelationGeneratedFile> {
    const templateData = {
      entities,
      config,
      relationshipMap: Object.fromEntries(relationshipMap),
    };

    const content = await this.templateEngine.render('graphql-schema', templateData);
    
    return {
      filePath: path.join(config.outputDir, 'graphql', 'schema.graphql'),
      content,
      type: 'schema',
      description: 'GraphQL Schema定义',
      editable: true,
      dependencies: [],
      metadata: {
        queryType: 'graphql',
        entities: entities.map(e => e.code),
        complexity: entities.length + relationshipMap.size,
        hasCache: false,
      },
    };
  }

  /**
   * 生成GraphQL Resolver
   */
  private async generateGraphQLResolver(
    entities: EntityDefinition[],
    config: MultiTableRelationConfig,
    relationshipMap: Map<string, RelationshipDefinition[]>
  ): Promise<RelationGeneratedFile> {
    const templateData = {
      entities,
      config,
      relationshipMap: Object.fromEntries(relationshipMap),
      className: 'RelationResolver',
    };

    const content = await this.templateEngine.render('graphql-resolver', templateData);
    
    return {
      filePath: path.join(config.outputDir, 'graphql', 'relation.resolver.ts'),
      content,
      type: 'resolver',
      description: 'GraphQL关联查询解析器',
      editable: true,
      dependencies: [],
      metadata: {
        queryType: 'graphql',
        entities: entities.map(e => e.code),
        complexity: entities.length * 2 + relationshipMap.size,
        hasCache: config.enableQueryCache || false,
      },
    };
  }

  /**
   * 生成配置文件
   */
  private async generateConfigFiles(
    entities: EntityDefinition[],
    config: MultiTableRelationConfig,
    relationQueries: RelationQueryConfig[],
    aggregateQueries: AggregateQueryConfig[]
  ): Promise<RelationGeneratedFile[]> {
    const files: RelationGeneratedFile[] = [];

    // 生成查询配置
    const queryConfig = await this.generateQueryConfig(
      entities,
      config,
      relationQueries,
      aggregateQueries
    );
    files.push(queryConfig);

    // 生成模块配置
    const moduleConfig = await this.generateModuleConfig(entities, config);
    files.push(moduleConfig);

    return files;
  }

  /**
   * 生成查询配置
   */
  private async generateQueryConfig(
    entities: EntityDefinition[],
    config: MultiTableRelationConfig,
    relationQueries: RelationQueryConfig[],
    aggregateQueries: AggregateQueryConfig[]
  ): Promise<RelationGeneratedFile> {
    const templateData = {
      entities,
      config,
      relationQueries,
      aggregateQueries,
    };

    const content = await this.templateEngine.render('multi-table-query-config', templateData);
    
    return {
      filePath: path.join(config.outputDir, 'config', 'query.config.ts'),
      content,
      type: 'config',
      description: '多表查询配置',
      editable: true,
      dependencies: [],
      metadata: {
        queryType: 'config',
        entities: entities.map(e => e.code),
        complexity: relationQueries.length + aggregateQueries.length,
        hasCache: false,
      },
    };
  }

  /**
   * 生成模块配置
   */
  private async generateModuleConfig(
    entities: EntityDefinition[],
    config: MultiTableRelationConfig
  ): Promise<RelationGeneratedFile> {
    const templateData = {
      entities,
      config,
      moduleName: 'MultiTableRelationModule',
    };

    const content = await this.templateEngine.render('multi-table-relation-module', templateData);
    
    return {
      filePath: path.join(config.outputDir, 'multi-table-relation.module.ts'),
      content,
      type: 'config',
      description: '多表关联模块',
      editable: true,
      dependencies: [],
      metadata: {
        queryType: 'module',
        entities: entities.map(e => e.code),
        complexity: 1,
        hasCache: false,
      },
    };
  }

  /**
   * 创建目录结构
   */
  private async createDirectoryStructure(outputDir: string): Promise<void> {
    const dirs = [
      path.join(outputDir, 'controllers'),
      path.join(outputDir, 'services'),
      path.join(outputDir, 'dto'),
      path.join(outputDir, 'graphql'),
      path.join(outputDir, 'config'),
    ];

    for (const dir of dirs) {
      await fs.ensureDir(dir);
    }
  }

  /**
   * 转换为PascalCase
   */
  private toPascalCase(str: string): string {
    return str.replace(/(?:^|[-_])(\w)/g, (_, c) => c.toUpperCase());
  }

  /**
   * 转换为camelCase
   */
  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }
}
