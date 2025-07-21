/**
 * Performance optimization utilities for the low-code platform
 */

import { ref, nextTick } from 'vue';

// Performance metrics interface
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Component performance tracker
export class ComponentPerformanceTracker {
  private static instance: ComponentPerformanceTracker;
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  static getInstance(): ComponentPerformanceTracker {
    if (!ComponentPerformanceTracker.instance) {
      ComponentPerformanceTracker.instance = new ComponentPerformanceTracker();
    }
    return ComponentPerformanceTracker.instance;
  }

  /**
   * Start tracking component render time
   */
  startRender(componentName: string): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.recordMetric({
        name: `component_render_${componentName}`,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        metadata: { componentName, type: 'render' },
      });

      // Log slow renders
      if (duration > 16) { // More than one frame at 60fps
        console.warn(`Slow render detected: ${componentName} took ${duration.toFixed(2)}ms`);
      }
    };
  }

  /**
   * Track API call performance
   */
  trackApiCall(url: string, method: string): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.recordMetric({
        name: 'api_call',
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        metadata: { url, method, type: 'api' },
      });
    };
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only recent metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(filter?: { name?: string; type?: string; since?: number }): PerformanceMetric[] {
    let filtered = this.metrics;

    if (filter) {
      if (filter.name) {
        filtered = filtered.filter(m => m.name.includes(filter.name!));
      }
      if (filter.type) {
        filtered = filtered.filter(m => m.metadata?.type === filter.type);
      }
      if (filter.since) {
        filtered = filtered.filter(m => m.timestamp >= filter.since!);
      }
    }

    return filtered;
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    totalMetrics: number;
    averageRenderTime: number;
    averageApiTime: number;
    slowComponents: string[];
    slowApis: string[];
  } {
    const renderMetrics = this.getMetrics({ type: 'render' });
    const apiMetrics = this.getMetrics({ type: 'api' });

    const averageRenderTime = renderMetrics.length > 0
      ? renderMetrics.reduce((sum, m) => sum + m.value, 0) / renderMetrics.length
      : 0;

    const averageApiTime = apiMetrics.length > 0
      ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length
      : 0;

    const slowComponents = renderMetrics
      .filter(m => m.value > 16)
      .map(m => m.metadata?.componentName)
      .filter((name, index, arr) => arr.indexOf(name) === index);

    const slowApis = apiMetrics
      .filter(m => m.value > 1000)
      .map(m => m.metadata?.url)
      .filter((url, index, arr) => arr.indexOf(url) === index);

    return {
      totalMetrics: this.metrics.length,
      averageRenderTime,
      averageApiTime,
      slowComponents,
      slowApis,
    };
  }

  /**
   * Initialize performance observers
   */
  initializeObservers(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return;
    }

    // Observe long tasks
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: 'long_task',
            value: entry.duration,
            unit: 'ms',
            timestamp: Date.now(),
            metadata: { type: 'long_task', startTime: entry.startTime },
          });

          if (entry.duration > 50) {
            console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`);
          }
        }
      });

      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    } catch (error) {
      console.warn('Long task observer not supported');
    }
  }

  /**
   * Cleanup observers
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

/**
 * Debounce function to limit the rate of function execution
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func.apply(null, args);
    }, delay);
  };
}

/**
 * Throttle function to limit the rate of function execution
 * @param func - Function to throttle
 * @param delay - Delay in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let lastExecTime = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(null, args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        func.apply(null, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

/**
 * Lazy loading hook for large datasets
 * @param loadFn - Function to load data
 * @param pageSize - Number of items per page
 * @returns Lazy loading utilities
 */
export function useLazyLoading<T>(
  loadFn: (page: number, size: number) => Promise<{ data: T[]; total: number }>,
  pageSize: number = 20
) {
  const data = ref<T[]>([]);
  const loading = ref(false);
  const hasMore = ref(true);
  const currentPage = ref(1);
  const total = ref(0);

  const loadMore = async () => {
    if (loading.value || !hasMore.value) return;

    try {
      loading.value = true;
      const result = await loadFn(currentPage.value, pageSize);
      
      if (currentPage.value === 1) {
        data.value = result.data;
      } else {
        data.value.push(...result.data);
      }
      
      total.value = result.total;
      hasMore.value = data.value.length < result.total;
      currentPage.value++;
    } catch (error) {
      console.error('Failed to load more data:', error);
    } finally {
      loading.value = false;
    }
  };

  const reset = () => {
    data.value = [];
    currentPage.value = 1;
    hasMore.value = true;
    total.value = 0;
  };

  const refresh = async () => {
    reset();
    await loadMore();
  };

  return {
    data,
    loading,
    hasMore,
    total,
    loadMore,
    reset,
    refresh
  };
}

/**
 * Virtual scrolling hook for large lists
 * @param items - Array of items
 * @param itemHeight - Height of each item
 * @param containerHeight - Height of the container
 * @returns Virtual scrolling utilities
 */
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number = 50,
  containerHeight: number = 400
) {
  const scrollTop = ref(0);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const bufferSize = Math.floor(visibleCount / 2);

  const startIndex = ref(0);
  const endIndex = ref(visibleCount);

  const updateVisibleRange = () => {
    const newStartIndex = Math.max(0, Math.floor(scrollTop.value / itemHeight) - bufferSize);
    const newEndIndex = Math.min(items.length, newStartIndex + visibleCount + bufferSize * 2);
    
    startIndex.value = newStartIndex;
    endIndex.value = newEndIndex;
  };

  const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement;
    scrollTop.value = target.scrollTop;
    updateVisibleRange();
  };

  const visibleItems = ref<T[]>([]);
  const offsetY = ref(0);
  const totalHeight = ref(0);

  const updateVisibleItems = () => {
    visibleItems.value = items.slice(startIndex.value, endIndex.value);
    offsetY.value = startIndex.value * itemHeight;
    totalHeight.value = items.length * itemHeight;
  };

  // Watch for changes and update visible items
  const update = () => {
    updateVisibleRange();
    updateVisibleItems();
  };

  return {
    visibleItems,
    offsetY,
    totalHeight,
    handleScroll,
    update
  };
}

/**
 * Memory optimization hook to prevent memory leaks
 * @returns Memory optimization utilities
 */
export function useMemoryOptimization() {
  const timers = new Set<NodeJS.Timeout>();
  const intervals = new Set<NodeJS.Timeout>();
  const listeners = new Map<EventTarget, { event: string; handler: EventListener }[]>();

  const addTimer = (timer: NodeJS.Timeout) => {
    timers.add(timer);
    return timer;
  };

  const addInterval = (interval: NodeJS.Timeout) => {
    intervals.add(interval);
    return interval;
  };

  const addEventListener = (target: EventTarget, event: string, handler: EventListener) => {
    target.addEventListener(event, handler);
    
    if (!listeners.has(target)) {
      listeners.set(target, []);
    }
    listeners.get(target)!.push({ event, handler });
  };

  const cleanup = () => {
    // Clear all timers
    timers.forEach(timer => clearTimeout(timer));
    timers.clear();

    // Clear all intervals
    intervals.forEach(interval => clearInterval(interval));
    intervals.clear();

    // Remove all event listeners
    listeners.forEach((eventList, target) => {
      eventList.forEach(({ event, handler }) => {
        target.removeEventListener(event, handler);
      });
    });
    listeners.clear();
  };

  return {
    addTimer,
    addInterval,
    addEventListener,
    cleanup
  };
}

/**
 * Cache hook for API responses
 * @param maxSize - Maximum cache size
 * @param ttl - Time to live in milliseconds
 * @returns Cache utilities
 */
export function useCache<K, V>(maxSize: number = 100, ttl: number = 5 * 60 * 1000) {
  const cache = new Map<K, { value: V; timestamp: number }>();

  const get = (key: K): V | null => {
    const item = cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > ttl) {
      cache.delete(key);
      return null;
    }

    return item.value;
  };

  const set = (key: K, value: V): void => {
    // Remove oldest items if cache is full
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    cache.set(key, { value, timestamp: Date.now() });
  };

  const has = (key: K): boolean => {
    const item = cache.get(key);
    if (!item) return false;

    if (Date.now() - item.timestamp > ttl) {
      cache.delete(key);
      return false;
    }

    return true;
  };

  const clear = (): void => {
    cache.clear();
  };

  const size = (): number => {
    return cache.size;
  };

  return {
    get,
    set,
    has,
    clear,
    size
  };
}
