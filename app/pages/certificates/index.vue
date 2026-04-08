<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Header Section -->
    <div class="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="space-y-2">
          <h1 class="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Сертификаты
          </h1>
          <p class="text-slate-500 font-medium">
            База сертификатов, статистика и управление организациями
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <NuxtLink
            to="/certificates/templates"
            class="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600"
          >
            <LayoutTemplate class="h-4 w-4" />
            Шаблоны сертификатов
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs (Bento-style chips) -->
    <div class="mb-8 overflow-x-auto custom-scrollbar pb-2">
      <div class="inline-flex rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">
        <nav class="flex gap-1" aria-label="Tabs">
          <button
            @click="changeTab('list')"
            :class="[
              'flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 whitespace-nowrap',
              activeTab === 'list'
                ? 'bg-white text-primary shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
            ]"
          >
            <FileCheck class="h-4 w-4" />
            База сертификатов
          </button>
          <button
            @click="changeTab('orgs')"
            :class="[
              'flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 whitespace-nowrap',
              activeTab === 'orgs'
                ? 'bg-white text-primary shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
            ]"
          >
            <Building2 class="h-4 w-4" />
            Организации
          </button>
        </nav>
      </div>
    </div>

    <!-- Tab Content -->
    <div>
      <!-- База сертификатов -->
      <div v-show="activeTab === 'list'" class="animate-in fade-in duration-300">
        <DatabaseCertificateManagementPanel />
      </div>

      <!-- Организации -->
      <div v-show="activeTab === 'orgs'" class="animate-in fade-in duration-300">
        <OrganizationsOrganizationManagementPanel />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { FileCheck, Building2, LayoutTemplate } from 'lucide-vue-next';

definePageMeta({
  layout: 'default',
});

useHead({
  title: 'Сертификаты - АТЦ Платформа',
});

const route = useRoute();
const router = useRouter();

const tabs = [
  { id: 'list', label: 'База сертификатов' },
  { id: 'orgs', label: 'Организации' },
];

const activeTab = ref<string>('list');

const syncTabWithUrl = () => {
  const tab = route.query.tab as string;
  if (tab && tabs.some(t => t.id === tab)) {
    activeTab.value = tab;
  } else {
    activeTab.value = 'list';
  }
};

watch(() => route.query.tab, () => syncTabWithUrl());
onMounted(() => syncTabWithUrl());

const changeTab = (id: string) => {
  if (activeTab.value !== id) {
    activeTab.value = id;
    router.push({ query: { ...route.query, tab: id } });
  }
};
</script>
