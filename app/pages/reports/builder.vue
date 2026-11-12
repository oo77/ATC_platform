<template>
  <div class="flex h-full flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
    <!-- ── Хедер ─────────────────────────────────────────────────── -->
    <div class="z-20 flex shrink-0 flex-wrap items-center gap-3 border-b border-stroke bg-white px-5 py-3 dark:border-strokedark dark:bg-boxdark">
      <NuxtLink
        to="/reports"
        class="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        title="Назад к отчётам"
        aria-label="Назад к отчётам"
      >
        <ChevronLeft class="h-5 w-5" />
      </NuxtLink>

      <!-- Название (inline-редактирование) -->
      <div class="flex min-w-0 flex-1 items-center gap-2">
        <input
          v-if="editingTitle"
          ref="titleInput"
          v-model="config.name"
          maxlength="200"
          class="w-full max-w-sm border-b-2 border-primary bg-transparent px-1 text-base font-semibold text-gray-900 outline-none dark:text-white"
          placeholder="Название отчёта"
          @blur="editingTitle = false"
          @keydown.enter="editingTitle = false"
          @keydown.escape="editingTitle = false"
        />
        <button
          v-else
          type="button"
          class="group flex min-w-0 items-center gap-2 font-semibold text-gray-900 transition-colors hover:text-primary dark:text-white"
          title="Переименовать"
          @click="startEditTitle"
        >
          <span class="truncate">{{ config.name || "Новый отчёт" }}</span>
          <Pencil class="h-3.5 w-3.5 shrink-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
        <span
          v-if="templateId && isDirty"
          class="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
        >не сохранено</span>
        <span
          v-else-if="templateId"
          class="hidden shrink-0 items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] text-green-700 sm:flex dark:bg-green-900/20 dark:text-green-300"
        ><Check class="h-3 w-3" /> сохранён</span>
        <span v-else-if="draftSavedHint" class="hidden shrink-0 text-[11px] text-gray-400 sm:inline">черновик сохранён</span>
      </div>

      <!-- Чипы активных фильтров -->
      <div v-if="activeFilterChips.length" class="hidden max-w-md items-center gap-1.5 overflow-hidden lg:flex">
        <span
          v-for="chip in activeFilterChips.slice(0, 3)"
          :key="chip.key"
          class="flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300"
        >
          <span class="max-w-[140px] truncate" :title="chip.label">{{ chip.label }}</span>
          <button type="button" class="hover:text-red-500" :aria-label="`Убрать фильтр ${chip.label}`" @click="removeFilterChip(chip.key)">
            <X class="h-3 w-3" />
          </button>
        </span>
        <button
          v-if="activeFilterChips.length > 3"
          type="button"
          class="text-xs text-gray-400 hover:text-primary"
          @click="drawerOpen = true"
        >+{{ activeFilterChips.length - 3 }}</button>
      </div>

      <!-- Кнопки -->
      <div class="flex shrink-0 items-center gap-2">
        <label
          class="flex cursor-pointer select-none items-center gap-2 rounded-lg border border-stroke px-3 py-1.5 hover:bg-gray-50 dark:border-strokedark dark:hover:bg-gray-700"
          title="Публичный шаблон виден всем сотрудникам"
        >
          <input v-model="config.is_public" type="checkbox" class="peer sr-only" />
          <span
            class="relative h-4 w-8 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40"
            :class="config.is_public ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'"
          >
            <span
              class="absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform"
              :class="config.is_public ? 'translate-x-4' : 'translate-x-0'"
            />
          </span>
          <span class="hidden text-xs text-gray-600 sm:inline dark:text-gray-400">Публичный</span>
        </label>

        <button
          v-if="result.generated && result.rows.length > 0"
          type="button"
          :disabled="exporting"
          class="flex h-9 items-center gap-1.5 rounded-lg border border-stroke px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-strokedark dark:text-gray-300 dark:hover:bg-gray-700"
          title="Скачать весь отчёт в Excel"
          @click="exportExcel"
        >
          <Loader2 v-if="exporting" class="h-4 w-4 animate-spin" />
          <FileSpreadsheet v-else class="h-4 w-4" />
          <span class="hidden sm:inline">Excel</span>
        </button>

        <div ref="saveMenuRef" class="relative flex">
          <button
            type="button"
            :disabled="saving"
            class="flex h-9 items-center gap-1.5 rounded-l-lg border border-stroke px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-strokedark dark:text-gray-300 dark:hover:bg-gray-700"
            @click="saveTemplate(false)"
          >
            <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
            <Save v-else class="h-4 w-4" />
            <span class="hidden sm:inline">{{ saving ? "Сохранение…" : "Сохранить" }}</span>
          </button>
          <button
            type="button"
            class="flex h-9 items-center rounded-r-lg border border-l-0 border-stroke px-1.5 text-gray-500 hover:bg-gray-50 dark:border-strokedark dark:hover:bg-gray-700"
            aria-label="Другие варианты сохранения"
            :aria-expanded="saveMenuOpen"
            @click="saveMenuOpen = !saveMenuOpen"
          >
            <ChevronDown class="h-4 w-4" />
          </button>
          <div
            v-if="saveMenuOpen"
            class="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-xl border border-stroke bg-white py-1 shadow-xl dark:border-strokedark dark:bg-boxdark"
          >
            <button type="button" class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800" @click="saveTemplate(true)">
              <CopyPlus class="h-4 w-4 text-gray-400" /> Сохранить как новый
            </button>
            <button type="button" class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" @click="resetAll">
              <RotateCcw class="h-4 w-4" /> Начать заново
            </button>
          </div>
        </div>

        <button
          type="button"
          class="relative flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          @click="drawerOpen = true"
        >
          <SlidersHorizontal class="h-4 w-4" />
          Конструктор
          <span
            v-if="config.columns.length > 0"
            class="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber-400 px-1 text-[11px] font-bold leading-none text-white"
          >{{ config.columns.length }}</span>
        </button>
      </div>
    </div>

    <!-- ── Предупреждения ──────────────────────────────────────────── -->
    <div v-if="bannerVisible" class="shrink-0 space-y-2 px-5 pt-3">
      <div
        v-if="validationWarning"
        role="alert"
        class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-700/40 dark:bg-amber-900/20"
      >
        <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <p class="flex-1 text-xs text-amber-700 dark:text-amber-300">{{ validationWarning }}</p>
        <button type="button" class="text-amber-400 hover:text-amber-600" aria-label="Закрыть" @click="validationWarning = ''">
          <X class="h-3.5 w-3.5" />
        </button>
      </div>
      <div
        v-for="(w, i) in shownWarnings"
        :key="i"
        class="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-3 dark:border-orange-700/40 dark:bg-orange-900/20"
      >
        <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
        <p class="flex-1 text-xs text-orange-700 dark:text-orange-300">{{ w }}</p>
      </div>
      <div
        v-if="isStale"
        class="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-2.5 pl-3 dark:border-blue-700/40 dark:bg-blue-900/20"
      >
        <RefreshCw class="h-4 w-4 shrink-0 text-blue-500" />
        <p class="flex-1 text-xs text-blue-700 dark:text-blue-300">Настройки изменились — таблица показывает прежний результат.</p>
        <button
          type="button"
          class="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          :disabled="generating"
          @click="generate(true)"
        >
          Обновить
        </button>
      </div>
    </div>

    <!-- ── Тело ──────────────────────────────────────────────────── -->
    <div class="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <!-- Пустое состояние -->
      <div v-if="!result.generated" class="h-full overflow-y-auto">
        <div class="mx-auto flex max-w-4xl flex-col items-center px-6 py-10 text-center">
          <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/10 bg-primary/5">
            <TableProperties class="h-8 w-8 text-primary/50" />
          </div>
          <p class="mb-1 text-base font-medium text-gray-700 dark:text-gray-200">
            {{ templateId || config.columns.length ? "Отчёт готов к формированию" : "Соберите отчёт за пару кликов" }}
          </p>
          <p class="mb-5 text-sm text-gray-500 dark:text-gray-400">
            <template v-if="templateId || config.columns.length">Нажмите «Сформировать», чтобы получить актуальные данные</template>
            <template v-else>Начните с готового шаблона или откройте конструктор и выберите поля</template>
          </p>
          <div class="flex flex-wrap justify-center gap-2">
            <button
              v-if="templateId || config.columns.length"
              type="button"
              :disabled="generating"
              class="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-medium text-white shadow-md hover:bg-primary/90 disabled:opacity-60"
              @click="generate(true)"
            >
              <Loader2 v-if="generating" class="h-4 w-4 animate-spin" />
              <Play v-else class="h-4 w-4" />
              {{ generating ? "Формирование…" : "Сформировать" }}
            </button>
            <button
              type="button"
              class="flex items-center gap-2 rounded-xl border border-stroke bg-white px-5 py-2.5 font-medium text-gray-700 hover:border-primary hover:text-primary dark:border-strokedark dark:bg-boxdark dark:text-gray-200"
              @click="drawerOpen = true"
            >
              <SlidersHorizontal class="h-4 w-4" /> Открыть конструктор
            </button>
          </div>

          <div v-if="!templateId" class="mt-10 w-full text-left">
            <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Быстрый старт</p>
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <button
                v-for="p in REPORT_PRESETS"
                :key="p.id"
                type="button"
                class="group rounded-xl border border-stroke bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md dark:border-strokedark dark:bg-boxdark"
                @click="applyPreset(p)"
              >
                <p class="text-sm font-semibold text-gray-800 group-hover:text-primary dark:text-gray-100">{{ p.title }}</p>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ p.description }}</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      <ReportsPreviewTable
        v-else
        :rows="result.rows"
        :columns="result.column_labels"
        :numeric-columns="result.numeric_columns"
        :total="result.total"
        :loading="generating"
        :page="pagination.page"
        :limit="pagination.limit"
        :total-row="result.total_row"
        :sort-field="config.sort_field"
        :sort-direction="config.sort_direction"
        :duration-ms="result.duration_ms"
        @page-change="handlePageChange"
        @limit-change="handleLimitChange"
        @sort="handleSort"
      />
    </div>

    <!-- ══ DRAWER — Конструктор ════════════════════════════════════ -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-200"
      leave-to-class="opacity-0"
    >
      <div v-if="drawerOpen" class="fixed inset-0 z-[100000] bg-black/30 backdrop-blur-[1px]" @click="drawerOpen = false" />
    </Transition>

    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-from-class="translate-x-full"
      leave-active-class="transition-transform duration-200 ease-in"
      leave-to-class="translate-x-full"
    >
      <aside
        v-if="drawerOpen"
        role="dialog"
        aria-modal="true"
        aria-label="Настройка отчёта"
        class="fixed right-0 top-0 z-[100001] flex h-full w-full max-w-[1180px] flex-col border-l border-stroke bg-white sm:w-[92%] dark:border-strokedark dark:bg-boxdark"
        @keydown.escape="drawerOpen = false"
      >
        <!-- Шапка -->
        <div class="flex shrink-0 items-center justify-between border-b border-stroke bg-gray-50/50 px-5 py-3 dark:border-strokedark dark:bg-gray-800/20">
          <div class="flex items-center gap-2.5">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <SlidersHorizontal class="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 class="text-sm font-bold leading-none text-gray-900 dark:text-white">Настройка отчёта</h2>
              <p class="mt-1 text-[11px] text-gray-500">{{ summary }}</p>
            </div>
          </div>
          <button
            type="button"
            class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            aria-label="Закрыть конструктор"
            @click="drawerOpen = false"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Тело -->
        <div class="flex-1 overflow-y-auto p-4">
          <!-- 1. Базовая сущность -->
          <section class="mb-4">
            <SectionTitle n="1" title="Что считается строкой отчёта" />
            <div class="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Базовая сущность">
              <button
                v-for="root in ROOTS"
                :key="root.key"
                type="button"
                role="radio"
                :aria-checked="config.primary_entity === root.key"
                :title="root.hint"
                class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
                :class="config.primary_entity === root.key
                  ? 'border-primary bg-primary text-white shadow-sm'
                  : 'border-gray-200 text-gray-600 hover:border-primary/50 dark:border-gray-700 dark:text-gray-300'"
                @click="config.primary_entity = root.key"
              >
                {{ root.label }}
              </button>
            </div>
            <p class="mt-1.5 text-[11px] text-gray-500">{{ currentRoot?.hint }}</p>
          </section>

          <div class="grid grid-cols-1 items-start gap-5 xl:grid-cols-12">
            <!-- 2. Поля -->
            <section class="xl:col-span-4">
              <SectionTitle n="2" title="Поля данных" />
              <div v-if="metaLoading" class="flex justify-center rounded-xl border border-dashed border-gray-200 py-10 dark:border-gray-700">
                <Loader2 class="h-6 w-6 animate-spin text-primary" />
              </div>
              <ReportsFieldPicker
                v-else
                ref="fieldPicker"
                :groups="entityGroups"
                :selected-keys="selectedKeys"
                @toggle="toggleField"
              />
            </section>

            <!-- 3–4. Структура и группировка -->
            <div class="space-y-5 xl:col-span-4">
              <section>
                <SectionTitle n="3" title="Столбцы">
                  <button
                    v-if="config.columns.length"
                    type="button"
                    class="text-[11px] text-gray-400 hover:text-red-500"
                    @click="config.columns = []"
                  >
                    Очистить
                  </button>
                </SectionTitle>
                <ReportsColumnList
                  :columns="config.columns"
                  :field-map="fieldMap"
                  :grouping-labels="config.groupings.map((g) => g.label)"
                  @remove="removeColumn"
                  @reorder="(a, b) => moveItem(config.columns, a, b)"
                />
              </section>
              <section>
                <SectionTitle n="4" title="Группировка строк" />
                <ReportsGroupingSection
                  :groupings="config.groupings"
                  :entity-groups="entityGroups"
                  @add="(g) => config.groupings.push(g)"
                  @remove="(i) => config.groupings.splice(i, 1)"
                  @reorder="(a, b) => moveItem(config.groupings, a, b)"
                />
                <p v-if="config.groupings.length && !hasAggregatedColumn" class="mt-2 text-[11px] text-gray-500">
                  Подсказка: добавьте столбец с агрегацией (например «Количество слушателей»), чтобы посчитать значения по каждой группе.
                </p>
              </section>
            </div>

            <!-- 5. Фильтры -->
            <section class="xl:col-span-4">
              <SectionTitle n="5" title="Фильтры" />
              <div class="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                <ReportsFiltersSection
                  :filters="config.filters"
                  :lookup="lookup"
                  :entity-groups="entityGroups"
                  :field-map="fieldMap"
                  :sort-options="sortOptions"
                  :sort-field="config.sort_field"
                  :sort-direction="config.sort_direction"
                  @update="(f) => (config.filters = f)"
                  @update:sort="setSort"
                />
              </div>
            </section>
          </div>
        </div>

        <!-- Низ -->
        <div class="flex shrink-0 items-center gap-3 border-t border-stroke bg-gray-50 px-4 py-3 dark:border-strokedark dark:bg-gray-800/50">
          <p v-if="validationWarning" class="hidden flex-1 text-xs text-amber-600 md:block">{{ validationWarning }}</p>
          <p v-else-if="compatibility" class="hidden flex-1 text-xs text-orange-600 md:block">{{ compatibility }}</p>
          <p v-else class="hidden flex-1 text-[11px] text-gray-400 md:block">Ctrl + Enter — сформировать · Esc — закрыть</p>
          <button
            type="button"
            :disabled="generating"
            class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary/90 disabled:opacity-60 md:max-w-xs"
            @click="generateAndClose"
          >
            <Loader2 v-if="generating" class="h-4 w-4 animate-spin" />
            <Play v-else class="h-4 w-4" />
            {{ generating ? "Формирование…" : "Сформировать отчёт" }}
          </button>
        </div>
      </aside>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronLeft,
  CopyPlus,
  FileSpreadsheet,
  Loader2,
  Pencil,
  Play,
  RefreshCw,
  RotateCcw,
  Save,
  SlidersHorizontal,
  TableProperties,
  X,
} from "lucide-vue-next";
import { useToast } from "~/composables/useToast";
import { checkColumnsCompatibility } from "~/composables/useCompatibilityCheck";
import {
  DATE_FIELD_OPTIONS,
  OP_LABELS,
  REPORT_PRESETS,
  ROOTS,
  VALUELESS_OPS,
  type ColumnConfig,
  type EntityGroupMeta,
  type FieldMeta,
  type GroupingItem,
  type ReportFilters,
  type ReportPreset,
  type RootEntity,
} from "~/utils/reportBuilder";

