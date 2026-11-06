<template>
  <!--
    UiPagination v2 — одна компактная пагинация для всех таблиц.
    Контракт (props/emits) прежний: currentPage, totalPages, total, limit, loading, limitOptions;
    update:page, update:limit — поэтому все существующие места работают без правок.
    Новое: hideLimit, compact (авто на мобильных), scrollTarget, лимит всегда есть в списке опций.
    Размещать внутри карточки таблицы как футер.
  -->
  <nav
    v-if="total > 0"
    aria-label="Постраничная навигация"
    class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-gray-100 px-4 py-3 dark:border-gray-800"
  >
    <!-- Слева: диапазон «1–20 из 437» -->
    <p class="text-sm text-gray-500 dark:text-gray-400">
      <span class="font-medium tabular-nums text-gray-800 dark:text-gray-100">{{ from }}–{{ to }}</span>
      из <span class="tabular-nums">{{ total }}</span>
    </p>

    <!-- По центру: страницы (на узком экране — «3 / 12») -->
    <div v-if="totalPages > 1" class="flex items-center gap-1">
      <button type="button" class="pg-btn" :disabled="currentPage === 1 || loading" title="Предыдущая" aria-label="Предыдущая страница" @click="goToPage(currentPage - 1)">
        <ChevronLeft class="h-4 w-4" />
      </button>

      <!-- Мобильная версия -->
      <span class="px-2 text-sm tabular-nums text-gray-600 sm:hidden dark:text-gray-300">{{ currentPage }} / {{ totalPages }}</span>

      <!-- Десктопная версия: номера с многоточием -->
      <template v-for="(page, i) in visiblePages" :key="`${page}-${i}`">
        <button
          v-if="page !== '...'"
          type="button"
          :disabled="loading"
          :aria-current="currentPage === page ? 'page' : undefined"
          :class="['pg-btn hidden min-w-8 px-2 text-sm font-medium tabular-nums sm:inline-flex', currentPage === page ? '!bg-primary !text-white hover:!bg-primary' : '']"
          @click="goToPage(page as number)"
        >{{ page }}</button>
        <span v-else class="hidden w-6 text-center text-gray-400 sm:inline">…</span>
      </template>

      <button type="button" class="pg-btn" :disabled="currentPage === totalPages || loading" title="Следующая" aria-label="Следующая страница" @click="goToPage(currentPage + 1)">
        <ChevronRight class="h-4 w-4" />
      </button>
    </div>

    <!-- Справа: размер страницы -->
    <label v-if="!hideLimit" class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
      По
      <select
        :value="limit"
        :disabled="loading"
        class="h-8 rounded-lg border border-gray-300 bg-transparent px-2 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        @change="handleLimitChange"
      >
        <option v-for="o in options" :key="o" :value="o">{{ o }}</option>
      </select>
    </label>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

interface Props {
  currentPage: number
  totalPages: number
  total: number
  limit: number
  loading?: boolean
  limitOptions?: number[]
  /** Скрыть выбор размера страницы (там, где страница не умеет менять limit) */
  hideLimit?: boolean
  /** CSS-селектор/элемент, к которому прокрутить после смены страницы (шапка таблицы) */
  scrollTarget?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  limitOptions: () => [10, 25, 50, 100],
  hideLimit: false,
})

const emit = defineEmits<{
  'update:page': [page: number]
  'update:limit': [limit: number]
}>()

// Если страница использует нестандартный limit (12, 20) — добавляем его в список,
// иначе select показывал бы неверное значение
const options = computed(() => Array.from(new Set([...props.limitOptions, props.limit])).sort((a, b) => a - b))

const from = computed(() => (props.total === 0 ? 0 : (props.currentPage - 1) * props.limit + 1))
const to = computed(() => Math.min(props.currentPage * props.limit, props.total))

// Окно страниц: первая, последняя и ±2 вокруг текущей
const visiblePages = computed(() => {
  const total = props.totalPages
  const cur = props.currentPage
  const delta = 2
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | string)[] = [1]
  if (cur > delta + 2) pages.push('...')
  for (let i = Math.max(2, cur - delta); i <= Math.min(total - 1, cur + delta); i++) pages.push(i)
  if (cur < total - delta - 1) pages.push('...')
  pages.push(total)
  return pages
})

const goToPage = (page: number) => {
  if (page < 1 || page > props.totalPages || page === props.currentPage) return
  emit('update:page', page)
  // После смены страницы возвращаем взгляд к началу таблицы, чтобы не «терять» список
  if (props.scrollTarget && typeof document !== 'undefined') {
    document.querySelector(props.scrollTarget)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }
}

const handleLimitChange = (e: Event) => {
  emit('update:limit', parseInt((e.target as HTMLSelectElement).value, 10))
}
</script>

<style scoped>
/* Единый вид кнопок пагинации */
.pg-btn {
  display: inline-flex;
  height: 2rem;
  min-width: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  color: var(--color-gray-600);
  transition: background-color 0.15s;
}
.pg-btn:hover:not(:disabled) {
  background-color: var(--color-gray-100);
}
.pg-btn:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}
:global(.dark) .pg-btn {
  color: var(--color-gray-300);
}
:global(.dark) .pg-btn:hover:not(:disabled) {
  background-color: rgb(255 255 255 / 0.08);
}
</style>
