/**
 * Performance optimization utilities for the low-code platform
 */

import { ref, nextTick } from 'vue';

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
