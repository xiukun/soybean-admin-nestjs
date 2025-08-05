import { Injectable } from '@nestjs/common';
import { EntityTemplateField } from './entity-template.service';
import { FieldDataType } from '@lib/bounded-contexts/field/domain/field.model';

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // 缓存时间 (秒)
  maxSize: number; // 最大缓存条目数
  strategy: 'lru' | 'lfu' | 'fifo' | 'ttl';
  warmupOnStart: boolean;
  invalidateOnUpdate: boolean;
  compressionEnabled: boolean;
}

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number; // 字节大小
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number; // 字节
  hitCount: number;
  missCount: number;
  hitRate: number;
  evictionCount: number;
  averageAccessTime: number;
  oldestEntry: number;
  newestEntry: number;
}

export interface EntityCacheStrategy {
  entityCode: string;
  config: CacheConfig;
  keyPatterns: string[];
  dependencies: string[]; // 依赖的其他实体
  invalidationRules: {
    onEntityUpdate: boolean;
    onRelatedEntityUpdate: boolean;
    customRules: string[];
  };
}

export interface CacheOptimizationSuggestion {
  type: 'ttl_adjustment' | 'size_optimization' | 'strategy_change' | 'dependency_optimization';
  entityCode: string;
  currentValue: any;
  suggestedValue: any;
  reason: string;
  expectedImprovement: string;
  priority: 'low' | 'medium' | 'high';
}

