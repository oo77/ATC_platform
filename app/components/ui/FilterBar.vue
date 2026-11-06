<template>
  <!--
    UiFilterBar — ОДИН паттерн фильтров для всех списков.

    Уровень 1 (всегда виден, одна строка):
      [🔍 поиск]  [быстрый сегмент: Все | Активные | …]  [Фильтры (n) ▾]  ····  Найдено N  [#actions]
    Уровень 2 (по кнопке «Фильтры»): второстепенные поля (селекты, даты) — слот #filters.
    Уровень 3 (только если что-то применено): чипы «Программа: КПК ×» + «Сбросить всё».

    Психология: главное действие — поиск; не больше одного выбора на виду (закон Хика);
    состояние фильтров видно в чипах, его не нужно держать в голове;
    открытость панели запоминается (persistKey) — меньше повторных кликов.
    Логика страницы НЕ меняется: страница сама связывает v-model и обработчики.
  -->
  <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
    <div class="flex flex-wrap items-center gap-2 p-2.5">
      <!-- Поиск: «/» — фокус, Esc — очистка -->
      <div class="relative min-w-[200px] flex-1">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          ref="inputRef"
          :value="search"
          type="search"
          :placeholder="searchPlaceholder"
          :autofocus="autofocus"
          class="h-9 w-full rounded-lg border border-gray-300 bg-transparent pl-9 pr-14 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:text-gray-100 [&::-webkit-search-cancel-button]:hidden"
          @input="onInput"
          @keydown.esc="clearSearch"
        />
        <!-- Подсказка горячей клавиши, пока поле пустое -->
        <kbd v-if="!search" class="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-gray-200 px-1.5 text-[11px] text-gray-400 sm:block dark:border-gray-700">/</kbd>
        <button v-else type="button" class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-700" aria-label="Очистить поиск" @click="clearSearch">
          <X class="h-3.5 w-3.5" />
        </button>
      </div>

      <!-- Быстрый сегмент (например, статус) — единственный «открытый» фильтр -->
      <div v-if="segments?.length" class="inline-flex rounded-lg bg-gray-100 p-0.5 dark:bg-white/[0.06]" role="group">
        <button
          v-for="s in segments"
          :key="s.value"
          type="button"
          :class="[
            'h-8 rounded-md px-3 text-sm font-medium transition-colors',
            segment === s.value
              ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white'
              : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200',
          ]"
          @click="emit('update:segment', s.value)"
        >
          {{ s.label }}
          <span v-if="s.count !== undefined" class="ml-1 text-xs tabular-nums text-gray-400">{{ s.count }}</span>
        </button>
      </div>

      <!-- Кнопка второстепенных фильтров со счётчиком активных -->
      <UiButton v-if="$slots.filters" variant="outline" size="md" :end-icon="open ? ChevronUp : ChevronDown" :start-icon="SlidersHorizontal" :aria-expanded="open" @click="toggleOpen">
        Фильтры
        <span v-if="activeCount" class="rounded-full bg-primary px-1.5 text-[11px] font-semibold leading-5 text-white">{{ activeCount }}</span>
      </UiButton>

      <div class="ml-auto flex items-center gap-3">
        <!-- Количество результатов: обратная связь, что фильтр сработал -->
        <span v-if="total !== undefined" class="text-sm text-gray-500 dark:text-gray-400" aria-live="polite">
          Найдено <span class="font-semibold tabular-nums text-gray-800 dark:text-gray-100">{{ total }}</span>
        </span>
        <slot name="actions" />
      </div>
    </div>

    <!-- Панель второстепенных фильтров -->
    <div v-if="$slots.filters && open" class="border-t border-gray-100 p-3 dark:border-gray-800">
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><slot name="filters" /></div>
    </div>

    <!-- Чипы применённых фильтров -->
    <div v-if="chips?.length || activeCount" class="flex flex-wrap items-center gap-1.5 border-t border-gray-100 px-3 py-2 dark:border-gray-800">
      <span
        v-for="c in chips"
        :key="c.key"
        class="inline-flex items-center gap-1 rounded-full bg-primary-50 py-0.5 pl-2.5 pr-1 text-xs font-medium text-primary-700 dark:bg-primary-500/15 dark:text-primary-300"
      >
        {{ c.label }}
        <button type="button" class="rounded-full p-0.5 hover:bg-primary-100 dark:hover:bg-primary-500/30" :aria-label="`Убрать фильтр: ${c.label}`" @click="emit('remove', c.key)">
          <X class="h-3 w-3" />
        </button>
      </span>
      <button type="button" class="ml-1 text-xs font-medium text-gray-500 underline-offset-2 hover:text-gray-800 hover:underline dark:hover:text-gray-200" @click="emit('reset')">
        Сбросить всё
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { ChevronDown, ChevronUp, Search, SlidersHorizontal, X } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    search?: string
    searchPlaceholder?: string
    /** Задержка события @search, мс. 0 — без задержки (если страница уже сама делает debounce) */
    debounce?: number
    autofocus?: boolean
    segments?: { value: string | number | boolean; label: string; count?: number }[]
    segment?: string | number | boolean
    chips?: { key: string; label: string }[]
    /** Сколько фильтров применено (для бейджа на кнопке) */
    activeCount?: number
    total?: number
    /** Ключ для запоминания раскрытия панели в localStorage */
    persistKey?: string
  }>(),
  { search: '', searchPlaceholder: 'Поиск…', debounce: 300, autofocus: false, activeCount: 0 },
)

const emit = defineEmits<{
  'update:search': [v: string]
  /** Срабатывает после паузы ввода — сюда вешайте существующий handleFilterChange */
  search: [v: string]
  'update:segment': [v: string | number | boolean]
  remove: [key: string]
  reset: []
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const open = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

const storageKey = () => (props.persistKey ? `filterbar:${props.persistKey}` : '')

const toggleOpen = () => {
  open.value = !open.value
  // localStorage может быть недоступен (приватный режим) — оборачиваем в try/catch
  try {
    if (storageKey()) localStorage.setItem(storageKey(), open.value ? '1' : '0')
  } catch { /* не критично */ }
}

const onInput = (e: Event) => {
  const v = (e.target as HTMLInputElement).value
  emit('update:search', v)
  clearTimeout(timer)
  if (props.debounce > 0) timer = setTimeout(() => emit('search', v), props.debounce)
  else emit('search', v)
}

const clearSearch = () => {
  if (!props.search) return
  clearTimeout(timer)
  emit('update:search', '')
  emit('search', '')
  inputRef.value?.focus()
}

// Горячая клавиша «/» ставит фокус в поиск, если пользователь не печатает в другом поле
const onHotkey = (e: KeyboardEvent) => {
  const t = e.target as HTMLElement
  if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) && !t.isContentEditable) {
    e.preventDefault()
    inputRef.value?.focus()
  }
}

onMounted(() => {
  try {
    if (storageKey()) open.value = localStorage.getItem(storageKey()) === '1'
  } catch { /* не критично */ }
  // Если фильтры уже применены (вернулись «Назад») — панель открыта, чтобы состояние было видно
  if (props.activeCount) open.value = open.value || false
  document.addEventListener('keydown', onHotkey)
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  document.removeEventListener('keydown', onHotkey)
})
</script>
