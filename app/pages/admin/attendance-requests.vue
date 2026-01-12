<script setup lang="ts">
/**
 * Страница запросов на разрешение отметки посещаемости
 * Доступна только администраторам и менеджерам
 */

import { 
  REQUEST_STATUS_LABELS, 
  REQUEST_STATUS_COLORS,
  MARKING_STATUS_COLORS,
  type AttendanceMarkingRequest,
  type MarkingStatistics,
} from '~/types/attendanceMarking';

definePageMeta({
  layout: 'default',
});

const { authFetch } = useAuthFetch();
const { success: showSuccess, error: showError } = useNotification();

// Состояние
const loading = ref(true);
const requests = ref<AttendanceMarkingRequest[]>([]);
const statistics = ref<MarkingStatistics | null>(null);
const activeFilter = ref<'pending' | 'all'>('pending');
const processingId = ref<string | null>(null);

// Загрузка данных
async function loadData() {
  loading.value = true;
  try {
    const [requestsRes, overdueRes] = await Promise.all([
      authFetch<{
        success: boolean;
        requests: AttendanceMarkingRequest[];
      }>('/api/attendance/marking/requests', {
        params: {
          onlyPending: activeFilter.value === 'pending' ? 'true' : undefined,
        },
      }),
      authFetch<{
        success: boolean;
        statistics: MarkingStatistics;
      }>('/api/attendance/marking/overdue'),
    ]);

    if (requestsRes.success) {
      requests.value = requestsRes.requests;
    }
    if (overdueRes.success) {
      statistics.value = overdueRes.statistics;
    }
  } catch (error) {
    console.error('Error loading data:', error);
    showError('Ошибка загрузки данных');
  } finally {
    loading.value = false;
  }
}

// Одобрить запрос
async function approveRequest(request: AttendanceMarkingRequest) {
  processingId.value = request.id;
  try {
    const response = await authFetch<{ success: boolean; message: string }>(
      `/api/attendance/marking/requests/${request.id}`,
      {
        method: 'PUT',
        body: { approved: true },
      }
    );

    if (response.success) {
      showSuccess('Запрос одобрен. Инструктор может отметить посещаемость');
      await loadData();
    }
  } catch (error: any) {
    showError(error.data?.message || 'Ошибка при одобрении запроса');
  } finally {
    processingId.value = null;
  }
}

// Отклонить запрос
async function rejectRequest(request: AttendanceMarkingRequest) {
  const comment = prompt('Укажите причину отклонения (опционально):');
  if (comment === null) return; // Отменено

  processingId.value = request.id;
  try {
    const response = await authFetch<{ success: boolean; message: string }>(
      `/api/attendance/marking/requests/${request.id}`,
      {
        method: 'PUT',
        body: { approved: false, comment },
      }
    );

    if (response.success) {
      showSuccess('Запрос отклонён');
      await loadData();
    }
  } catch (error: any) {
    showError(error.data?.message || 'Ошибка при отклонении запроса');
  } finally {
    processingId.value = null;
  }
}

// Форматирование даты
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Относительное время
function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Только что';
  if (hours < 24) return `${hours}ч назад`;
  
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Вчера';
  if (days < 7) return `${days}д назад`;
  
  return formatDate(dateStr);
}

// Загрузка при монтировании
onMounted(() => {
  loadData();
});

