<template>
  <div class="flex h-screen overflow-hidden">
    <AppSidebar />
    <Backdrop />
    <div 
      :class="[
        'flex flex-1 flex-col overflow-x-hidden overflow-y-auto transition-all duration-300 ease-in-out',
        {
          'lg:ml-[290px]': isExpanded || isHovered,
          'lg:ml-[90px]': !isExpanded && !isHovered,
        }
      ]"
    >
      <AppHeader />
      <main class="mx-auto w-full max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
// Полноценный layout с SSR-совместимыми компонентами
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import Backdrop from '@/components/layout/Backdrop.vue'
import { useSidebar } from '~/composables/useSidebar'

// Получаем состояние сайдбара для адаптации контента
// isHovered - для реакции на hover эффект
const { isExpanded, isHovered } = useSidebar()
</script>

