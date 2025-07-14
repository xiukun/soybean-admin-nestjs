<script setup lang="ts">
import { defineOptions, onActivated, onBeforeMount, onDeactivated, ref } from 'vue';
import { amisApi } from '@/service/api/amis.api';
import { useThemeStore } from '@/store/modules/theme';
import { useAppStore } from '@/store/modules/app';
import AmisRenderer from '@/components/amis-renderer/amis.vue';
import OpenDesignerIcon from '@/components/amis-renderer/open-designer-icon.vue';
defineOptions({
  name: 'AmisTemplatePage'
});
const themeStore = useThemeStore();
const appStore = useAppStore();
const amisRef = ref();
const schema = ref({} as any);
const themeMark = ref(themeStore.themeScheme);
const localeMark = ref(appStore.locale);

onBeforeMount(async () => {
  const res = await amisApi.fetchGetAmisSchema();
  schema.value = res;
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
      <OpenDesignerIcon />
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
