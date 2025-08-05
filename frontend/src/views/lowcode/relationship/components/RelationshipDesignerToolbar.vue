<template>
  <div class="relationship-toolbar">
    <n-space>
      <!-- 连线模式 -->
      <n-tooltip placement="bottom">
        <template #trigger>
          <n-button 
            quaternary 
            circle 
            :type="isConnectMode ? 'primary' : 'default'" 
            @click="$emit('toggle-connect-mode')"
          >
            <template #icon>
              <icon-mdi-connection class="text-16px" />
            </template>
          </n-button>
        </template>
        <span>{{ $t('page.lowcode.relationship.toolbar.connectMode') }}</span>
      </n-tooltip>

      <!-- 自动布局 -->
      <n-tooltip placement="bottom">
        <template #trigger>
          <n-button 
            quaternary 
            circle 
            :loading="layoutLoading"
            @click="$emit('auto-layout')"
          >
            <template #icon>
              <icon-mdi-auto-fix class="text-16px" />
            </template>
          </n-button>
        </template>
        <span>{{ $t('page.lowcode.relationship.toolbar.autoLayout') }}</span>
      </n-tooltip>

      <!-- 小地图 -->
      <n-tooltip placement="bottom">
        <template #trigger>
          <n-button 
            quaternary 
            circle 
            @click="$emit('toggle-minimap')"
          >
            <template #icon>
              <icon-mdi-map class="text-16px" />
            </template>
          </n-button>
        </template>
        <span>{{ $t('page.lowcode.relationship.toolbar.minimap') || '小地图' }}</span>
      </n-tooltip>

      <!-- 连接点显示 -->
      <n-tooltip placement="bottom">
        <template #trigger>
          <n-button 
            quaternary 
            circle 
            :type="showConnectionPoints ? 'primary' : 'default'"
            @click="$emit('toggle-connection-points')"
          >
            <template #icon>
              <icon-mdi-circle-outline class="text-16px" />
            </template>
          </n-button>
        </template>
        <span>显示连接点</span>
      </n-tooltip>

      <n-divider vertical />

      <!-- 缩放控制 -->
      <n-tooltip placement="bottom">
        <template #trigger>
          <n-button 
            quaternary 
            circle 
            @click="$emit('zoom-in')"
          >
            <template #icon>
              <icon-mdi-magnify-plus-outline class="text-16px" />
            </template>
          </n-button>
        </template>
        <span>{{ $t('page.lowcode.relationship.toolbar.zoomIn') }}</span>
      </n-tooltip>

      <n-tooltip placement="bottom">
        <template #trigger>
          <n-button 
            quaternary 
            circle 
            @click="$emit('zoom-out')"
          >
            <template #icon>
              <icon-mdi-magnify-minus-outline class="text-16px" />
            </template>
          </n-button>
        </template>
        <span>{{ $t('page.lowcode.relationship.toolbar.zoomOut') }}</span>
      </n-tooltip>

      <n-tooltip placement="bottom">
        <template #trigger>
          <n-button 
            quaternary 
            circle 
            @click="$emit('fit-view')"
          >
            <template #icon>
              <icon-mdi-fit-to-page-outline class="text-16px" />
            </template>
          </n-button>
        </template>
        <span>{{ $t('page.lowcode.relationship.toolbar.fitCanvas') }}</span>
      </n-tooltip>

      <n-divider vertical />

      <!-- 网格控制 -->
      <n-tooltip placement="bottom">
        <template #trigger>
          <n-button 
            quaternary 
            circle 
            @click="$emit('toggle-grid')"
          >
            <template #icon>
              <icon-mdi-grid class="text-16px" />
            </template>
          </n-button>
        </template>
        <span>{{ $t('page.lowcode.relationship.toolbar.toggleGrid') || '显示/隐藏网格' }}</span>
      </n-tooltip>

      <n-tooltip placement="bottom">
        <template #trigger>
          <n-button 
            quaternary 
            circle 
            @click="$emit('toggle-snap-to-grid')"
          >
            <template #icon>
              <icon-mdi-magnet class="text-16px" />
            </template>
          </n-button>
        </template>
        <span>{{ $t('page.lowcode.relationship.toolbar.snapToGrid') || '对齐网格' }}</span>
      </n-tooltip>

      <n-divider vertical />

      <!-- 导出功能 -->
      <n-dropdown 
        trigger="click" 
        :options="exportOptions" 
        @select="$emit('export', $event)"
      >
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button quaternary circle>
              <template #icon>
                <icon-mdi-export class="text-16px" />
              </template>
            </n-button>
          </template>
          <span>{{ $t('page.lowcode.relationship.toolbar.export') }}</span>
        </n-tooltip>
      </n-dropdown>

      <!-- 保存状态 -->
      <n-tooltip placement="bottom">
        <template #trigger>
          <n-button 
            quaternary 
            circle 
            @click="$emit('save-state')"
          >
            <template #icon>
              <icon-mdi-content-save class="text-16px" />
            </template>
          </n-button>
        </template>
        <span>{{ $t('page.lowcode.relationship.toolbar.saveState') || '保存状态' }}</span>
      </n-tooltip>
    </n-space>

    <!-- 缩放显示 -->
    <div class="zoom-display">
      {{ Math.round(zoomLevel * 100) }}%
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { NButton, NSpace, NTooltip, NDivider, NDropdown } from 'naive-ui';

/**
 * 关系设计器工具栏组件
 * @description 提供关系设计器的所有工具栏功能，包括连线模式、布局、缩放、网格等控制
 */

interface Props {
  /** 是否处于连线模式 */
  isConnectMode: boolean;
  /** 是否正在执行自动布局 */
  layoutLoading: boolean;
  /** 是否显示连接点 */
  showConnectionPoints: boolean;
  /** 当前缩放级别 */
  zoomLevel: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'toggle-connect-mode': [];
  'auto-layout': [];
  'toggle-minimap': [];
  'toggle-connection-points': [];
  'zoom-in': [];
  'zoom-out': [];
  'fit-view': [];
  'toggle-grid': [];
  'toggle-snap-to-grid': [];
  'export': [type: string];
  'save-state': [];
}>();

const { t } = useI18n();

/**
 * 导出选项配置
 * @returns 导出格式选项列表
 */
const exportOptions = computed(() => [
  { label: t('page.lowcode.relationship.exportOptions.png'), key: 'png' },
  { label: t('page.lowcode.relationship.exportOptions.jpg'), key: 'jpg' },
  { label: t('page.lowcode.relationship.exportOptions.svg'), key: 'svg' },
  { label: t('page.lowcode.relationship.exportOptions.json'), key: 'json' }
]);
</script>

<style scoped>
.relationship-toolbar {
  @apply flex items-center justify-between p-3 bg-white border-b border-gray-200;
}

.zoom-display {
  @apply text-sm text-gray-600 font-mono;
}
</style>