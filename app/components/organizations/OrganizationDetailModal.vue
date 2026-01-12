<template>
  <UiModal :is-open="isOpen" @close="handleClose" size="xl">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <h3 class="text-xl font-semibold text-black dark:text-white">
            {{ organization?.name }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Код: {{ organization?.code }}
          </p>
        </div>
      </div>
    </template>

    <template #default>
      <div v-if="organization" class="space-y-6">
        <!-- Статус -->
        <div class="flex items-center gap-2 flex-wrap">
          <span
            class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
            :class="organization.isActive 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'"
          >
            {{ organization.isActive ? 'Активна' : 'Неактивна' }}
          </span>
          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
            {{ organization.studentsCount }} слушателей
          </span>
        </div>

        <!-- Статистика обучения -->
        <div class="bg-gradient-to-r from-primary/5 to-success/5 dark:from-primary/10 dark:to-success/10 rounded-xl p-5 border border-primary/10 dark:border-primary/20">
          <h4 class="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Статистика обучения
          </h4>
          
          <!-- Загрузка статистики -->
          <div v-if="loadingStats" class="flex items-center justify-center py-6">
            <div class="h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-t-transparent mr-2"></div>
            <span class="text-gray-500 dark:text-gray-400">Загрузка статистики...</span>
          </div>
          
          <!-- Карточки статистики -->
          <div v-else-if="stats" class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-white dark:bg-boxdark rounded-lg p-4 text-center shadow-sm">
              <p class="text-3xl font-bold text-primary">{{ stats.totalStudents }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Всего сотрудников</p>
            </div>
            <div class="bg-white dark:bg-boxdark rounded-lg p-4 text-center shadow-sm">
              <p class="text-3xl font-bold text-success">{{ stats.trainedLastMonth }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Обучено за месяц</p>
            </div>
            <div class="bg-white dark:bg-boxdark rounded-lg p-4 text-center shadow-sm">
              <p class="text-3xl font-bold text-info">{{ stats.trainedLast3Months }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Обучено за 3 месяца</p>
            </div>
            <div class="bg-white dark:bg-boxdark rounded-lg p-4 text-center shadow-sm">
              <p class="text-3xl font-bold text-warning">{{ stats.totalCertificates }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Всего сертификатов</p>
            </div>
          </div>
          
          <!-- Нет данных -->
          <div v-else class="text-center py-4 text-gray-500 dark:text-gray-400">
            Не удалось загрузить статистику
          </div>
        </div>

        <!-- Популярные курсы -->
        <div v-if="popularCourses && popularCourses.length > 0" class="bg-white dark:bg-meta-4 rounded-xl p-5 border border-stroke dark:border-strokedark">
          <h4 class="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Популярные курсы
          </h4>
          <div class="space-y-3">
            <div 
              v-for="(course, index) in popularCourses" 
              :key="index"
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-boxdark rounded-lg"
            >
              <div class="flex-1 min-w-0">
                <p class="font-medium text-black dark:text-white truncate">{{ course.name }}</p>
                <p v-if="course.code" class="text-xs text-gray-500 dark:text-gray-400 font-mono">{{ course.code }}</p>
              </div>
              <div class="flex items-center gap-3 ml-3">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {{ course.certificatesCount }} серт.
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Последние сертификаты -->
        <div v-if="recentCertificates && recentCertificates.length > 0" class="bg-white dark:bg-meta-4 rounded-xl p-5 border border-stroke dark:border-strokedark">
          <h4 class="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            Последние выданные сертификаты
          </h4>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left border-b border-stroke dark:border-strokedark">
                  <th class="pb-2 font-medium text-gray-500 dark:text-gray-400">Слушатель</th>
                  <th class="pb-2 font-medium text-gray-500 dark:text-gray-400">Курс</th>
                  <th class="pb-2 font-medium text-gray-500 dark:text-gray-400">Номер</th>
                  <th class="pb-2 font-medium text-gray-500 dark:text-gray-400 text-right">Дата</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="cert in recentCertificates" 
                  :key="cert.id"
                  class="border-b border-stroke dark:border-strokedark last:border-0"
                >
                  <td class="py-2 text-black dark:text-white">{{ cert.studentName }}</td>
                  <td class="py-2 text-gray-600 dark:text-gray-400 max-w-[200px] truncate">{{ cert.courseName }}</td>
                  <td class="py-2 font-mono text-xs text-gray-600 dark:text-gray-400">{{ cert.certificateNumber }}</td>
                  <td class="py-2 text-right text-gray-600 dark:text-gray-400">{{ formatShortDate(cert.issueDate) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Контактная информация -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Краткое название -->
          <div v-if="organization.shortName">
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Краткое название
            </h4>
            <p class="text-black dark:text-white">{{ organization.shortName }}</p>
          </div>

          <!-- Телефон -->
          <div>
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Контактный телефон
            </h4>
            <p class="text-black dark:text-white flex items-center gap-2">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {{ organization.contactPhone || 'Не указан' }}
            </p>
          </div>

          <!-- Email -->
          <div>
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Email
            </h4>
            <p class="text-black dark:text-white flex items-center gap-2">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {{ organization.contactEmail || 'Не указан' }}
            </p>
          </div>

          <!-- Адрес -->
          <div class="md:col-span-2" v-if="organization.address">
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Адрес
            </h4>
            <p class="text-black dark:text-white flex items-start gap-2">
              <svg class="w-4 h-4 text-gray-400 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {{ organization.address }}
            </p>
          </div>
        </div>

        <!-- Описание -->
        <div v-if="organization.description">
          <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Описание
          </h4>
          <div class="bg-gray-50 dark:bg-meta-4 rounded-lg p-4">
            <p class="text-black dark:text-white whitespace-pre-wrap">{{ organization.description }}</p>
          </div>
        </div>

        <!-- Даты -->
        <div class="border-t border-stroke dark:border-strokedark pt-4">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500 dark:text-gray-400">Создана:</span>
              <span class="ml-2 text-black dark:text-white">{{ formatDate(organization.createdAt) }}</span>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Обновлена:</span>
              <span class="ml-2 text-black dark:text-white">{{ formatDate(organization.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-between w-full">
        <UiButton variant="outline" @click="emit('edit')">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Редактировать
        </UiButton>
        <UiButton variant="primary" @click="handleClose">
          Закрыть
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup>
import { ref, watch } from 'vue';

const { authFetch } = useAuthFetch();

const props = defineProps({
  organization: {
    type: Object,
    default: null
  },
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'edit']);

// Статистика
const loadingStats = ref(false);
const stats = ref(null);
const popularCourses = ref([]);
const recentCertificates = ref([]);

// Загрузка статистики
const fetchStats = async () => {
  if (!props.organization?.id) return;
  
  loadingStats.value = true;
  try {
    const response = await authFetch(
      `/api/organizations/${props.organization.id}/stats`,
      { method: 'GET' }
    );
    
    if (response.success && response.data) {
      stats.value = response.data.stats;
      popularCourses.value = response.data.popularCourses || [];
      recentCertificates.value = response.data.recentCertificates || [];
    }
  } catch (error) {
    console.error('Ошибка загрузки статистики организации:', error);
  } finally {
    loadingStats.value = false;
  }
};

// Загрузка статистики при открытии модалки
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen && props.organization?.id) {
    await fetchStats();
  } else {
    // Сброс при закрытии
    stats.value = null;
    popularCourses.value = [];
    recentCertificates.value = [];
  }
}, { immediate: true });

const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatShortDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const handleClose = () => {
  emit('close');
};
</script>
