<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-in fade-in slide-in-from-top-4 duration-700">
      <div class="flex items-center gap-4">
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shrink-0">
          <ShieldCheck class="w-7 h-7" />
        </div>
        <div>
          <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Аттестация</h1>
          <p class="text-sm font-bold text-slate-500 dark:text-slate-400 mt-0.5">
            {{ isTeacher ? "Ваши сертификационные экзамены" : "Группы аттестации инструкторов" }}
          </p>
        </div>
      </div>
      <UiButton
        v-if="canManageAttestation"
        size="sm"
        class="h-10 px-4 gap-2 font-bold shadow-sm shrink-0"
        @click="navigateTo('/attestation/groups/create')"
      >
        <Plus class="w-4 h-4" /> Новая группа
      </UiButton>
    </div>

    <!-- TEACHER: собственный список -->
    <div v-if="isTeacher" class="space-y-4">
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
      <div
        v-else-if="myItems.length === 0"
        class="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-16 text-center"
      >
        <div class="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-full inline-block mb-4">
          <ShieldCheck class="w-10 h-10 text-slate-300 dark:text-slate-600" />
        </div>
        <p class="text-slate-500 font-medium">Вам пока не назначена аттестация</p>
      </div>
      <div
        v-for="item in myItems"
        :key="item.groupId"
        class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all hover:shadow-md"
      >
        <div class="min-w-0">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white truncate">{{ item.groupName }}</h3>
          <p class="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
            {{ item.templateName || "Тест ещё не назначен" }}
            <span v-if="item.examStart">• {{ formatDateTime(item.examStart) }} — {{ formatDateTime(item.examEnd) }}</span>
          </p>
          <p v-if="item.location" class="text-sm font-semibold text-slate-500 dark:text-slate-400">Место: {{ item.location }}</p>
        </div>
        <div class="flex flex-col items-end gap-2 shrink-0">
          <span :class="['inline-flex items-center rounded-full px-3 py-1 text-xs font-bold', decisionBadgeClass(item.decision)]">
            {{ decisionLabel(item.decision) }}
          </span>
          <div v-if="item.bestScore !== null" class="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Балл: <b class="text-slate-900 dark:text-white">{{ Math.round(item.bestScore) }}%</b>
          </div>
          <UiButton
            v-if="canStartExam(item)"
            size="sm"
            class="gap-2 font-bold"
            @click="startExam(item)"
            :loading="startingGroupId === item.groupId"
          >
            {{ item.activeSessionId ? "Продолжить" : "Начать тест" }}
          </UiButton>
        </div>
      </div>
    </div>

    <!-- ADMIN/MANAGER: список групп -->
    <div v-else class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
      <div v-else-if="groups.length === 0" class="p-16 text-center">
        <div class="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-full inline-block mb-4">
          <ShieldCheck class="w-10 h-10 text-slate-300 dark:text-slate-600" />
        </div>
        <p class="text-slate-500 font-medium">Группы аттестации ещё не созданы</p>
        <UiButton v-if="canManageAttestation" class="mt-6 gap-2 font-bold" @click="navigateTo('/attestation/groups/create')">
          <Plus class="w-4 h-4" /> Создать первую группу
        </UiButton>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/50 dark:bg-slate-800/50">
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Группа</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Инструкторов</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Тест</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Экзамен</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Статус</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="group in groups"
              :key="group.id"
              class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
              @click="navigateTo(`/attestation/groups/${group.id}`)"
            >
              <td class="px-6 py-4">
                <p class="font-bold text-slate-900 dark:text-white text-sm">{{ group.code }}</p>
                <p class="text-xs font-semibold text-slate-500 truncate max-w-[280px]">{{ group.name }}</p>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="inline-flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-300">
                  <Users class="w-3.5 h-3.5 text-slate-400" /> {{ group.instructorsCount }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">{{ group.templateName || "—" }}</td>
              <td class="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                {{ group.examStart ? formatDateTime(group.examStart) : "—" }}
              </td>
              <td class="px-6 py-4 text-right">
                <span
                  class="inline-flex items-center rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest border"
                  :class="statusBadgeClass(group.status)"
                >
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
    draft: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
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
  return "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400";
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
