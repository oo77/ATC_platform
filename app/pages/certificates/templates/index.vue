<template>
  <!-- Внешний враппер без собственных отступов (убран двойной padding) -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Единый заголовок; главное действие страницы — «Создать шаблон»; сводка (всего/выдано) — одной строкой вместо трёх KPI-карточек -->
    <UiPageHeader
      title="Шаблоны сертификатов"
      description="Шаблоны для автоматической генерации и выгрузки сертификатов"
    >
      <template #meta>
        <span>Всего шаблонов: <span class="font-medium tabular-nums text-gray-800 dark:text-gray-100">{{ stats.total }}</span></span>
        <span>Выдано сертификатов: <span class="font-medium tabular-nums text-gray-800 dark:text-gray-100">{{ stats.issued }}</span></span>
      </template>
      <template #actions>
        <UiButton v-if="canCreateTemplates" variant="primary" size="md" :start-icon="Plus" @click="showCreateModal = true">
          Создать шаблон
        </UiButton>
      </template>
    </UiPageHeader>

    <!-- Единый блок фильтров: поиск (фильтрация на клиенте, без debounce) + сегмент статуса со счётчиками -->
    <UiFilterBar
      v-model:search="searchQuery"
      search-placeholder="Поиск по названию или формату..."
      :debounce="0"
      :segments="statusSegments"
      :segment="statusFilter"
      :total="filteredTemplates.length"
      @update:segment="onStatusSegment"
    />

    <!-- Таблица шаблонов в стандартной карточке -->
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <!-- Загрузка -->
      <div v-if="loading" class="p-12 text-center">
        <div class="mx-auto inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
        <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">Загрузка шаблонов...</p>
      </div>

      <!-- Пусто: единое состояние со следующим шагом -->
      <UiEmptyState
        v-else-if="filteredTemplates.length === 0"
        title="Шаблоны не найдены"
        :description="searchQuery ? 'Попробуйте изменить параметры поиска' : 'Создайте первый шаблон сертификата для начала работы'"
        :icon="LayoutTemplate"
      >
        <template #actions>
          <UiButton v-if="canCreateTemplates && !searchQuery" variant="primary" size="md" :start-icon="Plus" @click="showCreateModal = true">
            Создать шаблон
          </UiButton>
        </template>
      </UiEmptyState>

      <!-- Таблица: контейнер со скроллом, чтобы шапка была sticky -->
      <div v-else class="max-h-[calc(100vh-16rem)] min-h-[200px] overflow-auto">
        <table class="w-full border-collapse text-left text-sm">
          <thead class="sticky top-0 z-10 bg-white dark:bg-gray-900">
            <tr class="border-b border-gray-200 dark:border-gray-800">
              <th class="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Шаблон</th>
              <th class="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Формат номера</th>
              <th class="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Переменные</th>
              <th class="px-4 py-2.5 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Выдано</th>
              <th class="px-4 py-2.5 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Статус</th>
              <th class="w-28 px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Действия</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <!-- Строка кликабельна (как было): открывает настройки шаблона -->
            <tr
              v-for="template in filteredTemplates"
              :key="template.id"
              class="group cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
              @click="navigateTo(`/certificates/templates/${template.id}`)"
            >
              <!-- Шаблон (Превью + Название + Описание) -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-4">
                  <!-- Mini Thumbnail Preview -->
                  <div class="relative w-16 h-11 shrink-0 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <div v-if="template.templateData" class="absolute inset-0 overflow-hidden flex items-center justify-center">
                      <div
                        class="relative bg-white shadow-xs overflow-hidden shrink-0"
                        :style="{
                          width: `${template.templateData.width}px`,
                          height: `${template.templateData.height}px`,
                          transform: 'scale(0.07)',
                          transformOrigin: 'center center',
                        }"
                      >
                        <div class="absolute inset-0 z-0" :style="getPreviewBackgroundStyle(template)"></div>
                        <div
                          v-for="element in template.templateData.elements"
                          :key="element.id"
                          :style="getElementStyle(element)"
                          class="pointer-events-none"
                        >
                          <div v-if="element.type === 'text'" :style="getTextStyle(element)">{{ element.content }}</div>
                          <div v-else-if="element.type === 'variable'" :style="getTextStyle(element)" class="text-primary font-medium opacity-70">[{{ element.variableKey }}]</div>
                          <img v-else-if="element.type === 'image'" :src="element.src" class="w-full h-full object-contain" />
                          <div v-else-if="element.type === 'qr'" class="w-full h-full bg-black/10 flex items-center justify-center">
                            <svg class="w-1/2 h-1/2 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 11h6v6H3v-6zm2 2v2h2v-2H5zm13-2h-3v3h3v-3zm0 3h-3v3h3v-3z"/></svg>
                          </div>
                          <div v-else-if="element.type === 'shape'" class="w-full h-full" :style="{ backgroundColor: element.fillColor, borderRadius: element.shapeType === 'circle' ? '50%' : '0', border: element.strokeWidth > 0 ? `${element.strokeWidth}px solid ${element.strokeColor}` : 'none' }"></div>
                        </div>
                      </div>
                    </div>
                    <div v-else-if="template.backgroundUrl" class="absolute inset-0">
                      <img :src="template.backgroundUrl" :alt="template.name" class="w-full h-full object-cover" />
                    </div>
                    <div v-else-if="template.originalFileUrl" class="flex flex-col items-center justify-center">
                      <FileText class="w-5 h-5 text-primary" />
                      <span class="text-[11px] font-medium text-gray-500">.docx</span>
                    </div>
                    <div v-else class="flex items-center justify-center text-gray-400">
                      <LayoutTemplate class="w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  <!-- Text details -->
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <p class="font-medium text-gray-900 dark:text-white group-hover:text-primary transition-colors truncate">
                        {{ template.name }}
                      </p>
                      <span
                        v-if="template.originalFileUrl"
                        class="px-1.5 py-0.5 rounded text-[11px] font-medium bg-info-50 text-info-600 dark:bg-info-500/15 dark:text-info-400"
                      >
                        Word
                      </span>
                    </div>
                    <p v-if="template.description" class="text-xs font-medium text-gray-400 mt-0.5 truncate max-w-md">
                      {{ template.description }}
                    </p>
                  </div>
                </div>
              </td>

              <!-- Формат номера -->
              <td class="px-4 py-3">
                <code class="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-700 dark:bg-white/[0.06] dark:text-gray-300">
                  {{ template.numberFormat || '—' }}
                </code>
              </td>

              <!-- Переменные: счётчик + готовность единым UiBadge -->
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-700 dark:text-gray-300">{{ template.variables?.length || 0 }} пер.</span>
                  <UiBadge
                    size="sm"
                    :color="template.variables && template.variables.length > 0 ? 'success' : 'warning'"
                    :start-icon="template.variables && template.variables.length > 0 ? CheckCircle2 : AlertCircle"
                  >
                    {{ template.variables && template.variables.length > 0 ? 'Готов' : 'Настройте' }}
                  </UiBadge>
                </div>
              </td>

              <!-- Выдано -->
              <td class="px-4 py-3 text-center tabular-nums text-gray-700 dark:text-gray-300">{{ template.lastNumber || 0 }}</td>

              <!-- Статус: единый UiBadge -->
              <td class="px-4 py-3 text-center">
                <UiBadge :color="template.isActive ? 'success' : 'light'">{{ template.isActive ? 'Активен' : 'Неактивен' }}</UiBadge>
              </td>

              <!-- Действия: одна главная иконка (редактор) + «⋯» (настройки, дублировать, удалить внизу красным); клик не открывает строку -->
              <td class="px-4 py-3" @click.stop>
                <div class="flex items-center justify-end gap-1">
                  <UiButton
                    :to="`/certificates/templates/${template.id}/editor`"
                    variant="ghost"
                    size="sm"
                    icon
                    title="Открыть редактор"
                    aria-label="Открыть редактор"
                  >
                    <Edit3 class="h-4 w-4" />
                  </UiButton>
                  <UiDropdown
                    :groups="rowMenu(template)"
                    icon-only
                    variant="ghost"
                    size="sm"
                    aria-label="Ещё действия"
                    @select="(key) => onRowAction(key, template)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Модалка создания -->
    <CertificatesTemplateFormModal
      :is-open="showCreateModal"
      @close="showCreateModal = false"
      @created="handleCreated"
    />

    <!-- Модалка подтверждения удаления -->
    <UiConfirmModal
      :is-open="showDeleteModal"
      title="Удаление шаблона"
      message="Вы уверены, что хотите удалить этот шаблон?"
      :item-name="templateToDelete?.name"
      warning="Это действие нельзя отменить."
      :loading="isDeleting"
      @confirm="handleDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import type { CertificateTemplate } from "~/types/certificate";
