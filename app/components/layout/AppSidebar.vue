<template>
  <aside
    :class="[
      'fixed top-4 left-4 h-[calc(100vh-2rem)] z-50 transform-gpu translate-z-0 transition-all duration-200 ease-out',
      'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-white/20 dark:border-gray-800/20 shadow-2xl rounded-4xl overflow-hidden',
      {
        'w-[280px]': isExpanded || isMobileOpen || isHovered,
        'w-[85px]': !isExpanded && !isHovered && !isMobileOpen,
        'translate-x-0': isMobileOpen,
        '-translate-x-full lg:translate-x-0': !isMobileOpen,
      },
    ]"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Logo Section with Toggle Button -->
    <div
      :class="[
        'flex items-center justify-between relative mb-2 px-4 transition-all duration-200',
        isExpanded || isHovered || isMobileOpen ? 'h-24 py-4 pr-2' : 'h-20 flex-col py-6',
      ]"
    >
      <NuxtLink to="/" class="block text-center flex-1">
        <div class="flex items-center justify-center h-full transform-gpu">
          <Transition name="fade" mode="out-in">
            <div v-if="isExpanded || isHovered || isMobileOpen" class="flex flex-col items-center">
              <img src="/logo.png" alt="Logo" class="h-10 object-contain" />
              <span class="text-[8px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mt-1">ATC Platform</span>
            </div>
            <img v-else src="/android-chrome-192x192.png" alt="Logo" class="h-10 w-10 object-contain rounded-xl shadow-sm" />
          </Transition>
        </div>
      </NuxtLink>

      <!-- Internal Sidebar Toggle (Chevron icon) -->
      <button
        v-if="isExpanded || isHovered || isMobileOpen"
        @click="toggleSidebar"
        class="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-all duration-150 animate-in fade-in"
      >
        <component :is="ChevronLeft" :size="18" :class="['transition-transform duration-300', isExpanded ? '' : 'rotate-180']" />
      </button>
    </div>

    <!-- Navigation -->
    <div class="flex flex-col flex-1 overflow-y-auto no-scrollbar py-2 px-3 space-y-4">
      <nav v-for="(menuGroup, groupIndex) in menuGroups" :key="groupIndex">
        <h3 
          v-if="menuGroup.title && (isExpanded || isHovered || isMobileOpen)"
          class="px-4 mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 opacity-50"
        >
          {{ menuGroup.title }}
        </h3>

        <ul class="space-y-1">
          <li v-for="(item, index) in menuGroup.items" :key="item.name" class="relative">
            <div v-if="item.subItems && item.subItems.length > 0">
              <button
                @click="toggleSubmenu(groupIndex, index)"
                :class="[
                  'group flex items-center justify-between w-full px-4 py-2.5 rounded-2xl cursor-pointer transition-all duration-150',
                  isSubmenuOpen(groupIndex, index)
                    ? 'bg-blue-50/70 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800/40',
                  !isExpanded && !isHovered ? 'justify-center px-0' : '',
                ]"
              >
                <div class="flex items-center gap-3.5 min-w-0 z-10 transition-transform duration-150">
                   <div :class="['flex items-center justify-center w-5 h-5 transition-transform duration-150', isSubmenuOpen(groupIndex, index) ? 'scale-110' : '']">
                      <component :is="item.icon" :size="19" :stroke-width="isSubmenuOpen(groupIndex, index) ? 2.5 : 2" />
                   </div>
                  <span v-show="isExpanded || isHovered || isMobileOpen" class="truncate font-bold text-[13px] tracking-tight">
                    {{ item.name }}
                  </span>
                </div>
                <component :is="ChevronDown" v-show="isExpanded || isHovered || isMobileOpen" :size="14" :class="['transition-transform duration-150', isSubmenuOpen(groupIndex, index) ? 'rotate-180' : '']" />
              </button>

              <transition
                enter-active-class="transition-all duration-200 ease-out"
                enter-from-class="max-h-0 opacity-0 scale-95"
                enter-to-class="max-h-[300px] opacity-100 scale-100"
                leave-active-class="transition-all duration-150 ease-in"
                leave-from-class="max-h-[300px] opacity-100 scale-100"
                leave-to-class="max-h-0 opacity-0 scale-95"
              >
                <div v-show="isSubmenuOpen(groupIndex, index) && (isExpanded || isHovered || isMobileOpen)" class="overflow-hidden mt-0.5">
                  <ul class="pl-10 pr-2 space-y-1 relative">
                    <div class="absolute left-6 top-0 bottom-2 w-px bg-gray-100 dark:bg-gray-800 opacity-50"></div>
                    <li v-for="subItem in item.subItems" :key="subItem.name">
                      <NuxtLink
                        :to="subItem.path"
                        :class="[
                          'block px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all duration-150',
                          isActive(subItem.path, subItem.excludePaths)
                            ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 shadow-sm translate-x-1'
                            : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:translate-x-1',
                        ]"
                      >{{ subItem.name }}</NuxtLink>
                    </li>
                  </ul>
                </div>
              </transition>
            </div>

            <NuxtLink
              v-else
              :to="item.path ?? ''"
              :class="[
                'group flex items-center px-4 py-2.5 rounded-2xl cursor-pointer transition-all duration-150 transform-gpu translate-z-0',
                isActive(item.path ?? '', item.excludePaths)
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800/40 hover:text-gray-900 dark:hover:text-white',
                !isExpanded && !isHovered ? 'justify-center px-0' : '',
              ]"
            >
              <div class="relative z-10 flex items-center justify-center w-5 h-5">
                <component :is="item.icon" :size="19" />
              </div>
              <span v-show="isExpanded || isHovered || isMobileOpen" class="ml-3.5 truncate font-bold text-[13px] tracking-tight relative z-10">
                {{ item.name }}
              </span>
              <div v-if="isActive(item.path || '') && !(!isExpanded && !isHovered)" class="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-full transition-all duration-150"></div>
              <div v-if="!isExpanded && !isHovered && !isMobileOpen" class="absolute left-20 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[11px] font-black rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-100 z-60 shadow-xl">
                {{ item.name }}
              </div>
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </div>

    <!-- Sidebar Footer -->
    <div v-if="isExpanded || isHovered || isMobileOpen" class="p-3 bg-white/40 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-800">
       <div class="flex items-center gap-2.5 p-2 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-white/50 dark:border-gray-700/50 shadow-xs transition-all duration-150">
          <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-sm">{{ userInitial }}</div>
          <div class="flex-1 min-w-0">
            <p class="text-[11px] font-bold text-gray-900 dark:text-white truncate">{{ userName }}</p>
            <p class="text-[8px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-tight">{{ userRoleLabel }}</p>
          </div>
       </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useSidebar } from "~/composables/useSidebar";
