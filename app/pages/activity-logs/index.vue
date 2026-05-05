<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Header -->
    <div class="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="space-y-2">
          <h1 class="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Журнал аудита
          </h1>
          <p class="text-slate-500 font-medium">
            История всех действий пользователей в системе
          </p>
        </div>
      </div>
    </div>

    <!-- Bento Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Всего записей</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ total }}</h3>
          </div>
          <div class="rounded-xl bg-primary/10 p-3 text-primary transition-transform group-hover:rotate-12">
            <ClipboardList class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Создание</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ actionStats.CREATE }}</h3>
          </div>
          <div class="rounded-xl bg-success/10 p-3 text-success transition-transform group-hover:rotate-12">
            <PlusCircle class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Удаление</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ actionStats.DELETE }}</h3>
          </div>
          <div class="rounded-xl bg-danger/10 p-3 text-danger transition-transform group-hover:rotate-12">
            <Trash2 class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Входы в систему</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ actionStats.LOGIN }}</h3>
          </div>
          <div class="rounded-xl bg-purple-500/10 p-3 text-purple-600 dark:text-purple-400 transition-transform group-hover:rotate-12">
            <LogIn class="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 mb-6">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Filter class="w-5 h-5" />
          </div>
          <h4 class="text-lg font-bold text-slate-900 dark:text-white">Фильтры</h4>
        </div>
        <button
          v-if="hasActiveFilters"
          @click="resetFilters"
          class="text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10"
        >
          <RotateCcw class="w-4 h-4" />
          Сбросить
        </button>
      </div>

      <div class="flex flex-col gap-6">
        <!-- Search by user -->
        <div class="relative max-w-xl">
          <input
            v-model="filters.userSearch"
            type="text"
            placeholder="Поиск по имени или email пользователя..."
            class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium"
            @input="handleFilterChange"
          />
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Date from -->
          <div class="space-y-3">
            <label class="flex text-xs font-bold text-slate-400 uppercase tracking-widest items-center gap-2">
              <CalendarDays class="w-3.5 h-3.5" />
              Дата начала
            </label>
            <input
              v-model="filters.startDate"
              type="date"
              class="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 text-sm font-medium"
              @change="handleFilterChange"
            />
          </div>

          <!-- Date to -->
          <div class="space-y-3">
            <label class="flex text-xs font-bold text-slate-400 uppercase tracking-widest items-center gap-2">
              <CalendarDays class="w-3.5 h-3.5" />
              Дата окончания
            </label>
            <input
              v-model="filters.endDate"
              type="date"
              class="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 text-sm font-medium"
              @change="handleFilterChange"
            />
          </div>

          <!-- Action type -->
          <div class="space-y-3">
            <label class="flex text-xs font-bold text-slate-400 uppercase tracking-widest items-center gap-2">
              <Zap class="w-3.5 h-3.5" />
              Тип действия
            </label>
            <div class="relative">
              <select
                v-model="filters.actionType"
                class="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 pl-4 pr-10 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 appearance-none font-medium text-sm"
                @change="handleFilterChange"
              >
                <option value="">Все действия</option>
                <option value="CREATE">Создание</option>
                <option value="UPDATE">Обновление</option>
                <option value="DELETE">Удаление</option>
                <option value="VIEW">Просмотр</option>
                <option value="LOGIN">Вход</option>
                <option value="LOGOUT">Выход</option>
                <option value="IMPORT">Импорт</option>
                <option value="EXPORT">Экспорт</option>
                <option value="APPROVE">Одобрение</option>
                <option value="REJECT">Отклонение</option>
                <option value="BLOCK">Блокировка</option>
                <option value="UNBLOCK">Разблокировка</option>
                <option value="REVOKE">Отзыв</option>
                <option value="ISSUE">Выдача</option>
                <option value="RESET_PASSWORD">Сброс пароля</option>
                <option value="ASSIGN">Назначение</option>
                <option value="UNASSIGN">Снятие назначения</option>
              </select>
              <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <!-- Entity type -->
          <div class="space-y-3">
            <label class="flex text-xs font-bold text-slate-400 uppercase tracking-widest items-center gap-2">
              <Layers class="w-3.5 h-3.5" />
              Тип сущности
            </label>
            <div class="relative">
              <select
                v-model="filters.entityType"
                class="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 pl-4 pr-10 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 appearance-none font-medium text-sm"
                @change="handleFilterChange"
              >
                <option value="">Все сущности</option>
                <option value="USER">Пользователь</option>
                <option value="STUDENT">Студент</option>
                <option value="CERTIFICATE">Сертификат</option>
                <option value="CERTIFICATE_TEMPLATE">Шаблон сертификата</option>
                <option value="ISSUED_CERTIFICATE">Выданный сертификат</option>
                <option value="COURSE">Курс</option>
                <option value="DISCIPLINE">Дисциплина</option>
                <option value="INSTRUCTOR">Инструктор</option>
                <option value="FILE">Файл</option>
                <option value="FOLDER">Папка</option>
                <option value="SCHEDULE">Занятие</option>
                <option value="GROUP">Группа</option>
                <option value="CLASSROOM">Аудитория</option>
                <option value="ORGANIZATION">Организация</option>
                <option value="REPRESENTATIVE">Представитель</option>
                <option value="ATTENDANCE">Посещаемость</option>
                <option value="GRADE">Оценка</option>
                <option value="SYSTEM">Система</option>
              </select>
              <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <!-- Loading -->
      <div v-if="loading" class="p-12 text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p class="mt-4 text-slate-500 font-medium tracking-wide">Загрузка журнала...</p>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredLogs.length === 0" class="py-20 px-6 text-center text-slate-500 dark:text-slate-400">
        <div class="bg-slate-50 dark:bg-slate-800/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <ClipboardList class="h-10 w-10 text-slate-400" />
        </div>
        <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Записи не найдены</h3>
        <p class="max-w-md mx-auto text-slate-500">
          {{ hasActiveFilters ? 'Попробуйте изменить параметры фильтрации' : 'В журнале пока нет записей' }}
        </p>
      </div>

      <!-- Table data -->
      <div v-else class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Дата и время</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Пользователь</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Действие</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Сущность</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Название</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">IP адрес</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="log in filteredLogs"
              :key="log.id"
              class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <!-- DateTime -->
              <td class="px-6 py-4 align-middle whitespace-nowrap">
                <div class="flex items-center gap-2 text-sm">
                  <Clock class="w-4 h-4 text-slate-400 shrink-0" />
                  <span class="font-medium text-slate-900 dark:text-white">{{ formatDateTime(log.createdAt) }}</span>
                </div>
              </td>

              <!-- User -->
              <td class="px-6 py-4 align-middle">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                    {{ getUserInitials(log.userName) }}
                  </div>
                  <div>
                    <div class="font-bold text-slate-900 dark:text-white text-sm">{{ log.userName || 'Неизвестно' }}</div>
                    <div class="text-xs text-slate-500">{{ log.userEmail || log.userId }}</div>
                  </div>
                </div>
              </td>

              <!-- Action type badge -->
              <td class="px-6 py-4 align-middle">
                <span :class="['inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase', getActionBadgeClass(log.actionType)]">
                  {{ getActionTypeLabel(log.actionType) }}
                </span>
              </td>

              <!-- Entity type -->
              <td class="px-6 py-4 align-middle">
                <span class="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                  {{ getEntityTypeLabel(log.entityType) }}
                </span>
              </td>

              <!-- Entity name -->
              <td class="px-6 py-4 align-middle">
                <span class="text-sm font-medium text-slate-900 dark:text-white">{{ log.entityName || '—' }}</span>
              </td>

              <!-- IP -->
              <td class="px-6 py-4 align-middle">
                <span class="text-xs font-mono text-slate-500">{{ log.ipAddress || '—' }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="totalPages > 1"
        class="border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/30 dark:bg-slate-800/30"
      >
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="text-sm font-medium text-slate-500">
            Показано
            <span class="font-bold text-slate-900 dark:text-white">{{ (currentPage - 1) * pageSize + 1 }}</span>
            —
            <span class="font-bold text-slate-900 dark:text-white">{{ Math.min(currentPage * pageSize, total) }}</span>
            из
            <span class="font-bold text-slate-900 dark:text-white">{{ total }}</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="handlePageChange(currentPage - 1)"
              :disabled="currentPage === 1 || loading"
              class="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all"
            >
              Назад
            </button>
            <span class="text-sm font-bold text-slate-900 dark:text-white px-2">
              {{ currentPage }} / {{ totalPages }}
            </span>
            <button
              @click="handlePageChange(currentPage + 1)"
              :disabled="currentPage >= totalPages || loading"
              class="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all"
            >
              Вперёд
            </button>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-sm text-slate-500 font-medium">На странице:</label>
            <select
              :value="pageSize"
              @change="handleLimitChange(Number(($event.target as HTMLSelectElement).value))"
              class="rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent py-2 px-3 text-sm font-medium outline-none focus:border-primary dark:bg-slate-800"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  ClipboardList, Filter, RotateCcw, Search, CalendarDays,
  Zap, Layers, ChevronDown, Clock, PlusCircle, Trash2, LogIn
} from 'lucide-vue-next';

