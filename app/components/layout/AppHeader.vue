<template>
  <header
    :class="[
      'sticky top-0 z-40 w-full transition-all duration-300 px-4 pt-4',
      'bg-transparent pointer-events-none'
    ]"
  >
    <div 
      :class="[
        'flex items-center justify-between px-4 lg:px-6 h-18 pointer-events-auto',
        'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md',
        'border border-white/20 dark:border-gray-800/20 shadow-xl rounded-2xl transition-all duration-300'
      ]"
    >
      <!-- Левая часть: Переключатель сайдбара и Поиск -->
      <div class="flex items-center gap-3 relative z-30">
        <!-- Кнопка переключения Сайдбара для Десктопа -->
        <button
          @click="toggleSidebar"
          class="hidden lg:flex items-center justify-center w-10 min-w-[40px] h-10 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 cursor-pointer"
        >
          <div :class="['transition-transform duration-300', isExpanded ? '' : 'rotate-180']">
            <PanelLeftClose v-if="isExpanded" :size="20" />
            <PanelLeft v-else :size="20" />
          </div>
        </button>

        <!-- Кнопка мобильного меню -->
        <button
          @click="toggleMobileSidebar"
          class="lg:hidden flex items-center justify-center w-10 h-10 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
        >
          <X v-if="isMobileOpen" :size="24" />
          <Menu v-else :size="24" />
        </button>
        
        <div class="hidden md:flex items-center ml-2">
           <SearchBar />
        </div>
      </div>

      <!-- Правая часть: Уведомления, Тема и Профиль -->
      <div class="flex items-center gap-2 sm:gap-4 relative z-30">
        <div class="flex items-center gap-1 sm:gap-2 pr-2 border-r border-gray-100 dark:border-gray-800">
          <ThemeToggler style="margin-right: 8px" />
          <NotificationMenu />
        </div>
        
        <UserMenu />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useSidebar } from '~/composables/useSidebar'
import { Menu, X, PanelLeftClose, PanelLeft } from 'lucide-vue-next'
import ThemeToggler from '../common/ThemeToggler.vue'
import SearchBar from './header/SearchBar.vue'
import NotificationMenu from './header/NotificationMenu.vue'
import UserMenu from './header/UserMenu.vue'

const sidebar = useSidebar()
const { isExpanded, isMobileOpen } = sidebar

const toggleSidebar = () => {
  sidebar.toggleSidebar()
}

const toggleMobileSidebar = () => {
  sidebar.toggleMobileSidebar()
}
</script>

<style scoped>
.h-18 {
  height: 4.5rem;
}
</style>
