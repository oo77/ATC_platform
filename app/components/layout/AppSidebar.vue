<template>
  <aside
    :class="[
      'fixed top-4 left-4 h-[calc(100vh-2rem)] z-50 flex flex-col',
      'transform-gpu transition-all duration-200 ease-out',
      'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md',
      'border border-white/20 dark:border-gray-800/20 shadow-2xl rounded-3xl',
      {
        'w-[272px]': isExpanded || isMobileOpen || isHovered,
        'w-[72px]': !isExpanded && !isHovered && !isMobileOpen,
        'translate-x-0': isMobileOpen,
        '-translate-x-full lg:translate-x-0': !isMobileOpen,
      },
    ]"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Logo Section -->
    <div
      :class="[
        'flex items-center justify-between shrink-0 px-4 transition-all duration-200',
        isExpanded || isHovered || isMobileOpen
          ? 'h-20 py-4 pr-3'
          : 'h-16 justify-center py-4',
      ]"
    >
      <NuxtLink to="/" class="flex items-center gap-3 min-w-0 flex-1">
        <div class="shrink-0 flex items-center justify-center">
          <img
            src="/android-chrome-192x192.png"
            alt="Logo"
            class="h-9 w-9 object-contain rounded-xl shadow-sm"
          />
        </div>
        <Transition name="label-fade">
          <div
            v-show="isExpanded || isHovered || isMobileOpen"
            class="flex flex-col min-w-0 overflow-hidden"
          >
            <span
              class="text-[13px] font-black tracking-tight text-gray-900 dark:text-white leading-tight truncate"
              >ATC Platform</span
            >
            <span
              class="text-[9px] font-semibold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400 leading-tight"
              >Управление</span
            >
          </div>
        </Transition>
      </NuxtLink>

      <!-- Toggle chevron -->
      <Transition name="label-fade">
        <button
          v-show="isExpanded || isHovered || isMobileOpen"
          @click.stop="toggleSidebar"
          class="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 transition-all duration-150"
        >
          <component
            :is="ChevronLeft"
            :size="16"
            :class="[
              'transition-transform duration-300',
              isExpanded ? '' : 'rotate-180',
            ]"
          />
        </button>
      </Transition>
    </div>

    <!-- Divider -->
    <div class="shrink-0 mx-4 h-px bg-gray-100 dark:bg-gray-800" />

    <!-- Navigation — flex-1 + min-h-0 чтобы скролл работал внутри flex-col -->
    <div
      class="flex-1 min-h-0 overflow-y-auto overflow-x-visible py-3 px-2.5 no-scrollbar"
    >
      <nav
        v-for="(menuGroup, groupIndex) in menuGroups"
        :key="groupIndex"
        class="mb-2"
      >
        <!-- Group label -->
        <Transition name="label-fade">
          <h3
            v-show="
              menuGroup.title && (isExpanded || isHovered || isMobileOpen)
            "
            class="px-3 mb-1 mt-2 text-[9px] font-black uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500"
          >
            {{ menuGroup.title }}
          </h3>
        </Transition>

        <ul class="space-y-0.5">
          <li
            v-for="(item, index) in menuGroup.items"
            :key="item.name"
            class="relative"
          >
            <!-- Item with sub-items -->
            <div v-if="item.subItems && item.subItems.length > 0">
              <button
                @click.stop="toggleSubmenu(groupIndex, index)"
                :class="[
                  'group relative flex items-center gap-3 w-full rounded-xl transition-all duration-150 cursor-pointer',
                  isExpanded || isHovered || isMobileOpen
                    ? 'px-3 py-2.5 justify-between'
                    : 'px-0 py-2.5 justify-center',
                  isSubmenuOpen(groupIndex, index)
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white',
                ]"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div
                    class="shrink-0 flex items-center justify-center w-[22px] h-[22px]"
                  >
                    <component
                      :is="item.icon"
                      :size="18"
                      :stroke-width="isSubmenuOpen(groupIndex, index) ? 2.5 : 2"
                    />
                  </div>
                  <Transition name="label-fade">
                    <span
                      v-show="isExpanded || isHovered || isMobileOpen"
                      class="truncate text-[13px] font-semibold"
                    >
                      {{ item.name }}
                    </span>
                  </Transition>
                </div>
                <Transition name="label-fade">
                  <component
                    v-show="isExpanded || isHovered || isMobileOpen"
                    :is="ChevronDown"
                    :size="13"
                    :class="[
                      'shrink-0 transition-transform duration-200',
                      isSubmenuOpen(groupIndex, index) ? 'rotate-180' : '',
                    ]"
                  />
                </Transition>

                <!-- Tooltip when collapsed -->
                <div
                  v-if="!isExpanded && !isHovered && !isMobileOpen"
                  class="sidebar-tooltip"
                >
                  {{ item.name }}
                </div>
              </button>

              <!-- Submenu -->
              <transition
                enter-active-class="transition-all duration-200 ease-out overflow-hidden"
                enter-from-class="max-h-0 opacity-0"
                enter-to-class="max-h-[400px] opacity-100"
                leave-active-class="transition-all duration-150 ease-in overflow-hidden"
                leave-from-class="max-h-[400px] opacity-100"
                leave-to-class="max-h-0 opacity-0"
              >
                <div
                  v-show="
                    isSubmenuOpen(groupIndex, index) &&
                    (isExpanded || isHovered || isMobileOpen)
                  "
                >
                  <ul
                    class="mt-0.5 ml-4 pl-5 pr-1 space-y-0.5 border-l border-gray-100 dark:border-gray-800"
                  >
                    <li v-for="subItem in item.subItems" :key="subItem.name">
                      <NuxtLink
                        :to="subItem.path"
                        :class="[
                          'block px-3 py-2 rounded-lg text-[12px] font-semibold transition-all duration-150',
                          isActive(subItem.path, subItem.excludePaths)
                            ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/60',
                        ]"
                        >{{ subItem.name }}</NuxtLink
                      >
                    </li>
                  </ul>
                </div>
              </transition>
            </div>

            <!-- Regular nav item -->
            <NuxtLink
              v-else
              :to="item.path ?? ''"
              :class="[
                'group relative flex items-center gap-3 rounded-xl transition-all duration-150',
                isExpanded || isHovered || isMobileOpen
                  ? 'px-3 py-2.5'
                  : 'px-0 py-2.5 justify-center',
                isActive(item.path ?? '', item.excludePaths)
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white',
              ]"
            >
              <div
                class="shrink-0 flex items-center justify-center w-[22px] h-[22px]"
              >
                <component
                  :is="item.icon"
                  :size="18"
                  :stroke-width="isActive(item.path ?? '') ? 2.5 : 2"
                />
              </div>
              <Transition name="label-fade">
                <span
                  v-show="isExpanded || isHovered || isMobileOpen"
                  class="truncate text-[13px] font-semibold"
                >
                  {{ item.name }}
                </span>
              </Transition>

              <!-- Tooltip when collapsed -->
              <div
                v-if="!isExpanded && !isHovered && !isMobileOpen"
                class="sidebar-tooltip"
              >
                {{ item.name }}
              </div>
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </div>

    <!-- Divider -->
    <div class="shrink-0 mx-4 h-px bg-gray-100 dark:bg-gray-800" />

    <!-- Footer -->
    <div class="shrink-0 p-2.5">
      <div
        :class="[
          'flex items-center gap-2.5 p-2 rounded-xl border transition-all duration-150',
          'bg-white/60 dark:bg-gray-800/60 border-gray-100 dark:border-gray-700/50 shadow-xs',
          isExpanded || isHovered || isMobileOpen ? '' : 'justify-center',
        ]"
      >
        <div
          class="shrink-0 w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-sm"
        >
          {{ userInitial }}
        </div>
        <Transition name="label-fade">
          <div
            v-show="isExpanded || isHovered || isMobileOpen"
            class="flex-1 min-w-0 overflow-hidden"
          >
            <p
              class="text-[11px] font-bold text-gray-900 dark:text-white truncate"
            >
              {{ userName }}
            </p>
            <p
              class="text-[9px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-tight"
            >
              {{ userRoleLabel }}
            </p>
          </div>
        </Transition>
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
  Library,
  BarChart3,
  FolderTree,
  ShieldCheck,
  ChevronDown,
  ChevronLeft,
  HelpCircle,
  Trophy,
  Award,
  History,
  Settings,
  BookOpen,
  ClipboardList,
} from "lucide-vue-next";
import type { Component } from "vue";

