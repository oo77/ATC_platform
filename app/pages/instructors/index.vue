<template>
  <!-- Внешний враппер без собственных отступов (убран двойной padding) -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Единый заголовок страницы вместо самописного h1 с иконкой-плиткой -->
    <UiPageHeader
      title="Инструкторы"
      description="Управление преподавательским составом и инструкторами учебного центра"
    />

    <!-- Вкладки показываем, только если доступно больше одной (как и раньше) -->
    <UiTabs v-if="availableTabs.length > 1" v-model="activeTab" :tabs="availableTabs" />

    <!-- Список инструкторов: панель сама рисует фильтры и карточку таблицы -->
    <UsersInstructorManagementPanel v-if="activeTab === 'list'" />

    <!-- Нагрузка за месяц -->
    <InstructorsMonthlyLoad v-else-if="activeTab === 'load'" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
// UserSquare2 удалён: иконка-плитка в заголовке больше не используется (UiPageHeader)
import { CalendarRange, List } from "lucide-vue-next";
import InstructorsMonthlyLoad from "~/components/instructors/MonthlyLoad.vue";

definePageMeta({
  layout: "default",
});

useHead({
  title: "Инструкторы - АТЦ Платформа",
});

const route = useRoute();
const router = useRouter();
const { canViewInstructorHours } = usePermissions();

type TabId = "list" | "load";

const availableTabs = computed(() => [
  { id: "list" as TabId, label: "Список инструкторов", icon: List },
  ...(canViewInstructorHours.value
    ? [{ id: "load" as TabId, label: "Нагрузка за месяц", icon: CalendarRange }]
    : []),
]);

// Вкладка хранится в адресе (?tab=load), чтобы её можно было открыть ссылкой и после перезагрузки
const activeTab = computed<TabId>({
  get: () => {
    const tab = route.query.tab;
    return availableTabs.value.some((t) => t.id === tab) ? (tab as TabId) : "list";
  },
  set: (tab) => {
    router.replace({ query: { ...route.query, tab: tab === "list" ? undefined : tab } });
  },
});
</script>
