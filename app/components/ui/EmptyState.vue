<template>
  <!-- UiEmptyState — одинаковое «пусто» везде: что случилось + что делать дальше -->
  <div class="flex flex-col items-center justify-center px-6 py-12 text-center">
    <span class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/[0.06]">
      <component :is="icon || Inbox" class="h-6 w-6" />
    </span>
    <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">{{ title }}</p>
    <p v-if="description" class="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">{{ description }}</p>
    <!-- Следующий шаг: «Сбросить фильтры» или «Добавить» — чтобы не было тупика -->
    <div v-if="$slots.actions" class="mt-4 flex flex-wrap justify-center gap-2"><slot name="actions" /></div>
  </div>
</template>

<script setup lang="ts">
import { Inbox } from 'lucide-vue-next'
defineProps<{ title: string; description?: string; icon?: object }>()
</script>
