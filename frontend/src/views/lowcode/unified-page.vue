<template>
  <div class="unified-page">
    <UnifiedPageManager
      :page-id="pageId"
      :page-type="pageType"
      :can-edit="canEdit"
      :title="pageTitle"
      :initial-data="initialData"
      :context="pageContext"
      @action="handlePageAction"
      @change="handlePageChange"
      @loaded="handlePageLoaded"
      @error="handlePageError"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/store/modules/auth';
import { useAppStore } from '@/store/modules/app';
import UnifiedPageManager from '@/components/lowcode/unified-page-manager.vue';
import { envConfig } from '@/utils/env-config';

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
  initialData: () => ({}),
  context: () => ({})
});

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const appStore = useAppStore();

// 响应式数据
const pageData = ref<Record<string, any>>({});
const pageSchema = ref<any>(null);

// 计算属性
const pageId = computed(() => {
  return props.pageId || route.params.pageId as string || route.meta?.pageId as string;
});

const pageType = computed(() => {
  return props.pageType || route.meta?.pageType as any || envConfig.getLowcodeConfig().defaultPageType;
});

const canEdit = computed(() => {
  // 检查用户权限
  const userPermissions = authStore.userInfo?.permissions || [];
  const requiredPermissions = route.meta?.permissions as string[] || [];
  
  if (requiredPermissions.length > 0) {
    const hasPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );
    if (!hasPermission) return false;
  }
  
  return props.canEdit && envConfig.getLowcodeConfig().enableDesigner;
});

const pageTitle = computed(() => {
  return props.title || route.meta?.title as string || '低代码页面';
});

const pageContext = computed(() => {
  const config = envConfig.getConfig();
  
  return {
    ...props.context,
    // 应用信息
    app: {
      name: config.appName,
      version: config.appVersion,
      env: config.env
    },
    // 用户信息
    user: authStore.userInfo,
    // 认证信息
    auth: {
      token: authStore.token,
      isLoggedIn: authStore.isLogin
    },
    // 路由信息
    route: {
      path: route.path,
      name: route.name,
      params: route.params,
      query: route.query,
      meta: route.meta
    },
    // 应用状态
    appState: {
      theme: appStore.theme,
      locale: appStore.locale,
      collapsed: appStore.siderCollapse
    },
    // 服务配置
    services: config.services,
    // API主机
    API_HOST: config.services.amis.baseURL
  };
});

const initialData = computed(() => {
  return {
    ...props.initialData,
    ...pageData.value,
    // 从路由参数中提取数据
    ...route.params,
    // 从查询参数中提取数据
    ...route.query
  };
});

// 事件处理
function handlePageAction(action: any) {
  console.log('页面动作:', action);
  
  // 处理特殊动作
  switch (action.actionType) {
    case 'url':
    case 'link':
      handleLinkAction(action);
      break;
    case 'dialog':
      handleDialogAction(action);
      break;
    case 'drawer':
      handleDrawerAction(action);
      break;
    case 'reload':
      handleReloadAction(action);
      break;
    case 'goBack':
      handleGoBackAction(action);
      break;
    case 'custom':
      handleCustomAction(action);
      break;
    default:
      // 其他动作可以在这里处理
      break;
  }
}

function handlePageChange(data: any) {
  console.log('页面数据变化:', data);
  pageData.value = { ...pageData.value, ...data };
}

function handlePageLoaded(schema: any) {
  console.log('页面加载完成:', schema);
  pageSchema.value = schema;
  
  // 更新页面标题
  if (schema.title && schema.title !== pageTitle.value) {
    document.title = `${schema.title} - ${envConfig.getAppConfig().name}`;
  }
}

function handlePageError(error: string) {
  console.error('页面加载错误:', error);
  window.$message?.error(`页面加载失败: ${error}`);
}

// 动作处理函数
function handleLinkAction(action: any) {
  const { url, link, blank } = action;
  const targetUrl = url || link;
  
  if (!targetUrl) return;
  
  if (blank || action.target === '_blank') {
    window.open(targetUrl, '_blank');
  } else if (targetUrl.startsWith('http')) {
    window.location.href = targetUrl;
  } else {
    router.push(targetUrl);
  }
}

function handleDialogAction(action: any) {
  // 处理对话框动作
  console.log('对话框动作:', action);
}

function handleDrawerAction(action: any) {
  // 处理抽屉动作
  console.log('抽屉动作:', action);
}

function handleReloadAction(action: any) {
  // 重新加载页面
  if (action.target === 'window') {
    window.location.reload();
  } else {
    // 重新加载组件
    router.go(0);
  }
}

function handleGoBackAction(action: any) {
  const { delta = -1 } = action;
  router.go(delta);
}

function handleCustomAction(action: any) {
  // 处理自定义动作
  console.log('自定义动作:', action);
  
  // 可以在这里添加自定义业务逻辑
  switch (action.script) {
    case 'openDesigner':
      // 打开设计器
      break;
    case 'exportData':
      // 导出数据
      break;
    case 'importData':
      // 导入数据
      break;
    default:
      break;
  }
}

// 生命周期
onMounted(() => {
  // 页面挂载后的初始化逻辑
  console.log('统一页面组件已挂载');
});
</script>

<style scoped>
.unified-page {
  height: 100%;
  width: 100%;
}
</style>
