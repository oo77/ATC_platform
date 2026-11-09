<template>
  <div class="flex flex-col gap-4">
    <!-- KPI: 4 метрики в одну строку (раньше — 4 крупные карточки с анимацией); таблица поднимается выше сгиба -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <UiStat label="Выдано" :value="stats.issued" :hint="`из ${stats.total}`" :icon="CheckCircle" tone="success" :loading="loading && !stats.total" />
      <UiStat label="Отозвано" :value="stats.revoked" :icon="XCircle" tone="danger" :loading="loading && !stats.total" />
      <UiStat label="Организаций" :value="stats.organizations" :icon="Building2" tone="warning" :loading="loading && !stats.total" />
      <UiStat label="Учебных групп" :value="stats.groups" :icon="Users" tone="primary" :loading="loading && !stats.total" />
    </div>

    <!-- Единый блок фильтров: поиск + сегмент статуса на виду; организация, источник, шаблон и период — в сворачиваемой панели.
         Главное действие — «Добавить вручную», импорт и выгрузка собраны в одно меню -->
    <UiFilterBar
      v-model:search="filters.search"
      search-placeholder="ФИО, номер сертификата, ПИНФЛ…"
      :debounce="0"
      :segments="statusOptions"
      :segment="filters.status"
      :total="pagination.total"
      :active-count="activeFilterCount"
      :chips="filterChips"
      persist-key="certificates"
      @search="debouncedSearch"
      @update:segment="onStatusSegment"
      @remove="removeFilterChip"
      @reset="resetFilters"
    >
      <!-- Второстепенные фильтры -->
      <template #filters>
        <!-- Организация -->
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Организация</span>
          <span class="relative block">
            <Building2 class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              v-model="filters.organizationName"
              type="text"
              placeholder="Название организации"
              class="h-9 w-full rounded-lg border border-gray-300 bg-transparent pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:text-gray-100"
              @input="debouncedSearch"
            />
          </span>
        </label>

        <!-- Источник: 5 вариантов — компактный select вместо ряда чипов -->
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Источник</span>
          <select
            v-model="filters.sourceType"
            class="h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            @change="handleFilterChange"
          >
            <option v-for="opt in sourceOptions" :key="opt.value" :value="opt.value">
              {{ opt.value === 'all' ? 'Все источники' : opt.label }}
            </option>
          </select>
        </label>

        <!-- Шаблон: число шаблонов не ограничено, поэтому select вместо чипов (чипы раздували панель) -->
        <label v-if="templates.length" class="block">
          <span class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Шаблон</span>
          <select
            v-model="filters.templateId"
            class="h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            @change="handleFilterChange"
          >
            <option value="">Все шаблоны</option>
            <option v-for="tpl in templates" :key="tpl.id" :value="tpl.id">{{ tpl.name }}</option>
          </select>
        </label>

        <!-- Период выдачи: две даты в одной ячейке сетки -->
        <div>
          <span class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Период выдачи</span>
          <div class="flex items-center gap-2">
            <input
              v-model="filters.dateFrom"
              type="date"
              aria-label="Выдан с"
              class="h-9 min-w-0 flex-1 rounded-lg border border-gray-300 bg-transparent px-2.5 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:text-gray-100"
              @change="handleFilterChange"
            />
            <span class="text-gray-400">—</span>
            <input
              v-model="filters.dateTo"
              type="date"
              aria-label="Выдан по"
              class="h-9 min-w-0 flex-1 rounded-lg border border-gray-300 bg-transparent px-2.5 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:text-gray-100"
              @change="handleFilterChange"
            />
          </div>
        </div>
      </template>

      <!-- Действия: меню «Импорт и выгрузка» (вторично) + одно главное «Добавить вручную» -->
      <template #actions>
        <UiDropdown label="Импорт и выгрузка" variant="outline" size="md" :groups="toolbarMenu" @select="onToolbarSelect" />
        <UiButton variant="primary" size="md" :start-icon="Plus" @click="openManualFormModal">
          Добавить вручную
        </UiButton>
      </template>
    </UiFilterBar>

    <!-- Карточка таблицы: таблица + пагинация-футер внутри одной карточки -->
    <div id="certificates-table" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <!-- Загрузка -->
      <div v-if="loading" class="flex items-center justify-center py-16 text-sm text-gray-500 dark:text-gray-400">
        <div class="h-5 w-5 animate-spin rounded-full border-2 border-solid border-primary border-t-transparent"></div>
        <span class="ml-3">Загрузка сертификатов...</span>
      </div>

      <!-- Пусто: что случилось + что делать дальше (сбросить фильтры или добавить первый сертификат) -->
      <UiEmptyState
        v-else-if="!data.length"
        :icon="FileCheck"
        :title="hasActiveFilters ? 'По фильтрам ничего не найдено' : 'Сертификаты пока не выданы'"
        :description="hasActiveFilters ? 'Попробуйте изменить параметры фильтрации' : 'Добавьте первый сертификат вручную или импортируйте из файла'"
      >
        <template #actions>
          <UiButton v-if="hasActiveFilters" variant="outline" size="md" @click="resetFilters">Сбросить фильтры</UiButton>
          <UiButton v-else variant="primary" size="md" :start-icon="Plus" @click="openManualFormModal">Добавить вручную</UiButton>
        </template>
      </UiEmptyState>

      <!-- Таблица: контейнер с ограничением высоты, шапка липкая -->
      <div v-else class="max-h-[70vh] overflow-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-800">
              <!-- Сортируемые колонки: кнопка внутри th (доступна с клавиатуры), прежний toggleSort -->
              <th class="sticky top-0 z-10 bg-white px-4 py-3 dark:bg-gray-900" :aria-sort="ariaSort('certificate_number')">
                <button type="button" class="flex items-center gap-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-primary dark:text-gray-400" @click="toggleSort('certificate_number')">
                  № сертификата
                  <component :is="SortIcon" :active="filters.sortBy === 'certificate_number'" :order="filters.sortOrder" />
                </button>
              </th>
              <th class="sticky top-0 z-10 bg-white px-4 py-3 dark:bg-gray-900" :aria-sort="ariaSort('student_name')">
                <button type="button" class="flex items-center gap-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-primary dark:text-gray-400" @click="toggleSort('student_name')">
                  Слушатель
                  <component :is="SortIcon" :active="filters.sortBy === 'student_name'" :order="filters.sortOrder" />
                </button>
              </th>
              <th class="sticky top-0 z-10 bg-white px-4 py-3 dark:bg-gray-900" :aria-sort="ariaSort('course_name')">
                <button type="button" class="flex items-center gap-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-primary dark:text-gray-400" @click="toggleSort('course_name')">
                  Курс / Группа
                  <component :is="SortIcon" :active="filters.sortBy === 'course_name'" :order="filters.sortOrder" />
                </button>
              </th>
              <th class="sticky top-0 z-10 bg-white px-4 py-3 dark:bg-gray-900" :aria-sort="ariaSort('issue_date')">
                <button type="button" class="flex items-center gap-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-primary dark:text-gray-400" @click="toggleSort('issue_date')">
                  Дата выдачи
                  <component :is="SortIcon" :active="filters.sortBy === 'issue_date'" :order="filters.sortOrder" />
                </button>
              </th>
              <th class="sticky top-0 z-10 bg-white px-4 py-3 text-xs font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400">Статус</th>
              <th class="sticky top-0 z-10 w-24 bg-white px-4 py-3 text-right text-xs font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                <span class="sr-only">Действия</span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr
              v-for="cert in data"
              :key="cert.id"
              class="transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
            >
              <!-- № сертификата (+ предупреждение, если выдан с замечаниями) -->
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-sm font-medium text-primary">{{ cert.certificateNumber }}</span>
                  <AlertTriangle v-if="cert.hasWarnings" class="h-3.5 w-3.5 text-warning-600 dark:text-warning-400" title="Выдан с предупреждениями" />
                </div>
              </td>

              <!-- Слушатель: ФИО, организация; ПИНФЛ скрыт маской -->
              <td class="px-4 py-3">
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ cert.student.fullName }}</p>
                <p v-if="cert.student.organization" class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {{ cert.student.organization }}
                </p>
                <UiSensitiveValue v-if="cert.student.pinfl" :value="cert.student.pinfl" class="mt-0.5 text-xs" />
              </td>

              <!-- Курс / Группа + метка источника -->
              <td class="px-4 py-3">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ cert.course.name }}</p>
                  <!-- Метки источника: один нейтральный стиль, AI выделен информационным цветом; шрифт не мельче 11px -->
                  <UiBadge
                    v-if="cert.sourceType === 'import' && cert.importSource === 'ai'"
                    color="info"
                    :title="cert.aiConfidence ? 'Уверенность AI: ' + Math.round(cert.aiConfidence * 100) + '%' : 'AI Импорт'"
                  >
                    <Zap class="mr-1 h-3 w-3" />AI{{ cert.aiConfidence ? ' ' + Math.round(cert.aiConfidence * 100) + '%' : '' }}
                  </UiBadge>
                  <UiBadge v-else-if="cert.sourceType === 'import'" color="light">
                    <FileSpreadsheet class="mr-1 h-3 w-3" />Excel
                  </UiBadge>
                  <UiBadge v-else-if="cert.sourceType === 'manual'" color="light">Ручной</UiBadge>
                </div>
                <p v-if="cert.group.code" class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Группа: {{ cert.group.code }}
                </p>
              </td>

              <!-- Дата выдачи + кто выдал -->
              <td class="px-4 py-3">
                <p class="text-sm text-gray-900 dark:text-white">{{ formatDate(cert.issueDate) }}</p>
                <p v-if="cert.issuedBy" class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ cert.issuedBy.name }}</p>
              </td>

              <!-- Статус: UiBadge вместо самописной CAPS-плашки; причина отзыва — под бейджем -->
              <td class="px-4 py-3">
                <UiBadge :color="cert.status === 'issued' ? 'success' : 'error'">
                  {{ cert.status === 'issued' ? 'Выдан' : 'Отозван' }}
                </UiBadge>
                <p
                  v-if="cert.status === 'revoked' && cert.revokeReason"
                  class="mt-1 max-w-32 truncate text-xs text-gray-500 dark:text-gray-400"
                  :title="cert.revokeReason"
                >
                  {{ cert.revokeReason }}
                </p>
              </td>

              <!-- Действия: 1 видимая иконка (скачать PDF) + «⋯» (подробнее, отзыв/удаление). Опасное — отдельной группой, последним -->
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-1">
                  <a
                    v-if="cert.id"
                    :href="`/api/certificates/download/${cert.id}`"
                    target="_blank"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
                    title="Скачать PDF"
                    aria-label="Скачать PDF"
                  >
                    <Download class="h-4 w-4" />
                  </a>
                  <UiDropdown
                    icon-only
                    variant="ghost"
                    size="sm"
                    aria-label="Другие действия"
                    :groups="rowMenu(cert)"
                    @select="(key: string) => onRowAction(key, cert)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Пагинация: единый UiPagination вместо самописных «Назад/Вперёд»; лимит страницы на этой странице не меняется -->
      <UiPagination
        v-if="pagination.totalPages > 0 && !loading"
        :current-page="pagination.page"
        :total-pages="pagination.totalPages"
        :total="pagination.total"
        :limit="pagination.limit"
        :loading="loading"
        hide-limit
        scroll-target="#certificates-table"
        @update:page="goToPage"
      />
    </div>

    <!-- Modals -->
    <DatabaseCertificateDetailModal
      v-if="selectedCertificate"
      :certificate="selectedCertificate"
      :is-open="isDetailModalOpen"
      @close="closeDetailModal"
    />

    <UiModal
      :is-open="isRevokeModalOpen"
      @close="closeRevokeModal"
      title="Отзыв сертификата"
      size="md"
    >
      <div class="space-y-4">
        <!-- Предупреждение: спокойный красный блок без жирных акцентов -->
        <div class="rounded-xl border border-error-200 bg-error-50 p-4 dark:border-error-500/20 dark:bg-error-500/10">
          <p class="flex items-center gap-2 text-sm font-semibold text-error-700 dark:text-error-400">
            <AlertTriangle class="h-4 w-4" />
            Внимание!
          </p>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Вы собираетесь отозвать сертификат
            <span class="font-mono font-medium">{{ revokeTarget?.certificateNumber }}</span>
            слушателя
            <span class="font-medium">{{ revokeTarget?.student.fullName }}</span>.
            Это действие будет записано в журнал.
          </p>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Причина отзыва <span class="text-error-600">*</span>
          </label>
          <textarea
            v-model="revokeReason"
            rows="3"
            placeholder="Укажите причину отзыва сертификата..."
            class="w-full resize-none rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:text-white"
          ></textarea>
        </div>

        <div class="flex justify-end gap-3">
          <UiButton variant="outline" @click="closeRevokeModal">Отмена</UiButton>
          <UiButton
            variant="danger"
            @click="confirmRevoke"
            :disabled="!revokeReason.trim() || isRevoking"
            :loading="isRevoking"
          >
            Отозвать сертификат
          </UiButton>
        </div>
      </div>
    </UiModal>

    <UiConfirmModal
      :is-open="isDeleteModalOpen"
      title="Удаление сертификата"
      message="Отозванный сертификат будет удалён из базы полностью, вместе с PDF-файлом."
      :item-name="deleteTarget ? `${deleteTarget.certificateNumber} — ${deleteTarget.student.fullName}` : undefined"
      warning="Это действие нельзя отменить"
      confirm-text="Удалить полностью"
      cancel-text="Отмена"
      variant="danger"
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />

    <DatabaseCertificateExportModal
      :is-open="isExportModalOpen"
      :filters="filters"
      :total-count="stats.total"
      :current-count="data.length"
      :current-page-data="data"
      @close="closeExportModal"
    />

    <DatabaseCertificateManualFormModal
      :is-open="isManualFormModalOpen"
      @close="closeManualFormModal"
      @created="handleCertificateCreated"
    />

    <DatabaseCertificateArchiveModal
      :is-open="isArchiveModalOpen"
      :initial-filters="{
        organizationName: filters.organizationName,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        status: filters.status,
      }"
      @close="closeArchiveModal"
    />
  </div>
