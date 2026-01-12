<template>
  <aside
    :class="[
      'fixed mt-16 flex flex-col lg:mt-0 top-0 left-0 h-screen z-50 transition-all duration-300 ease-in-out',
      sidebarColorClass,
      'backdrop-blur-xl border-r shadow-xl dark:shadow-none',
      {
        'lg:w-[280px]': isExpanded || isMobileOpen || isHovered,
        'lg:w-[80px]': !isExpanded && !isHovered,
        'translate-x-0 w-[280px]': isMobileOpen,
        '-translate-x-full': !isMobileOpen,
        'lg:translate-x-0': true,
      },
    ]"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Logo Section -->
    <div
      :class="[
        'flex items-center justify-center relative border-b border-gray-100/50 dark:border-gray-800/50 mb-2 transition-all duration-300',
        isExpanded || isHovered || isMobileOpen ? 'h-32 py-4' : 'h-20',
        !isExpanded && !isHovered ? 'lg:px-0' : 'px-6',
      ]"
    >
      <NuxtLink to="/" class="block w-full text-center relative z-10 group">
        <!-- Logo Display Logic -->
        <div class="flex items-center justify-center h-full">
            <Transition
              enter-active-class="transition-all duration-300 ease-out"
              enter-from-class="opacity-0 scale-90"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-90"
              mode="out-in"
            >
              <img
                v-if="isExpanded || isHovered || isMobileOpen"
                key="full-logo"
                src="/logo.png"
                alt="Logo"
                class="h-24 object-contain mx-auto transition-all duration-300 group-hover:scale-105"
              />
              <img
                v-else
                key="mini-logo"
                src="/android-chrome-192x192.png"
                alt="Logo"
                class="h-10 w-10 object-contain mx-auto rounded-xl shadow-md transition-all duration-300 hover:rotate-6"
              />
            </Transition>
        </div>
      </NuxtLink>
    </div>

    <!-- Navigation -->
    <div
      class="flex flex-col flex-1 overflow-y-auto overflow-x-hidden no-scrollbar py-4 px-3 space-y-6"
    >
      <nav v-for="(menuGroup, groupIndex) in menuGroups" :key="groupIndex">
        <!-- Group Title -->
        <h3
          v-if="menuGroup.title"
          :class="[
            'px-4 mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 transition-opacity duration-300',
            !isExpanded && !isHovered ? 'opacity-0 lg:hidden' : 'opacity-100',
          ]"
        >
          {{ menuGroup.title }}
        </h3>
        
        <!-- Divider for collapsed state instead of title -->
        <div 
          v-if="(!isExpanded && !isHovered) && menuGroup.title && groupIndex > 0"
          class="h-px bg-gray-100 dark:bg-gray-800 mx-4 mb-4 mt-2"
        ></div>

        <ul class="space-y-1.5">
          <li v-for="(item, index) in menuGroup.items" :key="item.name">
            
            <!-- Dropdown Menu Item -->
            <div v-if="item.subItems && item.subItems.length > 0">
              <button
                @click="toggleSubmenu(groupIndex, index)"
                :class="[
                  'group flex items-center justify-between w-full px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200',
                  'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                  isSubmenuOpen(groupIndex, index) ? 'text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800/30' : 'text-gray-600 dark:text-gray-400',
                  !isExpanded && !isHovered ? 'justify-center px-0' : ''
                ]"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div :class="[
                    'relative flex items-center justify-center w-6 h-6 rounded-lg transition-all duration-300',
                    isSubmenuOpen(groupIndex, index) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400'
                  ]">
                    <component :is="item.icon" class="w-5 h-5" />
                    <span v-if="isSubmenuOpen(groupIndex, index)" class="absolute inset-0 bg-blue-500/10 dark:bg-blue-400/10 rounded-lg blur-sm scale-150 opacity-50"></span>
                  </div>
                  
                  <span
                    v-show="isExpanded || isHovered || isMobileOpen"
                    class="truncate font-medium text-sm transition-all duration-300"
                  >
                    {{ item.name }}
                  </span>
                </div>
                
                <ChevronDownIcon
                  v-show="isExpanded || isHovered || isMobileOpen"
                  :class="[
                    'w-4 h-4 transition-transform duration-300 opacity-50 group-hover:opacity-100',
                    isSubmenuOpen(groupIndex, index) ? 'rotate-180 text-blue-500 opacity-100' : 'text-gray-400'
                  ]"
                />
              </button>

              <!-- Dropdown Content -->
              <transition
                enter-active-class="transition-all duration-300 ease-in-out"
                enter-from-class="max-h-0 opacity-0"
                enter-to-class="max-h-[400px] opacity-100"
                leave-active-class="transition-all duration-200 ease-in-out"
                leave-from-class="max-h-[400px] opacity-100"
                leave-to-class="max-h-0 opacity-0"
              >
                <div
                  v-show="isSubmenuOpen(groupIndex, index) && (isExpanded || isHovered || isMobileOpen)"
                  class="overflow-hidden"
                >
                  <ul class="pt-1 pb-2 pl-[1.15rem] ml-3 border-l-[1.5px] border-gray-100 dark:border-gray-800 space-y-1">
                    <li v-for="subItem in item.subItems" :key="subItem.name">
                      <NuxtLink
                        :to="subItem.path"
                        :class="[
                          'flex items-center px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 relative overflow-hidden',
                          isActive(subItem.path, subItem.excludePaths)
                            ? 'text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-500/10 translate-x-1'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50'
                        ]"
                      >
                         <span v-if="isActive(subItem.path, subItem.excludePaths)" class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3 bg-blue-500 rounded-r-full"></span>
                        {{ subItem.name }}
                      </NuxtLink>
                    </li>
                  </ul>
                </div>
              </transition>
            </div>

            <!-- Single Link Item -->
            <NuxtLink
              v-else
              :to="item.path ?? ''"
              :class="[
                'group flex items-center px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 relative overflow-hidden',
                isActive(item.path ?? '', item.excludePaths)
                  ? 'bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white',
                !isExpanded && !isHovered ? 'justify-center' : ''
              ]"
            >
              <!-- Hover Gradient Effect for inactive items -->
              <div 
                 v-if="!isActive(item.path ?? '', item.excludePaths)"
                 class="absolute inset-0 bg-linear-to-r from-blue-500/0 via-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              ></div>

              <div :class="[
                'relative z-10 w-6 h-6 flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
                isActive(item.path ?? '', item.excludePaths) ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400'
              ]">
                <component :is="item.icon" class="w-5 h-5" />
              </div>
              
              <span
                v-show="isExpanded || isHovered || isMobileOpen"
                class="ml-3 truncate font-medium text-sm transition-opacity duration-300 relative z-10"
              >
                {{ item.name }}
              </span>
              
              <!-- Clean Tooltip for collapsed state -->
              <div 
                v-if="!isExpanded && !isHovered && !isMobileOpen"
                class="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-60 shadow-xl whitespace-nowrap translate-x--2 group-hover:translate-x-0"
              >
                {{ item.name }}
                <div class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[4px] w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useSidebar } from "~/composables/useSidebar";
