<script setup lang="ts">
import { computed, defineOptions, onActivated, onBeforeMount, onDeactivated, ref } from 'vue';
import { useRoute } from 'vue-router';
import { fetchGetLowcodePageByMenuId } from '@/service/api/lowcode';
import { useThemeStore } from '@/store/modules/theme';
import { useAppStore } from '@/store/modules/app';
import AmisRenderer from '@/components/amis-renderer/amis.vue';
import OpenDesignerIcon from '@/components/amis-renderer/open-designer-icon.vue';

defineOptions({
  name: 'AmisTemplatePage'
});

const route = useRoute();
const themeStore = useThemeStore();
const appStore = useAppStore();

const amisRef = ref();
const schema = ref({} as any);
const lowcodePageInfo = ref<Api.Lowcode.PageInfo | null>(null);
const themeMark = ref(themeStore.themeScheme);
const localeMark = ref(appStore.locale);

// 获取当前菜单ID（从路由meta中直接获取）
const currentMenuId = computed(() => {
  const menuId = route.meta?.menuId;
  return menuId ? Number.parseInt(menuId, 10) : null;
});

onBeforeMount(async () => {
  try {
    const menuId = currentMenuId.value;

    if (menuId) {
      // 直接通过菜单ID获取低代码页面数据
      const { data: pageInfo } = await fetchGetLowcodePageByMenuId(menuId);
      if (pageInfo) {
        lowcodePageInfo.value = pageInfo;
        schema.value = pageInfo.schema || {};
      } else {
        // 如果没有找到页面数据，使用默认schema
        schema.value = getDefaultSchema();
      }
    } else {
      // 如果没有找到菜单ID，使用默认schema
      schema.value = getDefaultSchema();
    }
  } catch (error) {
    console.error('Failed to load lowcode page:', error);
    // 出错时使用默认schema
    schema.value = getDefaultSchema();
  }
});

// 默认schema
const getDefaultSchema = () => ({
  type: 'page',
  title: '低代码页面',
  body: [
    {
      type: 'alert',
      level: 'info',
      body: '当前页面暂未配置低代码内容，请联系管理员进行配置。'
    }
  ]
});
// 刷新
const handleRefresh = () => {
  amisRef.value?.refresh();
};
onActivated(() => {
  if (themeMark.value !== themeStore.themeScheme || localeMark.value !== appStore.locale) {
    handleRefresh();
  }
});
onDeactivated(() => {
  themeMark.value = themeStore.themeScheme;
  localeMark.value = appStore.locale;
  // removeItemsFromLocalStorage(/^\/page\/body.*/); // 这将删除所有以"/page/body"开头的
});
</script>

<template>
  <div class="maita-amis-container">
    <AmisRenderer ref="amisRef" :schema="schema" />

    <div class="icon-float-right">
      <OpenDesignerIcon
        :lowcode-page-info="lowcodePageInfo"
        :menu-id="currentMenuId"
        :page-key="lowcodePageInfo?.id || `menu_${currentMenuId}`"
        :objtitle="lowcodePageInfo?.title || route.meta?.title || '低代码页面'"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.maita-amis-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.icon-float-right {
  position: absolute;
  right: 0;
  top: 30%;
  transform: translateY(-50%);
}
</style>
