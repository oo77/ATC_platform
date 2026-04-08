<template>
  <div class="flex flex-col gap-6">
    <!-- Action Bar -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="space-y-1">
        <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          База сертификатов
        </h2>
        <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
          Всего в базе: {{ stats.total }}
          <span v-if="hasActiveFilters" class="text-primary">
            · найдено: {{ pagination.total }}
          </span>
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <UiButton variant="primary" size="sm" class="h-10 px-4 gap-2 font-bold shadow-sm" @click="openManualFormModal">
          <Plus class="w-4 h-4" />
          Добавить вручную
        </UiButton>
        <NuxtLink
          to="/database/import-certificates"
          class="inline-flex items-center gap-2 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-sm font-bold text-slate-700 dark:text-slate-300 transition-all hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-600"
        >
          <FileSpreadsheet class="h-4 w-4" />
          Импорт Excel
        </NuxtLink>
        <button
          @click="navigateTo('/admin/database/ai-import-certificates')"
          class="inline-flex items-center gap-2 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 px-4 text-sm font-bold text-violet-700 dark:text-violet-400 transition-all hover:bg-violet-100 dark:hover:bg-violet-500/20"
        >
          <Zap class="h-4 w-4" />
          AI Импорт
        </button>
        <UiButton
          variant="outline"
          size="sm"
          class="h-10 px-4 gap-2 font-bold"
          @click="openExportModal"
          :disabled="loading || !data.length"
        >
          <Download class="w-4 h-4" />
          Экспорт
        </UiButton>
      </div>
    </div>

    <!-- Bento Box Metrics -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Выдано</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ stats.issued }}</h3>
          </div>
          <div class="rounded-xl bg-success/10 p-3 text-success transition-transform group-hover:rotate-12">
            <CheckCircle class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Отозвано</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ stats.revoked }}</h3>
          </div>
          <div class="rounded-xl bg-danger/10 p-3 text-danger transition-transform group-hover:rotate-12">
            <XCircle class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Организаций</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ stats.organizations }}</h3>
          </div>
          <div class="rounded-xl bg-warning/10 p-3 text-warning transition-transform group-hover:rotate-12">
            <Building2 class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Учебных групп</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ stats.groups }}</h3>
          </div>
          <div class="rounded-xl bg-primary/10 p-3 text-primary transition-transform group-hover:rotate-12">
            <Users class="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>

    <!-- Filters Panel -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
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
        <!-- Search Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="relative">
            <input
              v-model="filters.search"
              type="text"
              placeholder="ФИО, номер сертификата, ПИНФЛ..."
              class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
              @input="debouncedSearch"
            />
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          </div>
          <div class="relative">
            <input
              v-model="filters.organizationName"
              type="text"
              placeholder="Фильтр по организации..."
              class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
              @input="debouncedSearch"
            />
            <Building2 class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          </div>
        </div>

        <div class="flex flex-wrap gap-x-10 gap-y-5">
          <!-- Статус (chips) -->
          <div class="space-y-3">
            <label class="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <CheckCircle class="w-3.5 h-3.5" />
              Статус
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="opt in statusOptions"
                :key="opt.value"
                @click="filters.status = opt.value; handleFilterChange()"
                class="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                :class="filters.status === opt.value
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <!-- Источник (chips) -->
          <div class="space-y-3">
            <label class="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <Layers class="w-3.5 h-3.5" />
              Источник
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="opt in sourceOptions"
                :key="opt.value"
                @click="filters.sourceType = opt.value; handleFilterChange()"
                class="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                :class="filters.sourceType === opt.value
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <!-- Период выдачи -->
          <div class="space-y-3">
            <label class="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <CalendarRange class="w-3.5 h-3.5" />
              Период выдачи
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model="filters.dateFrom"
                type="date"
                class="rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2 px-3 text-sm outline-none focus:border-primary dark:border-slate-700 dark:text-white transition-all font-medium"
                @change="handleFilterChange"
              />
              <span class="text-slate-400 font-bold text-sm">—</span>
              <input
                v-model="filters.dateTo"
                type="date"
                class="rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2 px-3 text-sm outline-none focus:border-primary dark:border-slate-700 dark:text-white transition-all font-medium"
                @change="handleFilterChange"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <!-- Loading -->
      <div v-if="loading" class="p-12 text-center">
        <div class="mx-auto inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p class="mt-4 font-bold text-slate-900 dark:text-white">Загрузка сертификатов...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!data.length" class="p-16 text-center">
        <div class="bg-slate-50 dark:bg-slate-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileCheck class="w-8 h-8 text-slate-300" />
        </div>
        <p class="text-lg font-bold text-slate-900 dark:text-white">
          {{ hasActiveFilters ? 'По фильтрам не найдено' : 'Сертификаты пока не выданы' }}
        </p>
        <p class="mt-2 text-slate-500 font-medium max-w-sm mx-auto">
          {{ hasActiveFilters ? 'Попробуйте изменить параметры фильтрации' : 'Добавьте первый сертификат через кнопку "Добавить вручную" или импорт' }}
        </p>
      </div>

      <!-- Data Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <th
                class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                @click="toggleSort('certificate_number')"
              >
                <div class="flex items-center gap-1.5">
                  № сертификата
                  <component :is="SortIcon" :active="filters.sortBy === 'certificate_number'" :order="filters.sortOrder" />
                </div>
              </th>
              <th
                class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                @click="toggleSort('student_name')"
              >
                <div class="flex items-center gap-1.5">
                  Слушатель
                  <component :is="SortIcon" :active="filters.sortBy === 'student_name'" :order="filters.sortOrder" />
                </div>
              </th>
              <th
                class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                @click="toggleSort('course_name')"
              >
                <div class="flex items-center gap-1.5">
                  Курс / Группа
                  <component :is="SortIcon" :active="filters.sortBy === 'course_name'" :order="filters.sortOrder" />
                </div>
              </th>
              <th
                class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                @click="toggleSort('issue_date')"
              >
                <div class="flex items-center gap-1.5">
                  Дата выдачи
                  <component :is="SortIcon" :active="filters.sortBy === 'issue_date'" :order="filters.sortOrder" />
                </div>
              </th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
                Статус
              </th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
                Действия
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="cert in data"
              :key="cert.id"
              class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
            >
              <!-- № сертификата -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-sm font-bold text-primary group-hover:text-primary/80 transition-colors">
                    {{ cert.certificateNumber }}
                  </span>
                  <span
                    v-if="cert.hasWarnings"
                    class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-bold bg-warning/10 text-warning"
                    title="Выдан с предупреждениями"
                  >
                    ⚠
                  </span>
                </div>
              </td>

              <!-- Слушатель -->
              <td class="px-6 py-4">
                <div>
                  <p class="font-bold text-slate-900 dark:text-white">{{ cert.student.fullName }}</p>
                  <p v-if="cert.student.organization" class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    {{ cert.student.organization }}
                  </p>
                  <p v-if="cert.student.pinfl" class="text-xs text-slate-400 font-mono mt-0.5">
                    {{ cert.student.pinfl }}
                  </p>
                </div>
              </td>

              <!-- Курс / Группа -->
              <td class="px-6 py-4">
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <p class="font-bold text-slate-900 dark:text-white">{{ cert.course.name }}</p>
                    <!-- Source badges -->
                    <span
                      v-if="cert.sourceType === 'import' && cert.importSource === 'ai'"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30"
                      :title="cert.aiConfidence ? 'Уверенность AI: ' + Math.round(cert.aiConfidence * 100) + '%' : 'AI Импорт'"
                    >
                      <Zap class="w-2.5 h-2.5" />
                      AI{{ cert.aiConfidence ? ' ' + Math.round(cert.aiConfidence * 100) + '%' : '' }}
                    </span>
                    <span
                      v-else-if="cert.sourceType === 'import'"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-success/5 text-success border border-success/20"
                    >
                      <FileSpreadsheet class="w-2.5 h-2.5" />
                      Excel
                    </span>
                    <span
                      v-else-if="cert.sourceType === 'manual'"
                      class="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20"
                    >
                      ✍ Ручной
                    </span>
                  </div>
                  <p v-if="cert.group.code" class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    Группа: {{ cert.group.code }}
                  </p>
                </div>
              </td>

              <!-- Дата выдачи -->
              <td class="px-6 py-4">
                <div>
                  <p class="font-bold text-slate-900 dark:text-white text-sm">{{ formatDate(cert.issueDate) }}</p>
                  <p v-if="cert.issuedBy" class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    {{ cert.issuedBy.name }}
                  </p>
                </div>
              </td>

              <!-- Статус -->
              <td class="px-6 py-4 text-center">
                <span
                  class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-black uppercase tracking-widest border"
                  :class="cert.status === 'issued'
                    ? 'bg-success/5 text-success border-success/20'
                    : 'bg-danger/5 text-danger border-danger/20'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="cert.status === 'issued' ? 'bg-success' : 'bg-danger'"></span>
                  {{ cert.status === 'issued' ? 'Выдан' : 'Отозван' }}
                </span>
                <p
                  v-if="cert.status === 'revoked' && cert.revokeReason"
                  class="text-xs text-slate-400 mt-1 max-w-32 truncate mx-auto"
                  :title="cert.revokeReason"
                >
                  {{ cert.revokeReason }}
                </p>
              </td>

              <!-- Действия -->
              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-1">
                  <a
                    v-if="cert.id"
                    :href="`/api/certificates/download/${cert.id}`"
                    target="_blank"
                    class="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                    title="Скачать PDF"
                  >
                    <Download class="h-4 w-4" />
                  </a>
                  <button
                    @click="openDetailModal(cert)"
                    class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors"
                    title="Подробнее"
                  >
                    <Eye class="h-4 w-4" />
                  </button>
                  <button
                    v-if="cert.status === 'issued'"
                    @click="openRevokeModal(cert)"
                    class="p-2 rounded-lg text-danger hover:bg-danger/10 transition-colors"
                    title="Отозвать сертификат"
                  >
                    <XCircle class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="pagination.totalPages > 1"
        class="px-6 py-4 bg-slate-50/30 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between"
      >
        <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Показано {{ (pagination.page - 1) * pagination.limit + 1 }} — {{ Math.min(pagination.page * pagination.limit, pagination.total) }} из {{ pagination.total }}
        </span>
        <div class="flex gap-2">
          <UiButton
            variant="outline"
            size="sm"
            class="h-8 px-3 font-bold"
            :disabled="pagination.page <= 1"
            @click="goToPage(pagination.page - 1)"
          >
            Назад
          </UiButton>
          <span class="flex items-center px-3 text-sm font-bold text-slate-600 dark:text-slate-400">
            {{ pagination.page }} / {{ pagination.totalPages }}
          </span>
          <UiButton
            variant="outline"
            size="sm"
            class="h-8 px-3 font-bold"
            :disabled="pagination.page >= pagination.totalPages"
            @click="goToPage(pagination.page + 1)"
          >
            Вперёд
          </UiButton>
        </div>
      </div>
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
        <div class="p-4 bg-danger/5 border border-danger/20 rounded-xl">
          <p class="text-danger font-bold flex items-center gap-2">
            <AlertTriangle class="w-4 h-4" />
            Внимание!
          </p>
          <p class="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Вы собираетесь отозвать сертификат
            <span class="font-mono font-bold">{{ revokeTarget?.certificateNumber }}</span>
            слушателя
            <span class="font-bold">{{ revokeTarget?.student.fullName }}</span>.
            Это действие будет записано в журнал.
          </p>
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Причина отзыва <span class="text-danger">*</span>
          </label>
          <textarea
            v-model="revokeReason"
            rows="3"
            placeholder="Укажите причину отзыва сертификата..."
            class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 px-4 text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineComponent, h } from 'vue';
