<template>
  <!-- Обёртка без двойного отступа (отступы задаёт layout) -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Единый заголовок вместо text-3xl font-black -->
    <UiPageHeader title="Журнал аттестации" description="Сводная ведомость по всем группам и инструкторам" />

    <!-- Фильтр решений: UiTabs со счётчиками вместо кнопок-таблеток (activeFilter и counts прежние) -->
    <UiTabs v-model="activeFilter" :tabs="filterTabs" />

    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>

      <UiEmptyState v-else-if="filteredItems.length === 0" :icon="ClipboardList" title="Записей пока нет" />

      <div v-else class="max-h-[70vh] overflow-auto">
        <table class="w-full border-collapse text-left">
          <!-- Sticky-шапка без CAPS -->
          <thead class="sticky top-0 z-10 bg-white dark:bg-gray-900">
            <tr class="border-b border-gray-200 dark:border-gray-800">
              <th class="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Инструктор</th>
              <th class="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Группа</th>
              <th class="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Дата экзамена</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Балл</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Решение</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <!-- Строка кликабельна (как и раньше) -->
            <tr
              v-for="item in filteredItems"
              :key="item.id"
              class="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]"
              @click="navigateTo(`/attestation/groups/${item.groupId}`)"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {{ getInitials(item.fullName) }}
                  </div>
                  <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ item.fullName }}</p>
                </div>
              </td>
              <td class="px-4 py-3">
                <p class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ item.groupCode }}</p>
                <p class="max-w-[220px] truncate text-xs text-gray-500 dark:text-gray-400">{{ item.groupName }}</p>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{{ item.examStart ? formatDate(item.examStart) : "—" }}</td>
              <td class="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                {{ item.scorePercent !== null ? Math.round(item.scorePercent) + "%" : "—" }}
              </td>
              <td class="px-4 py-3 text-right">
                <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium" :class="decisionBadgeClass(item.decision)">
                  {{ decisionLabel(item.decision) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ClipboardList } from "lucide-vue-next";

definePageMeta({ layout: "default" });

const { authFetch } = useAuthFetch();
const loading = ref(true);
const items = ref([]);
const activeFilter = ref("all");

const decisionFilters = [
  { value: "all", label: "Все" },
  { value: "passed", label: "Сдали" },
  { value: "failed", label: "Не сдали" },
  { value: "pending", label: "Ожидают" },
];

const counts = computed(() => ({
  passed: items.value.filter((i) => i.decision === "passed").length,
  failed: items.value.filter((i) => i.decision === "failed").length,
  pending: items.value.filter((i) => !i.decision || i.decision === "pending").length,
}));

// Вкладки для UiTabs: те же фильтры решений, счётчики берутся из counts (у «Все» — общее число записей)
const filterTabs = computed(() => decisionFilters.map((f) => ({
  id: f.value,
  label: f.label,
  count: f.value === "all" ? items.value.length : counts.value[f.value],
})));

const filteredItems = computed(() => {
  if (activeFilter.value === "all") return items.value;
  if (activeFilter.value === "pending") return items.value.filter((i) => !i.decision || i.decision === "pending");
  return items.value.filter((i) => i.decision === activeFilter.value);
});

const getInitials = (name) => {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });

const decisionLabel = (d) => ({ passed: "Сдан", failed: "Не сдан" }[d] || "Ожидает");
const decisionBadgeClass = (d) => {
  if (d === "passed") return "bg-success/10 text-success border-success/20";
  if (d === "failed") return "bg-danger/10 text-danger border-danger/20";
  return "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
};

onMounted(async () => {
  loading.value = true;
  try {
    const res = await authFetch("/api/attestation/journal");
    if (res.success) items.value = res.items || [];
  } finally {
    loading.value = false;
  }
});
</script>
