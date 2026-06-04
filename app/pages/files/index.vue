<template>
  <div class="h-[calc(100vh-8rem)]">
    <FileManager />
  </div>
</template>

<script setup lang="ts">
import FileManager from '~/components/files/FileManager.vue';

definePageMeta({
  layout: 'default',
});
</script>