definePageMeta({ layout: "report-builder" as any });

/** Заголовок секции конструктора: «1. Название ———— [слот]» */
const SectionTitle = defineComponent({
  props: { n: { type: String, required: true }, title: { type: String, required: true } },
  setup(props, { slots }) {
    return () =>
      h("div", { class: "mb-2 flex items-center gap-2" }, [
        h("span", { class: "text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400" }, `${props.n}. ${props.title}`),
        h("div", { class: "h-px flex-1 bg-gray-100 dark:bg-gray-800" }),
        slots.default?.(),
      ]);
  },
});

const route = useRoute();
const router = useRouter();
const toast = useToast();

const apiFetch = (url: string, opts?: Record<string, any>): Promise<any> => ($fetch as any)(url, opts);

const DRAFT_KEY = "report_builder_draft";
const ROOT_KEYS = ROOTS.map((r) => r.key);

const defaultConfig = () => ({
  name: "Новый отчёт",
  description: "",
  is_public: false,
  primary_entity: "study_groups" as RootEntity,
  columns: [] as ColumnConfig[],
  groupings: [] as GroupingItem[],
  filters: {} as ReportFilters,
  sort_field: "",
  sort_direction: "asc" as "asc" | "desc",
});

const config = reactive(defaultConfig());

const result = reactive({
  generated: false,
  rows: [] as Record<string, unknown>[],
  column_labels: [] as string[],
  numeric_columns: [] as string[],
  total: 0,
  total_row: null as Record<string, unknown> | null,
  warnings: [] as string[],
  duration_ms: null as number | null,
});

