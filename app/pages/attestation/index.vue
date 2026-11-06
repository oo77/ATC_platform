<template>
  <!-- Обёртка без двойного отступа (отступы задаёт layout) -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Единый заголовок вместо text-3xl font-black; «Новая группа» — единственное главное действие -->
    <UiPageHeader
      title="Аттестация"
      :description="isTeacher ? 'Ваши сертификационные экзамены' : 'Группы аттестации инструкторов'"
    >
      <template #actions>
        <UiButton v-if="canManageAttestation" size="sm" @click="navigateTo('/attestation/groups/create')">
          <Plus class="mr-1.5 h-4 w-4" /> Новая группа
        </UiButton>
      </template>
    </UiPageHeader>

    <!-- TEACHER: собственный список -->
    <div v-if="isTeacher" class="space-y-3">
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
      <!-- Пусто: общий компонент -->
      <div v-else-if="myItems.length === 0" class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <UiEmptyState :icon="ShieldCheck" title="Вам пока не назначена аттестация" />
      </div>
      <div
        v-for="item in myItems"
        :key="item.groupId"
        class="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700 md:flex-row md:items-center md:justify-between"
      >
        <div class="min-w-0">
          <h3 class="truncate text-base font-semibold text-gray-900 dark:text-white">{{ item.groupName }}</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ item.templateName || "Тест ещё не назначен" }}
            <span v-if="item.examStart">• {{ formatDateTime(item.examStart) }} — {{ formatDateTime(item.examEnd) }}</span>
          </p>
          <p v-if="item.location" class="text-sm text-gray-500 dark:text-gray-400">Место: {{ item.location }}</p>
        </div>
        <div class="flex shrink-0 flex-col items-start gap-2 md:items-end">
          <span :class="['inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', decisionBadgeClass(item.decision)]">
            {{ decisionLabel(item.decision) }}
          </span>
          <div v-if="item.bestScore !== null" class="text-sm text-gray-600 dark:text-gray-400">
            Балл: <b class="font-semibold text-gray-900 dark:text-white">{{ Math.round(item.bestScore) }}%</b>
          </div>
          <UiButton
            v-if="canStartExam(item)"
            size="sm"
            @click="startExam(item)"
            :loading="startingGroupId === item.groupId"
          >
            {{ item.activeSessionId ? "Продолжить" : "Начать тест" }}
          </UiButton>
        </div>
      </div>
    </div>

    <!-- ADMIN/MANAGER: список групп в стандартной карточке таблицы -->
    <div v-else class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
      <UiEmptyState v-else-if="groups.length === 0" :icon="ShieldCheck" title="Группы аттестации ещё не созданы">
        <template #actions>
          <UiButton v-if="canManageAttestation" size="sm" @click="navigateTo('/attestation/groups/create')">
            <Plus class="mr-1.5 h-4 w-4" /> Создать первую группу
          </UiButton>
        </template>
      </UiEmptyState>
      <div v-else class="max-h-[70vh] overflow-auto">
        <table class="w-full border-collapse text-left">
          <!-- Sticky-шапка: без CAPS и tracking-wider, подписи 12px -->
          <thead class="sticky top-0 z-10 bg-white dark:bg-gray-900">
            <tr class="border-b border-gray-200 dark:border-gray-800">
              <th class="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Группа</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Инструкторов</th>
              <th class="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Тест</th>
              <th class="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Экзамен</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Статус</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <!-- Строка кликабельна (как и раньше) -->
            <tr
              v-for="group in groups"
              :key="group.id"
              class="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]"
              @click="navigateTo(`/attestation/groups/${group.id}`)"
            >
              <td class="px-4 py-3">
                <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ group.code }}</p>
                <p class="max-w-[280px] truncate text-xs text-gray-500 dark:text-gray-400">{{ group.name }}</p>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Users class="h-3.5 w-3.5 text-gray-400" /> {{ group.instructorsCount }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{{ group.templateName || "—" }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                {{ group.examStart ? formatDateTime(group.examStart) : "—" }}
              </td>
              <td class="px-4 py-3 text-right">
                <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium" :class="statusBadgeClass(group.status)">
                  {{ statusLabel(group.status) }}
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
import { ref, onMounted } from "vue";
import { ShieldCheck, Plus, Users } from "lucide-vue-next";
import { usePermissions } from "~/composables/usePermissions";

definePageMeta({ layout: "default" });

const { authFetch } = useAuthFetch();
const { isTeacher, canManageAttestation } = usePermissions();
const toast = useToast();

const loading = ref(false);
const groups = ref([]);
const myItems = ref([]);
const startingGroupId = ref(null);

const formatDateTime = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusLabel = (status) => ({
  draft: "Черновик",
  scheduled: "Запланирована",
  in_progress: "Идёт экзамен",
  completed: "Завершена",
  cancelled: "Отменена",
}[status] || status);

const statusBadgeClass = (status) => {
  const map = {
    draft: "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
    scheduled: "bg-primary/10 text-primary border-primary/20",
    in_progress: "bg-warning/10 text-warning border-warning/20",
    completed: "bg-success/10 text-success border-success/20",
    cancelled: "bg-danger/10 text-danger border-danger/20",
  };
  return map[status] || map.draft;
};

const decisionLabel = (decision) => ({
  passed: "Сдан",
  failed: "Не сдан",
  pending: "Ожидает решения",
}[decision] || "Ожидает решения");

const decisionBadgeClass = (decision) => {
  if (decision === "passed") return "bg-success/10 text-success";
  if (decision === "failed") return "bg-danger/10 text-danger";
  return "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400";
};

const canStartExam = (item) => {
  if (item.activeSessionId) return true;
  return item.available && item.attemptsUsed < (item.maxAttempts || 1);
};

const load = async () => {
  loading.value = true;
  try {
    if (isTeacher.value) {
      const res = await authFetch("/api/attestation/my");
      if (res.success) myItems.value = res.items || [];
    } else {
      const res = await authFetch("/api/attestation/groups");
      if (res.success) groups.value = res.groups || [];
    }
  } catch (e) {
    toast.error("Не удалось загрузить данные аттестации");
  } finally {
    loading.value = false;
  }
};

const startExam = async (item) => {
  startingGroupId.value = item.groupId;
  try {
    if (item.activeSessionId) {
      await navigateTo(`/attestation/exam/${item.groupId}?session=${item.activeSessionId}`);
      return;
    }
    const res = await authFetch("/api/attestation/sessions/start", {
      method: "POST",
      body: { group_id: item.groupId },
    });
    if (res.success) {
      await navigateTo(`/attestation/exam/${item.groupId}?session=${res.session.id}`);
    } else {
      toast.error(res.message || "Не удалось начать тест");
    }
  } finally {
    startingGroupId.value = null;
  }
};

onMounted(load);
</script>
