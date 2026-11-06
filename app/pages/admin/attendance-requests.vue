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

// Иконки lucide вместо inline-SVG (единый набор)
import { RefreshCw, User, Check, X } from 'lucide-vue-next';

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

// Вкладки в формате UiTabs (activeFilter и watch не тронуты); счётчик — число ожидающих запросов
const filterTabs = computed(() => [
  { id: 'pending', label: 'Ожидающие', count: statistics.value && statistics.value.pendingRequests > 0 ? statistics.value.pendingRequests : undefined },
  { id: 'all', label: 'Все запросы' },
]);

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
    <!-- Единый заголовок; «Обновить» — вторичное действие -->
    <UiPageHeader title="Запросы на отметку посещаемости" description="Одобрение просроченных отметок от инструкторов">
      <template #actions>
        <UiButton variant="outline" size="sm" :disabled="loading" @click="loadData">
          <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />
          Обновить
        </UiButton>
      </template>
    </UiPageHeader>

    <!-- Метрики: плоская строка UiStat вместо 5 карточек с цветными рамками -->
    <div v-if="statistics" class="grid grid-cols-2 gap-3 sm:grid-cols-5">
      <UiStat label="Ожидают отметки" :value="statistics.pending" />
      <UiStat label="Просрочено" :value="statistics.overdue" tone="danger" />
      <UiStat label="С опозданием" :value="statistics.late" tone="warning" />
      <UiStat label="Вовремя" :value="statistics.onTime" tone="success" />
      <UiStat label="Ожидают одобрения" :value="statistics.pendingRequests" tone="primary" />
    </div>

    <!-- Фильтр: UiTabs со счётчиком вместо самодельных кнопок -->
    <UiTabs v-model="activeFilter" :tabs="filterTabs" />

    <!-- Загрузка -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="h-10 w-10 animate-spin rounded-full border-b-2 border-primary"></div>
    </div>

    <!-- Пустой список: общий компонент -->
    <div v-else-if="requests.length === 0" class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <UiEmptyState
        :title="activeFilter === 'pending' ? 'Нет ожидающих запросов' : 'Запросов не найдено'"
        :description="activeFilter === 'pending' ? 'Все запросы на отметку рассмотрены' : 'Инструкторы ещё не отправляли запросов'"
      />
    </div>

    <!-- Список запросов -->
    <div v-else class="space-y-3">
      <div
        v-for="request in requests"
        :key="request.id"
        class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-5"
      >
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <!-- Информация о запросе -->
          <div class="flex-1">
            <div class="flex items-start gap-4">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-white/[0.06]">
                <User class="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>

              <div class="min-w-0 flex-1">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                  {{ request.instructor?.fullName || 'Инструктор' }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ getRelativeTime(request.createdAt) }}</p>

                <!-- Событие -->
                <div class="mt-3 rounded-lg bg-gray-50 p-3 dark:bg-white/[0.04]">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ request.event?.title || 'Занятие' }}</p>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {{ formatDate(request.event?.endTime ?? null) }}
                    <span v-if="request.event?.groupCode" class="ml-2">• {{ request.event.groupCode }}</span>
                  </p>
                </div>

                <!-- Причина -->
                <div class="mt-3">
                  <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Причина:</p>
                  <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">{{ request.reason }}</p>
                </div>

                <!-- Результат рассмотрения -->
                <div
                  v-if="request.status !== 'pending'"
                  class="mt-3 rounded-lg p-3"
                  :class="request.status === 'approved' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'"
                >
                  <div class="flex flex-wrap items-center gap-2">
                    <span :class="REQUEST_STATUS_COLORS[request.status]" class="rounded-full px-2 py-1 text-xs font-medium">
                      {{ REQUEST_STATUS_LABELS[request.status] }}
                    </span>
                    <span v-if="request.reviewer" class="text-sm text-gray-600 dark:text-gray-400">
                      {{ request.reviewer.fullName }} • {{ formatDate(request.reviewedAt) }}
                    </span>
                  </div>
                  <p v-if="request.reviewComment" class="mt-2 text-sm text-gray-600 dark:text-gray-400">{{ request.reviewComment }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Действия: «Одобрить» — главное (primary), «Отклонить» — вторичное danger-ghost -->
          <div v-if="request.status === 'pending'" class="flex gap-2 lg:flex-col">
            <UiButton size="sm" :loading="processingId === request.id" :disabled="processingId === request.id" @click="approveRequest(request)">
              <Check class="mr-2 h-4 w-4" />
              Одобрить
            </UiButton>
            <UiButton size="sm" variant="danger-ghost" :disabled="processingId === request.id" @click="rejectRequest(request)">
              <X class="mr-2 h-4 w-4" />
              Отклонить
            </UiButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