import { usePermissions } from "~/composables/usePermissions";
import { useAuth } from "~/composables/useAuth";
import { Permission } from "~/types/permissions";
import { 
  LayoutDashboard, 
  CalendarRange, 
  Users, 
  GraduationCap, 
  FileCheck, 
  Database, 
  Library, 
  BarChart3, 
  FolderTree, 
  ShieldCheck, 
  Clock, 
  ChevronDown,
  ChevronLeft,
  HelpCircle,
  Trophy,
  Award,
  History,
  Settings,
  UserCheck
} from "lucide-vue-next";
import type { Component } from "vue";

// Интерфейсы
interface SubMenuItem { name: string; path: string; permission?: Permission; anyPermissions?: Permission[]; excludePaths?: string[]; hideForRoles?: string[]; }
interface MenuItem { icon: Component; name: string; path?: string; permission?: Permission; anyPermissions?: Permission[]; subItems?: SubMenuItem[]; showOnlyForRoles?: string[]; hideForRoles?: string[]; excludePaths?: string[]; }
interface MenuGroup { title: string; items: MenuItem[]; }

const route = useRoute();
const auth = useAuth();
const { isExpanded, isMobileOpen, isHovered, openSubmenu, setIsHovered, toggleSidebar } = useSidebar();
const { hasPermission, hasAnyPermission, isStudent, isTeacher, isAdmin, isManager } = usePermissions();

const userName = computed(() => auth.user.value?.name || "Пользователь");
const userInitial = computed(() => userName.value.charAt(0).toUpperCase());
const userRoleLabel = computed(() => isAdmin.value ? "Админ" : isManager.value ? "Менеджер" : isTeacher.value ? "Преподаватель" : "Студент");

const handleMouseEnter = () => !isExpanded.value && setIsHovered(true);
const handleMouseLeave = () => setIsHovered(false);

