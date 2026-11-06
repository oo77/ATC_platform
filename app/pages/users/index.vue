<template>
  <!-- Внешний враппер без собственных отступов: отступы задаёт layout (убран двойной padding) -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Единый заголовок страницы вместо самописного h1 (без uppercase и font-black) -->
    <UiPageHeader
      title="Управление пользователями"
      description="Создание и управление учётными записями, назначение ролей"
    />

    <!-- Вкладки с подчёркиванием: заменили «таблетки» slate-стиля единым UiTabs -->
    <UiTabs
      :model-value="activeTab"
      :tabs="tabItems"
      @update:model-value="changeTab"
    />

    <!-- Контент вкладок без лишней карточки-обёртки: каждая панель сама рисует фильтры и таблицу -->
    <!-- Администраторы (только для ADMIN) -->
    <UsersUserManagementPanel v-if="isAdmin" v-show="activeTab === 'admin'" :role="UserRole.ADMIN" />

    <!-- Модераторы (только для ADMIN) -->
    <UsersUserManagementPanel v-if="isAdmin" v-show="activeTab === 'manager'" :role="UserRole.MANAGER" />

    <!-- Представители (только для ADMIN) -->
    <RepresentativesRepresentativeManagementPanel v-if="isAdmin" v-show="activeTab === 'representatives'" />
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

// Данные для UiTabs: только id/label/icon (поле roles вкладкам UI не нужно)
const tabItems = computed(() =>
  visibleTabs.value.map((tab) => ({ id: tab.id, label: tab.label, icon: tab.icon })),
);

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
