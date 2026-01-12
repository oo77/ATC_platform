<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок страницы -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-title-md2 font-bold text-black dark:text-white">
          Журнал действий
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          История всех действий пользователей в системе
        </p>
      </div>
    </div>

    <div class="flex flex-col gap-6">
      <!-- Фильтры -->
      <div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-black dark:text-white">
            Фильтры
          </h3>
          <button
            v-if="hasActiveFilters"
            @click="resetFilters"
            class="ml-auto text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Сбросить фильтры
          </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Фильтр по дате начала -->
          <div>
            <label class="mb-2 block text-sm font-medium text-black dark:text-white">
              Дата начала
            </label>
            <input
              v-model="filters.startDate"
              @change="applyFilters"
              type="date"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
            />
          </div>
  
          <!-- Фильтр по дате окончания -->
          <div>
            <label class="mb-2 block text-sm font-medium text-black dark:text-white">
              Дата окончания
            </label>
            <input
              v-model="filters.endDate"
              @change="applyFilters"
              type="date"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
            />
          </div>

          <!-- Фильтр по типу действия -->
          <div>
            <label class="mb-2 block text-sm font-medium text-black dark:text-white">
              Тип действия
            </label>
            <select
              v-model="filters.actionType"
              @change="applyFilters"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
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
          </div>
  
          <!-- Фильтр по типу сущности -->
          <div>
            <label class="mb-2 block text-sm font-medium text-black dark:text-white">
              Тип сущности
            </label>
            <select
              v-model="filters.entityType"
              @change="applyFilters"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
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
          </div>
        </div>
      </div>
  
      <!-- Таблица с логами -->
      <div class="bg-white dark:bg-boxdark rounded-xl shadow-md overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full table-auto">
            <thead>
              <tr class="bg-gray-2 text-left dark:bg-meta-4">
                <th class="py-4 px-4 font-medium text-black dark:text-white pl-6">
                  Дата и время
                </th>
                <th class="py-4 px-4 font-medium text-black dark:text-white">
                  Пользователь
                </th>
                <th class="py-4 px-4 font-medium text-black dark:text-white">
                  Действие
                </th>
                <th class="py-4 px-4 font-medium text-black dark:text-white">
                  Сущность
                </th>
                <th class="py-4 px-4 font-medium text-black dark:text-white">
                  Название
                </th>
                <th class="py-4 px-4 font-medium text-black dark:text-white">
                  IP адрес
                </th>
              </tr>
            </thead>
            <tbody>
              <!-- Загрузка -->
              <tr v-if="loading">
                <td colspan="6" class="text-center py-12">
                  <div class="flex justify-center items-center">
                    <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                    <span class="ml-3 text-gray-600 dark:text-gray-400">Загрузка...</span>
                  </div>
                </td>
              </tr>
  
              <!-- Нет записей -->
              <tr v-else-if="logs.length === 0">
                <td colspan="6" class="text-center py-12">
                   <p class="text-gray-600 dark:text-gray-400">
                    Нет записей для отображения
                  </p>
                </td>
              </tr>
  
              <!-- Строки -->
              <tr
                v-for="log in logs"
                :key="log.id"
                class="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition"
              >
                <td class="py-4 px-4 text-sm pl-6">
                  <span class="text-black dark:text-white">
                    {{ formatDateTime(log.createdAt) }}
                  </span>
                </td>
                <td class="py-4 px-4">
                  <div class="flex flex-col">
                    <span class="text-sm font-medium text-black dark:text-white">
                      {{ log.userName || 'Неизвестно' }}
                    </span>
                    <span class="text-xs text-gray-600 dark:text-gray-400">
                      {{ log.userEmail || log.userId }}
                    </span>
                  </div>
                </td>
                <td class="py-4 px-4">
                  <span
                    :class="[
                      'inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium',
                      getActionTypeColor(log.actionType)
                    ]"
                  >
                    {{ getActionTypeLabel(log.actionType) }}
                  </span>
                </td>
                <td class="py-4 px-4 text-sm text-black dark:text-white">
                  {{ getEntityTypeLabel(log.entityType) }}
                </td>
                <td class="py-4 px-4 text-sm text-black dark:text-white">
                  {{ log.entityName || '—' }}
                </td>
                <td class="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                  {{ log.ipAddress || '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
  
        <!-- Пагинация -->
        <UiPagination
          v-if="totalPages > 0"
          :current-page="currentPage"
          :total-pages="totalPages"
          :total="total"
          :limit="pageSize"
          :loading="loading"
          :limit-options="[10, 50, 100]"
          @update:page="handlePageChange"
          @update:limit="handleLimitChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

// Определяем мета-данные страницы
definePageMeta({
  layout: 'default',
});

// Используем composable для работы с логами
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
  getActionTypeColor,
} = useActivityLogs();

// Фильтры
const filters = ref({
  actionType: '',
  entityType: '',
  startDate: '',
  endDate: '',
});

// Вычисляемое свойство для наличия активных фильтров
const hasActiveFilters = computed(() => {
  return (
    filters.value.actionType !== '' ||
    filters.value.entityType !== '' ||
    filters.value.startDate !== '' ||
    filters.value.endDate !== ''
  );
});

// Применить фильтры
const applyFilters = async () => {
  await fetchActivityLogs({
    actionType: filters.value.actionType || undefined,
    entityType: filters.value.entityType || undefined,
    startDate: filters.value.startDate || undefined,
    endDate: filters.value.endDate || undefined,
    page: 1, // Сбрасываем на первую страницу при изменении фильтров
  });
};

// Сбросить фильтры
const resetFilters = async () => {
  filters.value = {
    actionType: '',
    entityType: '',
    startDate: '',
    endDate: '',
  };
  await applyFilters();
};

// Обработка изменения страницы
const handlePageChange = async (page: number) => {
  await changePageFn(page, {
    actionType: filters.value.actionType || undefined,
    entityType: filters.value.entityType || undefined,
    startDate: filters.value.startDate || undefined,
    endDate: filters.value.endDate || undefined,
  });
};

// Обработка изменения количества записей на странице
const handleLimitChange = async (limit: number) => {
  await changePageSizeFn(limit, {
    actionType: filters.value.actionType || undefined,
    entityType: filters.value.entityType || undefined,
    startDate: filters.value.startDate || undefined,
    endDate: filters.value.endDate || undefined,
  });
};

// Загрузить данные при монтировании
onMounted(async () => {
  console.log('Activity Logs Page Mounted');
  try {
    await fetchActivityLogs();
  } catch (e) {
    console.error('Error fetching logs inside onMounted:', e);
  }
});
</script>