import { usePermissions } from "~/composables/usePermissions";
import { Permission } from "~/types/permissions";
import type { DefineComponent } from "vue";

// Интерфейсы для типизации меню
interface SubMenuItem {
  name: string;
  path: string;
  permission?: Permission;
  excludePaths?: string[];
}

interface MenuItem {
  icon: DefineComponent<any, any, any>;
  name: string;
  path?: string;
  permission?: Permission;
  anyPermissions?: Permission[];
  subItems?: SubMenuItem[];
  showOnlyForRoles?: string[];
  hideForRoles?: string[];
  excludePaths?: string[];
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

// Importing icons
import GridIcon from "~/components/icons/GridIcon.vue";
import CalenderIcon from "~/components/icons/CalenderIcon.vue";
import UserGroupIcon from "~/components/icons/UserGroupIcon.vue";
import DocsIcon from "~/components/icons/DocsIcon.vue";
import ChevronDownIcon from "~/components/icons/ChevronDownIcon.vue";
import DatabaseIcon from "~/components/icons/DatabaseIcon.vue";
import AcademicCapIcon from "~/components/icons/AcademicCapIcon.vue";
import FolderIcon from "~/components/icons/FolderIcon.vue";
import CertificateIcon from "~/components/icons/CertificateIcon.vue";
import ClipboardCheckIcon from "~/components/icons/ClipboardCheckIcon.vue";
import BoxCubeIcon from "~/components/icons/BoxCubeIcon.vue";
import UserCircleIcon from "~/components/icons/UserCircleIcon.vue";

const route = useRoute();
const { isExpanded, isMobileOpen, isHovered, openSubmenu, setIsHovered } = useSidebar();
const { 
  hasPermission, 
  hasAnyPermission, 
  isStudent,
  isTeacher,
  isAdmin,
  isManager,
} = usePermissions();

// Hover Handlers
const handleMouseEnter = () => {
  if (!isExpanded.value) {
    setIsHovered(true)
  }
}

const handleMouseLeave = () => {
  setIsHovered(false)
}

// Sidebar Color based on user settings
const userSettings = useState<{ sidebar_color?: string } | null>('user-settings');

const sidebarColorClass = computed(() => {
  const color = userSettings.value?.sidebar_color || 'default';
  
  switch (color) {
    case 'primary':
      return 'bg-blue-600/95 dark:bg-blue-700/95 border-blue-500/50 dark:border-blue-600/50 shadow-blue-500/20 text-white sidebar-primary';
    case 'success':
      return 'bg-emerald-600/95 dark:bg-emerald-700/95 border-emerald-500/50 dark:border-emerald-600/50 shadow-emerald-500/20 text-white sidebar-success';
    case 'purple':
      return 'bg-purple-600/95 dark:bg-purple-700/95 border-purple-500/50 dark:border-purple-600/50 shadow-purple-500/20 text-white sidebar-purple';
    default:
      return 'bg-white/95 dark:bg-gray-900/95 border-gray-200/50 dark:border-gray-800/50 shadow-gray-200/50';
  }
});

// Menu Configuration
const allMenuGroups: MenuGroup[] = [
  {
    title: "Главная",
    items: [
      {
        icon: GridIcon,
        name: "Обзор",
        path: "/",
        permission: Permission.DASHBOARD_VIEW,
      },
      {
        icon: CalenderIcon,
        name: isStudent.value || isTeacher.value ? "Моё расписание" : "Расписание",
        path: "/schedule",
        anyPermissions: [Permission.SCHEDULE_VIEW_ALL, Permission.SCHEDULE_VIEW_OWN],
      },
    ]
  },
  {
    title: "Учебный процесс",
    items: [
      {
        icon: AcademicCapIcon,
        name: "Учебные программы",
        permission: Permission.COURSES_VIEW,
        subItems: [
             { 
               name: "Список программ", 
               path: "/programs",
               excludePaths: ["/programs/create"]
             },
             { name: "Создать программу", path: "/programs/create", permission: Permission.COURSES_CREATE }
        ]
      },
      {
        icon: UserGroupIcon,
        name: isTeacher.value ? "Мои группы" : "Учебные группы",
        path: "/groups",
        anyPermissions: [Permission.GROUPS_VIEW_ALL, Permission.GROUPS_VIEW_OWN],
      },
      {
        icon: CalenderIcon,
        name: "Отметка посещаемости",
        path: "/attendance/pending",
        permission: Permission.ATTENDANCE_MARK,
        showOnlyForRoles: ['TEACHER'],
      },
      {
        icon: ClipboardCheckIcon,
        name: "Банк тестирования",
        permission: Permission.TEST_BANKS_VIEW,
        hideForRoles: ['STUDENT'],
        subItems: [
             { 
               name: "Банки вопросов", 
               path: "/test-bank", 
               excludePaths: ["/test-bank/templates"]
             },
             { 
               name: "Шаблоны тестов", 
               path: "/test-bank/templates", 
               permission: Permission.TEST_TEMPLATES_VIEW 
             }
        ]
      },
    ]
  },
  {
    title: "База данных",
    items: [
      {
        icon: DatabaseIcon,
        name: "База данных",
        permission: Permission.STUDENTS_VIEW_ALL,
         subItems: [
             { name: "База организаций", path: "/database?tab=organizations", permission: Permission.ORGANIZATIONS_VIEW },
             { name: "База студентов", path: "/database?tab=students" },
             { name: "База сертификатов", path: "/database?tab=certificates", permission: Permission.CERTIFICATES_VIEW }
        ]
      },
    ]
  },
  {
    title: "Ресурсы",
    items: [
      {
        icon: FolderIcon,
        name: "Файловый менеджер",
        path: "/files",
        permission: Permission.FILES_VIEW,
        hideForRoles: ['STUDENT'],
      },
    ]
  },
  {
    title: "Личный кабинет",
    items: [
       {
        icon: CertificateIcon,
        name: "Мои сертификаты",
        path: "/my-certificates",
        permission: Permission.CERTIFICATES_VIEW_OWN,
        showOnlyForRoles: ['STUDENT'],
      },
      {
        icon: ClipboardCheckIcon,
        name: "Мои тесты",
        path: "/tests/my",
        showOnlyForRoles: ['STUDENT'],
      },
      {
        icon: AcademicCapIcon,
        name: "Мои курсы",
        path: "/my-courses",
        showOnlyForRoles: ['STUDENT'],
      },
      {
        icon: DocsIcon,
        name: "Поддержка",
        path: "/support",
        showOnlyForRoles: ['STUDENT'],
      },
    ]
  },
  {
    title: "Администрирование",
    items: [
      {
        icon: UserGroupIcon,
        name: "Пользователи",
        permission: Permission.USERS_VIEW,
        subItems: [
             { name: "Администраторы", path: "/users?tab=admin", permission: Permission.USERS_MANAGE_ROLES },
             { name: "Модераторы", path: "/users?tab=manager", permission: Permission.USERS_MANAGE_ROLES },
             { name: "Инструкторы", path: "/users?tab=instructors" },
             { name: "Студенты", path: "/users?tab=students" },
             { name: "Представители", path: "/users?tab=representatives" },
        ]
      },
      {
        icon: DocsIcon,
        name: "Шаблоны сертификатов",
        path: "/certificates/templates",
        permission: Permission.TEMPLATES_VIEW,
      },
      {
        icon: CalenderIcon,
        name: "Запросы на отметку",
        path: "/admin/attendance-requests",
        permission: Permission.ATTENDANCE_MANAGE,
        showOnlyForRoles: ['ADMIN', 'MANAGER'],
      },
      {
        icon: ClipboardCheckIcon,
        name: "Журнал действий",
        path: "/activity-logs",
        permission: Permission.LOGS_VIEW,
      },
    ]
  }
];

// Computed Filtered Menu
const menuGroups = computed((): MenuGroup[] => {
  return allMenuGroups
    .map(group => {
      const filteredItems = group.items
        .map((item): MenuItem | null => {
          // 1. Role-based visibility
          if (item.showOnlyForRoles) {
            const currentRole = isAdmin.value ? 'ADMIN' 
              : isManager.value ? 'MANAGER' 
              : isTeacher.value ? 'TEACHER' 
              : isStudent.value ? 'STUDENT' 
              : null;
            if (!currentRole || !item.showOnlyForRoles.includes(currentRole)) {
              return null;
            }
          }

          if (item.hideForRoles) {
            const currentRole = isAdmin.value ? 'ADMIN' 
              : isManager.value ? 'MANAGER' 
              : isTeacher.value ? 'TEACHER' 
              : isStudent.value ? 'STUDENT' 
              : null;
            if (currentRole && item.hideForRoles.includes(currentRole)) {
              return null;
            }
          }

          // 2. Permission based visibility
          if (item.permission && !hasPermission(item.permission)) {
            return null;
          }

          if (item.anyPermissions && !hasAnyPermission(item.anyPermissions)) {
            return null;
          }

          // 3. Handle Subitems
          if (item.subItems) {
             const filteredSubItems = item.subItems.filter(subItem => {
                if (subItem.permission && !hasPermission(subItem.permission)) {
                  return false;
                }
                return true;
             });

             if (filteredSubItems.length === 0) return null;
             
             // If we have subitems, we update the item to contain them
             return { ...item, subItems: filteredSubItems };
          }

          return item;
        })
        .filter((item): item is MenuItem => item !== null);

      return {
        ...group,
        items: filteredItems,
      };
    })
    .filter(group => group.items.length > 0);
});

// Helper functions for state
const isActive = (path: string, excludePaths?: string[]) => {
  if (path === '/') return route.path === '/';
  
  // Check exclusions
  if (excludePaths && excludePaths.some(excluded => route.path.startsWith(excluded))) {
    return false;
  }

  // Check if active path includes query param if present
  if (path.includes('?')) {
    const [pathBase, queryString] = path.split('?');
    const params = new URLSearchParams(queryString);
    const tab = params.get('tab');
    
    return route.path === pathBase && route.query.tab === tab;
  }

  // Strict match for determining if the LINK itself is highlighted (base case)
  return route.path === path || route.path.startsWith(path + '/');
};

const isParentActive = (path: string) => {
   if (path === '/') return route.path === '/';
   // Loose match for determining if a group should be open based on one of its children
   const pathBase = path.split('?')[0] || '';
   return route.path.startsWith(pathBase);
};

const toggleSubmenu = (groupIndex: number, itemIndex: number) => {
  const key = `${groupIndex}-${itemIndex}`;
  openSubmenu.value = openSubmenu.value === key ? null : key;
};

const isSubmenuOpen = (groupIndex: number, itemIndex: number) => {
  const key = `${groupIndex}-${itemIndex}`;
  if (openSubmenu.value === key) return true;
  
  // Auto-expand if child is active (using loose match)
  const item = menuGroups.value[groupIndex]?.items[itemIndex];
  if (item?.subItems) {
    return item.subItems.some(sub => isActive(sub.path, sub.excludePaths));
  }
  return false;
};
</script>

<style scoped>
/* Стили для цветных вариантов sidebar */
.sidebar-primary :deep(.text-gray-400),
.sidebar-primary :deep(.text-gray-500),
.sidebar-primary :deep(.text-gray-600),
.sidebar-success :deep(.text-gray-400),
.sidebar-success :deep(.text-gray-500),
.sidebar-success :deep(.text-gray-600),
.sidebar-purple :deep(.text-gray-400),
.sidebar-purple :deep(.text-gray-500),
.sidebar-purple :deep(.text-gray-600) {
  color: rgba(255, 255, 255, 0.7) !important;
}

.sidebar-primary :deep(.text-gray-900),
.sidebar-primary :deep(.dark\:text-white),
.sidebar-success :deep(.text-gray-900),
.sidebar-success :deep(.dark\:text-white),
.sidebar-purple :deep(.text-gray-900),
.sidebar-purple :deep(.dark\:text-white) {
  color: white !important;
}

.sidebar-primary :deep(.border-gray-100),
.sidebar-primary :deep(.border-gray-200),
.sidebar-primary :deep(.dark\:border-gray-800),
.sidebar-success :deep(.border-gray-100),
.sidebar-success :deep(.border-gray-200),
.sidebar-success :deep(.dark\:border-gray-800),
.sidebar-purple :deep(.border-gray-100),
.sidebar-purple :deep(.border-gray-200),
.sidebar-purple :deep(.dark\:border-gray-800) {
  border-color: rgba(255, 255, 255, 0.15) !important;
}

.sidebar-primary :deep(.bg-gray-50),
.sidebar-primary :deep(.hover\:bg-gray-50:hover),
.sidebar-primary :deep(.dark\:hover\:bg-gray-800\/50:hover),
.sidebar-success :deep(.bg-gray-50),
.sidebar-success :deep(.hover\:bg-gray-50:hover),
.sidebar-success :deep(.dark\:hover\:bg-gray-800\/50:hover),
.sidebar-purple :deep(.bg-gray-50),
.sidebar-purple :deep(.hover\:bg-gray-50:hover),
.sidebar-purple :deep(.dark\:hover\:bg-gray-800\/50:hover) {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.sidebar-primary :deep(.bg-blue-50\/80),
.sidebar-success :deep(.bg-blue-50\/80),
.sidebar-purple :deep(.bg-blue-50\/80) {
  background-color: rgba(255, 255, 255, 0.2) !important;
}

.sidebar-primary :deep(.group-hover\:text-blue-500),
.sidebar-primary :deep(.group-hover\:text-blue-400),
.sidebar-success :deep(.group-hover\:text-blue-500),
.sidebar-success :deep(.group-hover\:text-blue-400),
.sidebar-purple :deep(.group-hover\:text-blue-500),
.sidebar-purple :deep(.group-hover\:text-blue-400) {
  color: white !important;
}
</style>
