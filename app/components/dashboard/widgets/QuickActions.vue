<template>
  <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
    <div class="flex items-center gap-3 mb-4">
      <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-black dark:text-white">
        Быстрые действия
      </h3>
    </div>
    <div class="flex flex-wrap gap-3">
      <NuxtLink
        v-for="action in actions"
        :key="action.to"
        :to="action.to"
        class="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-primary hover:text-white hover:border-primary"
      >
        <component v-if="action.icon" :is="action.icon" class="w-4 h-4" />
        {{ action.label }}
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
defineProps({
  actions: {
    type: Array,
    required: true,
    // Each action: { to: string, label: string, icon?: Component }
  }
});
</script>
