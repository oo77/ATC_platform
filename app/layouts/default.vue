<template>
  <div class="fixed inset-0 flex bg-[#f8fafc] dark:bg-[#0f172a] transition-colors duration-500 overflow-hidden">
    <!-- background decorative elements -->
    <div class="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/3 blur-[100px] rounded-full -z-10 pointer-events-none"></div>
    <div class="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/3 blur-[100px] rounded-full -z-10 pointer-events-none"></div>

    <AppSidebar />
    <Backdrop />

    <!-- Main Container -->
    <div 
      :class="[
        'relative flex flex-1 flex-col transition-all duration-300 ease-out min-w-0',
        {
          'lg:ml-[290px]': isExpanded || isHovered,
          'lg:ml-[105px]': !isExpanded && !isHovered,
        }
      ]"
    >
      <AppHeader />
      
      <!-- Content Area with its own scroll container -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto w-full px-4 md:px-6 2xl:px-10 pb-10">
        <div class="animate-content-in pt-4">
           <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import Backdrop from '@/components/layout/Backdrop.vue'
import { useSidebar } from '~/composables/useSidebar'

const { isExpanded, isHovered } = useSidebar()
</script>

<style>
/* Nuxt 4 Optimized styles */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.1); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.2); }

@keyframes content-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-content-in { animation: content-in 0.4s ease-out forwards; }
</style>
