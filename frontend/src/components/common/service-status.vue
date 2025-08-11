<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getAllServices } from '@/service/gateway';
import { checkServicesHealth } from '@/service/request/router';
import { $t } from '@/locales';

const serviceConfigs = getAllServices().reduce(
  (acc, config, index) => {
    const key = index === 0 ? 'baseSystem' : 'lowcodePlatform';
    acc[key] = config;
    return acc;
  },
  {} as Record<string, any>
);

const serviceHealth = ref<Record<string, boolean>>({
  baseSystem: false,
  lowcodePlatform: false
});

const checking = ref(false);
const lastCheckTime = ref<string>('');

const allServicesHealthy = computed(() => {
  return Object.values(serviceHealth.value).every(status => status);
});

const statusText = computed(() => {
  const healthyCount = Object.values(serviceHealth.value).filter(status => status).length;
  const totalCount = Object.keys(serviceHealth.value).length;

  if (healthyCount === totalCount) {
    return $t('common.allServicesOnline');
  } else if (healthyCount === 0) {
    return $t('common.allServicesOffline');
  }
  return $t('common.partialServicesOnline', { healthy: healthyCount, total: totalCount });
});

async function checkHealth() {
  if (checking.value) return;

  try {
    checking.value = true;
    const health = await checkServicesHealth();
    serviceHealth.value = health;
    lastCheckTime.value = new Date().toLocaleTimeString();
  } catch (error) {
    console.error('Failed to check service health:', error);
    // Set all services as offline on error
    Object.keys(serviceHealth.value).forEach(key => {
      serviceHealth.value[key] = false;
    });
  } finally {
    checking.value = false;
  }
}

// Auto check health every 30 seconds
let healthCheckInterval: NodeJS.Timeout;

onMounted(() => {
  checkHealth();

  healthCheckInterval = setInterval(() => {
    checkHealth();
  }, 30000);
});

onUnmounted(() => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }
});
</script>

<template>
  <div class="service-status">
    <NSpace align="center">
      <NIcon size="16" :color="allServicesHealthy ? '#18a058' : '#d03050'">
        <icon-mdi:server-network v-if="allServicesHealthy" />
        <icon-mdi:server-network-off v-else />
      </NIcon>

      <NText :depth="allServicesHealthy ? 3 : 1" :type="allServicesHealthy ? 'success' : 'error'">
        {{ statusText }}
      </NText>

      <NPopover trigger="hover" placement="bottom">
        <template #trigger>
          <NButton text size="small" @click="checkHealth">
            <template #icon>
              <NIcon :class="{ 'animate-spin': checking }">
                <icon-mdi:refresh />
              </NIcon>
            </template>
          </NButton>
        </template>

        <div class="service-details">
          <div class="mb-2">
            <NText strong>{{ $t('common.serviceStatus') }}</NText>
          </div>

          <NSpace vertical size="small">
            <div v-for="(config, key) in serviceConfigs" :key="key" class="service-item">
              <NSpace align="center" justify="space-between">
                <NSpace align="center">
                  <NIcon size="12" :color="serviceHealth[key] ? '#18a058' : '#d03050'">
                    <icon-mdi:circle />
                  </NIcon>
                  <NText>{{ config.name }}</NText>
                </NSpace>

                <NTag size="small" :type="serviceHealth[key] ? 'success' : 'error'">
                  {{ serviceHealth[key] ? $t('common.online') : $t('common.offline') }}
                </NTag>
              </NSpace>

              <NText depth="3" class="mt-1 text-xs">
                {{ config.description }}
              </NText>
            </div>
          </NSpace>

          <NDivider class="my-3" />

          <NSpace justify="space-between" align="center">
            <NText depth="3" class="text-xs">{{ $t('common.lastCheck') }}: {{ lastCheckTime }}</NText>

            <NButton size="tiny" :loading="checking" @click="checkHealth">
              {{ $t('common.refresh') }}
            </NButton>
          </NSpace>
        </div>
      </NPopover>
    </NSpace>
  </div>
</template>

<style scoped>
.service-status {
  display: inline-flex;
  align-items: center;
}

.service-details {
  min-width: 280px;
  padding: 8px;
}

.service-item {
  padding: 4px 0;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
