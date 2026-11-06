<template>
  <!--
    UiStat — плоская метрика (вместо крупных «bento»-карточек с градиентами).
    Несколько UiStat подряд внутри UiStatStrip образуют компактную полосу.
    Если задан `to` или `clickable` — метрика работает как фильтр/ссылка.
  -->
  <component
    :is="to ? 'NuxtLink' : clickable ? 'button' : 'div'"
    v-bind="to ? { to } : clickable ? { type: 'button' } : {}"
    :class="[
      'flex min-w-0 items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left dark:bg-white/[0.03]',
      active ? 'border-primary ring-1 ring-primary/30' : 'border-gray-200 dark:border-gray-800',
      to || clickable ? 'transition-colors hover:border-gray-300 dark:hover:border-gray-700' : '',
    ]"
  >
    <!-- Иконка в мягком цветном квадрате; цвет зависит от смысла (tone) -->
    <span v-if="icon" :class="['flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', toneClass]">
      <component :is="icon" class="h-[18px] w-[18px]" />
    </span>
    <span class="min-w-0">
      <span class="block truncate text-xs text-gray-500 dark:text-gray-400">{{ label }}</span>
      <span class="flex items-baseline gap-1.5">
        <span v-if="loading" class="mt-1 block h-5 w-12 animate-pulse rounded bg-gray-100 dark:bg-white/10"></span>
        <span v-else class="text-lg font-semibold leading-tight tabular-nums text-gray-900 dark:text-white">{{ value }}</span>
        <span v-if="hint" class="truncate text-xs text-gray-400">{{ hint }}</span>
      </span>
      <!-- Тонкая полоса прогресса (например, часы) -->
      <span v-if="progress !== undefined" class="mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
        <span class="block h-full rounded-full bg-primary transition-all" :style="{ width: Math.min(100, Math.max(0, progress)) + '%' }"></span>
      </span>
    </span>
  </component>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    value: string | number
    hint?: string
    icon?: Component
    tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
    /** 0–100 — показать полосу прогресса */
    progress?: number
    loading?: boolean
    to?: string
    clickable?: boolean
    /** Выбранный фильтр (если метрика служит переключателем) */
    active?: boolean
  }>(),
  { tone: 'neutral' },
)

const toneClass = computed(
  () =>
    ({
      neutral: 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-300',
      primary: 'bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300',
      success: 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400',
      warning: 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400',
      danger: 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400',
      info: 'bg-info-50 text-info-600 dark:bg-info-500/15 dark:text-info-400',
    })[props.tone],
)
</script>
