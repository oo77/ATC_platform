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
    <!-- Администраторы и модераторы — право users:manage_roles -->
    <UsersUserManagementPanel v-if="canManageRoles" v-show="activeTab === 'admin'" :role="UserRole.ADMIN" />
    <UsersUserManagementPanel v-if="canManageRoles" v-show="activeTab === 'manager'" :role="UserRole.MANAGER" />

    <!-- Представители — право representatives:view (раньше только ADMIN: у менеджера страница была пустой) -->
    <RepresentativesRepresentativeManagementPanel v-if="hasPermission(Permission.REPRESENTATIVES_VIEW)" v-show="activeTab === 'representatives'" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, watchEffect } from "vue";
import { Permission } from "~/types/permissions";
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

// Доступ по правам, а не по названию роли
const { hasPermission } = usePermissions();
const canManageRoles = computed(() => hasPermission(Permission.USERS_MANAGE_ROLES));

// Все вкладки
const allTabs = [
  {
    id: "admin",
    label: "Администраторы",
    permission: Permission.USERS_MANAGE_ROLES,
    icon: Shield
  },
  {
    id: "manager",
    label: "Модераторы",
    permission: Permission.USERS_MANAGE_ROLES,
    icon: UserCog
  },
  {
    id: "representatives",
    label: "Представители",
    permission: Permission.REPRESENTATIVES_VIEW,
    icon: Briefcase
  },
];

// Фильтруем вкладки по правам пользователя
const visibleTabs = computed(() => allTabs.filter((tab) => hasPermission(tab.permission)));

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