</template>


<script setup lang="ts">
import { Permission } from "~/types/permissions";
import { ref, computed, onMounted, defineComponent, h } from 'vue';
import * as XLSX from 'xlsx';
// Убраны иконки Filter/RotateCcw/Search/Layers/CalendarRange (фильтры рисует UiFilterBar)
import {
  Plus, FileCheck, CheckCircle, XCircle, Building2, Users,
  Download, Eye, Zap, FileSpreadsheet, AlertTriangle, Trash2, Archive,
} from 'lucide-vue-next';

const { authFetch } = useAuthFetch();
const { hasPermission: hasPerm } = usePermissions();
const canRevokeCertificates = computed(() => hasPerm(Permission.CERTIFICATES_REVOKE));
const notification = useNotification();

// Sort icon inline component
const SortIcon = defineComponent({
  props: { active: Boolean, order: String },
  setup(props) {
    return () =>
      h('svg', {
        // Нейтральный gray вместо slate — единая палитра
        class: ['h-3.5 w-3.5 transition-colors', props.active ? 'text-primary' : 'text-gray-300 dark:text-gray-600'],
        fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24',
      }, [
        h('path', {
          'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2.5',
          d: props.active && props.order === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7',
        }),
      ]);
  },
});

// Filter options
const statusOptions = [
  { value: 'all', label: 'Все' },
  { value: 'issued', label: 'Выданные' },
  { value: 'revoked', label: 'Отозванные' },
];
const sourceOptions = [
  { value: 'all', label: 'Все' },
  { value: 'group_journal', label: 'Журнал группы' },
  { value: 'import', label: 'Excel' },
  { value: 'ai', label: 'AI Импорт' },
  { value: 'manual', label: 'Ручной ввод' },
];

