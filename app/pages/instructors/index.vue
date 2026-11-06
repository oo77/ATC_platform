<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Header Section -->
    <div class="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="space-y-1">
          <div class="flex items-center space-x-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserSquare2 class="h-5 w-5" />
            </div>
            <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
              Инструкторы
            </h1>
          </div>
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400 pl-13">
            Управление преподавательским составом и инструкторами учебного центра
          </p>
        </div>
      </div>
    </div>

    <!-- Tabs Navigation -->
    <div v-if="availableTabs.length > 1" class="mb-5 overflow-x-auto custom-scrollbar pb-1">
      <div class="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        <nav class="flex gap-0.5" aria-label="Tabs">
          <button
            v-for="tab in availableTabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all duration-300 whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-white text-primary shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
            ]"
          >
            <component :is="tab.icon" class="h-3.5 w-3.5" />
            {{ tab.label }}
          </button>
        </nav>
      </div>
    </div>

    <!-- Management Panel Component -->
    <div
      v-if="activeTab === 'list'"
      class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 animate-in fade-in duration-500"
    >
      <UsersInstructorManagementPanel />
    </div>

    <!-- Monthly Load -->
    <InstructorsMonthlyLoad v-else-if="activeTab === 'load'" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { CalendarRange, List, UserSquare2 } from "lucide-vue-next";
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
