<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Header Section -->
    <div class="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="space-y-2">
          <h1 class="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Управление пользователями
          </h1>
          <p class="text-slate-500 font-medium">
            Создание и управление учётными записями, назначение ролей
          </p>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="mb-8 overflow-x-auto custom-scrollbar pb-2">
      <div class="inline-flex rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">
        <nav class="flex gap-1" aria-label="Tabs">
          <button
            v-for="tab in visibleTabs"
            :key="tab.id"
            @click="changeTab(tab.id)"
            :class="[
              'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300 whitespace-nowrap',
              activeTab === tab.id 
                ? 'bg-white text-primary shadow-sm dark:bg-slate-700 dark:text-white' 
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            ]"
          >
            <component :is="getTabIcon(tab.id)" class="h-4 w-4" />
            {{ tab.label }}
          </button>
        </nav>
      </div>
    </div>

    <!-- Tab Content Container -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm animate-in fade-in duration-500">
      <!-- Администраторы Tab (только для ADMIN) -->
      <div v-if="isAdmin" v-show="activeTab === 'admin'" class="p-6">
        <UsersUserManagementPanel :role="UserRole.ADMIN" />
      </div>

      <!-- Модераторы Tab (только для ADMIN) -->
      <div v-if="isAdmin" v-show="activeTab === 'manager'" class="p-6">
        <UsersUserManagementPanel :role="UserRole.MANAGER" />
      </div>

      <!-- Представители Tab (только для ADMIN) -->
      <div v-if="isAdmin" v-show="activeTab === 'representatives'" class="p-6">
        <RepresentativesRepresentativeManagementPanel />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import { UserRole } from "~/types/auth";
import { Shield, UserCog, Briefcase, Users } from "lucide-vue-next";

// Определяем мета-данные страницы
definePageMeta({
  layout: "default",
});

const route = useRoute();
const router = useRouter();

// Получаем информацию о текущем пользователе
const { user } = useAuth();

// Проверка роли
const isAdmin = computed(() => user.value?.role === "ADMIN");
const isManager = computed(() => user.value?.role === "MANAGER");

// Все вкладки
const allTabs = [
  {
    id: "admin",
    label: "Администраторы",
    roles: ["ADMIN"], // Видна только админам
    icon: Shield
  },
  {
    id: "manager",
    label: "Модераторы",
    roles: ["ADMIN"], // Видна только админам
    icon: UserCog
  },
  {
    id: "representatives",
    label: "Представители",
    roles: ["ADMIN"], // Видна только админам
    icon: Briefcase
  },
];

// Фильтруем вкладки по роли пользователя
const visibleTabs = computed(() => {
  const userRole = user.value?.role || "";
  return allTabs.filter((tab) => tab.roles.includes(userRole));
});

// Получить иконку для вкладки
const getTabIcon = (id: string) => {
  const tab = allTabs.find(t => t.id === id);
  return tab ? tab.icon : Users;
};

// Активная вкладка
const activeTab = ref<string>("");

// Синхронизация с URL
const syncTabWithUrl = () => {
  const tab = route.query.tab as string;
  if (tab === "instructors") {
    router.replace("/instructors");
    return;
  }
  if (tab === "students") {
    router.replace("/students");
    return;
  }
  if (tab && visibleTabs.value.some((t) => t.id === tab)) {
    activeTab.value = tab;
  } else if (visibleTabs.value.length > 0 && !activeTab.value) {
    // Если таб не указан, берем первый доступный
    activeTab.value = visibleTabs.value[0]?.id || "";
  }
};

watch(
  () => route.query.tab,
  () => {
    syncTabWithUrl();
  },
);

watchEffect(() => {
  // Ждем пока user подгрузится и табы отфильтруются
  if (visibleTabs.value.length > 0) {
    syncTabWithUrl();
  }
});

const changeTab = (id: string) => {
  if (activeTab.value !== id) {
    activeTab.value = id;
    router.push({ query: { ...route.query, tab: id } });
  }
};
</script>