// State
const data = ref<any[]>([]);
const loading = ref(false);
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 });
const stats = ref({ total: 0, issued: 0, revoked: 0, organizations: 0, groups: 0 });

const filters = ref({
  search: '',
  status: 'all',
  sourceType: 'all',
  organizationName: '',
  dateFrom: '',
  dateTo: '',
  templateId: '',
  sortBy: 'issue_date',
  sortOrder: 'desc' as 'asc' | 'desc',
});

const selectedCertificate = ref<any>(null);
const isDetailModalOpen = ref(false);
const isRevokeModalOpen = ref(false);
const revokeTarget = ref<any>(null);
const revokeReason = ref('');
const isManualFormModalOpen = ref(false);
const isRevoking = ref(false);
const isDeleteModalOpen = ref(false);
const deleteTarget = ref<any>(null);
const isDeleting = ref(false);
const isExportModalOpen = ref(false);
const templates = ref<{ id: string; name: string }[]>([]);
const isDownloadingExcel = ref(false);
const isArchiveModalOpen = ref(false);

const hasActiveFilters = computed(() =>
  !!(filters.value.search || filters.value.status !== 'all' || filters.value.sourceType !== 'all' ||
    filters.value.organizationName || filters.value.dateFrom || filters.value.dateTo || filters.value.templateId)
);

