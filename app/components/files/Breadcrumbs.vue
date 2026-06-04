<template>
  <div class="breadcrumbs">
    <div class="flex items-center gap-2 px-3 py-1 text-xs">
      <template v-for="(crumb, index) in path" :key="index">
        <router-link
          v-if="index < path.length - 1"
          :to="crumb.url"
          class="hover:text-primary transition-colors"
        >
          {{ crumb.label }}
        </router-link>
        <span v-else class="text-gray-500">{{ crumb.label }}</span>
        <svg v-if="index < path.length - 1" class="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-weight="2" d="M9 5l7 7-7 7" />
        </svg>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  path: { label: string; url: string }[];
}

defineProps<Props>();
</script>

<style scoped>
</style>