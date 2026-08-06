<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Header Section -->
    <div class="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="space-y-2">
          <h1 class="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Шаблоны сертификатов
          </h1>
          <p class="text-slate-500 font-medium text-sm md:text-base">
            Управление шаблонами для автоматической генерации и выгрузки сертификатов
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <UiButton v-if="canCreateTemplates" variant="primary" size="sm" class="h-10 px-4 gap-2 font-bold shadow-sm" @click="showCreateModal = true">
            <Plus class="w-4 h-4" />
            Создать шаблон
          </UiButton>
        </div>
      </div>
    </div>

    <!-- Bento Box Metrics -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Всего шаблонов</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ stats.total }}</h3>
          </div>
          <div class="rounded-xl bg-primary/10 p-3 text-primary transition-transform group-hover:rotate-12">
            <LayoutTemplate class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Активных шаблонов</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ stats.active }}</h3>
          </div>
          <div class="rounded-xl bg-success/10 p-3 text-success transition-transform group-hover:rotate-12">
            <CheckCircle2 class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Выдано сертификатов</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ stats.issued }}</h3>
          </div>
          <div class="rounded-xl bg-warning/10 p-3 text-warning transition-transform group-hover:rotate-12">
            <FileCheck class="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>

    <!-- Фильтры и поиск -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 md:p-6 mb-6">
      <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <!-- Поиск -->
        <div class="relative flex-1 max-w-md">
          <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Поиск по названию или формату..."
            class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <!-- Переключатели статусов -->
        <div class="flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1">
          <button
            @click="statusFilter = 'all'"
            :class="[
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all',
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            ]"
          >
            Все ({{ templates.length }})
          </button>
          <button
            @click="statusFilter = 'active'"
            :class="[
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all',
              statusFilter === 'active'
                ? 'bg-white dark:bg-slate-700 text-success shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            ]"
          >
            Активные ({{ stats.active }})
          </button>
          <button
            @click="statusFilter = 'inactive'"
            :class="[
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all',
              statusFilter === 'inactive'
                ? 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            ]"
          >
            Неактивные ({{ templates.length - stats.active }})
          </button>
        </div>
      </div>
    </div>

    <!-- Таблица шаблонов -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <!-- Loading State -->
      <div v-if="loading" class="p-12 text-center">
        <div class="mx-auto inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p class="mt-4 font-bold text-slate-900 dark:text-white">
          Загрузка шаблонов...
        </p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredTemplates.length === 0" class="p-16 text-center">
        <div class="bg-slate-50 dark:bg-slate-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <LayoutTemplate class="w-8 h-8 text-slate-300" />
        </div>
        <p class="text-lg font-bold text-slate-900 dark:text-white">Шаблоны не найдены</p>
        <p class="mt-2 text-slate-500 font-medium max-w-sm mx-auto">
          {{ searchQuery ? 'Попробуйте изменить параметры поиска' : 'Создайте первый шаблон сертификата для начала работы' }}
        </p>
        <UiButton v-if="canCreateTemplates && !searchQuery" class="mt-4" @click="showCreateModal = true">
          <Plus class="w-4 h-4 mr-2" />
          Создать шаблон
        </UiButton>
      </div>

      <!-- List Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Шаблон</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Формат номера</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Переменные</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Выдано</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Статус</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Действия</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="template in filteredTemplates"
              :key="template.id"
              class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
              @click="navigateTo(`/certificates/templates/${template.id}`)"
            >
              <!-- Шаблон (Превью + Название + Описание) -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-4">
                  <!-- Mini Thumbnail Preview -->
                  <div class="relative w-16 h-11 shrink-0 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
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
                          <div v-else-if="element.type === 'variable'" :style="getTextStyle(element)" class="text-primary font-bold opacity-70">[{{ element.variableKey }}]</div>
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
                      <span class="text-[9px] font-bold text-slate-500">.docx</span>
                    </div>
                    <div v-else class="flex items-center justify-center text-slate-400">
                      <LayoutTemplate class="w-5 h-5 text-slate-400" />
                    </div>
                  </div>

                  <!-- Text details -->
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <p class="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors truncate">
                        {{ template.name }}
                      </p>
                      <span
                        v-if="template.originalFileUrl"
                        class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                      >
                        Word
                      </span>
                    </div>
                    <p v-if="template.description" class="text-xs font-medium text-slate-400 mt-0.5 truncate max-w-md">
                      {{ template.description }}
                    </p>
                  </div>
                </div>
              </td>

              <!-- Формат номера -->
              <td class="px-6 py-4">
                <code class="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  {{ template.numberFormat || '—' }}
                </code>
              </td>

              <!-- Переменные -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {{ template.variables?.length || 0 }} пер.
                  </span>
                  <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
                    :class="template.variables && template.variables.length > 0 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'"
                  >
                    <CheckCircle2 v-if="template.variables && template.variables.length > 0" class="w-3 h-3" />
                    <AlertCircle v-else class="w-3 h-3" />
                    {{ template.variables && template.variables.length > 0 ? 'Готов' : 'Настройте' }}
                  </span>
                </div>
              </td>

              <!-- Выдано -->
              <td class="px-6 py-4 text-center">
                <span class="inline-flex items-center justify-center min-w-10 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {{ template.lastNumber || 0 }}
                </span>
              </td>

              <!-- Статус -->
              <td class="px-6 py-4 text-center">
                <span
                  class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-black uppercase tracking-widest border"
                  :class="template.isActive
                    ? 'bg-success/5 text-success border-success/20'
                    : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="template.isActive ? 'bg-success' : 'bg-slate-400'"></span>
                  {{ template.isActive ? 'Активен' : 'Неактивен' }}
                </span>
              </td>

              <!-- Действия -->
              <td class="px-6 py-4" @click.stop>
                <div class="flex items-center justify-center gap-1">
                  <NuxtLink
                    :to="`/certificates/templates/${template.id}/editor`"
                    class="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Открыть редактор"
                  >
                    <Edit3 class="w-4 h-4" />
                  </NuxtLink>
                  <NuxtLink
                    :to="`/certificates/templates/${template.id}`"
                    class="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Настройки шаблона"
                  >
                    <Settings class="w-4 h-4" />
                  </NuxtLink>
                  <button
                    @click="handleDuplicate(template)"
                    class="p-2 rounded-lg text-slate-400 hover:text-success hover:bg-success/10 transition-colors"
                    title="Дублировать"
                  >
                    <Copy class="w-4 h-4" />
                  </button>
                  <button
                    v-if="canDeleteTemplates"
                    @click="confirmDelete(template)"
                    class="p-2 rounded-lg text-slate-400 hover:text-danger hover:bg-danger/10 transition-colors"
                    title="Удалить"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
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
import {
  Plus,
  Search,
  LayoutTemplate,
  CheckCircle2,
  AlertCircle,
  FileCheck,
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
