<template>
  <div class="unified-page-manager">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <n-breadcrumb>
          <n-breadcrumb-item>{{ $t('page.lowcode.title') }}</n-breadcrumb-item>
          <n-breadcrumb-item>{{ currentPageTitle }}</n-breadcrumb-item>
        </n-breadcrumb>
      </div>
      <div class="header-right">
        <n-space>
          <!-- 服务状态指示器 -->
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-badge :dot="true" :type="serviceStatus.allHealthy ? 'success' : 'error'">
                <n-button size="small" @click="checkServicesHealth">
                  <template #icon>
                    <svg-icon icon="ic:round-health-and-safety" />
                  </template>
                </n-button>
              </n-badge>
            </template>
            <div>
              <div>后端服务: {{ serviceStatus.backend ? '✅' : '❌' }}</div>
              <div>低代码平台: {{ serviceStatus.lowcode ? '✅' : '❌' }}</div>
              <div>Amis后端: {{ serviceStatus.amis ? '✅' : '❌' }}</div>
            </div>
          </n-tooltip>

          <!-- 页面操作按钮 -->
          <n-button v-if="canEdit" type="primary" size="small" @click="openDesigner">
            <template #icon>
              <svg-icon icon="ic:round-design-services" />
            </template>
            {{ $t('page.lowcode.openDesigner') }}
          </n-button>

          <n-button size="small" @click="refreshPage">
            <template #icon>
              <svg-icon icon="ic:round-refresh" />
            </template>
            {{ $t('common.refresh') }}
          </n-button>
        </n-space>
      </div>
    </div>

    <!-- 页面内容 -->
    <div class="page-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <n-spin size="large">
          <template #description>
            {{ $t('page.lowcode.loading') }}
          </template>
        </n-spin>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-container">
        <n-result status="error" :title="$t('page.lowcode.loadError')" :description="error">
          <template #footer>
            <n-button @click="refreshPage">{{ $t('common.retry') }}</n-button>
          </template>
        </n-result>
      </div>

      <!-- Amis渲染器 -->
      <div v-else class="amis-container">
        <amis-renderer
          :schema="pageSchema"
          :data="pageData"
          :context="amisContext"
          @action="handleAmisAction"
          @change="handleAmisChange"
        />
      </div>
    </div>

    <!-- 设计器弹窗 -->
    <n-modal
      v-model:show="designerVisible"
      :mask-closable="false"
      :close-on-esc="false"
      style="width: 95vw; height: 95vh"
      preset="card"
      :title="$t('page.lowcode.designer')"
    >
      <iframe
        v-if="designerUrl"
        :src="designerUrl"
        style="width: 100%; height: 80vh; border: none"
        @load="handleDesignerLoad"
      />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { 
  NBreadcrumb, 
  NBreadcrumbItem, 
  NSpace, 
  NButton, 
  NTooltip, 
  NBadge, 
  NSpin, 
  NResult, 
  NModal 
} from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { $t } from '@/locales';
import { useAuthStore } from '@/store/modules/auth';
import SvgIcon from '@/components/custom/svg-icon.vue';
import AmisRenderer from '@/components/amis-renderer/amis.vue';
import { unifiedApi } from '@/service/api/unified-api';

interface Props {
  /** 页面ID */
  pageId?: string;
  /** 页面类型 */
  pageType?: 'amis' | 'lowcode' | 'custom';
  /** 是否可编辑 */
  canEdit?: boolean;
  /** 页面标题 */
  title?: string;
  /** 初始数据 */
  initialData?: Record<string, any>;
  /** 上下文数据 */
  context?: Record<string, any>;
}

const props = withDefaults(defineProps<Props>(), {
  pageType: 'amis',
  canEdit: true,
  title: '低代码页面',
  initialData: () => ({}),
  context: () => ({})
});

const emit = defineEmits<{
  action: [action: any];
  change: [data: any];
  loaded: [schema: any];
  error: [error: string];
}>();

const route = useRoute();
const authStore = useAuthStore();

// 状态管理
const { bool: loading, setTrue: startLoading, setFalse: stopLoading } = useBoolean(false);
const { bool: designerVisible, setTrue: showDesigner, setFalse: hideDesigner } = useBoolean(false);

