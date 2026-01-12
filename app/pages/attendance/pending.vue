<script setup lang="ts">
/**
 * Страница "Неотмеченные занятия" для инструкторов
 * Показывает все занятия, требующие отметки посещаемости
 */

import { 
  MARKING_STATUS_LABELS, 
  MARKING_STATUS_COLORS, 
  MARKING_STATUS_ICONS,
  type AttendanceMarkingStatusRecord,
  type MarkingStatistics,
} from '~/types/attendanceMarking';

definePageMeta({
  layout: 'default',
});

const { authFetch } = useAuthFetch();
const { success: showSuccess, error: showError } = useNotification();

// Состояние
const loading = ref(true);
const events = ref<AttendanceMarkingStatusRecord[]>([]);
const statistics = ref<MarkingStatistics | null>(null);
const activeFilter = ref<'all' | 'pending' | 'overdue'>('pending');

// Загрузка данных
async function loadData() {
  loading.value = true;
  try {
    const response = await authFetch<{
      success: boolean;
      statuses: AttendanceMarkingStatusRecord[];
    }>('/api/attendance/marking/status', {
      params: {
        onlyPending: activeFilter.value === 'pending' ? 'true' : undefined,
        status: activeFilter.value === 'overdue' ? 'overdue' : undefined,
      },
    });

    if (response.success) {
      events.value = response.statuses;
    }

    // Загружаем статистику
    const statsResponse = await authFetch<{
      success: boolean;
      pending: AttendanceMarkingStatusRecord[];
      statistics: MarkingStatistics;
    }>('/api/attendance/marking/pending');

    if (statsResponse.success) {
      statistics.value = statsResponse.statistics;
    }
  } catch (error) {
    console.error('Error loading data:', error);
    showError('Ошибка загрузки данных');
  } finally {
    loading.value = false;
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

// Оставшееся время до дедлайна
function getTimeRemaining(deadlineStr: string): { text: string; isOverdue: boolean; isUrgent: boolean } {
  const deadline = new Date(deadlineStr);
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();

  if (diff < 0) {
    const overdue = Math.abs(diff);
    const hours = Math.floor(overdue / (1000 * 60 * 60));
    if (hours < 24) {
      return { text: `Просрочено ${hours}ч`, isOverdue: true, isUrgent: true };
    }
    const days = Math.floor(hours / 24);
    return { text: `Просрочено ${days}д`, isOverdue: true, isUrgent: true };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 2) {
    return { text: `Осталось ${hours}ч`, isOverdue: false, isUrgent: true };
  }
  if (hours < 24) {
    return { text: `Осталось ${hours}ч`, isOverdue: false, isUrgent: false };
  }
  const days = Math.floor(hours / 24);
  return { text: `Осталось ${days}д`, isOverdue: false, isUrgent: false };
}

// Стиль строки на основе времени
function getRowClass(event: AttendanceMarkingStatusRecord): string {
  const timeInfo = getTimeRemaining(event.deadline);
  
  if (event.status === 'overdue') {
    return 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10';
  }
  if (timeInfo.isOverdue || event.status === 'late') {
    return 'border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
  }
  if (timeInfo.isUrgent) {
    return 'border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/10';
  }
  return 'border-l-4 border-transparent';
}

// Прогресс отметки
function getProgress(event: AttendanceMarkingStatusRecord): number {
  if (event.studentsCount === 0) return 0;
  return Math.round((event.markedCount / event.studentsCount) * 100);
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
          Отметка посещаемости
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          Занятия, требующие отметки посещаемости
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
    <div v-if="statistics" class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ statistics.pending }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Ожидают</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-red-200 dark:border-red-800">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-red-600">{{ statistics.overdue }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Просрочено</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-yellow-200 dark:border-yellow-800">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-yellow-600">{{ statistics.late }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">С опозданием</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-green-200 dark:border-green-800">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-green-600">{{ statistics.onTime }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Вовремя</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Фильтры -->
    <div class="flex gap-2 mb-6">
      <button
        v-for="filter in [
          { value: 'pending', label: 'Ожидают', count: statistics?.pending },
          { value: 'overdue', label: 'Просрочено', count: statistics?.overdue },
          { value: 'all', label: 'Все' },
        ]"
        :key="filter.value"
        @click="activeFilter = filter.value as any"
        :class="activeFilter === filter.value 
          ? 'bg-primary-600 text-white' 
          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'"
        class="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 
               transition-colors"
      >
        {{ filter.label }}
        <span 
          v-if="filter.count && filter.count > 0"
          class="ml-1 px-1.5 py-0.5 text-xs rounded-full"
          :class="activeFilter === filter.value 
            ? 'bg-white/20' 
            : filter.value === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-gray-100 dark:bg-gray-700'"
        >
          {{ filter.count }}
        </span>
      </button>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
    </div>

    <!-- Пустой список -->
    <div 
      v-else-if="events.length === 0" 
      class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center"
    >
      <svg class="w-16 h-16 mx-auto mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Все занятия отмечены
      </p>
      <p class="text-gray-500 dark:text-gray-400">
        Нет занятий, требующих отметки посещаемости
      </p>
    </div>

    <!-- Список занятий -->
    <div v-else class="space-y-3">
      <div 
        v-for="event in events" 
        :key="event.id"
        :class="getRowClass(event)"
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 transition-all hover:shadow-md"
      >
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <!-- Информация о занятии -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start gap-4">
              <div class="shrink-0 w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <!-- Иконка статуса -->
                <svg v-if="event.status === 'pending'" class="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-else-if="event.status === 'in_progress'" class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <svg v-else-if="event.status === 'on_time'" class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-else-if="event.status === 'late'" class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <svg v-else-if="event.status === 'overdue'" class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-else class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-900 dark:text-white truncate">
                  {{ event.event?.title || 'Занятие' }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {{ formatDate(event.event?.endTime ?? null) }}
                  <span v-if="event.event?.groupCode" class="ml-2">
                    • {{ event.event.groupCode }}
                  </span>
                </p>
                
                <!-- Прогресс отметки -->
                <div class="mt-2 flex items-center gap-3">
                  <div class="flex-1 max-w-[200px] bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      class="h-2 rounded-full transition-all"
                      :class="getProgress(event) === 100 ? 'bg-green-500' : 'bg-primary-500'"
                      :style="{ width: `${getProgress(event)}%` }"
                    />
                  </div>
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    {{ event.markedCount }}/{{ event.studentsCount }} студентов
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Статус и действия -->
          <div class="flex items-center gap-4">
            <div class="text-right">
              <span 
                :class="MARKING_STATUS_COLORS[event.status]"
                class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full"
              >
                <!-- Иконка статуса (маленькая) -->
                <svg v-if="event.status === 'pending'" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-else-if="event.status === 'in_progress'" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <svg v-else-if="event.status === 'on_time'" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-else-if="event.status === 'late'" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <svg v-else-if="event.status === 'overdue'" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {{ MARKING_STATUS_LABELS[event.status] }}
              </span>
              <p 
                class="text-xs mt-1"
                :class="getTimeRemaining(event.deadline).isOverdue 
                  ? 'text-red-600 font-medium' 
                  : getTimeRemaining(event.deadline).isUrgent 
                    ? 'text-orange-600' 
                    : 'text-gray-500'"
              >
                {{ getTimeRemaining(event.deadline).text }}
              </p>
            </div>
            
            <NuxtLink 
              :to="`/groups/journal/${event.event?.groupId}_${event.event?.disciplineId}?eventId=${event.scheduleEventId}`"
              class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 
                     text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Отметить
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
