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

// Иконки lucide вместо inline-SVG (единый набор для переработанного шаблона)
import { Clock, XCircle, AlertTriangle, CheckCircle2, Pencil, RefreshCw, ShieldCheck } from 'lucide-vue-next';

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

// Вкладки фильтра в формате UiTabs (прежний activeFilter и watch не тронуты)
const filterTabs = computed(() => [
  { id: 'pending', label: 'Ожидают', count: statistics.value?.pending || undefined },
  { id: 'overdue', label: 'Просрочено', count: statistics.value?.overdue || undefined },
  { id: 'all', label: 'Все' },
]);

// Иконка и цвет статуса занятия (заменяют цепочки v-if с inline-SVG)
function statusIcon(status: string) {
  switch (status) {
    case 'pending': return Clock;
    case 'in_progress': return Pencil;
    case 'on_time': return CheckCircle2;
    case 'late': return AlertTriangle;
    case 'overdue': return XCircle;
    default: return ShieldCheck;
  }
}
function statusIconColor(status: string) {
  switch (status) {
    case 'in_progress': return 'text-blue-600';
    case 'on_time': return 'text-green-600';
    case 'late': return 'text-yellow-600';
    case 'overdue': return 'text-red-600';
    case 'pending': return 'text-gray-600 dark:text-gray-400';
    default: return 'text-purple-600';
  }
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
  <!-- Обёртка без container/px-4/py-6: отступы даёт layout -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Единый заголовок; «Обновить» — вторичное действие, главное — «Отметить» в строках -->
    <UiPageHeader title="Отметка посещаемости" description="Занятия, требующие отметки посещаемости">
      <template #actions>
        <UiButton variant="outline" size="sm" :disabled="loading" @click="loadData">
          <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />
          Обновить
        </UiButton>
      </template>
    </UiPageHeader>

    <!-- Метрики одной плоской строкой UiStat вместо 4 карточек с цветными рамками -->
    <div v-if="statistics" class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <UiStat label="Ожидают" :value="statistics.pending" :icon="Clock" />
      <UiStat label="Просрочено" :value="statistics.overdue" :icon="XCircle" tone="danger" />
      <UiStat label="С опозданием" :value="statistics.late" :icon="AlertTriangle" tone="warning" />
      <UiStat label="Вовремя" :value="statistics.onTime" :icon="CheckCircle2" tone="success" />
    </div>

    <!-- Фильтр статуса: UiTabs со счётчиками вместо самодельных кнопок -->
    <UiTabs v-model="activeFilter" :tabs="filterTabs" />

    <!-- Загрузка -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="h-10 w-10 animate-spin rounded-full border-b-2 border-primary"></div>
    </div>

    <!-- Пустой список: общий компонент -->
    <div v-else-if="events.length === 0" class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <UiEmptyState :icon="CheckCircle2" title="Все занятия отмечены" description="Нет занятий, требующих отметки посещаемости" />
    </div>

    <!-- Список занятий -->
    <div v-else class="space-y-3">
      <div
        v-for="event in events"
        :key="event.id"
        :class="getRowClass(event)"
        class="rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700"
      >
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <!-- Информация о занятии -->
          <div class="min-w-0 flex-1">
            <div class="flex items-start gap-4">
              <!-- Иконка статуса: lucide вместо 6 inline-SVG -->
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/[0.06]">
                <component :is="statusIcon(event.status)" :class="['h-5 w-5', statusIconColor(event.status)]" />
              </div>

              <div class="min-w-0 flex-1">
                <h3 class="truncate text-sm font-semibold text-gray-900 dark:text-white">
                  {{ event.event?.title || 'Занятие' }}
                </h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDate(event.event?.endTime ?? null) }}
                  <span v-if="event.event?.groupCode" class="ml-2">• {{ event.event.groupCode }}</span>
                </p>

                <!-- Прогресс отметки -->
                <div class="mt-2 flex items-center gap-3">
                  <div class="h-2 max-w-[200px] flex-1 rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      class="h-2 rounded-full transition-all"
                      :class="getProgress(event) === 100 ? 'bg-green-500' : 'bg-primary'"
                      :style="{ width: `${getProgress(event)}%` }"
                    />
                  </div>
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{ event.markedCount }}/{{ event.studentsCount }} студентов</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Статус и единственное главное действие -->
          <div class="flex items-center gap-4">
            <div class="text-right">
              <span
                :class="MARKING_STATUS_COLORS[event.status]"
                class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
              >
                <component :is="statusIcon(event.status)" class="h-3 w-3" />
                {{ MARKING_STATUS_LABELS[event.status] }}
              </span>
              <p
                class="mt-1 text-xs"
                :class="getTimeRemaining(event.deadline).isOverdue
                  ? 'font-medium text-red-600'
                  : getTimeRemaining(event.deadline).isUrgent
                    ? 'text-orange-600'
                    : 'text-gray-500 dark:text-gray-400'"
              >
                {{ getTimeRemaining(event.deadline).text }}
              </p>
            </div>

            <UiButton :to="`/groups/journal/${event.event?.groupId}_${event.event?.disciplineId}?eventId=${event.scheduleEventId}`" size="sm">
              <Pencil class="mr-2 h-4 w-4" />
              Отметить
            </UiButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