async function loadData() {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: String(pagination.value.page),
      limit: String(pagination.value.limit),
      sortBy: filters.value.sortBy,
      sortOrder: filters.value.sortOrder,
    });
    if (filters.value.search) params.append('search', filters.value.search);
    if (filters.value.status !== 'all') params.append('status', filters.value.status);
    if (filters.value.sourceType !== 'all') params.append('sourceType', filters.value.sourceType);
    if (filters.value.organizationName) params.append('organizationName', filters.value.organizationName);
    if (filters.value.dateFrom) params.append('dateFrom', filters.value.dateFrom);
    if (filters.value.dateTo) params.append('dateTo', filters.value.dateTo);
    if (filters.value.templateId) params.append('templateId', filters.value.templateId);

    const response = await authFetch(`/api/certificates?${params.toString()}`);
    if (response.success) {
      data.value = response.data.items;
      pagination.value = response.data.pagination;
      stats.value = response.data.stats;
    }
  } catch (error: any) {
    console.error('Error loading certificates:', error);
    notification.error('Ошибка загрузки', error.message || 'Не удалось загрузить сертификаты');
  } finally {
    loading.value = false;
  }
}

// ---- Презентационные хелперы для UiFilterBar, меню и таблицы (запросы и логика фильтров не затронуты) ----

