<template>
  <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
    <!-- Тулбар -->
    <div class="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-stroke bg-white px-5 py-2.5 dark:border-strokedark dark:bg-boxdark">
      <div class="flex items-center gap-2 text-sm">
        <span class="font-medium text-gray-700 dark:text-gray-300">Результат</span>
        <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs tabular-nums text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          {{ total.toLocaleString("ru-RU") }} {{ plural(total, "строка", "строки", "строк") }}
        </span>
        <span v-if="durationMs !== null" class="text-[11px] tabular-nums text-gray-400">{{ durationMs }} мс</span>
      </div>

      <span
        v-if="sortField"
        class="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary"
      >
        <ArrowUpNarrowWide v-if="sortDirection === 'asc'" class="h-3 w-3" />
        <ArrowDownWideNarrow v-else class="h-3 w-3" />
        <span class="max-w-[160px] truncate">{{ sortField }}</span>
        <button type="button" class="hover:text-red-500" aria-label="Сбросить сортировку" @click="$emit('sort', '')">
          <X class="h-3 w-3" />
        </button>
      </span>

      <div class="flex-1" />

      <div class="relative">
        <Search class="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <input
          v-model="search"
          type="search"
          placeholder="Найти на странице…"
          aria-label="Поиск по строкам текущей страницы"
          class="w-48 rounded-lg border border-gray-200 bg-gray-50 py-1 pl-7 pr-2 text-xs outline-none focus:border-primary focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>
      <button
        type="button"
        class="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:border-primary hover:text-primary dark:border-gray-700 dark:text-gray-300"
        title="Скопировать страницу как таблицу (вставляется в Excel)"
        :disabled="rows.length === 0"
        @click="copy"
      >
        <ClipboardCopy class="h-3.5 w-3.5" />
        {{ copied ? "Скопировано" : "Копировать" }}
      </button>
    </div>

    <!-- Пусто -->
    <div v-if="!loading && rows.length === 0" class="flex flex-1 flex-col items-center justify-center p-10 text-center">
      <SearchX class="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
      <p class="text-sm text-gray-500 dark:text-gray-400">Нет данных по выбранным критериям</p>
      <p class="mt-1 text-xs text-gray-400">Ослабьте фильтры или условия, расширьте период</p>
    </div>

    <!-- Таблица -->
    <div v-else class="relative flex-1 overflow-auto">
      <div v-if="loading" class="absolute inset-0 z-20 flex items-start justify-center bg-white/60 pt-24 dark:bg-boxdark/60">
        <Loader2 class="h-7 w-7 animate-spin text-primary" />
      </div>
      <table class="w-full border-collapse text-sm">
        <thead class="sticky top-0 z-10">
          <tr class="bg-gray-50 dark:bg-gray-800">
            <th class="w-10 border-b border-stroke px-2 py-2.5 text-right text-[11px] font-medium text-gray-400 dark:border-strokedark">#</th>
            <th
              v-for="col in columns"
              :key="col"
              scope="col"
              class="group relative max-w-[320px] cursor-pointer select-none whitespace-nowrap border-b border-stroke px-4 py-2.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100 dark:border-strokedark dark:text-gray-300 dark:hover:bg-gray-700/60"
              :class="isNumeric(col) ? 'text-right' : 'text-left'"
              :style="widthStyle(col)"
              :aria-sort="sortField === col ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'"
              :title="'Сортировать по «' + col + '» (по всему отчёту)'"
              @click="toggleSort(col)"
            >
              <span class="inline-flex max-w-full items-center gap-1" :class="isNumeric(col) ? 'flex-row-reverse' : ''">
                <span class="truncate">{{ col }}</span>
                <ArrowUp v-if="sortField === col && sortDirection === 'asc'" class="h-3 w-3 shrink-0 text-primary" />
                <ArrowDown v-else-if="sortField === col" class="h-3 w-3 shrink-0 text-primary" />
                <ArrowUpDown v-else class="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-40" />
              </span>
              <span
                class="absolute right-0 top-0 z-20 h-full w-1.5 cursor-col-resize hover:bg-primary/50"
                @click.stop
                @mousedown.prevent="startResize(col, $event)"
              />
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr
            v-for="item in visibleRows"
            :key="item.idx"
            class="transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/40"
          >
            <td class="px-2 py-2 text-right text-[11px] tabular-nums text-gray-400">{{ (page - 1) * limit + item.idx + 1 }}</td>
            <td
              v-for="col in columns"
              :key="col"
              class="max-w-[320px] truncate whitespace-nowrap px-4 py-2 text-gray-700 dark:text-gray-300"
              :class="isNumeric(col) ? 'text-right tabular-nums' : ''"
              :style="widthStyle(col)"
              :title="formatValue(item.row[col], col)"
            >
              <template v-if="search">
                <template v-for="(p, i) in highlightParts(formatValue(item.row[col], col), search)" :key="i">
                  <mark v-if="p.hit" class="rounded bg-amber-200/70 text-inherit dark:bg-amber-500/30">{{ p.text }}</mark>
                  <template v-else>{{ p.text }}</template>
                </template>
              </template>
              <template v-else>{{ formatValue(item.row[col], col) }}</template>
            </td>
          </tr>
          <tr v-if="search && visibleRows.length === 0">
            <td :colspan="columns.length + 1" class="px-4 py-6 text-center text-xs text-gray-400">
              На этой странице нет совпадений с «{{ search }}»
            </td>
          </tr>
        </tbody>
        <tfoot v-if="totalRow" class="sticky bottom-0 z-10">
          <tr class="total-row">
            <td class="border-t-2 border-primary/40 px-2 py-2.5" />
            <td
              v-for="(col, i) in columns"
              :key="col"
              class="max-w-[320px] truncate whitespace-nowrap border-t-2 border-primary/40 px-4 py-2.5 text-sm font-bold"
              :class="isNumeric(col) ? 'text-right tabular-nums' : ''"
              :style="widthStyle(col)"
            >
              <span v-if="totalRow[col] !== undefined && totalRow[col] !== null" class="text-primary">{{ formatValue(totalRow[col], col) }}</span>
              <span v-else-if="i === 0" class="flex items-center gap-1.5 text-primary">
                <Sigma class="h-3.5 w-3.5" /> ИТОГО
              </span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div v-if="total > 0" class="shrink-0 border-t border-stroke bg-white dark:border-strokedark dark:bg-boxdark">
      <UiPagination
        :current-page="page"
        :total-pages="Math.max(1, Math.ceil(total / limit))"
        :total="total"
        :limit="limit"
        :limit-options="[25, 50, 100, 200]"
        @update:page="$emit('page-change', $event)"
        @update:limit="$emit('limit-change', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ArrowUpNarrowWide,
  ArrowDownWideNarrow,
  ClipboardCopy,
  Loader2,
  Search,
  SearchX,
  Sigma,
  X,
} from "lucide-vue-next";
import { buildMatcher, highlightParts, toTsv } from "~/utils/reportBuilder";

