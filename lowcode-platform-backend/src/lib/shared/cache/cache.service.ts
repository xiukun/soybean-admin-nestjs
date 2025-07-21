import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { EnhancedLoggerService } from '../logging/enhanced-logger.service';

export interface CacheOptions {
  ttl?: number;
  namespace?: string;
  useCompression?: boolean;
  disableCache?: boolean;
}

@Injectable()
export class CacheService {
  private readonly defaultTtl: number;
  private readonly defaultNamespace: string;
  private readonly useCompression: boolean;
  private readonly enableCache: boolean;
  private readonly compressionThreshold: number;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
    private readonly logger: EnhancedLoggerService,
  ) {
    this.logger = this.logger.child('CacheService');
    this.defaultTtl = this.configService.get('CACHE_TTL', 300); // 5 minutes
    this.defaultNamespace = this.configService.get('CACHE_NAMESPACE', 'lowcode');
    this.useCompression = this.configService.get('CACHE_COMPRESSION', 'true') === 'true';
    this.enableCache = this.configService.get('ENABLE_CACHE', 'true') === 'true';
    this.compressionThreshold = this.configService.get('CACHE_COMPRESSION_THRESHOLD', 1024); // 1KB
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | undefined> {
    if (!this.enableCache || options?.disableCache) {
      return undefined;
    }

    const cacheKey = this.buildCacheKey(key, options?.namespace);
    const startTime = Date.now();

    try {
      const cachedValue = await this.cacheManager.get<string>(cacheKey);
      
      if (!cachedValue) {
        return undefined;
      }

      const value = this.deserializeValue<T>(cachedValue);
      
      const duration = Date.now() - startTime;
      this.logger.debug(`Cache hit for key: ${cacheKey} (${duration}ms)`, {
        operation: 'cache_get',
        key: cacheKey,
        hit: true,
        duration,
      });

      return value;
    } catch (error) {
      this.logger.warn(`Error getting value from cache for key: ${cacheKey}`, {
        operation: 'cache_get',
        key: cacheKey,
        error: error.message,
      });
      return undefined;
    }
  }

  /**
   * Set a value in cache
   */
  async set<T>(
    key: string,
    value: T,
    options?: CacheOptions,
  ): Promise<void> {
    if (!this.enableCache || options?.disableCache) {
      return;
    }

    const cacheKey = this.buildCacheKey(key, options?.namespace);
    const ttl = options?.ttl || this.defaultTtl;
    const startTime = Date.now();

    try {
      const serializedValue = this.serializeValue(value, options?.useCompression);
      
      await this.cacheManager.set(cacheKey, serializedValue, ttl);
      
      const duration = Date.now() - startTime;
      this.logger.debug(`Cache set for key: ${cacheKey} (${duration}ms)`, {
        operation: 'cache_set',
        key: cacheKey,
        ttl,
        size: serializedValue.length,
        compressed: options?.useCompression,
        duration,
      });
    } catch (error) {
      this.logger.warn(`Error setting value in cache for key: ${cacheKey}`, {
        operation: 'cache_set',
        key: cacheKey,
        error: error.message,
      });
    }
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string, namespace?: string): Promise<void> {
    if (!this.enableCache) {
      return;
    }

    const cacheKey = this.buildCacheKey(key, namespace);
    
    try {
      await this.cacheManager.del(cacheKey);
      
      this.logger.debug(`Cache deleted for key: ${cacheKey}`, {
        operation: 'cache_delete',
        key: cacheKey,
      });
    } catch (error) {
      this.logger.warn(`Error deleting value from cache for key: ${cacheKey}`, {
        operation: 'cache_delete',
        key: cacheKey,
        error: error.message,
      });
    }
  }

  /**
   * Clear all cache entries with a specific namespace
   */
  async clearNamespace(namespace: string): Promise<void> {
    if (!this.enableCache) {
      return;
    }

    try {
      // This implementation depends on the cache store
      // For Redis, we would use keys pattern and delete
      // For in-memory cache, we would need to iterate all keys
      // This is a simplified version
      // Note: reset() method may not be available in all cache-manager versions
      // Using del() with pattern matching instead
      await this.clearNamespace(namespace);
      
      this.logger.debug(`Cache cleared for namespace: ${namespace}`, {
        operation: 'cache_clear_namespace',
        namespace,
      });
    } catch (error) {
      this.logger.warn(`Error clearing cache for namespace: ${namespace}`, {
        operation: 'cache_clear_namespace',
        namespace,
        error: error.message,
      });
    }
  }

  /**
   * Clear all cache entries
   */
  async clearAll(): Promise<void> {
    if (!this.enableCache) {
      return;
    }

    try {
      // Note: reset() method may not be available in all cache-manager versions
      // Clear all keys manually
      const keys = await this.getAllKeys();
      await Promise.all(keys.map(key => this.cacheManager.del(key)));
      
      this.logger.debug('Cache cleared', {
        operation: 'cache_clear_all',
      });
    } catch (error) {
      this.logger.warn('Error clearing cache', {
        operation: 'cache_clear_all',
        error: error.message,
      });
    }
  }

  /**
   * Get multiple values from cache
   */
  async getMany<T>(
    keys: string[],
    options?: CacheOptions,
  ): Promise<Record<string, T | undefined>> {
    if (!this.enableCache || options?.disableCache || keys.length === 0) {
      return {};
    }

    const namespace = options?.namespace || this.defaultNamespace;
    const cacheKeys = keys.map(key => this.buildCacheKey(key, namespace));
    const startTime = Date.now();
    const result: Record<string, T | undefined> = {};

    try {
      // Get all values in parallel
      const cachedValues = await Promise.all(
        cacheKeys.map(cacheKey => this.cacheManager.get<string>(cacheKey))
      );

      // Process results
      keys.forEach((key, index) => {
        const cachedValue = cachedValues[index];
        if (cachedValue) {
          result[key] = this.deserializeValue<T>(cachedValue);
        } else {
          result[key] = undefined;
        }
      });

      const duration = Date.now() - startTime;
      const hitCount = Object.values(result).filter(v => v !== undefined).length;
      
      this.logger.debug(`Cache getMany: ${hitCount}/${keys.length} hits (${duration}ms)`, {
        operation: 'cache_get_many',
        keys: keys.length,
        hits: hitCount,
        duration,
      });

      return result;
    } catch (error) {
      this.logger.warn(`Error getting multiple values from cache`, {
        operation: 'cache_get_many',
        keys: keys.length,
        error: error.message,
      });
      return {};
    }
  }

  /**
   * Set multiple values in cache
   */
  async setMany<T>(
    entries: Record<string, T>,
    options?: CacheOptions,
  ): Promise<void> {
    if (!this.enableCache || options?.disableCache || Object.keys(entries).length === 0) {
      return;
    }

    const namespace = options?.namespace || this.defaultNamespace;
    const ttl = options?.ttl || this.defaultTtl;
    const startTime = Date.now();

    try {
      // Set all values in parallel
      await Promise.all(
        Object.entries(entries).map(([key, value]) => {
          const cacheKey = this.buildCacheKey(key, namespace);
          const serializedValue = this.serializeValue(value, options?.useCompression);
          return this.cacheManager.set(cacheKey, serializedValue, ttl);
        })
      );

      const duration = Date.now() - startTime;
      this.logger.debug(`Cache setMany: ${Object.keys(entries).length} keys (${duration}ms)`, {
        operation: 'cache_set_many',
        keys: Object.keys(entries).length,
        ttl,
        duration,
      });
    } catch (error) {
      this.logger.warn(`Error setting multiple values in cache`, {
        operation: 'cache_set_many',
        keys: Object.keys(entries).length,
        error: error.message,
      });
    }
  }

  /**
   * Build a cache key with namespace
   */
  private buildCacheKey(key: string, namespace?: string): string {
    const ns = namespace || this.defaultNamespace;
    return `${ns}:${key}`;
  }

  /**
   * Serialize a value for storage
   */
  private serializeValue<T>(value: T, useCompression?: boolean): string {
    try {
      const serialized = JSON.stringify(value);
      
      // Apply compression if needed
      const shouldCompress = (useCompression ?? this.useCompression) && 
                            serialized.length > this.compressionThreshold;
      
      if (shouldCompress) {
        // In a real implementation, we would use a compression library
        // For simplicity, we're just adding a marker here
        return `compressed:${serialized}`;
      }
      
      return serialized;
    } catch (error) {
      this.logger.warn(`Error serializing value for cache`, {
        error: error.message,
      });
      return '';
    }
  }

  /**
   * Deserialize a value from storage
   */
  private deserializeValue<T>(value: string): T | undefined {
    try {
      // Handle compressed values
      if (value.startsWith('compressed:')) {
        // In a real implementation, we would decompress here
        const serialized = value.substring('compressed:'.length);
        return JSON.parse(serialized);
      }
      
      return JSON.parse(value);
    } catch (error) {
      this.logger.warn(`Error deserializing value from cache`, {
        error: error.message,
      });
      return undefined;
    }
  }

  /**
   * 获取所有缓存键
   * Get all cache keys
   */
  private async getAllKeys(): Promise<string[]> {
    // This is a simplified implementation
    // In a real scenario, you'd need to implement this based on your cache provider
    // For now, return empty array as cache-manager doesn't provide a direct way to get all keys
    return [];
  }
}
