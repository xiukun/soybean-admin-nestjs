<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, toRefs, watch } from 'vue';
import type { MessageType } from 'naive-ui';
import { nanoid } from '@sa/utils';
import { loadAmisSDK, normalizeLinkRefactor } from '@maita/amis-tools';
import json5 from 'json5';
import { router } from '@/router';
import { amisRequest } from '@/service/request/amis-request';
import { useThemeStore } from '@/store/modules/theme';
import { useAppStore } from '@/store/modules/app';
import { localStg } from '@/utils/storage';
import { getSelectedLangPack } from '@/locales/amis-index';
interface Props {
  schema?: any;
  locals?: any;
  attr?: any;
  env?: any;
}
interface Emits {
  (e: 'ready', payload: { scoped: any }): void;
}
defineOptions({
  name: 'AmisRenderer'
});

const themeStore = useThemeStore();
const appStore = useAppStore();
const props = withDefaults(defineProps<Props>(), {
  schema: undefined,
  locals: undefined,
  attr: undefined,
  env: undefined
});

const emit = defineEmits<Emits>();
const { schema, locals, attr, env } = toRefs(props);

const issueUpdates = (scoped: any) => {
  emit('ready', { scoped });
};
const context = ref({
  API_HOST: (() => {
    try {
      // 尝试解析为JSON5格式
      return json5.parse(import.meta.env.VITE_OTHER_SERVICE_BASE_URL).amisService;
    } catch (error) {
      console.warn('解析VITE_OTHER_SERVICE_BASE_URL失败:', error);
      // 如果解析失败，直接使用原始值
      return import.meta.env.VITE_SERVICE_BASE_URL;
    }
  })()
  // API_HOST:
  //       localStorage.getItem('__PRODUCTION__APP__CONF__API_BASE_URL') ||
  //       (window as any).__PRODUCTION__APP__CONF__?.VITE_APP_API_BASEURL ||
  //       json5.parse(import.meta.env.VITE_SERVICE_BASE_URL).amisService
});

const amisInstance: any = ref(null);
const themeMode = computed(() => (themeStore.darkMode ? 'dark' : 'antd'));
const mountAmis = async () => {
  if (!(window as any).amisRequire) {
    await loadAmisSDK();
  }

  const amisRequire = (window as any).amisRequire;
  const amisEmbed = amisRequire('amis/embed');
  const { normalizeLink } = amisRequire('amis-core');
  const replaceText = await getSelectedLangPack(appStore.locale || 'zh-CN');
  const scoped = amisEmbed.embed(
    '#amis_key',
    schema.value,
    {
      data: {
        ...locals.value
      },
      context: context.value,
      location: window.location,
      locale: localStg.get('lang') || 'zh-CN',
      ...attr.value
    },
    {
      replaceText,
      theme: themeMode.value,
      fetcher: ({
        url,
        method,
        data: originalData,
        responseType,
        config: originalConfig,
        headers
      }: {
        url: string;
        method: string;
        data?: any;
        responseType?: string;
        config?: any;
        headers?: Record<string, string>;
      }) => {
        const config = originalConfig || {};
        // config.withCredentials = true
        if (responseType) config.responseType = responseType;
        config.headers = { ...headers, 'Page-Auth': router.currentRoute.value.meta?.pageKey };

        if (method !== 'post' && method !== 'put' && method !== 'patch') {
          if (originalData) {
            config.params = originalData;
          }

          return (amisRequest().instance as any)[method](url, config);
        } else if (originalData && originalData instanceof FormData) {
          config.headers ||= {};
          config.headers['Content-Type'] = 'multipart/form-data';
        } else if (
          originalData &&
          typeof originalData !== 'string' &&
          !(originalData instanceof Blob) &&
          !(originalData instanceof ArrayBuffer)
        ) {
          const modifiedData = JSON.stringify(originalData);
          config.headers ||= {};
          config.headers['Content-Type'] = 'application/json';
          return amisRequest().instance[method](url, modifiedData, config);
        }

        return amisRequest().instance[method](url, originalData, config);
      },
      // 覆盖 amis env
      // 参考 https://aisuda.bce.baidu.com/amis/zh-CN/docs/start/getting-started#sdk
      jumpTo: (originalTo: any, action: any) => {
        if (originalTo === 'goBack') {
          router.go(-1);
          return;
        }

        let to = originalTo;
        if (location.hash.includes('#')) {
          to = normalizeLinkRefactor(location.hash.includes('#') ? `#${originalTo}` : originalTo);
          if (action?.actionType === 'url') {
            if (action.blank === false) {
              router.push(to.substring(to.indexOf('#') + 1));
            } else if (/^(http|https):\/\//.test(to.substring(to.indexOf('#') + 1))) {
              window.open(to.substring(to.indexOf('#') + 1));
            } else {
              window.open(to);
            }
            return;
          }
        } else {
          to = normalizeLinkRefactor(originalTo);
          if (action?.actionType === 'url') {
            if (action.blank === false) {
              router.push(to.substring(to.indexOf('#')));
            } else {
              window.open(to);
            }
            return;
          }
        }

        // 主要是支持 nav 中的跳转
        if (action && to && action.target) {
          window.open(to, action.target);
          return;
        }

        if (/^https?:\/\//.test(to)) {
          window.location.replace(to);
        } else {
          router.push(to);
        }
      },

      updateLocation: (originalTo: any, replace: any) => {
        if (originalTo === 'goBack') {
          router.go(-1);
          return;
        }

        let to = originalTo;
        if (location.hash.includes('#')) {
          to = normalizeLinkRefactor(location.hash.includes('#') ? `#${originalTo}` : originalTo);
          router.replace(to.substring(to.indexOf('#') + 1));
        } else {
          to = normalizeLink(originalTo, window.location);
          if (replace) {
            router.replace(to);
          } else {
            router.replace(to);
          }
        }
      },
      session: nanoid(),
      getModalContainer: () => {
        return document.getElementById('amis_key');
      },
      notify: (type: MessageType, messageText: string) => {
        window.$message?.create(messageText, {
          type,
          duration: 4000,
          closable: true
        });
      },
      ...env.value
    },
    () => {
      issueUpdates(scoped);
    }
  );
  amisInstance.value = scoped;
  return scoped;
};

const updateProps = () => {
  amisInstance.value?.updateProps(
    {
      data: {
        ...locals.value
      },
      context: context.value,
      ...attr.value
    },
    (err: any) => {
      console.log(err);
    }
  );
};

const refresh = async () => {
  // amisInstance.value.updateSchema(schema.value)
  await mountAmis();
};

watch([router.currentRoute, locals, attr], () => {
  updateProps();
});

watch(
  () => [appStore.locale, themeStore.themeScheme],
  async () => {
    refresh();
    appStore.reloadPage();
  }
);

watch(schema, async () => {
  if (amisInstance.value) {
    (amisInstance.value as any)?.unmount();
  }
  await mountAmis();
});

onMounted(async () => {
  try {
    await mountAmis();
  } catch (error) {
    console.warn(error);
  }
});

onUnmounted(() => {
  amisInstance.value?.unmount();
});

defineExpose({
  refresh
});
</script>

<template>
  <div id="amis_key" class="MaitaAmisContainer relative" />
</template>
