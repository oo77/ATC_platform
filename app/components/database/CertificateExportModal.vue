<template>
  <UiModal
    :is-open="isOpen"
    @close="handleClose"
    title="Экспорт сертификатов"
    size="md"
  >
    <div class="space-y-6">
      <!-- Info Block -->
      <div class="bg-primary/5 rounded-lg p-4 border border-primary/10">
        <div class="flex items-start gap-3">
          <div class="p-2 bg-primary/10 rounded-full shrink-0">
            <svg
              class="w-5 h-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </div>
          <div>
            <h4 class="font-medium text-primary">Экспорт данных</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Выберите параметры экспорта. Файл будет сформирован на основе
              текущих фильтров.
            </p>
          </div>
        </div>
      </div>

      <!-- Options -->
      <div class="space-y-4">
        <!-- Range Selection -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Объем данных
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              class="relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none transition-all hover:bg-gray-50 dark:hover:bg-meta-4"
              :class="[
                exportScope === 'current'
                  ? 'border-primary ring-1 ring-primary bg-primary/5'
                  : 'border-gray-200 dark:border-strokedark',
              ]"
            >
              <input
                type="radio"
                v-model="exportScope"
                value="current"
                class="sr-only"
              />
              <div class="flex items-center gap-3">
                <div
                  class="h-4 w-4 rounded-full border flex items-center justify-center shrink-0"
                  :class="[
                    exportScope === 'current'
                      ? 'border-primary bg-primary'
                      : 'border-gray-300',
                  ]"
                >
                  <div
                    v-if="exportScope === 'current'"
                    class="h-1.5 w-1.5 rounded-full bg-white"
                  ></div>
                </div>
                <div class="flex flex-col">
                  <span
                    class="block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Текущая страница
                  </span>
                  <span
                    class="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400"
                  >
                    {{ currentCount }} записей
                  </span>
                </div>
              </div>
            </label>

            <label
              class="relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none transition-all hover:bg-gray-50 dark:hover:bg-meta-4"
              :class="[
                exportScope === 'all'
                  ? 'border-primary ring-1 ring-primary bg-primary/5'
                  : 'border-gray-200 dark:border-strokedark',
              ]"
            >
              <input
                type="radio"
                v-model="exportScope"
                value="all"
                class="sr-only"
              />
              <div class="flex items-center gap-3">
                <div
                  class="h-4 w-4 rounded-full border flex items-center justify-center shrink-0"
                  :class="[
                    exportScope === 'all'
                      ? 'border-primary bg-primary'
                      : 'border-gray-300',
                  ]"
                >
                  <div
                    v-if="exportScope === 'all'"
                    class="h-1.5 w-1.5 rounded-full bg-white"
                  ></div>
                </div>
                <div class="flex flex-col">
                  <span
                    class="block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Весь список
                  </span>
                  <span
                    class="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400"
                  >
                    {{ totalCount }} записей
                  </span>
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- Format Selection -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Формат файла
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              class="relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none transition-all hover:bg-gray-50 dark:hover:bg-meta-4"
              :class="[
                exportFormat === 'xlsx'
                  ? 'border-primary ring-1 ring-primary bg-primary/5'
                  : 'border-gray-200 dark:border-strokedark',
              ]"
            >
              <input
                type="radio"
                v-model="exportFormat"
                value="xlsx"
                class="sr-only"
              />
              <div class="flex items-center gap-3">
                <div
                  class="h-4 w-4 rounded-full border flex items-center justify-center shrink-0"
                  :class="[
                    exportFormat === 'xlsx'
                      ? 'border-primary bg-primary'
                      : 'border-gray-300',
                  ]"
                >
                  <div
                    v-if="exportFormat === 'xlsx'"
                    class="h-1.5 w-1.5 rounded-full bg-white"
                  ></div>
                </div>
                <span
                  class="block text-sm font-medium text-gray-900 dark:text-white"
                >
                  Excel (.xlsx)
                </span>
              </div>
            </label>

            <label
              class="relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none transition-all hover:bg-gray-50 dark:hover:bg-meta-4"
              :class="[
                exportFormat === 'csv'
                  ? 'border-primary ring-1 ring-primary bg-primary/5'
                  : 'border-gray-200 dark:border-strokedark',
              ]"
            >
              <input
                type="radio"
                v-model="exportFormat"
                value="csv"
                class="sr-only"
              />
              <div class="flex items-center gap-3">
                <div
                  class="h-4 w-4 rounded-full border flex items-center justify-center shrink-0"
                  :class="[
                    exportFormat === 'csv'
                      ? 'border-primary bg-primary'
                      : 'border-gray-300',
                  ]"
                >
                  <div
                    v-if="exportFormat === 'csv'"
                    class="h-1.5 w-1.5 rounded-full bg-white"
                  ></div>
                </div>
                <span
                  class="block text-sm font-medium text-gray-900 dark:text-white"
                >
                  CSV (.csv)
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div
        class="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-strokedark"
      >
        <UiButton
          variant="secondary"
          @click="handleClose"
          :disabled="isExporting"
        >
          Отмена
        </UiButton>
        <UiButton
          variant="primary"
          @click="startExport"
          :loading="isExporting"
          :disabled="isExporting"
        >
          <svg
            v-if="!isExporting"
            class="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Экспортировать
        </UiButton>
      </div>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import { ref } from "vue";
