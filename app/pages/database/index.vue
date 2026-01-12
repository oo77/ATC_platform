<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок страницы -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-title-md2 font-bold text-black dark:text-white">
        База данных
      </h2>
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
            :disabled="tab.disabled"
            :class="[
              'flex-1 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200',
              activeTab === tab.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white',
              tab.disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent',
            ]"
          >
            <span class="flex items-center justify-center gap-2">
              {{ tab.label }}
              <span
                v-if="tab.disabled"
                class="inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-600 dark:text-gray-300"
              >
                Скоро
              </span>
            </span>
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <!-- База студентов Tab -->
        <div v-show="activeTab === 'students'" class="p-6">
          <DatabaseStudentManagementPanel />
        </div>

        <!-- База организаций Tab -->
        <div v-show="activeTab === 'organizations'" class="p-6">
          <OrganizationsOrganizationManagementPanel />
        </div>

        <!-- База сертификатов Tab -->
        <div v-show="activeTab === 'certificates'" class="p-6">
          <DatabaseCertificateManagementPanel />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// Определяем мета-данные страницы
definePageMeta({
  layout: 'default',
});

const route = useRoute();
const router = useRouter();

// Конфигурация вкладок
const tabs = [
  {
    id: 'students',
    label: 'База студентов',
    disabled: false,
  },
  {
    id: 'organizations',
    label: 'База организаций',
    disabled: false,
  },
  {
    id: 'courses',
    label: 'База курсов',
    disabled: true, // Пока отключено
  },
  {
    id: 'certificates',
    label: 'База сертификатов',
    disabled: false, // Активировано
  },
];

// Активная вкладка
const activeTab = ref<string>('students');

// Синхронизация с URL при загрузке и изменении
const syncTabWithUrl = () => {
    const tab = route.query.tab as string;
    if (tab && tabs.some(t => t.id === tab && !t.disabled)) {
        activeTab.value = tab;
    } else {
        activeTab.value = 'students';
    }
}

watch(() => route.query.tab, () => {
    syncTabWithUrl();
});

onMounted(() => {
    syncTabWithUrl();
});

// При изменении вкладки меняем URL
const changeTab = (id: string) => {
    if (activeTab.value !== id) {
        activeTab.value = id;
        router.push({ query: { ...route.query, tab: id } });
    }
};
</script>