const pagination = reactive({ page: 1, limit: 50 });

// ── Метаданные ─────────────────────────────────────────────────────────
const metaLoading = ref(false);
const entityGroups = ref<EntityGroupMeta[]>([]);
const lookup = ref<any>({ courses: [], organizations: [], instructors: [], groups: [] });
const templateId = ref<string | null>(null);

const fieldMap = computed(() => {
  const m = new Map<string, FieldMeta>();
  for (const g of entityGroups.value) for (const f of g.fields) m.set(f.key, f);
  return m;
});
const selectedKeys = computed(() => new Set(config.columns.map((c) => c.field_key)));
const currentRoot = computed(() => ROOTS.find((r) => r.key === config.primary_entity));

// ── UI-состояние ───────────────────────────────────────────────────────
const generating = ref(false);
const exporting = ref(false);
const saving = ref(false);
const editingTitle = ref(false);
const titleInput = ref<HTMLInputElement | null>(null);
const validationWarning = ref("");
const draftSavedHint = ref(false);
const drawerOpen = ref(false);
const saveMenuOpen = ref(false);
const saveMenuRef = ref<HTMLElement | null>(null);
const fieldPicker = ref<{ focus: () => void } | null>(null);
let mounted = false;

// ── Снимки конфигурации: «не сохранено» и «результат устарел» ─────────
const savedSnapshot = (): string =>
  JSON.stringify({
    name: config.name,
    description: config.description,
    is_public: !!config.is_public,
    primary_entity: config.primary_entity,
    columns: config.columns.map((c) => [c.field_key, c.label, c.aggregation, !!c.show_in_total, c.total_aggregation]),
    groupings: config.groupings,
    filters: config.filters,
    sort_field: config.sort_field,
    sort_direction: config.sort_direction,
  });

