<template>
  <!-- Внешний враппер без двойного отступа: отступы даёт layout -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Единый заголовок страницы -->
    <UiPageHeader title="Файлы" description="Папки и документы платформы" />

    <!-- Файловый менеджер в карточке: скругление и граница вместо «голого» полотна -->
    <div class="h-[calc(100vh-13rem)] min-h-[480px] overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <FileManager />
    </div>
  </div>
</template>

<script setup lang="ts">
import FileManager from '~/components/files/FileManager.vue';

definePageMeta({
  layout: 'default',
});
</script>
