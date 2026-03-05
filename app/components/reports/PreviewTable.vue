<template>
  <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
    <!-- Тулбар над таблицей -->
    <div
      class="flex items-center justify-between px-5 py-3 bg-white dark:bg-boxdark border-b border-stroke dark:border-strokedark shrink-0"
    >
      <div class="flex items-center gap-3">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
          >Результат</span
        >
        <span
          class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full"
        >
          {{ total }} строк
        </span>
        <span
          v-if="total > rows.length"
          class="text-xs text-amber-600 dark:text-amber-400"
        >
          Показано {{ rows.length }} из {{ total }}
        </span>
      </div>

      <!-- Сортировка-инфо -->
      <div
        v-if="localSort.col"
        class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"
      >
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
            d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
          />
        </svg>
        <span class="truncate max-w-[140px]">{{ localSort.col }}</span>
        <span class="font-medium">{{
          localSort.dir === "asc" ? "↑" : "↓"
        }}</span>
        <button
          class="ml-1 text-gray-400 hover:text-red-500 transition-colors"
          title="Сбросить сортировку"
          @click="clearSort"
        >
          <svg
            class="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div
        class="inline-block h-8 w-8 animate-spin rounded-full border-3 border-solid border-primary border-r-transparent"
      />
    </div>

    <!-- Пустой результат -->
    <div
      v-else-if="rows.length === 0"
      class="flex-1 flex flex-col items-center justify-center text-center p-10"
    >
      <svg
        class="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3"
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
      <p class="text-gray-500 dark:text-gray-400 text-sm">
        Нет данных по выбранным критериям
      </p>
      <p class="text-xs text-gray-400 mt-1">
        Попробуйте изменить фильтры или добавить поля
      </p>
    </div>

    <!-- Таблица -->
    <div v-else class="flex-1 overflow-auto">
      <table class="w-full text-sm border-collapse">
        <thead class="sticky top-0 z-10">
          <tr class="bg-gray-50 dark:bg-gray-800">
            <th
              v-for="col in columns"
              :key="col"
              class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 border-b border-stroke dark:border-strokedark whitespace-nowrap cursor-pointer select-none group transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/60"
              @click="toggleSort(col)"
            >
              <div class="flex items-center gap-1.5">
                <span class="uppercase tracking-wide">{{ col }}</span>
                <!-- Иконки сортировки -->
                <span
                  class="flex flex-col shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
                  :class="localSort.col === col ? 'opacity-100' : ''"
                >
                  <svg
                    class="w-2.5 h-2.5 -mb-0.5 transition-colors"
                    :class="
                      localSort.col === col && localSort.dir === 'asc'
                        ? 'text-primary'
                        : 'text-gray-400 dark:text-gray-600'
                    "
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 4l8 8H4z" />
                  </svg>
                  <svg
                    class="w-2.5 h-2.5 transition-colors"
                    :class="
                      localSort.col === col && localSort.dir === 'desc'
                        ? 'text-primary'
                        : 'text-gray-400 dark:text-gray-600'
                    "
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 20l-8-8h16z" />
                  </svg>
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr
            v-for="(row, rowIdx) in sortedRows"
            :key="rowIdx"
            class="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
          >
            <td
              v-for="col in columns"
              :key="col"
              class="px-4 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap text-sm"
            >
              {{ formatValue(row[col]) }}
            </td>
          </tr>
        </tbody>

        <!-- СТРОКА TOTAL -->
        <tfoot v-if="totalRow" class="sticky bottom-0 z-10">
          <tr class="total-row">
            <td
              v-for="col in columns"
              :key="col"
              class="px-4 py-3 text-sm font-bold whitespace-nowrap border-t-2 border-primary/40"
            >
              <template v-if="col === columns[0]">
                <span class="flex items-center gap-2 text-primary">
                  <svg
                    class="w-3.5 h-3.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.5"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  ИТОГО
                </span>
              </template>
              <template
                v-else-if="
                  totalRow[col] !== undefined && totalRow[col] !== null
                "
              >
                <span class="text-primary">{{
                  formatValue(totalRow[col])
                }}</span>
              </template>
              <template v-else>
                <span class="text-gray-300 dark:text-gray-600 font-normal"
                  >—</span
                >
              </template>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Пагинация -->
    <div
      v-if="total > limit"
      class="shrink-0 border-t border-stroke dark:border-strokedark bg-white dark:bg-boxdark"
    >
      <UiPagination
        :current-page="page"
        :total-pages="Math.ceil(total / limit)"
        :total="total"
        :limit="limit"
        @update:page="$emit('page-change', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

const props = defineProps<{
  rows: any[];
  columns: string[];
  total: number;
  loading: boolean;
  page: number;
  limit: number;
  totalRow?: Record<string, any> | null;
}>();

defineEmits<{
  (e: "page-change", page: number): void;
}>();

// ── Локальная сортировка (клиент-сайд по текущей странице) ─────────────
const localSort = ref<{ col: string | null; dir: "asc" | "desc" }>({
  col: null,
  dir: "asc",
});

const toggleSort = (col: string) => {
  if (localSort.value.col === col) {
    if (localSort.value.dir === "asc") {
      localSort.value.dir = "desc";
    } else {
      // третий клик — сброс
      localSort.value.col = null;
      localSort.value.dir = "asc";
    }
  } else {
    localSort.value.col = col;
    localSort.value.dir = "asc";
  }
};

const clearSort = () => {
  localSort.value.col = null;
  localSort.value.dir = "asc";
};

const sortedRows = computed(() => {
  const { col, dir } = localSort.value;
  if (!col) return props.rows;

  return [...props.rows].sort((a, b) => {
    const av = a[col];
    const bv = b[col];

    // null/undefined — в конец
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;

    // числа
    if (typeof av === "number" && typeof bv === "number") {
      return dir === "asc" ? av - bv : bv - av;
    }

    // даты
    const da = new Date(av);
    const db = new Date(bv);
    if (!isNaN(da.getTime()) && !isNaN(db.getTime())) {
      return dir === "asc"
        ? da.getTime() - db.getTime()
        : db.getTime() - da.getTime();
    }

    // строки
    const sa = String(av).toLowerCase();
    const sb = String(bv).toLowerCase();
    if (sa < sb) return dir === "asc" ? -1 : 1;
    if (sa > sb) return dir === "asc" ? 1 : -1;
    return 0;
  });
});

// ── Форматирование значений ────────────────────────────────────────────
const formatValue = (value: any): string => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Да" : "Нет";
  if (typeof value === "number") {
    if (Number.isInteger(value)) return value.toLocaleString("ru-RU");
    return value.toLocaleString("ru-RU", { maximumFractionDigits: 2 });
  }
  if (
    value instanceof Date ||
    (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}/))
  ) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("ru-RU");
    }
  }
  return String(value);
};
</script>

<style scoped>
.total-row {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--color-primary, #3c50e0) 8%, transparent),
    color-mix(in srgb, var(--color-primary, #3c50e0) 4%, transparent)
  );
}

:root.dark .total-row {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--color-primary, #3c50e0) 15%, transparent),
    color-mix(in srgb, var(--color-primary, #3c50e0) 8%, transparent)
  );
}

/* Thin scrollbar для таблицы */
.overflow-auto::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
.overflow-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-auto::-webkit-scrollbar-thumb {
  background: rgb(203 213 225 / 0.6);
  border-radius: 4px;
}
:root.dark .overflow-auto::-webkit-scrollbar-thumb {
  background: rgb(55 65 81 / 0.8);
}
</style>