const querySnapshot = (): string =>
  JSON.stringify({
    primary_entity: config.primary_entity,
    columns: config.columns.map((c) => [c.field_key, c.label, c.aggregation, !!c.show_in_total, c.total_aggregation]),
    groupings: config.groupings,
    filters: config.filters,
  });

const savedFingerprint = ref("");
const lastRunFingerprint = ref("");
const isDirty = computed(() => !!templateId.value && savedSnapshot() !== savedFingerprint.value);
const isStale = computed(() => result.generated && !generating.value && querySnapshot() !== lastRunFingerprint.value);

// ── Производные ────────────────────────────────────────────────────────
const hasAggregatedColumn = computed(() => config.columns.some((c) => c.aggregation !== "none"));

const sortOptions = computed(() => [...config.groupings.map((g) => g.label), ...config.columns.map((c) => c.label)]);

const compatibility = computed(() => {
  if (config.columns.length < 2) return "";
  const w = checkColumnsCompatibility(config.columns, entityGroups.value);
  return w ? "Поля из независимых разделов — строки могут дублироваться, суммы завышаться. Для подсчётов используйте «Уникальных»." : "";
});

const shownWarnings = computed(() => (isStale.value ? [] : result.warnings));
const bannerVisible = computed(() => !!validationWarning.value || shownWarnings.value.length > 0 || isStale.value);

