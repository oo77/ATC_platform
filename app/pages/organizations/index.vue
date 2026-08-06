<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Header Section -->
    <div class="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="space-y-1">
          <div class="flex items-center space-x-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 class="h-5 w-5" />
            </div>
            <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
              Организации
            </h1>
          </div>
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400 pl-13">
            Реестр партнерских организаций, ИНН, реквизиты и слушатели
          </p>
        </div>
      </div>
    </div>

    <!-- Management Panel Component -->
    <div class="animate-in fade-in duration-300">
      <OrganizationsOrganizationManagementPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Building2 } from 'lucide-vue-next';

definePageMeta({
  layout: 'default',
});

useHead({
  title: 'Организации - АТЦ Платформа',
});
</script>
