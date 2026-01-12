<script setup lang="ts">
/**
 * Виджет "Неотмеченные занятия" для дашборда инструктора
 * Показывает список занятий, требующих отметки посещаемости
 */

import { 
  MARKING_STATUS_LABELS, 
  MARKING_STATUS_COLORS, 
  MARKING_STATUS_ICONS,
  type AttendanceMarkingStatusRecord,
  type MarkingStatistics,
} from '~/types/attendanceMarking';

const { authFetch } = useAuthFetch();

// Состояние
const loading = ref(true);
const pendingEvents = ref<AttendanceMarkingStatusRecord[]>([]);
const statistics = ref<MarkingStatistics | null>(null);

// Загрузка данных
async function loadData() {
  loading.value = true;
  try {
    const response = await authFetch<{
      success: boolean;
      pending: AttendanceMarkingStatusRecord[];
      statistics: MarkingStatistics;
    }>('/api/attendance/marking/pending');

    if (response.success) {
      pendingEvents.value = response.pending;
      statistics.value = response.statistics;
    }
  } catch (error) {
    console.error('Error loading pending markings:', error);
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

// Форматирование оставшегося времени
function getTimeRemaining(deadlineStr: string): string {
  const deadline = new Date(deadlineStr);
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();

  if (diff < 0) {
    const overdue = Math.abs(diff);
    const hours = Math.floor(overdue / (1000 * 60 * 60));
    if (hours < 24) {
      return `Просрочено ${hours}ч`;
    }
    const days = Math.floor(hours / 24);
    return `Просрочено ${days}д`;
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) {
    return `Осталось ${hours}ч`;
  }
  const days = Math.floor(hours / 24);
  return `Осталось ${days}д`;
}

// Получить класс для строки в зависимости от статуса
function getRowClass(event: AttendanceMarkingStatusRecord): string {
  switch (event.status) {
    case 'overdue':
      return 'bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500';
    case 'pending':
      const now = new Date();
      const deadline = new Date(event.deadline);
      if (now > deadline) {
        return 'bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500';
      }
      return 'bg-gray-50 dark:bg-gray-800/50';
    default:
      return 'bg-gray-50 dark:bg-gray-800/50';
  }
}

// Загрузка при монтировании
onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <!-- Заголовок -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        Посещаемость к отметке
        <span 
          v-if="statistics && statistics.pending > 0" 
          class="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white"
        >
          {{ statistics.pending }}
        </span>
      </h3>
      
      <button
        @click="loadData"
        class="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Обновить"
      >
        <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>

    <!-- Статистика -->
    <div v-if="statistics" class="grid grid-cols-4 gap-2 mb-4">
      <div class="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <p class="text-lg font-bold text-gray-900 dark:text-white">{{ statistics.pending }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">Ожидают</p>
      </div>
      <div class="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p class="text-lg font-bold text-red-600 dark:text-red-400">{{ statistics.overdue }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">Просрочено</p>
      </div>
      <div class="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <p class="text-lg font-bold text-yellow-600 dark:text-yellow-400">{{ statistics.late }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">С опозданием</p>
      </div>
      <div class="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <p class="text-lg font-bold text-green-600 dark:text-green-400">{{ statistics.onTime }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">Вовремя</p>
      </div>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <!-- Пустой список -->
    <div 
      v-else-if="pendingEvents.length === 0" 
      class="text-center py-8 text-gray-500 dark:text-gray-400"
    >
      <svg class="w-12 h-12 mx-auto mb-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="font-medium">Все занятия отмечены</p>
      <p class="text-sm">Нет занятий, требующих отметки посещаемости</p>
    </div>

    <!-- Список занятий -->
    <ul v-else class="space-y-2">
      <li 
        v-for="event in pendingEvents.slice(0, 5)" 
        :key="event.id"
        :class="getRowClass(event)"
        class="flex items-center justify-between p-3 rounded-lg transition-all hover:shadow-sm"
      >
        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-900 dark:text-white truncate">
            {{ event.event?.title || 'Занятие' }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ formatDate(event.event?.endTime ?? null) }}
            <span v-if="event.event?.groupCode" class="ml-2">
              • {{ event.event.groupCode }}
            </span>
          </p>
        </div>
        
        <div class="flex items-center gap-3 ml-4">
          <div class="text-right">
            <span 
              :class="MARKING_STATUS_COLORS[event.status]"
              class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full"
            >
              <!-- Иконка статуса -->
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
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ getTimeRemaining(event.deadline) }}
            </p>
          </div>
          
          <NuxtLink 
            :to="`/groups/journal/${event.event?.groupId}?eventId=${event.scheduleEventId}`"
            class="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
            title="Перейти к журналу"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </NuxtLink>
        </div>
      </li>
    </ul>

    <!-- Ссылка "показать все" -->
    <NuxtLink 
      v-if="pendingEvents.length > 0"
      to="/attendance/pending" 
      class="block text-center mt-4 text-sm text-primary-600 hover:text-primary-700 hover:underline"
    >
      Показать все {{ pendingEvents.length > 5 ? `(${pendingEvents.length})` : '' }} →
    </NuxtLink>
  </div>
</template>
