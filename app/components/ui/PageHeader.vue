<template>
  <!--
    UiPageHeader — единый заголовок страницы (вместо 19 разных <h1>).
    Структура: [крошки] → [заголовок + бейдж] → [мета-строка]  |  [действия справа]
    Правило: в слоте #actions — ОДНО главное действие + максимум 1–2 меню.
  -->
  <header class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div class="min-w-0">
      <!-- Хлебные крошки (вместо крупной ссылки «Назад к списку») -->
      <nav v-if="breadcrumbs?.length" aria-label="Навигация" class="mb-1 flex flex-wrap items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
        <template v-for="(crumb, i) in breadcrumbs" :key="i">
          <NuxtLink v-if="crumb.to" :to="crumb.to" class="hover:text-primary transition-colors">{{ crumb.label }}</NuxtLink>
          <span v-else class="text-gray-700 dark:text-gray-300">{{ crumb.label }}</span>
          <ChevronRight v-if="i < breadcrumbs.length - 1" class="h-3 w-3 text-gray-300 dark:text-gray-600" />
        </template>
      </nav>

      <!-- Заголовок: умеренный размер, без CAPS и font-black -->
      <div class="flex flex-wrap items-center gap-2.5">
        <h1 class="truncate text-xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-2xl">{{ title }}</h1>
        <slot name="badge" />
      </div>

      <!-- Описание или мета-строка (курс · даты · кол-во) -->
      <p v-if="description" class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ description }}</p>
      <div v-if="$slots.meta" class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
        <slot name="meta" />
      </div>
    </div>

    <!-- Действия: выровнены вправо, не переносятся внутри группы -->
    <div v-if="$slots.actions" class="flex shrink-0 flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'

defineProps<{
  title: string
  description?: string
  /** [{label:'Группы', to:'/groups'}, {label:'ПК-24'}] — последняя без to */
  breadcrumbs?: { label: string; to?: string }[]
}>()
</script>