// Убраны Search и FileCheck (поиск рисует UiFilterBar, KPI-карточек больше нет)
import {
  Plus,
  LayoutTemplate,
  CheckCircle2,
  AlertCircle,
  FileText,
  Edit3,
  Settings,
  Copy,
  Trash2,
} from "lucide-vue-next";

definePageMeta({
  layout: "default",
  title: "Шаблоны сертификатов",
});

useHead({
  title: "Шаблоны сертификатов - АТЦ Платформа",
});

const { authFetch } = useAuthFetch();
const { success: showSuccess, error: showError } = useNotification();
const { canCreateTemplates, canDeleteTemplates } = usePermissions();

// State
const loading = ref(true);
const templates = ref<CertificateTemplate[]>([]);
const searchQuery = ref("");
const statusFilter = ref<"all" | "active" | "inactive">("all");
const showCreateModal = ref(false);
const showDeleteModal = ref(false);
const templateToDelete = ref<CertificateTemplate | null>(null);
const isDeleting = ref(false);

const stats = computed(() => {
  const total = templates.value.length;
  const active = templates.value.filter((t) => t.isActive).length;
  const issued = templates.value.reduce(
    (acc, t) => acc + (t.lastNumber || 0),
    0,
  );
  return { total, active, issued };
});

const filteredTemplates = computed(() => {
  return templates.value.filter((t) => {
    const query = searchQuery.value.trim().toLowerCase();
    const matchesSearch =
      !query ||
      t.name.toLowerCase().includes(query) ||
      (t.description && t.description.toLowerCase().includes(query)) ||
      (t.numberFormat && t.numberFormat.toLowerCase().includes(query));

    const matchesStatus =
      statusFilter.value === "all" ||
      (statusFilter.value === "active" && t.isActive) ||
      (statusFilter.value === "inactive" && !t.isActive);

    return matchesSearch && matchesStatus;
  });
});

