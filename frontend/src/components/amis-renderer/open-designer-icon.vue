<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';

import { useAuthStore } from '@/store/modules/auth';

defineOptions({
  name: 'OpenDesignerIcon'
});

const props = defineProps<{
  pageKey?: string;
  token?: string;
  objtitle?: string;
  lowcodePageInfo?: Api.Lowcode.PageInfo | null;
  menuId?: number | null;
}>();

const route = useRoute();

const authStore = useAuthStore();
const isLoading = ref(false);

// 动态计算设计器参数
const designerParams = computed(() => {
  const menuId = props.menuId || (route.meta?.menuId ? parseInt(route.meta.menuId, 10) : null);
  const pageInfo = props.lowcodePageInfo;

  return {
    pageKey: menuId,
    token: props.token || authStore.token || '',
    objtitle: props.objtitle || pageInfo?.title || route.meta?.title || '低代码页面'
  };
});

const handleNewTab = () => {
  if (isLoading.value) return;

  isLoading.value = true;

  try {
    // 构建设计器URL
    const baseUrl = 'http://localhost:9555/#/';
    const params = new URLSearchParams();
    const { pageKey, token, objtitle } = designerParams.value;

    if (pageKey) {
      params.append('pageKey', pageKey);
    }
    if (token) {
      params.append('token', token);
    }
    if (objtitle) {
      params.append('objtitle', objtitle);
    }

    const designerUrl = `${baseUrl}?${params.toString()}`;

    // 在新标签页中打开设计器
    window.open(designerUrl, '_blank');
  } catch (error) {
    console.error('Failed to open designer:', error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <icon-material-symbols:desktop-landscape-add-outline-rounded
    class="right-1 cursor-progress text-6 text-orange-400 transition-all absolute! -top-1"
    @click="handleNewTab"
  />
</template>