// Меню
const allMenuGroups: MenuGroup[] = [
  { title: "Панель", items: [
    { icon: LayoutDashboard, name: "Обзор", path: "/", permission: Permission.DASHBOARD_VIEW },
    { icon: CalendarRange, name: isStudent.value || isTeacher.value ? "Мои занятия" : "Расписание", path: "/schedule", anyPermissions: [Permission.SCHEDULE_VIEW_ALL, Permission.SCHEDULE_VIEW_OWN] }
  ]},
  { title: "Обучение", items: [
    { icon: GraduationCap, name: "Программы", permission: Permission.COURSES_VIEW, path: "/programs" },
    { icon: Users, name: "Учебные группы", path: "/groups", anyPermissions: [Permission.GROUPS_VIEW_ALL, Permission.GROUPS_VIEW_OWN] },
    { icon: Trophy, name: "Мои успехи", path: "/my-certificates", showOnlyForRoles: ["STUDENT"] },
    { icon: FileCheck, name: "Тесты", showOnlyForRoles: ["STUDENT"], path: "/tests/my" },
    { icon: FileCheck, name: "База тестов", hideForRoles: ["STUDENT"], subItems: [ 
        { name: "Вопросы", path: "/test-bank" }, 
        { name: "Шаблоны", path: "/test-bank/templates" } 
    ] }
  ]},
  { title: "Контент", items: [
    { icon: Award, name: "Сертификаты", hideForRoles: ["STUDENT"], subItems: [
      { name: "База сертификатов", path: "/certificates", excludePaths: ["/certificates/templates"] },
      { name: "Организации", path: "/certificates?tab=orgs" },
      { name: "Шаблоны", path: "/certificates/templates" }
    ]},
    { icon: Library, name: "Библиотека", hideForRoles: ["STUDENT", "TEACHER"], subItems: [
      { name: "Каталог", path: "/library" },
      { name: "Управление", path: "/admin/library/books", permission: Permission.LIBRARY_MANAGE }
    ]},
    { icon: Library, name: "Библиотека", showOnlyForRoles: ["STUDENT", "TEACHER"], path: "/library" },
    { icon: FolderTree, name: "Файлы", path: "/files", hideForRoles: ["STUDENT"] }
  ]},
  { title: "Управление", items: [
    { icon: Users, name: "Пользователи", path: "/users", anyPermissions: [Permission.USERS_VIEW_ALL] },
    { icon: UserCheck, name: "Представители", path: "/representatives", anyPermissions: [Permission.REPRESENTATIVES_VIEW] },
    { icon: BarChart3, name: "Аналитика", path: "/reports", hideForRoles: ["STUDENT", "TEACHER"] }
  ]},
  { title: "Администрирование", items: [
    { icon: History, name: "Логи системы", path: "/activity-logs", permission: Permission.LOGS_VIEW },
    { icon: Settings, name: "Настройки", path: "/settings", permission: Permission.SETTINGS_MANAGE },
    { icon: ShieldCheck, name: "Безопасность", path: "/users?tab=admin", permission: Permission.USERS_MANAGE_ROLES }
  ]},
  { title: "Сервис", items: [
    { icon: HelpCircle, name: "Поддержка", path: "/support" }
  ]}
];

const menuGroups = computed(() => {
  return allMenuGroups.map(group => {
    const items = group.items.filter(item => {
      const role = isAdmin.value ? "ADMIN" : isManager.value ? "MANAGER" : isTeacher.value ? "TEACHER" : "STUDENT";
      if (item.showOnlyForRoles && !item.showOnlyForRoles.includes(role)) return false;
      if (item.hideForRoles && item.hideForRoles.includes(role)) return false;
      if (item.permission && !hasPermission(item.permission)) return false;
      if (item.anyPermissions && !hasAnyPermission(item.anyPermissions)) return false;
      return true;
    });
    return { ...group, items };
  }).filter(g => g.items.length > 0);
});

const isActive = (path: string, exclude?: string[]) => {
  if (path === "/") return route.path === "/";
  if (exclude?.some(ex => route.path.startsWith(ex))) return false;
  if (path.includes("?")) {
    const [b, q] = path.split("?");
    const p = new URLSearchParams(q);
    return route.path === b && route.query.tab === p.get("tab");
  }
  return route.path === path || route.path.startsWith(path + "/");
};

const toggleSubmenu = (g: number, i: number) => { const k = `${g}-${i}`; openSubmenu.value = openSubmenu.value === k ? null : k; };
const isSubmenuOpen = (g: number, i: number) => {
  const k = `${g}-${i}`;
  if (openSubmenu.value === k) return true;
  const item = menuGroups.value[g]?.items[i];
  return item?.subItems?.some(s => isActive(s.path)) || false;
};
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