const props = defineProps<{
  rows: Record<string, unknown>[];
  columns: string[];
  numericColumns: string[];
  total: number;
  loading: boolean;
  page: number;
  limit: number;
  totalRow?: Record<string, unknown> | null;
  sortField: string;
  sortDirection: "asc" | "desc";
  durationMs: number | null;
}>();

const emit = defineEmits<{
  (e: "page-change", page: number): void;
  (e: "limit-change", limit: number): void;
  (e: "sort", field: string, direction?: "asc" | "desc"): void;
}>();

const numericSet = computed(() => new Set(props.numericColumns));
const isNumeric = (col: string) => numericSet.value.has(col);

const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};

// ── Сортировка на сервере: по возрастанию → по убыванию → сброс ────────
const toggleSort = (col: string) => {
  if (props.sortField !== col) emit("sort", col, "asc");
  else if (props.sortDirection === "asc") emit("sort", col, "desc");
  else emit("sort", "");
};

// ── Поиск по текущей странице ─────────────────────────────────────────
const search = ref("");
const visibleRows = computed(() => {
  const all = props.rows.map((row, idx) => ({ row, idx }));
  const match = buildMatcher(search.value);
  if (!match) return all;
  return all.filter(({ row }) => match(props.columns.map((c) => formatValue(row[c], c)).join(" ")));
});

// ── Форматирование ────────────────────────────────────────────────────
const DATE_RE = /^\d{4}-\d{2}-\d{2}(T|\s|$)/;
const formatValue = (value: unknown, col?: string): string => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Да" : "Нет";
  if (typeof value === "number") {
    // Год из шкалы «По годам» не форматируем с пробелом
    if (col && /год/i.test(col) && Number.isInteger(value) && value > 1900 && value < 2200) return String(value);
    return value.toLocaleString("ru-RU", { maximumFractionDigits: 2 });
  }
  if (typeof value === "string" && DATE_RE.test(value)) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      // DATE из MySQL приходит как локальная полночь в ISO (…T19:00:00Z для UTC+5),
      // поэтому время определяем по локальным часам, а не по строке
      const hasTime = /[T\s]\d{2}:\d{2}/.test(value) && (d.getHours() !== 0 || d.getMinutes() !== 0);
      return hasTime
        ? d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : d.toLocaleDateString("ru-RU");
    }
  }
  return String(value);
};

// ── Копирование ───────────────────────────────────────────────────────
const copied = ref(false);
const copy = async () => {
  const rows = visibleRows.value.map(({ row }) =>
    Object.fromEntries(props.columns.map((c) => [c, isNumeric(c) ? row[c] : formatValue(row[c], c)])),
  );
  try {
    await navigator.clipboard.writeText(toTsv(props.columns, rows));
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch {
    /* буфер обмена недоступен */
  }
};

// ── Ресайз столбцов ───────────────────────────────────────────────────
const colWidths = ref<Record<string, number>>({});
const widthStyle = (col: string) => {
  const w = colWidths.value[col];
  return w ? { width: `${w}px`, minWidth: `${w}px`, maxWidth: `${w}px` } : undefined;
};
const startResize = (col: string, event: MouseEvent) => {
  const startX = event.clientX;
  const th = (event.target as HTMLElement).closest("th");
  const startWidth = colWidths.value[col] || th?.offsetWidth || 160;
  const onMove = (e: MouseEvent) => {
    colWidths.value = { ...colWidths.value, [col]: Math.max(70, startWidth + (e.clientX - startX)) };
  };
  const onUp = () => {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  };
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
};
</script>

<style scoped>
.total-row {
  background: color-mix(in srgb, var(--color-primary, #3c50e0) 8%, white);
}
:global(.dark) .total-row {
  background: color-mix(in srgb, var(--color-primary, #3c50e0) 18%, #1a222c);
}
</style>