// Интерфейсы
interface SubMenuItem {
  name: string;
  path: string;
  permission?: Permission;
  anyPermissions?: Permission[];
  excludePaths?: string[];
  hideForRoles?: string[];
}
interface MenuItem {
  icon: Component;
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

const route = useRoute();
const auth = useAuth();
const {
  isExpanded,
  isMobileOpen,
  isHovered,
  openSubmenu,
  setIsHovered,
  toggleSidebar,
} = useSidebar();
const {
  hasPermission,
  hasAnyPermission,
  isStudent,
  isTeacher,
  isAdmin,
  isManager,
} = usePermissions();

const userName = computed(() => auth.user.value?.name || "Пользователь");
const userInitial = computed(() => userName.value.charAt(0).toUpperCase());
const userRoleLabel = computed(() =>
  isAdmin.value
    ? "Админ"
    : isManager.value
      ? "Менеджер"
      : isTeacher.value
        ? "Преподаватель"
        : "Студент",
);

const handleMouseEnter = () => !isExpanded.value && setIsHovered(true);
const handleMouseLeave = () => setIsHovered(false);

// Меню
const allMenuGroups: MenuGroup[] = [
  {
    title: "Панель",
    items: [
      {
        icon: LayoutDashboard,
        name: "Обзор",
        path: "/",
        permission: Permission.DASHBOARD_VIEW,
      },
      {
        icon: CalendarRange,
        name: isStudent.value || isTeacher.value ? "Мои занятия" : "Расписание",
        path: "/schedule",
        anyPermissions: [
          Permission.SCHEDULE_VIEW_ALL,
          Permission.SCHEDULE_VIEW_OWN,
        ],
      },
    ],
  },
  {
    title: "Обучение",
    items: [
      {
        icon: GraduationCap,
        name: "Программы",
        permission: Permission.COURSES_VIEW,
        path: "/programs",
      },
      {
        icon: Users,
        name: "Учебные группы",
        path: "/groups",
        anyPermissions: [
          Permission.GROUPS_VIEW_ALL,
          Permission.GROUPS_VIEW_OWN,
        ],
      },
      {
        icon: Trophy,
        name: "Мои успехи",
        path: "/my-certificates",
        showOnlyForRoles: ["STUDENT"],
      },
      {
        icon: FileCheck,
        name: "Тесты",
        showOnlyForRoles: ["STUDENT"],
        path: "/tests/my",
      },
      {
        icon: FileCheck,
        name: "База тестов",
        hideForRoles: ["STUDENT"],
        subItems: [
          { name: "Вопросы", path: "/test-bank" },
          { name: "Шаблоны", path: "/test-bank/templates" },
        ],
      },
    ],
  },
  {
    title: "Контент",
    items: [
      {
        icon: Award,
        name: "Сертификаты",
        hideForRoles: ["STUDENT"],
        subItems: [
          {
            name: "База сертификатов",
            path: "/certificates",
            excludePaths: ["/certificates/templates"],
          },
          { name: "Организации", path: "/certificates?tab=orgs" },
          { name: "Шаблоны", path: "/certificates/templates" },
        ],
      },
      {
        icon: Library,
        name: "Библиотека",
        hideForRoles: ["STUDENT", "TEACHER"],
        subItems: [
          { name: "Каталог", path: "/library" },
          {
            name: "Управление",
            path: "/admin/library/books",
            permission: Permission.LIBRARY_MANAGE,
          },
        ],
      },
      {
        icon: Library,
        name: "Библиотека",
        showOnlyForRoles: ["STUDENT", "TEACHER"],
        path: "/library",
      },
      {
        icon: FolderTree,
        name: "Файлы",
        path: "/files",
        hideForRoles: ["STUDENT"],
      },
    ],
  },
  {
    title: "Управление",
    items: [
      {
        icon: Users,
        name: "Пользователи",
        path: "/users",
        permission: Permission.USERS_VIEW,
      },
      {
        icon: ClipboardList,
        name: "Запросы посещаемости",
        path: "/admin/attendance-requests",
        hideForRoles: ["STUDENT"],
      },
      {
        icon: BarChart3,
        name: "Аналитика",
        path: "/reports",
        hideForRoles: ["STUDENT", "TEACHER"],
      },
    ],
  },

  {
    title: "Сервис",
    items: [
      { icon: HelpCircle, name: "Поддержка", path: "/support" },
      { icon: BookOpen, name: "Документация", path: "/docs" },
    ],
  },
];

const menuGroups = computed(() => {
  return allMenuGroups
    .map((group) => {
      const items = group.items.filter((item) => {
        const role = isAdmin.value
          ? "ADMIN"
          : isManager.value
            ? "MANAGER"
            : isTeacher.value
              ? "TEACHER"
              : "STUDENT";
        if (item.showOnlyForRoles && !item.showOnlyForRoles.includes(role))
          return false;
        if (item.hideForRoles && item.hideForRoles.includes(role)) return false;
        if (item.permission && !hasPermission(item.permission)) return false;
        if (item.anyPermissions && !hasAnyPermission(item.anyPermissions))
          return false;
        return true;
      });
      return { ...group, items };
    })
    .filter((g) => g.items.length > 0);
});

const isActive = (path: string, exclude?: string[]) => {
  if (path === "/") return route.path === "/";
  if (exclude?.some((ex) => route.path.startsWith(ex))) return false;
  if (path.includes("?")) {
    const [b, q] = path.split("?");
    const p = new URLSearchParams(q);
    return route.path === b && route.query.tab === p.get("tab");
  }
  return route.path === path || route.path.startsWith(path + "/");
};

const toggleSubmenu = (g: number, i: number) => {
  const k = `${g}-${i}`;
  openSubmenu.value = openSubmenu.value === k ? null : k;
};
const isSubmenuOpen = (g: number, i: number) => {
  const k = `${g}-${i}`;
  if (openSubmenu.value === k) return true;
  const item = menuGroups.value[g]?.items[i];
  return item?.subItems?.some((s) => isActive(s.path)) || false;
};
</script>

<style scoped>
/* Скрыть скроллбар */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Плавное появление/скрытие текстовых лейблов */
.label-fade-enter-active,
.label-fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.label-fade-enter-from,
.label-fade-leave-to {
  opacity: 0;
  transform: translateX(-4px);
}

/* Tooltip для свёрнутого состояния */
.sidebar-tooltip {
  position: absolute;
  left: calc(100% + 12px);
  top: 50%;
  transform: translateY(-50%);
  padding: 5px 10px;
  background: #1e293b;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  border-radius: 8px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.1s ease;
  z-index: 999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

/* Показываем tooltip только при hover на родительский li/button/a */
li:hover .sidebar-tooltip,
a:hover .sidebar-tooltip,
button:hover .sidebar-tooltip {
  opacity: 1;
}

/* Dark mode tooltip */
:global(.dark) .sidebar-tooltip {
  background: #f8fafc;
  color: #0f172a;
}
</style>