// Сегмент статуса: пишем в тот же filters.status и зовём прежний handleFilterChange
function onStatusSegment(value: string | number | boolean) {
  filters.value.status = String(value);
  handleFilterChange();
}

// Сколько фильтров из раскрывающейся панели применено (статус и поиск видны сами) — для бейджа на кнопке «Фильтры»
const activeFilterCount = computed(() =>
  [
    filters.value.sourceType !== 'all',
    !!filters.value.organizationName,
    !!filters.value.templateId,
    !!filters.value.dateFrom,
    !!filters.value.dateTo,
  ].filter(Boolean).length
);

// Чипы применённых фильтров: состояние видно без раскрытия панели
const filterChips = computed(() => {
  const f = filters.value;
  const chips: { key: string; label: string }[] = [];
  if (f.status !== 'all') chips.push({ key: 'status', label: `Статус: ${statusOptions.find((o) => o.value === f.status)?.label ?? f.status}` });
  if (f.sourceType !== 'all') chips.push({ key: 'sourceType', label: `Источник: ${sourceOptions.find((o) => o.value === f.sourceType)?.label ?? f.sourceType}` });
  if (f.organizationName) chips.push({ key: 'organizationName', label: `Организация: ${f.organizationName}` });
  if (f.templateId) chips.push({ key: 'templateId', label: `Шаблон: ${templates.value.find((t) => t.id === f.templateId)?.name ?? '…'}` });
  if (f.dateFrom) chips.push({ key: 'dateFrom', label: `С ${f.dateFrom}` });
  if (f.dateTo) chips.push({ key: 'dateTo', label: `По ${f.dateTo}` });
  return chips;
});

// Снятие одного чипа: возвращаем значение по умолчанию и используем прежний handleFilterChange
function removeFilterChip(key: string) {
  const f = filters.value as Record<string, any>;
  f[key] = key === 'status' || key === 'sourceType' ? 'all' : '';
  handleFilterChange();
}

