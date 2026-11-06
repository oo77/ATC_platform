<template>
  <!-- Внешний враппер без двойного отступа: отступы даёт layout -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Единый заголовок страницы (журнал только для чтения — действий нет) -->
    <UiPageHeader title="Журнал аудита" description="История всех действий пользователей в системе" />

    <!-- Метрики одной плоской строкой (считаются по текущей странице) -->
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <UiStat label="Всего записей" :value="total" :icon="ClipboardList" tone="primary" />
      <UiStat label="Создание (на странице)" :value="actionStats.CREATE" :icon="PlusCircle" tone="success" />
      <UiStat label="Удаление (на странице)" :value="actionStats.DELETE" :icon="Trash2" tone="danger" />
      <UiStat label="Входы (на странице)" :value="actionStats.LOGIN" :icon="LogIn" tone="info" />
    </div>

    <!-- Три строки фильтров заменены одним блоком: поиск на виду, остальное — в панели «Фильтры». Страница уже делает debounce 400 мс, поэтому debounce=0 -->
    <UiFilterBar
      v-model:search="filters.userSearch"
      search-placeholder="Поиск по имени или email пользователя…"
      :debounce="0"
      :chips="filterChips"
      :active-count="filterChips.length"
      :total="total"
      persist-key="activity-logs"
      @search="handleFilterChange"
      @remove="removeFilterChip"
      @reset="resetFilters"
    >
      <template #filters>
        <!-- Дата начала -->
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Дата начала</span>
          <input
            v-model="filters.startDate"
            type="date"
            class="h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:text-gray-100"
            @change="handleFilterChange"
          />
        </label>

        <!-- Дата окончания -->
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Дата окончания</span>
          <input
            v-model="filters.endDate"
            type="date"
            class="h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:text-gray-100"
            @change="handleFilterChange"
          />
        </label>

        <!-- Тип действия -->
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Тип действия</span>
          <select
            v-model="filters.actionType"
            class="h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
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
        </label>

        <!-- Тип сущности -->
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Тип сущности</span>
          <select
            v-model="filters.entityType"
            class="h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
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
        </label>
      </template>
    </UiFilterBar>

    <!-- Карточка таблицы: пагинация — футер внутри -->
    <div id="logs-table" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <!-- Загрузка -->
      <div v-if="loading" class="p-12 text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p class="mt-4 text-sm text-gray-500">Загрузка журнала...</p>
      </div>

      <!-- Пусто -->
      <UiEmptyState
        v-else-if="filteredLogs.length === 0"
        :icon="ClipboardList"
        title="Записи не найдены"
        :description="hasActiveFilters ? 'Попробуйте изменить параметры фильтрации' : 'В журнале пока нет записей'"
      >
        <template v-if="hasActiveFilters" #actions>
          <UiButton variant="outline" size="sm" @click="resetFilters">Сбросить фильтры</UiButton>
        </template>
      </UiEmptyState>

      <!-- Таблица со sticky-шапкой -->
      <div v-else class="max-h-[70vh] overflow-auto">
        <table class="w-full border-collapse text-left">
          <thead class="sticky top-0 z-10 bg-white dark:bg-gray-900">
            <tr class="border-b border-gray-200 dark:border-gray-800">
              <th class="whitespace-nowrap px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Дата и время</th>
              <th class="whitespace-nowrap px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Пользователь</th>
              <th class="whitespace-nowrap px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Действие</th>
              <th class="whitespace-nowrap px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Сущность</th>
              <th class="whitespace-nowrap px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Название</th>
              <th class="whitespace-nowrap px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">IP адрес</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr
              v-for="log in filteredLogs"
              :key="log.id"
              class="transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
            >
              <!-- Дата и время -->
              <td class="whitespace-nowrap px-4 py-3 align-middle">
                <div class="flex items-center gap-2 text-sm">
                  <Clock class="h-4 w-4 shrink-0 text-gray-400" />
                  <span class="text-gray-900 dark:text-white">{{ formatDateTime(log.createdAt) }}</span>
                </div>
              </td>

              <!-- Пользователь -->
              <td class="px-4 py-3 align-middle">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-sm font-semibold text-primary dark:bg-primary-500/15">
                    {{ getUserInitials(log.userName) }}
                  </div>
                  <div class="min-w-0">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">{{ log.userName || 'Неизвестно' }}</div>
                    <div class="text-xs text-gray-500">{{ log.userEmail || log.userId }}</div>
                  </div>
                </div>
              </td>

              <!-- Тип действия (цвет по смыслу) -->
              <td class="px-4 py-3 align-middle">
                <span :class="['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', getActionBadgeClass(log.actionType)]">
                  {{ getActionTypeLabel(log.actionType) }}
                </span>
              </td>

              <!-- Тип сущности -->
              <td class="px-4 py-3 align-middle">
                <span class="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-white/[0.06] dark:text-gray-300">
                  {{ getEntityTypeLabel(log.entityType) }}
                </span>
              </td>

              <!-- Название сущности -->
              <td class="px-4 py-3 align-middle">
                <span class="text-sm text-gray-900 dark:text-white">{{ log.entityName || '—' }}</span>
              </td>

              <!-- IP -->
              <td class="px-4 py-3 align-middle">
                <span class="font-mono text-xs text-gray-500">{{ log.ipAddress || '—' }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Единая пагинация вместо самописной «Назад / Вперёд» + select -->
      <UiPagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :total="total"
        :limit="pageSize"
        :loading="loading"
        scroll-target="#logs-table"
        @update:page="handlePageChange"
        @update:limit="handleLimitChange"
      />
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

// Подписи для чипов применённых фильтров (значения справочников берём из тех же composable-функций)
const filterChips = computed(() => {
  const chips: { key: string; label: string }[] = [];
  if (filters.value.userSearch) chips.push({ key: 'userSearch', label: `Пользователь: ${filters.value.userSearch}` });
  if (filters.value.startDate) chips.push({ key: 'startDate', label: `С ${filters.value.startDate}` });
  if (filters.value.endDate) chips.push({ key: 'endDate', label: `По ${filters.value.endDate}` });
  if (filters.value.actionType) chips.push({ key: 'actionType', label: `Действие: ${getActionTypeLabel(filters.value.actionType)}` });
  if (filters.value.entityType) chips.push({ key: 'entityType', label: `Сущность: ${getEntityTypeLabel(filters.value.entityType)}` });
  return chips;
});
// Снятие одного чипа — очищаем поле и перезапрашиваем журнал прежним обработчиком
const removeFilterChip = (key: string) => {
  (filters.value as Record<string, string>)[key] = '';
  handleFilterChange();
};

const getUserInitials = (name?: string): string => {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
};

const getActionBadgeClass = (actionType: string): string => {
  const map: Record<string, string> = {
    CREATE: 'bg-success/10 text-success',
    UPDATE: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    DELETE: 'bg-danger/10 text-danger',
    VIEW: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    LOGIN: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    LOGOUT: 'bg-gray-100 dark:bg-gray-800 text-gray-500',
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
    UNASSIGN: 'bg-gray-100 dark:bg-gray-800 text-gray-500',
    ARCHIVE: 'bg-orange-500/10 text-orange-600',
    RESTORE: 'bg-green-500/10 text-green-600',
    UPLOAD: 'bg-indigo-500/10 text-indigo-600',
    DOWNLOAD: 'bg-indigo-500/10 text-indigo-600',
  };
  return map[actionType] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-500';
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
