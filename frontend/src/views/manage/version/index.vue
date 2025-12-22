<script setup lang="ts">
import { NCard, NEmpty } from 'naive-ui';
</script>

<template>
  <div class="h-full">
    <NCard :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <div class="pb-12px">
          <h2 class="text-18px font-bold">{{ $t('page.manage.version.title') }}</h2>
        </div>
        <div class="flex-1">
          <!-- 版本管理内容将在后续实现 -->
          <NEmpty :description="$t('common.lookForward')" />
        </div>
      </div>
    </NCard>
  </div>
</template>

<style scoped></style>
