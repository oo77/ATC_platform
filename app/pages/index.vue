<template>
  <div>
    <!-- Student Dashboard -->
    <DashboardStudent v-if="isStudent" />

    <!-- Teacher Dashboard -->
    <DashboardTeacher v-else-if="isTeacher" />

    <!-- Manager Dashboard -->
    <DashboardManager v-else-if="isManager" />

    <!-- Admin Dashboard -->
    <DashboardAdmin v-else-if="isAdmin" />

    <!-- Default Dashboard (fallback) -->
    <div v-else class="grid grid-cols-12 gap-4 md:gap-6">
      <div class="col-span-12">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h1 class="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Панель управления
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Welcome to TailAdmin Nuxt 4 Dashboard!
          </p>
        </div>
      </div>
      
      <div class="col-span-12 lg:col-span-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            Monthly Revenue
          </h2>
          <p class="text-3xl font-bold text-brand-500">$24,780</p>
        </div>
      </div>
      
      <div class="col-span-12 lg:col-span-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            Total Orders
          </h2>
          <p class="text-3xl font-bold text-success-500">1,234</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePermissions } from '~/composables/usePermissions';

definePageMeta({
  layout: 'default',
  title: 'Панель управления'
})

useHead({
  title: 'Панель управления'
})

const { isStudent, isTeacher, isManager, isAdmin } = usePermissions();
</script>