// Перезагрузка при смене фильтра
watch(activeFilter, () => {
  loadData();
});
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <!-- Заголовок -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Запросы на отметку посещаемости
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          Одобрение просроченных отметок от инструкторов
        </p>
      </div>
      
      <button
        @click="loadData"
        :disabled="loading"
        class="mt-4 sm:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 
               border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium
               hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Обновить
      </button>
    </div>

    <!-- Статистика -->
    <div v-if="statistics" class="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ statistics.pending }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">Ожидают отметки</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-red-200 dark:border-red-800">
        <p class="text-2xl font-bold text-red-600">{{ statistics.overdue }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">Просрочено</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-yellow-200 dark:border-yellow-800">
        <p class="text-2xl font-bold text-yellow-600">{{ statistics.late }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">С опозданием</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-green-200 dark:border-green-800">
        <p class="text-2xl font-bold text-green-600">{{ statistics.onTime }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">Вовремя</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-purple-200 dark:border-purple-800">
        <p class="text-2xl font-bold text-purple-600">{{ statistics.pendingRequests }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">Ожидают одобрения</p>
      </div>
    </div>

    <!-- Фильтры -->
    <div class="flex gap-2 mb-6">
      <button
        @click="activeFilter = 'pending'"
        :class="activeFilter === 'pending' 
          ? 'bg-primary-600 text-white' 
          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'"
        class="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 
               transition-colors"
      >
        Ожидающие
        <span 
          v-if="statistics && statistics.pendingRequests > 0"
          class="ml-1 px-1.5 py-0.5 text-xs rounded-full"
          :class="activeFilter === 'pending' ? 'bg-white/20' : 'bg-red-100 text-red-600'"
        >
          {{ statistics.pendingRequests }}
        </span>
      </button>
      <button
        @click="activeFilter = 'all'"
        :class="activeFilter === 'all' 
          ? 'bg-primary-600 text-white' 
          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'"
        class="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 
               transition-colors"
      >
        Все запросы
      </button>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
    </div>

    <!-- Пустой список -->
    <div 
      v-else-if="requests.length === 0" 
      class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center"
    >
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {{ activeFilter === 'pending' ? 'Нет ожидающих запросов' : 'Запросов не найдено' }}
      </p>
      <p class="text-gray-500 dark:text-gray-400">
        {{ activeFilter === 'pending' 
          ? 'Все запросы на отметку рассмотрены' 
          : 'Инструкторы ещё не отправляли запросов' 
        }}
      </p>
    </div>

    <!-- Список запросов -->
    <div v-else class="space-y-4">
      <div 
        v-for="request in requests" 
        :key="request.id"
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <!-- Информация о запросе -->
          <div class="flex-1">
            <div class="flex items-start gap-4">
              <div class="shrink-0 w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              
              <div class="flex-1 min-w-0">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ request.instructor?.fullName || 'Инструктор' }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ getRelativeTime(request.createdAt) }}
                </p>
                
                <!-- Событие -->
                <div class="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ request.event?.title || 'Занятие' }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {{ formatDate(request.event?.endTime ?? null) }}
                    <span v-if="request.event?.groupCode" class="ml-2">
                      • {{ request.event.groupCode }}
                    </span>
                  </p>
                </div>
                
                <!-- Причина -->
                <div class="mt-3">
                  <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Причина:</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {{ request.reason }}
                  </p>
                </div>
                
                <!-- Результат рассмотрения -->
                <div v-if="request.status !== 'pending'" class="mt-3 p-3 rounded-lg" 
                     :class="request.status === 'approved' 
                       ? 'bg-green-50 dark:bg-green-900/20' 
                       : 'bg-red-50 dark:bg-red-900/20'">
                  <div class="flex items-center gap-2">
                    <span 
                      :class="REQUEST_STATUS_COLORS[request.status]"
                      class="px-2 py-1 text-xs font-medium rounded-full"
                    >
                      {{ REQUEST_STATUS_LABELS[request.status] }}
                    </span>
                    <span v-if="request.reviewer" class="text-sm text-gray-600 dark:text-gray-400">
                      {{ request.reviewer.fullName }} • {{ formatDate(request.reviewedAt) }}
                    </span>
                  </div>
                  <p v-if="request.reviewComment" class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {{ request.reviewComment }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Действия -->
          <div v-if="request.status === 'pending'" class="flex gap-2 lg:flex-col">
            <button
              @click="approveRequest(request)"
              :disabled="processingId === request.id"
              class="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 
                     bg-green-600 hover:bg-green-700 disabled:bg-green-400
                     text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg v-if="processingId === request.id" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Одобрить
            </button>
            <button
              @click="rejectRequest(request)"
              :disabled="processingId === request.id"
              class="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 
                     bg-red-600 hover:bg-red-700 disabled:bg-red-400
                     text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Отклонить
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