// Меню «Импорт и выгрузка»: импорт — ссылки, выгрузка — прежние функции; недоступные пункты блокируются теми же условиями, что были у кнопок
const toolbarMenu = computed(() => [
  {
    label: 'Импорт',
    items: [
      { key: 'import-excel', label: 'Импорт из Excel', icon: FileSpreadsheet, to: '/database/import-certificates' },
      { key: 'import-ai', label: 'AI-импорт', icon: Zap, to: '/admin/database/ai-import-certificates' },
    ],
  },
  {
    label: 'Выгрузка',
    items: [
      { key: 'download-excel', label: 'Скачать Excel', description: 'Все по текущим фильтрам', icon: FileSpreadsheet, loading: isDownloadingExcel.value, disabled: loading.value || isDownloadingExcel.value || !pagination.value.total },
      { key: 'export', label: 'Экспорт…', icon: Download, disabled: loading.value || !data.value.length },
    ],
  },
  {
    // Окно настройки: период, курс, группа, организация, статус и группировка папок —
    // вместо скачивания всех сертификатов разом
    label: 'Архив',
    items: [
      { key: 'archive-zip', label: 'Скачать архив (ZIP)…', description: 'Период, курс, группа — на выбор', icon: Archive, disabled: loading.value || !pagination.value.total },
    ],
  },
]);
function onToolbarSelect(key: string) {
  if (key === 'download-excel') downloadExcel();
  else if (key === 'export') openExportModal();
  else if (key === 'archive-zip') openArchiveModal();
}

// Меню строки «⋯»: «Подробнее» — безопасное; отзыв/удаление (опасные) — отдельной группой в конце
function rowMenu(cert: any) {
  return [
    { items: [{ key: 'details', label: 'Подробнее', icon: Eye }] },
    {
      items: [
        // Отзыв и удаление — только с правом certificates:revoke (иначе сервер ответит 403)
        { key: 'revoke', label: 'Отозвать сертификат', icon: XCircle, danger: true, hidden: cert.status !== 'issued' || !canRevokeCertificates.value },
        { key: 'delete', label: 'Удалить полностью', icon: Trash2, danger: true, hidden: cert.status !== 'revoked' || !canRevokeCertificates.value },
      ],
    },
  ];
}
// Выбор пункта → прежние обработчики модалок (подтверждение остаётся в модалках)
function onRowAction(key: string, cert: any) {
  if (key === 'details') openDetailModal(cert);
  else if (key === 'revoke') openRevokeModal(cert);
  else if (key === 'delete') openDeleteModal(cert);
}

// aria-sort для заголовков сортируемых колонок (доступность для скринридеров)
function ariaSort(field: string): 'ascending' | 'descending' | 'none' {
  if (filters.value.sortBy !== field) return 'none';
  return filters.value.sortOrder === 'asc' ? 'ascending' : 'descending';
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
function debouncedSearch() {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => { pagination.value.page = 1; loadData(); }, 350);
}

function handleFilterChange() { pagination.value.page = 1; loadData(); }

function resetFilters() {
  filters.value = { search: '', status: 'all', sourceType: 'all', organizationName: '', dateFrom: '', dateTo: '', templateId: '', sortBy: 'issue_date', sortOrder: 'desc' };
  pagination.value.page = 1;
  loadData();
}

function toggleSort(field: string) {
  if (filters.value.sortBy === field) {
    filters.value.sortOrder = filters.value.sortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    filters.value.sortBy = field;
    filters.value.sortOrder = 'desc';
  }
  loadData();
}

function goToPage(page: number) { pagination.value.page = page; loadData(); }

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function openDetailModal(cert: any) { selectedCertificate.value = cert; isDetailModalOpen.value = true; }
function closeDetailModal() { isDetailModalOpen.value = false; selectedCertificate.value = null; }
function openRevokeModal(cert: any) { revokeTarget.value = cert; revokeReason.value = ''; isRevokeModalOpen.value = true; }
function closeRevokeModal() { isRevokeModalOpen.value = false; revokeTarget.value = null; revokeReason.value = ''; }

async function confirmRevoke() {
  if (!revokeTarget.value || !revokeReason.value.trim()) return;
  isRevoking.value = true;
  try {
    const response = await authFetch(`/api/certificates/${revokeTarget.value.id}/revoke`, {
      method: 'PATCH', body: { reason: revokeReason.value.trim() },
    });
    if (response.success) {
      notification.success('Сертификат отозван', `Сертификат ${revokeTarget.value.certificateNumber} успешно отозван`);
      closeRevokeModal();
      loadData();
    } else {
      notification.error('Ошибка', response.message || 'Не удалось отозвать сертификат');
    }
  } catch (error: any) {
    notification.error('Ошибка', error.message || 'Не удалось отозвать сертификат');
  } finally {
    isRevoking.value = false;
  }
}

function openDeleteModal(cert: any) { deleteTarget.value = cert; isDeleteModalOpen.value = true; }
function closeDeleteModal() { isDeleteModalOpen.value = false; deleteTarget.value = null; }