import {
  Plus, FileCheck, CheckCircle, XCircle, Building2, Users, Filter,
  RotateCcw, Search, Download, Eye, Zap, FileSpreadsheet, Layers,
  CalendarRange, AlertTriangle,
} from 'lucide-vue-next';

const { authFetch } = useAuthFetch();
const notification = useNotification();

// Sort icon inline component
const SortIcon = defineComponent({
  props: { active: Boolean, order: String },
  setup(props) {
    return () =>
      h('svg', {
        class: ['h-3.5 w-3.5 transition-colors', props.active ? 'text-primary' : 'text-slate-300'],
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
const isExportModalOpen = ref(false);

const hasActiveFilters = computed(() =>
  !!(filters.value.search || filters.value.status !== 'all' || filters.value.sourceType !== 'all' ||
    filters.value.organizationName || filters.value.dateFrom || filters.value.dateTo)
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

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
function debouncedSearch() {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => { pagination.value.page = 1; loadData(); }, 350);
}

function handleFilterChange() { pagination.value.page = 1; loadData(); }

function resetFilters() {
  filters.value = { search: '', status: 'all', sourceType: 'all', organizationName: '', dateFrom: '', dateTo: '', sortBy: 'issue_date', sortOrder: 'desc' };
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

function openExportModal() { isExportModalOpen.value = true; }
function closeExportModal() { isExportModalOpen.value = false; }
function openManualFormModal() { isManualFormModalOpen.value = true; }
function closeManualFormModal() { isManualFormModalOpen.value = false; }
function handleCertificateCreated(certificate: any) {
  notification.success('Сертификат создан', `Сертификат ${certificate.certificateNumber} успешно добавлен`);
  loadData();
}

onMounted(() => { loadData(); });
</script>