const plural = (n: number, forms: [string, string, string]) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return forms[0];
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return forms[1];
  return forms[2];
};

const summary = computed(() => {
  const parts = [
    `${config.columns.length} ${plural(config.columns.length, ["столбец", "столбца", "столбцов"])}`,
  ];
  if (config.groupings.length) parts.push(`${config.groupings.length} ${plural(config.groupings.length, ["уровень", "уровня", "уровней"])} группировки`);
  const nf = activeFilterChips.value.length;
  if (nf) parts.push(`${nf} ${plural(nf, ["фильтр", "фильтра", "фильтров"])}`);
  return parts.join(" · ");
});

// ── Чипы фильтров ──────────────────────────────────────────────────────
const nameList = (ids: string[] | undefined, list: any[], key: (x: any) => string) =>
  (ids ?? []).map((id) => key(list.find((x: any) => String(x.id) === String(id))) || "?").join(", ");

const fmtDate = (s: string) => s.split("-").reverse().join(".");

const activeFilterChips = computed(() => {
  const f = config.filters;
  const chips: { key: string; label: string }[] = [];
  if (f.date_from || f.date_to) {
    const field = DATE_FIELD_OPTIONS.find((o) => o.key === (f.date_field || "group.start_date"))?.label ?? "";
    const range = [f.date_from ? `с ${fmtDate(f.date_from)}` : "", f.date_to ? `по ${fmtDate(f.date_to)}` : ""].filter(Boolean).join(" ");
    chips.push({ key: "date", label: `${field}: ${range}` });
  }
  if (f.course_ids?.length) chips.push({ key: "course_ids", label: `Курсы: ${nameList(f.course_ids, lookup.value.courses, (c) => c?.short_name || c?.name)}` });
  if (f.group_ids?.length) chips.push({ key: "group_ids", label: `Группы: ${nameList(f.group_ids, lookup.value.groups, (g) => g?.code)}` });
  if (f.org_ids?.length) chips.push({ key: "org_ids", label: `Орг.: ${nameList(f.org_ids, lookup.value.organizations, (o) => o?.short_name || o?.name)}` });
  if (f.instructor_ids?.length) chips.push({ key: "instructor_ids", label: `Инструкторы: ${nameList(f.instructor_ids, lookup.value.instructors, (i) => i?.full_name)}` });
  (f.conditions ?? []).forEach((c, i) => {
    const field = fieldMap.value.get(c.field_key)?.label ?? c.field_key;
    const val = VALUELESS_OPS.includes(c.op) ? "" : ` ${c.value ?? ""}${c.op === "between" ? `–${c.value2 ?? ""}` : ""}`;
    chips.push({ key: `cond:${i}`, label: `${field} ${OP_LABELS[c.op] ?? c.op}${val}` });
  });
  if (f.row_limit) chips.push({ key: "row_limit", label: `Первые ${f.row_limit}` });
  return chips;
});