// Полное удаление отозванного (архивного) сертификата вместе с PDF
async function confirmDelete() {
  const target = deleteTarget.value;
  if (!target) return;
  isDeleting.value = true;
  try {
    const response = await authFetch(`/api/certificates/${target.id}`, { method: 'DELETE' });
    if (response.success) {
      notification.success(`Сертификат ${target.certificateNumber} удалён из базы`, 'Сертификат удалён');
      closeDeleteModal();
      // Удалили единственную запись на странице — возвращаемся на предыдущую
      if (data.value.length === 1 && pagination.value.page > 1) pagination.value.page--;
      loadData();
    } else {
      notification.error(response.message || 'Не удалось удалить сертификат', 'Ошибка');
    }
  } catch (error: any) {
    notification.error(error.data?.message || error.message || 'Не удалось удалить сертификат', 'Ошибка');
  } finally {
    isDeleting.value = false;
  }
}

function openExportModal() { isExportModalOpen.value = true; }
function closeExportModal() { isExportModalOpen.value = false; }

async function loadTemplates() {
  try {
    const response = await authFetch<{ success: boolean; templates: { id: string; name: string }[] }>('/api/certificates/templates');
    templates.value = response.templates.map((tpl) => ({ id: tpl.id, name: tpl.name }));
  } catch (error: any) {
    console.error('Error loading certificate templates:', error);
  }
}

// Excel по всем сертификатам, подходящим под текущие фильтры (включая шаблон):
// кому выдан, дата выдачи, номер сертификата
async function downloadExcel() {
  if (isDownloadingExcel.value || !pagination.value.total) return;
  isDownloadingExcel.value = true;
  try {
    const params = new URLSearchParams({
      page: '1',
      limit: String(pagination.value.total),
      sortBy: filters.value.sortBy,
      sortOrder: filters.value.sortOrder,
    });
    if (filters.value.search) params.append('search', filters.value.search);
    if (filters.value.status !== 'all') params.append('status', filters.value.status);
    if (filters.value.sourceType !== 'all') params.append('sourceType', filters.value.sourceType);
    if (filters.value.organizationName) params.append('organizationName', filters.value.organizationName);
    if (filters.value.dateFrom) params.append('dateFrom', filters.value.dateFrom);
    if (filters.value.dateTo) params.append('dateTo', filters.value.dateTo);
    if (filters.value.templateId) params.append('templateId', filters.value.templateId);

    const response = await authFetch(`/api/certificates?${params.toString()}`);
    if (!response.success) throw new Error(response.message || 'Не удалось загрузить сертификаты');

    const rows = response.data.items.map((cert: any) => ({
      'Кому выдан (ФИО)': cert.student?.fullName || '',
      'Организация': cert.student?.organization || '',
      'Дата выдачи': cert.issueDate ? formatDate(cert.issueDate) : '',
      '№ сертификата': cert.certificateNumber,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: Math.max(...rows.map((r: any) => String(r['Кому выдан (ФИО)']).length), 20) + 2 },
      { wch: Math.max(...rows.map((r: any) => String(r['Организация']).length), 20) + 2 },
      { wch: 12 },
      { wch: Math.max(...rows.map((r: any) => String(r['№ сертификата']).length), 16) + 2 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Сертификаты');

    const templateName = templates.value.find((tpl) => tpl.id === filters.value.templateId)?.name;
    const namePart = templateName ? `_${templateName.replace(/[\\/:*?"<>|]/g, '_')}` : '';
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `sertifikaty${namePart}_${dateStr}.xlsx`);
  } catch (error: any) {
    console.error('Error exporting certificates to Excel:', error);
    notification.error('Ошибка экспорта', error.message || 'Не удалось скачать Excel');
  } finally {
    isDownloadingExcel.value = false;
  }
}
function openArchiveModal() { isArchiveModalOpen.value = true; }
function closeArchiveModal() { isArchiveModalOpen.value = false; }

function openManualFormModal() { isManualFormModalOpen.value = true; }
function closeManualFormModal() { isManualFormModalOpen.value = false; }
function handleCertificateCreated(certificate: any) {
  notification.success('Сертификат создан', `Сертификат ${certificate.certificateNumber} успешно добавлен`);
  loadData();
}

onMounted(() => { loadData(); loadTemplates(); });
</script>
