<script lang="ts" setup>
const handleNewTab = () => {
  window.open('https://maita-amis.pages.dev/', '_blank');
};
</script>

<template>
  <icon-material-symbols:desktop-landscape-add-outline-rounded
    class="right-1 cursor-progress text-6 text-orange-400 transition-all absolute! -top-1"
    @click="handleNewTab"
  />
</template>
