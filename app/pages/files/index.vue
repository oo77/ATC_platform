<template>
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <UiPageHeader title="Файлы" description="Папки и документы платформы. Перетаскивайте файлы в окно, чтобы загрузить; Ctrl+клик — множественный выбор." />

    <!-- Менеджер занимает всю высоту окна под заголовком -->
    <div class="h-[calc(100vh-13rem)] min-h-[520px] overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <FileManager />
    </div>
  </div>
</template>

<script setup lang="ts">
import FileManager from '~/components/files/FileManager.vue';

definePageMeta({ layout: 'default' });
useHead({ title: 'Файлы' });
</script>