@Injectable()
export class EntityCacheManagerService {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    totalEntries: 0,
    totalSize: 0,
    hitCount: 0,
    missCount: 0,
    hitRate: 0,
    evictionCount: 0,
    averageAccessTime: 0,
    oldestEntry: 0,
    newestEntry: 0,
  };
  private entityStrategies = new Map<string, EntityCacheStrategy>();
  private defaultConfig: CacheConfig = {
    enabled: true,
    ttl: 3600, // 1小时
    maxSize: 1000,
    strategy: 'lru',
    warmupOnStart: false,
    invalidateOnUpdate: true,
    compressionEnabled: false,
  };

  /**
   * 设置实体缓存策略
   */
  setEntityCacheStrategy(strategy: EntityCacheStrategy): void {
    this.entityStrategies.set(strategy.entityCode, strategy);
  }

  /**
   * 获取实体缓存策略
   */
  getEntityCacheStrategy(entityCode: string): EntityCacheStrategy {
    return this.entityStrategies.get(entityCode) || this.createDefaultStrategy(entityCode);
  }

  /**
   * 设置缓存
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const entityCode = this.extractEntityCodeFromKey(key);
    const strategy = this.getEntityCacheStrategy(entityCode);
    
    if (!strategy.config.enabled) {
      return;
    }

    const now = Date.now();
    const entryTtl = ttl || strategy.config.ttl;
    const size = this.calculateSize(value);

    // 检查是否需要清理空间
    this.evictIfNecessary(strategy.config);

    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: now,
      ttl: entryTtl * 1000, // 转换为毫秒
      accessCount: 0,
      lastAccessed: now,
      size,
    };

    this.cache.set(key, entry);
    this.updateStats();
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      this.stats.missCount++;
      this.updateHitRate();
      return null;
    }

    const now = Date.now();
    
    // 检查是否过期
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.missCount++;
      this.stats.evictionCount++;
      this.updateStats();
      return null;
    }

    // 更新访问信息
    entry.accessCount++;
    entry.lastAccessed = now;
    
    this.stats.hitCount++;
    this.updateHitRate();
    
    return entry.value;
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.updateStats();
    }
    return deleted;
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
    this.resetStats();
  }

  /**
   * 使实体相关缓存失效
   */
  invalidateEntity(entityCode: string): void {
    const strategy = this.getEntityCacheStrategy(entityCode);
    const keysToDelete: string[] = [];

    // 查找匹配的缓存键
    for (const [key] of this.cache) {
      if (this.keyMatchesEntity(key, entityCode, strategy.keyPatterns)) {
        keysToDelete.push(key);
      }
    }

    // 删除匹配的缓存
    keysToDelete.forEach(key => this.delete(key));

    // 处理依赖关系
    if (strategy.invalidationRules.onRelatedEntityUpdate) {
      this.invalidateRelatedEntities(entityCode);
    }
  }

  /**
   * 预热缓存
   */
  async warmupCache(entityCode: string, dataLoader: () => Promise<any[]>): Promise<void> {
    const strategy = this.getEntityCacheStrategy(entityCode);
    
    if (!strategy.config.warmupOnStart) {
      return;
    }

    try {
      const data = await dataLoader();
      data.forEach((item, index) => {
        const key = `${entityCode}:${item.id || index}`;
        this.set(key, item, strategy.config.ttl);
      });
    } catch (error) {
      console.error(`Failed to warmup cache for entity ${entityCode}:`, error);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * 获取实体缓存统计
   */
  getEntityCacheStats(entityCode: string): {
    entryCount: number;
    totalSize: number;
    hitRate: number;
    averageAge: number;
  } {
    const entries = Array.from(this.cache.values()).filter(entry => 
      this.extractEntityCodeFromKey(entry.key) === entityCode
    );

    const now = Date.now();
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const totalAccess = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    const averageAge = entries.length > 0 
      ? entries.reduce((sum, entry) => sum + (now - entry.timestamp), 0) / entries.length
      : 0;

    return {
      entryCount: entries.length,
      totalSize,
      hitRate: totalAccess > 0 ? (this.stats.hitCount / (this.stats.hitCount + this.stats.missCount)) * 100 : 0,
      averageAge: averageAge / 1000, // 转换为秒
    };
  }

  /**
   * 分析缓存性能
   */
  analyzeCachePerformance(entityCode: string): {
    efficiency: number;
    memoryUsage: number;
    recommendations: string[];
  } {
    const stats = this.getEntityCacheStats(entityCode);
    const strategy = this.getEntityCacheStrategy(entityCode);
    const recommendations: string[] = [];

    // 计算效率
    let efficiency = 0;
    if (stats.hitRate > 80) {
      efficiency = 90 + (stats.hitRate - 80) / 2;
    } else if (stats.hitRate > 60) {
      efficiency = 70 + (stats.hitRate - 60);
    } else {
      efficiency = stats.hitRate;
    }

    // 内存使用分析
    const memoryUsage = stats.totalSize / (1024 * 1024); // MB

    // 生成建议
    if (stats.hitRate < 60) {
      recommendations.push('缓存命中率较低，建议调整缓存策略或增加TTL');
    }

    if (memoryUsage > 100) {
      recommendations.push('内存使用过高，建议减少缓存大小或启用压缩');
    }

    if (stats.averageAge > strategy.config.ttl * 0.8) {
      recommendations.push('缓存数据较旧，建议减少TTL或增加更新频率');
    }

    if (stats.entryCount > strategy.config.maxSize * 0.9) {
      recommendations.push('缓存接近容量上限，建议增加最大大小或优化清理策略');
    }

    return {
      efficiency,
      memoryUsage,
      recommendations,
    };
  }

  /**
   * 生成缓存优化建议
   */
  generateOptimizationSuggestions(entityCode: string, fields: EntityTemplateField[]): CacheOptimizationSuggestion[] {
    const suggestions: CacheOptimizationSuggestion[] = [];
    const strategy = this.getEntityCacheStrategy(entityCode);
    const stats = this.getEntityCacheStats(entityCode);
    const performance = this.analyzeCachePerformance(entityCode);

    // TTL优化建议
    if (stats.hitRate < 50) {
      suggestions.push({
        type: 'ttl_adjustment',
        entityCode,
        currentValue: strategy.config.ttl,
        suggestedValue: strategy.config.ttl * 2,
        reason: '缓存命中率低，建议增加TTL',
        expectedImprovement: '提高缓存命中率15-25%',
        priority: 'high',
      });
    }

    // 大小优化建议
    if (performance.memoryUsage > 50) {
      const hasLargeFields = fields.some(f => 
        f.dataType === FieldDataType.TEXT || 
        f.dataType === FieldDataType.JSON ||
        (f.dataType === FieldDataType.STRING && f.length && f.length > 1000)
      );

      if (hasLargeFields && !strategy.config.compressionEnabled) {
        suggestions.push({
          type: 'size_optimization',
          entityCode,
          currentValue: false,
          suggestedValue: true,
          reason: '实体包含大字段，启用压缩可减少内存使用',
          expectedImprovement: '减少内存使用30-50%',
          priority: 'medium',
        });
      }
    }

    // 策略优化建议
    if (stats.entryCount > 500 && strategy.config.strategy === 'fifo') {
      suggestions.push({
        type: 'strategy_change',
        entityCode,
        currentValue: 'fifo',
        suggestedValue: 'lru',
        reason: '大量缓存条目时，LRU策略通常更有效',
        expectedImprovement: '提高缓存效率10-20%',
        priority: 'medium',
      });
    }

    // 依赖优化建议
    if (strategy.dependencies.length > 3) {
      suggestions.push({
        type: 'dependency_optimization',
        entityCode,
        currentValue: strategy.dependencies.length,
        suggestedValue: Math.min(3, strategy.dependencies.length),
        reason: '过多的依赖关系会导致频繁的缓存失效',
        expectedImprovement: '减少不必要的缓存失效',
        priority: 'low',
      });
    }

    return suggestions;
  }

  /**
   * 应用优化建议
   */
  applyOptimizationSuggestion(suggestion: CacheOptimizationSuggestion): void {
    const strategy = this.getEntityCacheStrategy(suggestion.entityCode);

    switch (suggestion.type) {
      case 'ttl_adjustment':
        strategy.config.ttl = suggestion.suggestedValue;
        break;
      case 'size_optimization':
        strategy.config.compressionEnabled = suggestion.suggestedValue;
        break;
      case 'strategy_change':
        strategy.config.strategy = suggestion.suggestedValue;
        break;
      case 'dependency_optimization':
        // 这里需要更复杂的逻辑来优化依赖关系
        break;
    }

    this.setEntityCacheStrategy(strategy);
  }

  /**
   * 获取缓存键列表
   */
  getCacheKeys(entityCode?: string): string[] {
    const keys = Array.from(this.cache.keys());
    
    if (entityCode) {
      return keys.filter(key => this.extractEntityCodeFromKey(key) === entityCode);
    }
    
    return keys;
  }

  /**
   * 导出缓存数据
   */
  exportCacheData(entityCode?: string): { [key: string]: any } {
    const result: { [key: string]: any } = {};
    
    for (const [key, entry] of this.cache) {
      if (!entityCode || this.extractEntityCodeFromKey(key) === entityCode) {
        result[key] = {
          value: entry.value,
          metadata: {
            timestamp: entry.timestamp,
            ttl: entry.ttl,
            accessCount: entry.accessCount,
            lastAccessed: entry.lastAccessed,
            size: entry.size,
          },
        };
      }
    }
    
    return result;
  }

  /**
   * 导入缓存数据
   */
  importCacheData(data: { [key: string]: any }): void {
    Object.entries(data).forEach(([key, item]) => {
      if (item.value && item.metadata) {
        const entry: CacheEntry = {
          key,
          value: item.value,
          timestamp: item.metadata.timestamp,
          ttl: item.metadata.ttl,
          accessCount: item.metadata.accessCount,
          lastAccessed: item.metadata.lastAccessed,
          size: item.metadata.size,
        };
        this.cache.set(key, entry);
      }
    });
    
    this.updateStats();
  }

  /**
   * 创建默认策略
   */
  private createDefaultStrategy(entityCode: string): EntityCacheStrategy {
    return {
      entityCode,
      config: { ...this.defaultConfig },
      keyPatterns: [`${entityCode}:*`],
      dependencies: [],
      invalidationRules: {
        onEntityUpdate: true,
        onRelatedEntityUpdate: false,
        customRules: [],
      },
    };
  }

  /**
   * 从缓存键提取实体代码
   */
  private extractEntityCodeFromKey(key: string): string {
    const parts = key.split(':');
    return parts[0] || 'unknown';
  }

  /**
   * 检查键是否匹配实体
   */
  private keyMatchesEntity(key: string, entityCode: string, patterns: string[]): boolean {
    return patterns.some(pattern => {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(key);
    });
  }

  /**
   * 使相关实体缓存失效
   */
  private invalidateRelatedEntities(entityCode: string): void {
    // 查找依赖于当前实体的其他实体
    for (const [otherEntityCode, strategy] of this.entityStrategies) {
      if (strategy.dependencies.includes(entityCode)) {
        this.invalidateEntity(otherEntityCode);
      }
    }
  }

  /**
   * 必要时清理缓存
   */
  private evictIfNecessary(config: CacheConfig): void {
    if (this.cache.size >= config.maxSize) {
      this.evictEntries(config);
    }
  }

  /**
   * 清理缓存条目
   */
  private evictEntries(config: CacheConfig): void {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();
    
    // 首先移除过期的条目
    const expiredKeys = entries
      .filter(([, entry]) => now - entry.timestamp > entry.ttl)
      .map(([key]) => key);
    
    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.stats.evictionCount++;
    });

    // 如果还需要更多空间，根据策略清理
    if (this.cache.size >= config.maxSize) {
      const remainingEntries = Array.from(this.cache.entries());
      const toEvict = Math.ceil(config.maxSize * 0.1); // 清理10%
      
      let sortedEntries: [string, CacheEntry][];
      
      switch (config.strategy) {
        case 'lru':
          sortedEntries = remainingEntries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
          break;
        case 'lfu':
          sortedEntries = remainingEntries.sort(([, a], [, b]) => a.accessCount - b.accessCount);
          break;
        case 'fifo':
          sortedEntries = remainingEntries.sort(([, a], [, b]) => a.timestamp - b.timestamp);
          break;
        default:
          sortedEntries = remainingEntries.sort(([, a], [, b]) => a.timestamp - b.timestamp);
      }
      
      sortedEntries.slice(0, toEvict).forEach(([key]) => {
        this.cache.delete(key);
        this.stats.evictionCount++;
      });
    }
  }

  /**
   * 计算值的大小
   */
  private calculateSize(value: any): number {
    try {
      return JSON.stringify(value).length * 2; // 粗略估算，每个字符2字节
    } catch {
      return 1000; // 默认大小
    }
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    this.stats.totalEntries = this.cache.size;
    this.stats.totalSize = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0);
    
    const timestamps = Array.from(this.cache.values()).map(entry => entry.timestamp);
    if (timestamps.length > 0) {
      this.stats.oldestEntry = Math.min(...timestamps);
      this.stats.newestEntry = Math.max(...timestamps);
    }
  }

  /**
   * 更新命中率
   */
  private updateHitRate(): void {
    const total = this.stats.hitCount + this.stats.missCount;
    this.stats.hitRate = total > 0 ? (this.stats.hitCount / total) * 100 : 0;
  }

  /**
   * 重置统计信息
   */
  private resetStats(): void {
    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitCount: 0,
      missCount: 0,
      hitRate: 0,
      evictionCount: 0,
      averageAccessTime: 0,
      oldestEntry: 0,
      newestEntry: 0,
    };
  }
}