<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <div class="mb-6">
      <h2 class="text-title-md2 font-bold text-black dark:text-white">Журнал аттестации</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Сводная ведомость по всем группам и инструкторам</p>
    </div>

    <div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">
      <div v-if="loading" class="p-12 text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-meta-4 text-left text-gray-600 dark:text-gray-300">
          <tr>
            <th class="px-6 py-3 font-medium">Группа</th>
            <th class="px-6 py-3 font-medium">Дата экзамена</th>
            <th class="px-6 py-3 font-medium">Инструктор</th>
            <th class="px-6 py-3 font-medium">Балл</th>
            <th class="px-6 py-3 font-medium">Решение</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr
            v-for="item in items"
            :key="item.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
            @click="navigateTo(`/attestation/groups/${item.groupId}`)"
          >
            <td class="px-6 py-3">{{ item.groupCode }} — {{ item.groupName }}</td>
            <td class="px-6 py-3">{{ item.examStart ? formatDate(item.examStart) : "—" }}</td>
            <td class="px-6 py-3 font-medium text-gray-900 dark:text-white">{{ item.fullName }}</td>
            <td class="px-6 py-3">{{ item.scorePercent !== null ? Math.round(item.scorePercent) + "%" : "—" }}</td>
            <td class="px-6 py-3">
              <span :class="['inline-flex items-center rounded-full px-3 py-1 text-xs font-medium', decisionBadgeClass(item.decision)]">
                {{ decisionLabel(item.decision) }}
              </span>
            </td>
          </tr>
          <tr v-if="items.length === 0">
            <td colspan="5" class="px-6 py-6 text-center text-gray-500 dark:text-gray-400">Записей пока нет</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

definePageMeta({ layout: "default" });

const { authFetch } = useAuthFetch();
const loading = ref(true);
const items = ref([]);

const formatDate = (d) =>
  new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });

const decisionLabel = (d) => ({ passed: "Сдан", failed: "Не сдан", pending: "Ожидает" }[d] || "Ожидает");
const decisionBadgeClass = (d) => {
  if (d === "passed") return "bg-success/10 text-success";
  if (d === "failed") return "bg-danger/10 text-danger";
  return "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400";
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
