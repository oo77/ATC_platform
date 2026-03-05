<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-title-md2 font-bold text-black dark:text-white">
          Конструктор отчётов
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Создавайте и сохраняйте настраиваемые отчёты по учебным данным
        </p>
      </div>
      <NuxtLink
        to="/reports/builder"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-opacity-90 transition-all duration-200 shadow-md shadow-primary/30"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        Новый отчёт
      </NuxtLink>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div
        class="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
      />
    </div>

    <!-- Пустое состояние -->
    <div
      v-else-if="templates.length === 0"
      class="bg-white dark:bg-boxdark rounded-xl shadow-md p-16 text-center"
    >
      <div class="flex justify-center mb-4">
        <div class="p-4 bg-primary/10 rounded-2xl">
          <svg
            class="w-12 h-12 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
      </div>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Отчётов ещё нет
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
        Создайте свой первый отчёт с помощью конструктора — выберите поля,
        настройте группировку и экспортируйте данные
      </p>
      <NuxtLink
        to="/reports/builder"
        class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-opacity-90 transition-all"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        Создать первый отчёт
      </NuxtLink>
    </div>

    <!-- Сетка шаблонов -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      <div
        v-for="tpl in templates"
        :key="tpl.id"
        class="bg-white dark:bg-boxdark rounded-xl shadow-md border border-stroke dark:border-strokedark hover:shadow-lg hover:border-primary/30 transition-all duration-200 flex flex-col"
      >
        <!-- Карточка — шапка -->
        <div class="p-5 flex-1">
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="p-2.5 bg-primary/10 rounded-xl shrink-0">
              <svg
                class="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <span
              v-if="tpl.is_public"
              class="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full"
            >
              Публичный
            </span>
          </div>

          <h3
            class="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1"
          >
            {{ tpl.name }}
          </h3>
          <p
            v-if="tpl.description"
            class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3"
          >
            {{ tpl.description }}
          </p>

          <!-- Метаинфо -->
          <div
            class="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500"
          >
            <span class="flex items-center gap-1">
              <svg
                class="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              {{ tpl.columns_count }} столбцов
            </span>
            <span class="flex items-center gap-1">
              <svg
                class="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
              {{ tpl.use_count }} запусков
            </span>
            <span v-if="tpl.last_used_at" class="flex items-center gap-1">
              <svg
                class="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {{ formatDate(tpl.last_used_at) }}
            </span>
          </div>
        </div>

        <!-- Карточка — кнопки -->
        <div
          class="px-5 pb-5 pt-3 border-t border-stroke dark:border-strokedark flex items-center gap-2"
        >
          <NuxtLink
            :to="`/reports/builder?template=${tpl.id}`"
            class="flex-1 text-center px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-opacity-90 transition-all"
          >
            Открыть
          </NuxtLink>
          <button
            class="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
            title="Экспорт Excel"
            @click="quickExport(tpl.id)"
            :disabled="exportingId === tpl.id"
          >
            <svg
              v-if="exportingId !== tpl.id"
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <svg
              v-else
              class="w-4 h-4 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          <button
            class="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
            title="Удалить"
            @click="confirmDelete(tpl)"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Пагинация -->
    <div v-if="pagination.totalPages > 1" class="mt-8 flex justify-center">
      <UiPagination
        :current-page="pagination.page"
        :total-pages="pagination.totalPages"
        :total="pagination.total"
        :limit="pagination.limit"
        @update:page="handlePageChange"
      />
    </div>

    <!-- Диалог подтверждения удаления -->
    <div
      v-if="deleteTarget"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="deleteTarget = null"
    >
      <div
        class="bg-white dark:bg-boxdark rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4"
      >
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
            <svg
              class="w-6 h-6 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Удалить отчёт?
          </h3>
        </div>
        <p class="text-gray-600 dark:text-gray-400 mb-5 text-sm">
          Отчёт
          <strong class="text-gray-900 dark:text-white"
            >«{{ deleteTarget.name }}»</strong
          >
          будет удалён безвозвратно.
        </p>
        <div class="flex gap-3">
          <button
            class="flex-1 px-4 py-2 border border-stroke dark:border-strokedark text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm font-medium"
            @click="deleteTarget = null"
          >
            Отмена
          </button>
          <button
            :disabled="deleting"
            class="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm font-medium disabled:opacity-50"
            @click="doDelete"
          >
            {{ deleting ? "Удаление..." : "Удалить" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useToast } from "~/composables/useToast";

definePageMeta({ layout: "default" as any });

interface Template {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  use_count: number;
  columns_count: number;
  last_used_at: string | null;
  updated_at: string;
}

const toast = useToast();
const loading = ref(false);
const templates = ref<Template[]>([]);
const exportingId = ref<string | null>(null);
const deleteTarget = ref<Template | null>(null);
const deleting = ref(false);
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 1 });

const fetchTemplates = async () => {
  loading.value = true;
  try {
    const res = await $fetch<any>(
      `/api/reports/builder/templates?page=${pagination.value.page}&limit=${pagination.value.limit}`,
    );
    templates.value = res.data;
    pagination.value = { ...pagination.value, ...res.pagination };
  } catch (e: any) {
    toast.error(e.data?.statusMessage || "Ошибка загрузки отчётов");
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page: number) => {
  pagination.value.page = page;
  fetchTemplates();
};

const quickExport = async (templateId: string) => {
  exportingId.value = templateId;
  try {
    // Загружаем конфигурацию шаблона
    const tpl = await $fetch<any>(
      `/api/reports/builder/templates/${templateId}`,
    );

    const blob = await $fetch<Blob>("/api/reports/builder/export/excel", {
      method: "POST",
      body: {
        columns: tpl.data.columns,
        groupings: tpl.data.row_grouping,
        filters: tpl.data.filters,
        sort_field: tpl.data.sort_field,
        sort_direction: tpl.data.sort_direction,
      },
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tpl.data.name}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Excel-файл скачан");
  } catch (e: any) {
    toast.error("Ошибка экспорта Excel");
  } finally {
    exportingId.value = null;
  }
};

const confirmDelete = (tpl: Template) => {
  deleteTarget.value = tpl;
};

const doDelete = async () => {
  if (!deleteTarget.value) return;
  deleting.value = true;
  try {
    await $fetch(`/api/reports/builder/templates/${deleteTarget.value.id}`, {
      method: "DELETE",
    });
    toast.success("Отчёт удалён");
    deleteTarget.value = null;
    await fetchTemplates();
  } catch (e: any) {
    toast.error(e.data?.statusMessage || "Ошибка удаления");
  } finally {
    deleting.value = false;
  }
};

const formatDate = (date: string | null) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
};

onMounted(() => fetchTemplates());
</script>
