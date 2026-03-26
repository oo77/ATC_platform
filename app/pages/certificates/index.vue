<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок страницы -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-title-md2 font-bold text-black dark:text-white">
          Сертификаты
        </h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          База сертификатов и статистика по организациям
        </p>
      </div>

      <!-- Быстрые действия -->
      <div class="flex flex-wrap items-center gap-3">
        <NuxtLink
          to="/certificates/templates"
          class="inline-flex items-center gap-2 rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-strokedark dark:bg-boxdark dark:text-gray-300 dark:hover:bg-meta-4"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          Шаблоны
        </NuxtLink>
      </div>
    </div>

    <!-- Вкладки -->
    <div class="flex flex-col gap-6">
      <!-- Tabs Navigation -->
      <div class="rounded-lg bg-gray-50 p-1 dark:bg-gray-800">
        <nav class="flex gap-1" aria-label="Tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="changeTab(tab.id)"
            :class="[
              'flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition-all duration-200',
              activeTab === tab.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white',
            ]"
          >
            <component :is="tab.icon" class="h-4 w-4" />
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div>
        <!-- Список сертификатов -->
        <div v-show="activeTab === 'list'">
          <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
            <DatabaseCertificateManagementPanel />
          </div>
        </div>

        <!-- Организации -->
        <div v-show="activeTab === 'orgs'">
          <OrganizationsOrganizationManagementPanel />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { FileCheck, Users, BarChart3 } from 'lucide-vue-next';

definePageMeta({
  layout: 'default',
});

useHead({
  title: 'Сертификаты - АТЦ Платформа',
});

const route = useRoute();
const router = useRouter();

const tabs = [
  { id: 'list',  label: 'База сертификатов', icon: FileCheck },
  { id: 'orgs',  label: 'Организации', icon: Users },
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
