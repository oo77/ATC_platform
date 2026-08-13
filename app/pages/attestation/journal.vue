<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <div class="mb-8 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
      <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/10 text-warning shrink-0">
        <ClipboardList class="w-7 h-7" />
      </div>
      <div>
        <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Журнал аттестации</h1>
        <p class="text-sm font-bold text-slate-500 dark:text-slate-400 mt-0.5">
          Сводная ведомость по всем группам и инструкторам
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-6 flex flex-wrap items-center gap-2">
      <button
        v-for="f in decisionFilters"
        :key="f.value"
        @click="activeFilter = f.value"
        :class="[
          'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300 border',
          activeFilter === f.value
            ? 'bg-primary/10 text-primary border-primary/20'
            : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-700 dark:hover:text-slate-200',
        ]"
      >
        {{ f.label }}
        <span
          v-if="f.value !== 'all'"
          :class="['inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-black', activeFilter === f.value ? 'bg-primary/20' : 'bg-slate-100 dark:bg-slate-800']"
        >
          {{ counts[f.value] }}
        </span>
      </button>
    </div>

    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>

      <div v-else-if="filteredItems.length === 0" class="p-16 text-center">
        <div class="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-full inline-block mb-4">
          <ClipboardList class="w-10 h-10 text-slate-300 dark:text-slate-600" />
        </div>
        <p class="text-slate-500 font-medium">Записей пока нет</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/50 dark:bg-slate-800/50">
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Инструктор</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Группа</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Дата экзамена</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Балл</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Решение</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="item in filteredItems"
              :key="item.id"
              class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
              @click="navigateTo(`/attestation/groups/${item.groupId}`)"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="h-9 w-9 shrink-0 rounded-full bg-linear-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center font-bold text-xs border border-primary/10"
                  >
                    {{ getInitials(item.fullName) }}
                  </div>
                  <p class="font-bold text-slate-900 dark:text-white text-sm tracking-tight">{{ item.fullName }}</p>
                </div>
              </td>
              <td class="px-6 py-4">
                <p class="text-sm font-bold text-slate-700 dark:text-slate-300">{{ item.groupCode }}</p>
                <p class="text-xs font-semibold text-slate-500 truncate max-w-[220px]">{{ item.groupName }}</p>
              </td>
              <td class="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                {{ item.examStart ? formatDate(item.examStart) : "—" }}
              </td>
              <td class="px-6 py-4 text-center font-bold text-slate-900 dark:text-white">
                {{ item.scorePercent !== null ? Math.round(item.scorePercent) + "%" : "—" }}
              </td>
              <td class="px-6 py-4 text-right">
                <span
                  class="inline-flex items-center rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest border"
                  :class="decisionBadgeClass(item.decision)"
                >
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
  return "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
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