const removeFilterChip = (key: string) => {
  const f: ReportFilters = { ...config.filters };
  if (key === "date") {
    delete f.date_from;
    delete f.date_to;
  } else if (key.startsWith("cond:")) {
    const idx = Number(key.slice(5));
    f.conditions = (f.conditions ?? []).filter((_, i) => i !== idx);
    if (!f.conditions.length) delete f.conditions;
  } else {
    delete (f as any)[key];
  }
  config.filters = f;
  if (result.generated) generate(true);
};

// ── Черновик в localStorage ────────────────────────────────────────────
let draftTimer: ReturnType<typeof setTimeout> | null = null;
let draftHintTimer: ReturnType<typeof setTimeout> | null = null;

const saveDraft = () => {
  if (!mounted || templateId.value) return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...config }));
    draftSavedHint.value = true;
    if (draftHintTimer) clearTimeout(draftHintTimer);
    draftHintTimer = setTimeout(() => (draftSavedHint.value = false), 2500);
  } catch {
    /* localStorage недоступен */
  }
};

const loadDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);
    applyConfig({ ...defaultConfig(), ...draft });
  } catch {
    /* повреждённый черновик — игнорируем */
  }
};

const clearDraft = () => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* noop */
  }
};

watch(
  () => savedSnapshot(),
  () => {
    if (draftTimer) clearTimeout(draftTimer);
    draftTimer = setTimeout(saveDraft, 1200);
  },
);

// ── Применение конфигурации (черновик / шаблон / пресет) ──────────────
const knownField = (key?: string) => !!key && (fieldMap.value.size === 0 || fieldMap.value.has(key));

const applyConfig = (src: any) => {
  config.name = src.name || "Новый отчёт";
  config.description = src.description || "";
  config.is_public = !!src.is_public;
  config.primary_entity = ROOT_KEYS.includes(src.primary_entity) ? src.primary_entity : "study_groups";
  const dropped: string[] = [];
  config.columns = (src.columns || [])
    .filter((c: any) => (knownField(c.field_key) ? true : (dropped.push(c.field_key), false)))
    .map((c: any) => ({
      field_key: c.field_key,
      label: c.label || fieldMap.value.get(c.field_key)?.label || c.field_key,
      aggregation: c.aggregation || "none",
      show_in_total: !!c.show_in_total,
      total_aggregation: c.total_aggregation || "sum",
      width: c.width || 150,
      align: c.align || "left",
    }));
  config.groupings = (src.groupings || []).filter((g: any) => knownField(g.field_key || g.date_field_key));
  config.filters = src.filters && typeof src.filters === "object" ? { ...src.filters } : {};
  config.sort_field = src.sort_field || "";
  config.sort_direction = src.sort_direction === "desc" ? "desc" : "asc";
  if (dropped.length) toast.warning(`Поля больше не поддерживаются и убраны: ${dropped.join(", ")}`);
};

const applyPreset = (p: ReportPreset) => {
  applyConfig(JSON.parse(JSON.stringify(p.config)));
  generate(true);
};

// ── Инициализация ──────────────────────────────────────────────────────
const startEditTitle = async () => {
  editingTitle.value = true;
  await nextTick();
  titleInput.value?.focus();
  titleInput.value?.select();
};

const fetchMeta = async () => {
  metaLoading.value = true;
  try {
    const [fields, lookupData] = await Promise.all([
      apiFetch("/api/reports/builder/meta/fields"),
      apiFetch("/api/reports/builder/meta/lookup"),
    ]);
    entityGroups.value = fields.data;
    lookup.value = lookupData.data;
  } catch {
    toast.error("Ошибка загрузки полей");
  } finally {
    metaLoading.value = false;
  }
};

const loadTemplate = async (id: string) => {
  try {
    const res = await apiFetch(`/api/reports/builder/templates/${id}`);
    const tpl = res.data;
    // primary_entity хранится первым элементом data_sources
    const root = (tpl.data_sources || []).find((s: string) => ROOT_KEYS.includes(s as RootEntity));
    applyConfig({
      ...tpl,
      primary_entity: root || "study_groups",
      groupings: tpl.row_grouping || [],
    });
    templateId.value = id;
    savedFingerprint.value = savedSnapshot();
    clearDraft();
  } catch {
    toast.error("Ошибка загрузки шаблона");
  }
};

const onGlobalKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    generateAndClose();
  } else if (e.key === "Escape" && drawerOpen.value) {
    drawerOpen.value = false;
  }
};

const onDocMousedown = (e: MouseEvent) => {
  if (saveMenuRef.value && !saveMenuRef.value.contains(e.target as Node)) saveMenuOpen.value = false;
};

onMounted(async () => {
  window.addEventListener("keydown", onGlobalKeydown);
  document.addEventListener("mousedown", onDocMousedown);
  await fetchMeta();
  if (route.query.template) {
    await loadTemplate(String(route.query.template));
  } else {
    loadDraft();
  }
  mounted = true;
});

onUnmounted(() => {
  mounted = false;
  window.removeEventListener("keydown", onGlobalKeydown);
  document.removeEventListener("mousedown", onDocMousedown);
  if (draftTimer) clearTimeout(draftTimer);
  if (draftHintTimer) clearTimeout(draftHintTimer);
});

watch(drawerOpen, async (open) => {
  if (open) {
    await nextTick();
    fieldPicker.value?.focus();
  }
});

// ── Поля / столбцы ─────────────────────────────────────────────────────
const toggleField = (field: FieldMeta) => {
  const idx = config.columns.findIndex((c) => c.field_key === field.key);
  if (idx !== -1) {
    removeColumn(field.key);
    return;
  }
  config.columns.push({
    field_key: field.key,
    label: field.label,
    aggregation: field.defaultAggregation,
    show_in_total: false,
    total_aggregation: "sum",
    width: 150,
    align: "left",
  });
  validationWarning.value = "";
};

const removeColumn = (key: string) => {
  const col = config.columns.find((c) => c.field_key === key);
  config.columns = config.columns.filter((c) => c.field_key !== key);
  if (col && config.sort_field === col.label) config.sort_field = "";
};

const moveItem = <T,>(list: T[], from: number, to: number) => {
  if (to < 0 || to >= list.length || from === to) return;
  const [moved] = list.splice(from, 1);
  list.splice(to, 0, moved as T);
};

// Переименование столбца/уровня не должно «терять» сортировку
watch(sortOptions, (labels, prev) => {
  if (!config.sort_field || labels.includes(config.sort_field)) return;
  const oldIdx = prev?.indexOf(config.sort_field) ?? -1;
  config.sort_field = oldIdx >= 0 && labels[oldIdx] ? labels[oldIdx]! : "";
});

// ── Валидация ──────────────────────────────────────────────────────────
const validateBeforeGenerate = (): boolean => {
  if (config.columns.length === 0 && config.groupings.length === 0) {
    validationWarning.value = "Выберите хотя бы одно поле данных или добавьте группировку строк.";
    return false;
  }
  const bad = (config.filters.conditions ?? []).find(
    (c) =>
      !VALUELESS_OPS.includes(c.op) &&
      (c.value === undefined || c.value === null || c.value === "" || (c.op === "between" && (c.value2 === undefined || c.value2 === ""))),
  );
  if (bad) {
    validationWarning.value = `Заполните значение условия «${fieldMap.value.get(bad.field_key)?.label ?? bad.field_key}» или удалите его.`;
    return false;
  }
  const { date_from, date_to } = config.filters;
  if (date_from && date_to && date_from > date_to) {
    validationWarning.value = "Дата начала периода позже даты окончания.";
    return false;
  }
  validationWarning.value = "";
  return true;
};

const requestBody = () => ({
  name: config.name,
  columns: config.columns,
  groupings: config.groupings,
  filters: config.filters,
  primary_entity: config.primary_entity,
  sort_field: config.sort_field || undefined,
  sort_direction: config.sort_direction,
});

// ── Формирование ───────────────────────────────────────────────────────
let requestSeq = 0;

const generate = async (resetPage = false) => {
  if (!validateBeforeGenerate()) {
    drawerOpen.value = true;
    return;
  }
  if (resetPage) pagination.page = 1;
  const seq = ++requestSeq;
  const snapshot = querySnapshot();
  generating.value = true;
  try {
    const res = await apiFetch("/api/reports/builder/preview", {
      method: "POST",
      body: { ...requestBody(), limit: pagination.limit, offset: (pagination.page - 1) * pagination.limit },
    });
    if (seq !== requestSeq) return; // пришёл ответ на устаревший запрос
    const d = res.data;
    result.rows = d.rows;
    result.column_labels = d.column_labels;
    result.numeric_columns = d.numeric_columns || [];
    result.total = d.total;
    result.total_row = d.total_row || null;
    result.warnings = d.warnings || [];
    result.duration_ms = d.duration_ms ?? null;
    result.generated = true;
    lastRunFingerprint.value = snapshot;
    // Страница «уехала» за конец (например, после смены фильтров)
    if (d.rows.length === 0 && d.total > 0 && pagination.page > 1) {
      pagination.page = Math.ceil(d.total / pagination.limit);
      await generate(false);
    }
  } catch (e: any) {
    if (seq !== requestSeq) return;
    const msg = e?.data?.statusMessage || e?.statusMessage || "Ошибка формирования отчёта";
    validationWarning.value = msg;
    toast.error(msg);
  } finally {
    if (seq === requestSeq) generating.value = false;
  }
};

