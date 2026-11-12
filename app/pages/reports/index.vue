<template>
  <!-- Внешний враппер без двойного отступа: отступы даёт layout -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Единый заголовок; главное действие — «Новый отчёт» -->
    <UiPageHeader title="Конструктор отчётов" description="Создавайте и сохраняйте настраиваемые отчёты по учебным данным">
      <template #actions>
        <UiButton to="/reports/builder" variant="primary" :start-icon="Plus">Новый отчёт</UiButton>
      </template>
    </UiPageHeader>

    <!-- Загрузка -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
    </div>

    <!-- Пусто: объясняем ценность и даём единственный следующий шаг -->
    <div
      v-else-if="templates.length === 0"
      class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <UiEmptyState
        :icon="BarChart3"
        title="Отчётов ещё нет"
        description="Создайте свой первый отчёт с помощью конструктора — выберите поля, настройте группировку и экспортируйте данные"
      >
        <template #actions>
          <UiButton to="/reports/builder" variant="primary" :start-icon="Plus">Создать первый отчёт</UiButton>
        </template>
      </UiEmptyState>
    </div>

    <template v-else>
      <!-- Сетка шаблонов: плоские карточки без теней -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="tpl in templates"
          :key="tpl.id"
          class="flex flex-col rounded-xl border border-gray-200 bg-white transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700"
        >
          <!-- Карточка — содержимое -->
          <div class="flex-1 p-4">
            <div class="mb-3 flex items-start justify-between gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary dark:bg-primary-500/15">
                <BarChart3 class="h-5 w-5" />
              </div>
              <UiBadge v-if="tpl.is_public" color="success" size="sm">Публичный</UiBadge>
            </div>

            <h3 class="mb-1 line-clamp-1 text-sm font-semibold text-gray-900 dark:text-white">
              {{ tpl.name }}
            </h3>
            <p v-if="tpl.description" class="mb-3 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
              {{ tpl.description }}
            </p>

            <!-- Метаинфо -->
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <span class="flex items-center gap-1"><Columns3 class="h-3.5 w-3.5" /> {{ tpl.columns_count }} столбцов</span>
              <span class="flex items-center gap-1"><TrendingUp class="h-3.5 w-3.5" /> {{ tpl.use_count }} запусков</span>
              <span v-if="tpl.last_used_at" class="flex items-center gap-1"><Clock class="h-3.5 w-3.5" /> {{ formatDate(tpl.last_used_at) }}</span>
            </div>
          </div>

          <!-- Карточка — действия: «Открыть» + 1 иконка (Excel) + «⋯» (удаление последним, красным) -->
          <div class="flex items-center gap-2 border-t border-gray-100 px-4 py-3 dark:border-gray-800">
            <UiButton :to="`/reports/builder?template=${tpl.id}`" variant="soft" class-name="flex-1">Открыть</UiButton>
            <UiButton
              variant="ghost"
              icon
              title="Экспорт Excel"
              aria-label="Экспорт Excel"
              :loading="exportingId === tpl.id"
              @click="quickExport(tpl.id)"
            >
              <Download class="h-4 w-4" />
            </UiButton>
            <UiDropdown
              icon-only
              variant="ghost"
              aria-label="Другие действия"
              :groups="[{ items: [{ key: 'delete', label: 'Удалить', icon: Trash2, danger: true }] }]"
              @select="(key) => key === 'delete' && confirmDelete(tpl)"
            />
          </div>
        </div>
      </div>

      <!-- Пагинация: размер страницы здесь не меняется (нет обработчика limit), поэтому hideLimit -->
      <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <UiPagination
          :current-page="pagination.page"
          :total-pages="pagination.totalPages"
          :total="pagination.total"
          :limit="pagination.limit"
          hide-limit
          @update:page="handlePageChange"
        />
      </div>
    </template>

    <!-- Диалог подтверждения удаления отчёта: UiConfirmModal вместо самодельного блока, те же deleteTarget/doDelete/deleting -->
    <UiConfirmModal
      :is-open="!!deleteTarget"
      title="Удалить отчёт?"
      :message="`Отчёт «${deleteTarget?.name ?? ''}» будет удалён безвозвратно.`"
      :loading="deleting"
      loading-text="Удаление..."
      @confirm="doDelete"
      @cancel="deleteTarget = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useToast } from "~/composables/useToast";
// Иконки для нового интерфейса: заголовок, карточки отчётов и меню «⋯»
import { Plus, BarChart3, Columns3, TrendingUp, Clock, Download, Trash2 } from "lucide-vue-next";

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
    const res = (await ($fetch as any)(
      `/api/reports/builder/templates?page=${pagination.value.page}&limit=${pagination.value.limit}`,
    ));
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
    const tpl = (await ($fetch as any)(
      `/api/reports/builder/templates/${templateId}`,
    ));

    const blob = await $fetch<Blob>("/api/reports/builder/export/excel", {
      method: "POST",
      body: {
        name: tpl.data.name,
        columns: tpl.data.columns,
        groupings: tpl.data.row_grouping,
        filters: tpl.data.filters,
        // базовая сущность хранится первым элементом data_sources
        primary_entity: (tpl.data.data_sources || [])[0],
        sort_field: tpl.data.sort_field,
        sort_direction: tpl.data.sort_direction,
      },
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${String(tpl.data.name).replace(/[\\/:*?"<>|]+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