definePageMeta({ layout: 'default' });

const {
  logs,
  loading,
  total,
  currentPage,
  pageSize,
  totalPages,
  fetchActivityLogs,
  changePage: changePageFn,
  changePageSize: changePageSizeFn,
  formatDateTime,
  getActionTypeLabel,
  getEntityTypeLabel,
} = useActivityLogs();

// Filters
const filters = ref({
  userSearch: '',
  actionType: '',
  entityType: '',
  startDate: '',
  endDate: '',
});

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const hasActiveFilters = computed(() =>
  filters.value.userSearch !== '' ||
  filters.value.actionType !== '' ||
  filters.value.entityType !== '' ||
  filters.value.startDate !== '' ||
  filters.value.endDate !== ''
);

// Stats computed from current page data (quick visual feedback)
const actionStats = computed(() => {
  const stats = { CREATE: 0, DELETE: 0, LOGIN: 0 };
  for (const log of logs.value) {
    if (log.actionType in stats) stats[log.actionType as keyof typeof stats]++;
  }
  return stats;
});

const getUserInitials = (name?: string): string => {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
};

const getActionBadgeClass = (actionType: string): string => {
  const map: Record<string, string> = {
    CREATE: 'bg-success/10 text-success',
    UPDATE: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    DELETE: 'bg-danger/10 text-danger',
    VIEW: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    LOGIN: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    LOGOUT: 'bg-slate-100 dark:bg-slate-800 text-slate-500',
    IMPORT: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    EXPORT: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    APPROVE: 'bg-success/10 text-success',
    REJECT: 'bg-danger/10 text-danger',
    BLOCK: 'bg-danger/10 text-danger',
    UNBLOCK: 'bg-success/10 text-success',
    REVOKE: 'bg-warning/10 text-warning',
    ISSUE: 'bg-success/10 text-success',
    RESET_PASSWORD: 'bg-warning/10 text-warning',
    ASSIGN: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    UNASSIGN: 'bg-slate-100 dark:bg-slate-800 text-slate-500',
    ARCHIVE: 'bg-orange-500/10 text-orange-600',
    RESTORE: 'bg-green-500/10 text-green-600',
    UPLOAD: 'bg-indigo-500/10 text-indigo-600',
    DOWNLOAD: 'bg-indigo-500/10 text-indigo-600',
  };
  return map[actionType] ?? 'bg-slate-100 dark:bg-slate-800 text-slate-500';
};

const buildFilters = () => ({
  actionType: filters.value.actionType || undefined,
  entityType: filters.value.entityType || undefined,
  startDate: filters.value.startDate || undefined,
  endDate: filters.value.endDate || undefined,
  search: filters.value.userSearch || undefined,
});

const handleFilterChange = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    await fetchActivityLogs({ ...buildFilters(), page: 1 });
  }, 400);
};

const resetFilters = async () => {
  filters.value = { userSearch: '', actionType: '', entityType: '', startDate: '', endDate: '' };
  await fetchActivityLogs({ page: 1 });
};

const handlePageChange = async (page: number) => {
  await changePageFn(page, buildFilters());
};

const handleLimitChange = async (limit: number) => {
  await changePageSizeFn(limit, buildFilters());
};

const filteredLogs = computed(() => logs.value);

onMounted(async () => {
  await fetchActivityLogs();
});
</script>