const generateAndClose = async () => {
  await generate(true);
  if (result.generated && !validationWarning.value) drawerOpen.value = false;
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  generate(false);
};

const handleLimitChange = (limit: number) => {
  pagination.limit = limit;
  generate(true);
};

const setSort = (field: string, direction: "asc" | "desc") => {
  config.sort_field = field;
  config.sort_direction = field ? direction : "asc";
};

const handleSort = (field: string, direction: "asc" | "desc" = "asc") => {
  setSort(field, direction);
  generate(true);
};

// ── Экспорт Excel ──────────────────────────────────────────────────────
const readBlobError = async (e: any): Promise<string> => {
  try {
    if (e?.data instanceof Blob) {
      const j = JSON.parse(await e.data.text());
      return j.statusMessage || j.message || "";
    }
    return e?.data?.statusMessage || "";
  } catch {
    return "";
  }
};

const safeName = (s: string) => s.replace(/[\\/:*?"<>|]+/g, "_").trim() || "report";

const exportExcel = async () => {
  if (!validateBeforeGenerate()) return;
  exporting.value = true;
  try {
    const blob = (await apiFetch("/api/reports/builder/export/excel", {
      method: "POST",
      body: requestBody(),
      responseType: "blob",
    })) as Blob;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName(config.name)}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    toast.success("Excel-файл скачан");
  } catch (e: any) {
    toast.error((await readBlobError(e)) || "Ошибка экспорта Excel");
  } finally {
    exporting.value = false;
  }
};

// ── Сохранение шаблона ─────────────────────────────────────────────────
const saveTemplate = async (asNew: boolean) => {
  saveMenuOpen.value = false;
  if (!config.name.trim()) {
    toast.error("Введите название отчёта");
    startEditTitle();
    return;
  }
  if (config.columns.length === 0) {
    validationWarning.value = "Выберите хотя бы один столбец перед сохранением шаблона.";
    toast.error("Выберите хотя бы один столбец");
    return;
  }
  saving.value = true;
  const body = {
    name: asNew && templateId.value ? `${config.name.trim()} (копия)` : config.name.trim(),
    description: config.description,
    primary_entity: config.primary_entity,
    // Первый элемент — базовая сущность (по нему она восстанавливается при загрузке)
    data_sources: [...new Set([config.primary_entity, ...config.columns.map((c) => c.field_key.split(".")[0]!)])],
    row_grouping: config.groupings,
    filters: config.filters,
    sort_field: config.sort_field || null,
    sort_direction: config.sort_direction,
    is_public: config.is_public,
    columns: config.columns,
  };
  const create = async () => {
    const res = await apiFetch("/api/reports/builder/templates", { method: "POST", body });
    templateId.value = res.data.id;
    config.name = body.name;
    clearDraft();
    router.replace({ query: { ...route.query, template: res.data.id } });
  };
  try {
    if (templateId.value && !asNew) {
      try {
        await apiFetch(`/api/reports/builder/templates/${templateId.value}`, { method: "PUT", body });
        toast.success("Шаблон обновлён");
      } catch (e: any) {
        if (e?.statusCode !== 403 && e?.response?.status !== 403) throw e;
        // Чужой публичный шаблон — сохраняем свою копию
        body.name = `${config.name.trim()} (копия)`;
        await create();
        toast.info("Это чужой шаблон — сохранена ваша копия");
      }
    } else {
      await create();
      toast.success(asNew ? "Сохранено как новый отчёт" : "Шаблон сохранён");
    }
    savedFingerprint.value = savedSnapshot();
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || "Ошибка сохранения");
  } finally {
    saving.value = false;
  }
};

const resetAll = () => {
  saveMenuOpen.value = false;
  applyConfig(defaultConfig());
  templateId.value = null;
  savedFingerprint.value = "";
  Object.assign(result, {
    generated: false,
    rows: [],
    column_labels: [],
    numeric_columns: [],
    total: 0,
    total_row: null,
    warnings: [],
    duration_ms: null,
  });
  validationWarning.value = "";
  pagination.page = 1;
  clearDraft();
  if (route.query.template) router.replace({ query: {} });
  toast.success("Настройки сброшены");
};
</script>
