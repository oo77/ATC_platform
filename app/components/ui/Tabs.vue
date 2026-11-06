<template>
  <!--
    UiTabs — вкладки с подчёркиванием и счётчиками.
    Заменяет 5 копий «сегментов» и вкладок разных стилей.
    Работает как v-model: <UiTabs v-model="activeTab" :tabs="tabs" />
    Логика переключения остаётся на странице (можно слушать @change).
  -->
  <div class="border-b border-gray-200 dark:border-gray-800">
    <div class="no-scrollbar -mb-px flex gap-1 overflow-x-auto" role="tablist">
      <button
        v-for="tab in visibleTabs"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="modelValue === tab.id"
        :class="[
          'relative flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
          modelValue === tab.id
            ? 'border-primary text-primary dark:text-primary-300'
            : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200',
        ]"
        @click="select(tab.id)"
      >
        <component :is="tab.icon" v-if="tab.icon" class="h-4 w-4" />
        {{ tab.label }}
        <!-- Счётчик: показывает объём раздела, не заставляя открывать его -->
        <span
          v-if="tab.count !== undefined && tab.count !== null"
          :class="[
            'rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none tabular-nums',
            modelValue === tab.id
              ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300'
              : 'bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-gray-400',
          ]"
        >{{ tab.count }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'

export interface TabItem {
  id: string
  label: string
  count?: number | string | null
  icon?: Component
  /** Скрыть вкладку (например, по правам) */
  hidden?: boolean
}

const props = defineProps<{ modelValue: string; tabs: TabItem[] }>()
const emit = defineEmits<{ 'update:modelValue': [id: string]; change: [id: string] }>()

const visibleTabs = computed(() => props.tabs.filter((t) => !t.hidden))

// Одно событие для v-model и второе — для страниц, где при смене вкладки нужен свой обработчик
const select = (id: string) => {
  if (id === props.modelValue) return
  emit('update:modelValue', id)
  emit('change', id)
}
</script>
