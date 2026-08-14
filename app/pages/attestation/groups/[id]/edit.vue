<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10 space-y-6">
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div
          class="inline-block h-10 w-10 animate-spin rounded-full border-3 border-solid border-primary border-r-transparent"
        ></div>
        <p class="mt-3 text-slate-600 dark:text-slate-400 font-medium text-sm">Загрузка...</p>
      </div>
    </div>

    <template v-else-if="group">
      <!-- Header -->
      <div class="space-y-2 animate-in fade-in slide-in-from-top-3 duration-500">
        <NuxtLink
          :to="`/attestation/groups/${groupId}`"
          class="group inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary transition-colors"
        >
          <div
            class="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft class="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          </div>
          Назад к группе
        </NuxtLink>

        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Настройка группы аттестации
            </h1>
            <p class="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
              {{ group.code }} — {{ group.name }}
            </p>
          </div>

          <NuxtLink :to="`/attestation/groups/${groupId}`">
            <UiButton variant="outline" size="sm" class="h-9 px-3.5 gap-1.5 text-xs font-bold">
              <Eye class="w-3.5 h-3.5" /> К просмотру группы
            </UiButton>
          </NuxtLink>
        </div>
      </div>

      <!-- 2-Column Main Blocks -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Инструкторы -->
        <div
          class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden flex flex-col justify-between"
        >
          <div class="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 class="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
              <Users class="w-4 h-4 text-primary" />
              Инструкторы ({{ instructors.length }})
            </h3>
            <UiButton
              variant="primary"
              size="sm"
              class="h-8 px-2.5 gap-1 text-xs font-bold"
              @click="showInstructorsModal = true"
            >
              <UserPlus class="w-3.5 h-3.5" /> Добавить
            </UiButton>
          </div>

          <div class="p-4 flex-1">
            <div v-if="instructors.length === 0" class="py-8 text-center text-xs text-slate-500 font-medium">
              Инструкторы пока не добавлены
            </div>
            <div v-else class="space-y-1.5 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
              <div
                v-for="ins in instructors"
                :key="ins.id"
                class="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:bg-slate-100/70 transition-colors group"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <div
                    class="h-7 w-7 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] border border-primary/20"
                  >
                    {{ getInitials(ins.fullName) }}
                  </div>
                  <div class="min-w-0">
                    <p class="font-bold text-slate-900 dark:text-white text-xs truncate">{{ ins.fullName }}</p>
                    <p class="text-[10px] text-slate-500 truncate">{{ ins.positionSnapshot || "Инструктор" }}</p>
                  </div>
                </div>
                <button
                  class="inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:text-danger hover:bg-danger/10 transition-all opacity-40 group-hover:opacity-100"
                  title="Убрать"
                  @click="removeInstructor(ins.instructorId)"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Комиссия -->
        <div
          class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden flex flex-col justify-between"
        >
          <div class="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 class="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
              <Gavel class="w-4 h-4 text-amber-500" />
              Комиссия ({{ commission.length }})
            </h3>
            <UiButton
              variant="primary"
              size="sm"
              class="h-8 px-2.5 gap-1 text-xs font-bold"
              @click="showCommissionModal = true"
            >
              <Settings class="w-3.5 h-3.5" /> Назначить
            </UiButton>
          </div>

          <div class="p-4 flex-1">
            <div v-if="commission.length === 0" class="py-8 text-center text-xs text-slate-500 font-medium">
              Комиссия ещё не сформирована
            </div>
            <div v-else class="space-y-1.5 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
              <div
                v-for="c in sortedCommission"
                :key="c.id"
                class="flex items-center justify-between p-2 rounded-lg border transition-colors"
                :class="[
                  c.role === 'chairman'
                    ? 'border-amber-500/30 bg-amber-500/5'
                    : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40',
                ]"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <div
                    class="h-7 w-7 shrink-0 rounded-full flex items-center justify-center font-bold text-[10px] border"
                    :class="[
                      c.role === 'chairman'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-primary/10 text-primary border-primary/20',
                    ]"
                  >
                    <Crown v-if="c.role === 'chairman'" class="w-3.5 h-3.5" />
                    <span v-else>{{ getInitials(c.fullName) }}</span>
                  </div>
                  <div class="min-w-0">
                    <p class="font-bold text-slate-900 dark:text-white text-xs truncate">{{ c.fullName }}</p>
                    <p class="text-[10px] text-slate-500 truncate">{{ c.position || c.organization || "Член комиссии" }}</p>
                  </div>
                </div>

                <span
                  class="shrink-0 text-[10px] font-black uppercase px-2 py-0.5 rounded"
                  :class="[
                    c.role === 'chairman'
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                      : c.role === 'responsible'
                        ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
                        : c.role === 'secretary'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : 'bg-slate-200/60 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
                  ]"
                >
                  {{ roleLabel(c.role) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Расписание, Тест и Сертификаты -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Расписание -->
        <div
          class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden"
        >
          <div class="p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 class="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
              <CalendarClock class="w-4 h-4 text-warning" />
              Расписание и тест
            </h3>
          </div>
          <div class="p-4 space-y-3">
            <div class="space-y-1">
              <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Шаблон теста</label>
              <div class="relative">
                <select
                  v-model="schedule.testTemplateId"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs outline-none focus:border-primary focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 appearance-none font-medium transition-all"
                >
                  <option value="">Не назначен</option>
                  <option v-for="t in testTemplates" :key="t.id" :value="t.id">{{ t.name }} (порог: {{ t.passingScore ?? 75 }}%)</option>
                </select>
                <ChevronDown class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Начало</label>
                <input
                  v-model="schedule.examStart"
                  type="datetime-local"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs outline-none focus:border-primary focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 font-medium transition-all"
                />
              </div>
              <div class="space-y-1">
                <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Окончание</label>
                <input
                  v-model="schedule.examEnd"
                  type="datetime-local"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs outline-none focus:border-primary focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 font-medium transition-all"
                />
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Место проведения</label>
              <input
                v-model="schedule.location"
                type="text"
                placeholder="Аудитория 17"
                class="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs outline-none focus:border-primary focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 font-medium transition-all"
              />
            </div>

            <div class="flex justify-end pt-2">
              <UiButton size="sm" class="gap-1.5 text-xs font-bold" :loading="savingSchedule" @click="saveSchedule">
                <Save class="w-3.5 h-3.5" /> Сохранить расписание
              </UiButton>
            </div>
          </div>
        </div>

        <!-- Сертификат -->
        <div
          class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden"
        >
          <div class="p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 class="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
              <Award class="w-4 h-4 text-emerald-500" />
              Шаблон сертификата
            </h3>
          </div>
          <div class="p-4 space-y-3">
            <div class="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-2.5 flex items-start gap-2 text-xs text-blue-800 dark:text-blue-300">
              <Info class="w-4 h-4 shrink-0 mt-0.5" />
              <p class="leading-relaxed">
                Сертификат будет выдан автоматически, когда комиссия утвердит решение «Сдал».
              </p>
            </div>

            <div class="space-y-1">
              <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Шаблон</label>
              <div class="relative">
                <select
                  v-model="certificateTemplateId"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs outline-none focus:border-primary focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 appearance-none font-medium transition-all"
                >
                  <option value="">Не назначен (автовыдача отключена)</option>
                  <option v-for="t in certificateTemplates" :key="t.id" :value="t.id">{{ t.name }}</option>
                </select>
                <ChevronDown class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            <div class="flex justify-end pt-2">
              <UiButton size="sm" class="gap-1.5 text-xs font-bold" :loading="savingCertificateTemplate" @click="saveCertificateTemplate">
                <Save class="w-3.5 h-3.5" /> Сохранить сертификат
              </UiButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Опасная зона -->
      <div class="rounded-xl border border-danger/20 bg-danger/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h4 class="text-xs font-bold text-danger flex items-center gap-1.5 uppercase tracking-wider">
            <AlertTriangle class="w-4 h-4" /> Удалить группу
          </h4>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Все результаты экзаменов и связи участников будут удалены безвозвратно.</p>
        </div>
        <UiButton
          variant="outline"
          size="sm"
          class="h-8 px-3 gap-1.5 text-xs font-bold text-danger border-danger/30 hover:bg-danger/10 shrink-0"
          @click="showDeleteModal = true"
        >
          <Trash2 class="w-3.5 h-3.5" /> Удалить группу
        </UiButton>
      </div>
    </template>

    <!-- Модалка выбора инструкторов (Мультиселект) -->
    <AttestationSelectInstructorsModal
      :is-open="showInstructorsModal"
      :group-id="groupId"
      :already-selected-ids="instructors.map((i) => i.instructorId)"
      @close="showInstructorsModal = false"
      @added="onInstructorsAdded"
    />

    <!-- Модалка выбора членов комиссии (Мультиселект) -->
    <AttestationSelectCommissionModal
      :is-open="showCommissionModal"
      :group-id="groupId"
      :current-members="commission.map((c) => ({ commissionMemberId: c.commissionMemberId, role: c.role }))"
      @close="showCommissionModal = false"
      @saved="onCommissionSaved"
    />

    <!-- Модалка удаления группы -->
    <UiConfirmModal
      :is-open="showDeleteModal"
      title="Удаление группы"
      :message="`Вы уверены, что хотите удалить группу «${group?.name}»?`"
      confirm-text="Удалить навсегда"
      cancel-text="Отмена"
      variant="danger"
      :loading="deletingGroup"
      @confirm="confirmDeleteGroup"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  ArrowLeft,
  Users,
  Gavel,
  ChevronDown,
  Trash2,
  Save,
  CalendarClock,
  AlertTriangle,
  Award,
  Info,
  UserPlus,
  Eye,
  Settings,
  Crown,
} from "lucide-vue-next";
import AttestationSelectInstructorsModal from "~/components/attestation/SelectInstructorsModal.vue";
import AttestationSelectCommissionModal from "~/components/attestation/SelectCommissionModal.vue";

definePageMeta({ layout: "default" });

const route = useRoute();
const { authFetch } = useAuthFetch();
const toast = useToast();

const groupId = route.params.id as string;

const loading = ref(true);
const group = ref<any>(null);
const instructors = ref<any[]>([]);
const commission = ref<any[]>([]);
const testTemplates = ref<any[]>([]);
const certificateTemplates = ref<any[]>([]);
const certificateTemplateId = ref("");

const showInstructorsModal = ref(false);
const showCommissionModal = ref(false);
const showDeleteModal = ref(false);

const savingSchedule = ref(false);
const savingCertificateTemplate = ref(false);
const deletingGroup = ref(false);

const schedule = ref({ testTemplateId: "", examStart: "", examEnd: "", location: "" });

const sortedCommission = computed(() => {
  const list = [...commission.value];
  const roleWeight: Record<string, number> = { chairman: 1, responsible: 2, secretary: 3, member: 4 };
  return list.sort((a, b) => (roleWeight[a.role] || 9) - (roleWeight[b.role] || 9));
});

const getInitials = (name: string) => {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
};

const roleLabel = (role: string) =>
  ({ chairman: "Председатель", responsible: "Ответственный", secretary: "Секретарь", member: "Член комиссии" }[role] || "Член комиссии");

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const load = async () => {
  loading.value = true;
  try {
    const [groupRes, templatesRes, certTemplatesRes] = await Promise.all([
      authFetch(`/api/attestation/groups/${groupId}`),
      authFetch("/api/test-bank/templates?limit=100"),
      authFetch("/api/certificates/templates?isActive=true"),
    ]);

    if (groupRes.success) {
      group.value = groupRes.group;
      instructors.value = groupRes.instructors || [];
      commission.value = groupRes.commission || [];
      schedule.value = {
        testTemplateId: group.value.testTemplateId || "",
        examStart: toLocalInput(group.value.examStart),
        examEnd: toLocalInput(group.value.examEnd),
        location: group.value.location || "",
      };
      certificateTemplateId.value = group.value.certificateTemplateId || "";
    } else {
      toast.error(groupRes.message || "Группа не найдена");
    }

    if (templatesRes.success) testTemplates.value = templatesRes.templates || [];
    if (certTemplatesRes.success) certificateTemplates.value = certTemplatesRes.templates || [];
  } finally {
    loading.value = false;
  }
};

const onInstructorsAdded = (newInstructors: any[]) => {
  instructors.value = newInstructors;
};

const onCommissionSaved = (newCommission: any[]) => {
  commission.value = newCommission;
};

const removeInstructor = async (instructorId: string) => {
  const res = await authFetch(`/api/attestation/groups/${groupId}/instructors/${instructorId}`, { method: "DELETE" });
  if (res.success) {
    instructors.value = instructors.value.filter((i) => i.instructorId !== instructorId);
    toast.success("Инструктор удалён");
  } else {
    toast.error(res.message || "Не удалось убрать инструктора");
  }
};

const saveSchedule = async () => {
  if (!schedule.value.testTemplateId || !schedule.value.examStart || !schedule.value.examEnd) {
    toast.error("Заполните тест, начало и окончание экзамена");
    return;
  }
  savingSchedule.value = true;
  try {
    const res = await authFetch(`/api/attestation/groups/${groupId}/schedule`, {
      method: "PUT",
      body: {
        testTemplateId: schedule.value.testTemplateId,
        examStart: new Date(schedule.value.examStart).toISOString(),
        examEnd: new Date(schedule.value.examEnd).toISOString(),
        location: schedule.value.location,
      },
    });
    if (res.success) {
      group.value = res.group;
      toast.success("Расписание сохранено");
    } else {
      toast.error(res.message || "Не удалось сохранить расписание");
    }
  } finally {
    savingSchedule.value = false;
  }
};

const saveCertificateTemplate = async () => {
  savingCertificateTemplate.value = true;
  try {
    const res = await authFetch(`/api/attestation/groups/${groupId}/certificate-template`, {
      method: "PUT",
      body: { certificateTemplateId: certificateTemplateId.value || null },
    });
    if (res.success) {
      group.value = res.group;
      toast.success(certificateTemplateId.value ? "Шаблон сертификата назначен" : "Автовыдача сертификата отключена");
    } else {
      toast.error(res.message || "Не удалось сохранить шаблон сертификата");
    }
  } finally {
    savingCertificateTemplate.value = false;
  }
};

const confirmDeleteGroup = async () => {
  deletingGroup.value = true;
  try {
    const res = await authFetch(`/api/attestation/groups/${groupId}`, { method: "DELETE" });
    if (res.success) {
      toast.success("Группа удалена");
      await navigateTo("/attestation");
    } else {
      toast.error(res.message || "Не удалось удалить группу");
    }
  } finally {
    deletingGroup.value = false;
  }
};

onMounted(load);
</script>