import * as XLSX from "xlsx";

const props = defineProps<{
  isOpen: boolean;
  filters: any;
  totalCount: number;
  currentCount: number;
  currentPageData: any[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const { authFetch } = useAuthFetch();
const notification = useNotification();

const exportScope = ref<"current" | "all">("current");
const exportFormat = ref<"xlsx" | "csv">("xlsx");
const isExporting = ref(false);

function handleClose() {
  if (!isExporting.value) {
    emit("close");
  }
}

async function startExport() {
  isExporting.value = true;
  try {
    let rawData = [];

    if (exportScope.value === "current") {
      rawData = props.currentPageData;
    } else {
      // Fetch all data matching filters
      const params = new URLSearchParams({
        // No pagination limit (or high limit) for export
        limit: String(props.totalCount + 100), // Ensure we get everything
        sortBy: props.filters.sortBy,
        sortOrder: props.filters.sortOrder,
        disablePagination: "true", // Optional, if backend supports it, otherwise high limit
      });

      if (props.filters.search) params.append("search", props.filters.search);
      if (props.filters.status !== "all")
        params.append("status", props.filters.status);
      if (props.filters.sourceType !== "all")
        params.append("sourceType", props.filters.sourceType);
      if (props.filters.organizationName)
        params.append("organizationName", props.filters.organizationName);
      if (props.filters.dateFrom)
        params.append("dateFrom", props.filters.dateFrom);
      if (props.filters.dateTo) params.append("dateTo", props.filters.dateTo);

      const response = await authFetch(
        `/api/certificates?${params.toString()}`
      );
      if (!response.success) {
        throw new Error(response.message || "Ошибка загрузки данных");
      }
      rawData = response.data.items;
    }

    // Process data for Excel/CSV
    const exportData = rawData.map((item: any) => ({
      "Номер сертификата": item.certificateNumber,
      Слушатель: item.student?.fullName || "",
      ПИНФЛ: item.student?.pinfl || "",
      Организация: item.student?.organization || "",
      Курс: item.course?.name || "",
      Группа: item.group?.code || "Без группы",
      "Дата выдачи": formatDate(item.issueDate),
      Выдал: item.issuedBy?.name || "",
      Статус: formatStatus(item),
      Источник: formatSourceType(item.sourceType),
      Примечание: item.revokeReason || "",
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Auto-adjust column width (simple estimation)
    const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
      wch:
        Math.max(
          key.length,
          ...exportData.map((row: any) => String(row[key] || "").length)
        ) + 2,
    }));
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Сертификаты");

    // Generate filename
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `certificates_export_${dateStr}.${exportFormat.value}`;

    // Write file
    XLSX.writeFile(wb, filename);

    notification.success(
      "Экспорт завершен",
      `Файл ${filename} успешно сохранен`
    );
    emit("close");
  } catch (error: any) {
    console.error("Export error:", error);
    notification.error(
      "Ошибка экспорта",
      error.message || "Не удалось экспортировать данные"
    );
  } finally {
    isExporting.value = false;
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("ru-RU");
}

function formatStatus(item: any) {
  if (item.status === "issued") return "Выдан";
  if (item.status === "revoked") return "Отозван";
  return item.status;
}

function formatSourceType(type: string) {
  const map: Record<string, string> = {
    group_journal: "Журнал группы",
    import: "Импорт",
    manual: "Ручной ввод",
  };
  return map[type] || type;
}
</script>
