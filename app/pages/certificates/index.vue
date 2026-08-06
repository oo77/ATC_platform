<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Header Section -->
    <div class="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="space-y-1">
          <div class="flex items-center space-x-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Award class="h-5 w-5" />
            </div>
            <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
              База сертификатов
            </h1>
          </div>
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400 pl-13">
            Централизованный реестр выданных сертификатов, генерация документов и поиск
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <NuxtLink
            to="/certificates/templates"
            class="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600"
          >
            <LayoutTemplate class="h-4 w-4 text-primary" />
            <span>Шаблоны сертификатов</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Main Certificate Management Panel -->
    <div class="animate-in fade-in duration-300">
      <DatabaseCertificateManagementPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Award, LayoutTemplate } from 'lucide-vue-next';

definePageMeta({
  layout: 'default',
});

useHead({
  title: 'База сертификатов - АТЦ Платформа',
});
</script>
