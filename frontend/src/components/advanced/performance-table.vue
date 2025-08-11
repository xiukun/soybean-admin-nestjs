<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { NDataTable } from 'naive-ui';
import { debounce, useCache, useMemoryOptimization } from '@/utils/performance';

interface Props {
  columns: any[];
  data: any[];
  loading?: boolean;
  pagination?: any;
  rowKey?: string | ((row: any) => string);
  scrollX?: number;
  virtualScroll?: boolean;
  maxHeight?: number;
  enableCache?: boolean;
  cacheKey?: string;
  debounceDelay?: number;
}

interface Emits {
  (e: 'update:checked-row-keys', keys: string[]): void;
  (e: 'update:page', page: number): void;
  (e: 'update:page-size', pageSize: number): void;
  (e: 'update:sorter', sorter: any): void;
  (e: 'update:filters', filters: any): void;
  (e: 'selection-change', keys: string[]): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  rowKey: 'id',
  virtualScroll: false,
  maxHeight: 600,
  enableCache: true,
  debounceDelay: 300
});

const emit = defineEmits<Emits>();

// Refs
const tableRef = ref<InstanceType<typeof NDataTable>>();
const checkedRowKeys = ref<string[]>([]);

// Memory optimization
const { cleanup } = useMemoryOptimization();

// Cache for performance
const cache = useCache<string, any[]>(50, 10 * 60 * 1000); // 10 minutes TTL

// Computed properties
const visibleData = computed(() => {
  if (props.enableCache && props.cacheKey) {
    const cached = cache.get(props.cacheKey);
    if (cached) {
      return cached;
    }
  }

  const result = props.data;

  if (props.enableCache && props.cacheKey) {
    cache.set(props.cacheKey, result);
  }

  return result;
});

const paginationProps = computed(() => {
  if (!props.pagination) return false;

  return {
    ...props.pagination,
    showSizePicker: true,
    showQuickJumper: true,
    pageSizes: [10, 20, 50, 100],
    prefix: ({ itemCount }: { itemCount: number }) => `共 ${itemCount} 条`
  };
});

// Debounced handlers
const debouncedPageChange = debounce((page: number) => {
  emit('update:page', page);
}, props.debounceDelay);

const debouncedPageSizeChange = debounce((pageSize: number) => {
  emit('update:page-size', pageSize);
}, props.debounceDelay);

const debouncedSorterChange = debounce((sorter: any) => {
  emit('update:sorter', sorter);
}, props.debounceDelay);

const debouncedFiltersChange = debounce((filters: any) => {
  emit('update:filters', filters);
}, props.debounceDelay);

// Event handlers
function handlePageChange(page: number) {
  debouncedPageChange(page);
}

function handlePageSizeChange(pageSize: number) {
  debouncedPageSizeChange(pageSize);
}

function handleSorterChange(sorter: any) {
  debouncedSorterChange(sorter);
}

function handleFiltersChange(filters: any) {
  debouncedFiltersChange(filters);
}

function handleSelectionChange(keys: string[]) {
  checkedRowKeys.value = keys;
  emit('update:checked-row-keys', keys);
  emit('selection-change', keys);
}

// Performance monitoring
const performanceObserver = ref<PerformanceObserver | null>(null);

function startPerformanceMonitoring() {
  if (typeof PerformanceObserver !== 'undefined') {
    performanceObserver.value = new PerformanceObserver(list => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.duration > 100) {
          // Log slow operations
          console.warn(`Slow table operation detected: ${entry.name} took ${entry.duration}ms`);
        }
      });
    });

    performanceObserver.value.observe({ entryTypes: ['measure'] });
  }
}

function stopPerformanceMonitoring() {
  if (performanceObserver.value) {
    performanceObserver.value.disconnect();
    performanceObserver.value = null;
  }
}

// Lifecycle
onMounted(() => {
  startPerformanceMonitoring();
});

onUnmounted(() => {
  cleanup();
  stopPerformanceMonitoring();
});

// Watch for data changes and clear cache if needed
watch(
  () => props.data,
  () => {
    if (props.enableCache && props.cacheKey) {
      cache.clear();
    }
  },
  { deep: true }
);

// Expose methods
defineExpose({
  clearSelection: () => {
    checkedRowKeys.value = [];
  },
  selectAll: () => {
    checkedRowKeys.value = props.data.map(item =>
      typeof props.rowKey === 'function' ? props.rowKey(item) : item[props.rowKey as string]
    );
  },
  getSelectedRows: () => {
    return props.data.filter(item => {
      const key = typeof props.rowKey === 'function' ? props.rowKey(item) : item[props.rowKey as string];
      return checkedRowKeys.value.includes(key);
    });
  },
  scrollTo: (options: ScrollToOptions) => {
    if (tableRef.value) {
      const tableElement = tableRef.value.$el.querySelector('.n-data-table-base-table-body');
      if (tableElement) {
        tableElement.scrollTo(options);
      }
    }
  }
});
</script>

<template>
  <div class="performance-table">
    <NDataTable
      ref="tableRef"
      v-model:checked-row-keys="checkedRowKeys"
      :columns="columns"
      :data="visibleData"
      :loading="loading"
      :pagination="paginationProps"
      :row-key="rowKey"
      :scroll-x="scrollX"
      :virtual-scroll="virtualScroll"
      :max-height="maxHeight"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
      @update:sorter="handleSorterChange"
      @update:filters="handleFiltersChange"
      @update:checked-row-keys="handleSelectionChange"
    />
  </div>
</template>

<style scoped>
.performance-table {
  position: relative;
}

.performance-table :deep(.n-data-table) {
  /* Optimize rendering performance */
  contain: layout style paint;
}

.performance-table :deep(.n-data-table-tbody) {
  /* Enable hardware acceleration */
  transform: translateZ(0);
  will-change: transform;
}

.performance-table :deep(.n-data-table-tr) {
  /* Optimize row rendering */
  contain: layout style;
}

.performance-table :deep(.n-data-table-td) {
  /* Optimize cell rendering */
  contain: layout style paint;
}

/* Loading state optimization */
.performance-table :deep(.n-data-table--loading) {
  pointer-events: none;
}

/* Virtual scroll optimization */
.performance-table :deep(.n-scrollbar-content) {
  /* Smooth scrolling */
  scroll-behavior: smooth;
}

/* Responsive design */
@media (max-width: 768px) {
  .performance-table :deep(.n-data-table) {
    font-size: 12px;
  }

  .performance-table :deep(.n-data-table-th),
  .performance-table :deep(.n-data-table-td) {
    padding: 8px 4px;
  }
}
</style>