const error = ref<string>('');
const pageSchema = ref<any>(null);
const pageData = ref<Record<string, any>>({});
const serviceStatus = ref({
  backend: false,
  lowcode: false,
  amis: false,
  allHealthy: false
});

// 计算属性
const currentPageId = computed(() => props.pageId || route.params.id as string);
const currentPageTitle = computed(() => props.title || route.meta?.title || '低代码页面');

const amisContext = computed(() => ({
  ...props.context,
  API_HOST: getApiHost(),
  token: authStore.token,
  user: authStore.userInfo
}));

const designerUrl = computed(() => {
  if (!currentPageId.value) return '';
  
  const baseUrl = import.meta.env.VITE_DESIGNER_URL || 'http://localhost:3001';
  const params = new URLSearchParams({
    pageKey: currentPageId.value,
    token: authStore.token || '',
    title: currentPageTitle.value
  });
  
  return `${baseUrl}?${params.toString()}`;
});

// 方法
function getApiHost() {
  try {
    const serviceUrls = JSON.parse(import.meta.env.VITE_OTHER_SERVICE_BASE_URL || '{}');
    return serviceUrls.amisService || import.meta.env.VITE_SERVICE_BASE_URL;
  } catch {
    return import.meta.env.VITE_SERVICE_BASE_URL;
  }
}

async function loadPageSchema() {
  if (!currentPageId.value) {
    error.value = '页面ID不能为空';
    return;
  }

  try {
    startLoading();
    error.value = '';

    let schema;
    
    // 根据页面类型加载不同的schema
    switch (props.pageType) {
      case 'amis':
        const amisResponse = await unifiedApi.amisPage.getPageConfig(currentPageId.value);
        schema = amisResponse.data;
        break;
      
      case 'lowcode':
        // 从低代码平台加载页面配置
        const lowcodeResponse = await fetch(`/api/v1/lowcode/code-generation/page`);
        const lowcodeData = await lowcodeResponse.json();
        schema = lowcodeData.data;
        break;
      
      default:
        throw new Error(`不支持的页面类型: ${props.pageType}`);
    }

    if (!schema) {
      throw new Error('页面配置为空');
    }

    pageSchema.value = schema;
    pageData.value = { ...props.initialData };
    
    emit('loaded', schema);
  } catch (err: any) {
    error.value = err.message || '加载页面失败';
    emit('error', error.value);
  } finally {
    stopLoading();
  }
}

async function checkServicesHealth() {
  try {
    const health = await unifiedApi.health.checkAllServicesHealth();
    serviceStatus.value = {
      backend: !!health.backend,
      lowcode: !!health.lowcode,
      amis: !!health.amis,
      allHealthy: health.allHealthy
    };
  } catch (err) {
    console.error('健康检查失败:', err);
    serviceStatus.value = {
      backend: false,
      lowcode: false,
      amis: false,
      allHealthy: false
    };
  }
}

function refreshPage() {
  loadPageSchema();
}

function openDesigner() {
  if (!props.canEdit) {
    window.$message?.warning('当前页面不支持编辑');
    return;
  }
  
  showDesigner();
}

function handleDesignerLoad() {
  // 设计器加载完成后的处理
  console.log('设计器已加载');
}

function handleAmisAction(action: any) {
  console.log('Amis Action:', action);
  emit('action', action);
  
  // 处理特殊动作
  switch (action.actionType) {
    case 'refresh':
      refreshPage();
      break;
    case 'openDesigner':
      openDesigner();
      break;
    default:
      // 其他动作交给父组件处理
      break;
  }
}

function handleAmisChange(data: any) {
  pageData.value = { ...pageData.value, ...data };
  emit('change', data);
}

// 监听页面ID变化
watch(() => currentPageId.value, () => {
  if (currentPageId.value) {
    loadPageSchema();
  }
}, { immediate: true });

// 生命周期
onMounted(() => {
  checkServicesHealth();
});
</script>

<style scoped>
.unified-page-manager {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  background: var(--card-color);
}

.page-content {
  flex: 1;
  overflow: hidden;
}

.loading-container,
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.amis-container {
  height: 100%;
  overflow: auto;
}
</style>