// ---- Презентационная обвязка для UiFilterBar и меню «⋯» (вызывает прежние handleDuplicate / confirmDelete) ----

// Сегмент статуса со счётчиками — значения те же, что принимал statusFilter
const statusSegments = computed(() => [
  { value: "all", label: "Все", count: templates.value.length },
  { value: "active", label: "Активные", count: stats.value.active },
  { value: "inactive", label: "Неактивные", count: templates.value.length - stats.value.active },
]);

const onStatusSegment = (value: string | number | boolean) => {
  statusFilter.value = value as "all" | "active" | "inactive";
};

// Меню «⋯» строки: настройки (ссылка), дублирование, а удаление — отдельной группой внизу и только при праве canDeleteTemplates
const rowMenu = (template: CertificateTemplate) => [
  {
    items: [
      { key: "settings", label: "Настройки шаблона", icon: Settings, to: `/certificates/templates/${template.id}` },
      { key: "duplicate", label: "Дублировать", icon: Copy },
    ],
  },
  {
    items: [{ key: "delete", label: "Удалить", icon: Trash2, danger: true, hidden: !canDeleteTemplates.value }],
  },
];

const onRowAction = (key: string, template: CertificateTemplate) => {
  if (key === "duplicate") handleDuplicate(template);
  else if (key === "delete") confirmDelete(template);
};

// Загрузка списка
const loadTemplates = async () => {
  loading.value = true;
  try {
    const response = await authFetch<{
      success: boolean;
      templates: CertificateTemplate[];
    }>("/api/certificates/templates");
    if (response.success) {
      templates.value = response.templates;
    }
  } catch (error: any) {
    console.error("Error loading templates:", error);
    showError(error.message || "Ошибка загрузки шаблонов");
  } finally {
    loading.value = false;
  }
};

// Обработчик создания
const handleCreated = (template: CertificateTemplate) => {
  showCreateModal.value = false;
  // Переходим на страницу редактирования созданного шаблона
  navigateTo(`/certificates/templates/${template.id}`);
};

// Подтверждение удаления
const confirmDelete = (template: CertificateTemplate) => {
  templateToDelete.value = template;
  showDeleteModal.value = true;
};

// Удаление
const handleDelete = async () => {
  if (!templateToDelete.value) return;

  isDeleting.value = true;
  try {
    await authFetch(
      `/api/certificates/templates/${templateToDelete.value.id}`,
      {
        method: "DELETE",
      },
    );
    showSuccess("Шаблон успешно удалён");
    await loadTemplates();
  } catch (error: any) {
    console.error("Error deleting template:", error);
    showError(error.data?.message || error.message || "Ошибка удаления");
  } finally {
    isDeleting.value = false;
    showDeleteModal.value = false;
    templateToDelete.value = null;
  }
};

// Дублирование
const handleDuplicate = async (template: CertificateTemplate) => {
  try {
    const response = await authFetch<{
      success: boolean;
      template: CertificateTemplate;
      message: string;
    }>(`/api/certificates/templates/${template.id}/duplicate`, {
      method: "POST",
    });

    if (response.success) {
      showSuccess(response.message || "Шаблон успешно дублирован");
      // Переходим на страницу нового шаблона
      navigateTo(`/certificates/templates/${response.template.id}`);
    }
  } catch (error: any) {
    console.error("Error duplicating template:", error);
    showError(error.data?.message || error.message || "Ошибка дублирования");
  }
};

// Загружаем при монтировании
onMounted(() => {
  loadTemplates();
});

// Функции для превью в карточке/строке
const getPreviewBackgroundStyle = (template: CertificateTemplate) => {
  const bg = template.templateData?.background;
  if (!bg) return { backgroundColor: "#ffffff" };

  if (bg.type === "color") return { backgroundColor: bg.value };
  if (bg.type === "image")
    return {
      backgroundImage: `url(${bg.value})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  return { backgroundColor: "#ffffff" };
};

const getElementStyle = (element: any) => {
  return {
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
    position: "absolute" as const,
    zIndex: 10,
  };
};

const getTextStyle = (element: any): CSSProperties => {
  return {
    fontFamily: element.fontFamily,
    fontSize: `${element.fontSize}px`,
    fontWeight: element.fontWeight,
    fontStyle: element.fontStyle,
    color: element.color,
    textAlign: element.textAlign as any,
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-word" as const,
    lineHeight: element.lineHeight || 1.2,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
  };
};
</script>
