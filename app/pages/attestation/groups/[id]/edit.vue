<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div
          class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
        ></div>
        <p class="mt-4 text-slate-600 dark:text-slate-400 font-medium">Загрузка...</p>
      </div>
    </div>

    <template v-else-if="group">
      <!-- Header -->
      <div class="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
        <div class="mb-6">
          <NuxtLink
            :to="`/attestation/groups/${groupId}`"
            class="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors"
          >
            <div
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 transition-colors"
            >
              <ArrowLeft class="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </div>
            Назад к группе
          </NuxtLink>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Редактирование группы
            </h1>
            <p class="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">
              {{ group.code }} — {{ group.name }}
            </p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Инструкторы -->
        <div
          class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
        >
          <div class="border-b border-slate-100 dark:border-slate-800 p-6">
            <h3 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users class="w-5 h-5 text-primary" />
              Инструкторы группы
            </h3>
          </div>
          <div class="p-6">
            <div class="flex gap-2 mb-5">
              <div class="relative grow">
                <select
                  v-model="selectedInstructorId"
                  class="w-full rounded-xl border border-slate-200 bg-transparent py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 appearance-none transition-all font-medium"
                >
                  <option value="">Выберите инструктора...</option>
                  <option v-for="ins in availableInstructors" :key="ins.id" :value="ins.id">{{ ins.fullName }}</option>
                </select>
                <ChevronDown class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
              <UiButton size="sm" class="h-[46px] px-4 gap-2 font-bold shrink-0" :disabled="!selectedInstructorId" @click="addInstructor">
                <Plus class="w-4 h-4" /> Добавить
              </UiButton>
            </div>

            <div v-if="instructors.length === 0" class="py-8 text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
              Пока никто не добавлен
            </div>
            <div v-else class="space-y-1">
              <div
                v-for="ins in instructors"
                :key="ins.id"
                class="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div
                    class="h-9 w-9 shrink-0 rounded-full bg-linear-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center font-bold text-xs border border-primary/10"
                  >
                    {{ getInitials(ins.fullName) }}
                  </div>
                  <p class="font-bold text-slate-900 dark:text-white text-sm truncate">{{ ins.fullName }}</p>
                </div>
                <button
                  class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-danger hover:bg-danger/10 transition-all opacity-0 group-hover:opacity-100"
                  @click="removeInstructor(ins.instructorId)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Комиссия -->
        <div
          class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
        >
          <div class="border-b border-slate-100 dark:border-slate-800 p-6 flex items-center justify-between">
            <h3 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Gavel class="w-5 h-5 text-info" />
              Комиссия
            </h3>
            <NuxtLink to="/attestation/commission" class="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              Реестр <ChevronRight class="w-3 h-3" />
            </NuxtLink>
          </div>
          <div class="p-6">
            <div v-if="commissionDraft.length === 0" class="py-8 text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
              Комиссия ещё не сформирована
            </div>
            <div v-else class="space-y-2 mb-5">
              <div
                v-for="row in commissionDraft"
                :key="row.commissionMemberId"
                class="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
              >
                <div
                  class="h-8 w-8 shrink-0 rounded-full bg-linear-to-br from-info/20 to-info/5 text-info flex items-center justify-center font-bold text-[10px] border border-info/10"
                >
                  {{ getInitials(commissionMemberName(row.commissionMemberId)) }}
                </div>
                <span class="flex-1 text-sm font-bold text-slate-900 dark:text-white truncate">{{ commissionMemberName(row.commissionMemberId) }}</span>
                <select
                  v-model="row.role"
                  class="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs font-bold outline-none focus:border-primary"
                >
                  <option value="chairman">Председатель</option>
                  <option value="secretary">Секретарь</option>
                  <option value="member">Член комиссии</option>
                </select>
                <button
                  class="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-danger hover:bg-danger/10 transition-all shrink-0"
                  @click="commissionDraft = commissionDraft.filter((r) => r.commissionMemberId !== row.commissionMemberId)"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div class="flex gap-2 mb-4">
              <div class="relative grow">
                <select
                  v-model="selectedCommissionMemberId"
                  class="w-full rounded-xl border border-slate-200 bg-transparent py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 appearance-none transition-all font-medium text-sm"
                >
                  <option value="">Добавить члена комиссии...</option>
                  <option v-for="m in availableCommissionMembers" :key="m.id" :value="m.id">{{ m.fullName }}</option>
                </select>
                <ChevronDown class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
              <UiButton size="sm" class="h-[46px] px-4 shrink-0" :disabled="!selectedCommissionMemberId" @click="addCommissionDraftMember">
                <Plus class="w-4 h-4" />
              </UiButton>
            </div>

            <UiButton size="sm" class="w-full gap-2 font-bold" :loading="savingCommission" @click="saveCommission">
              <Save class="w-4 h-4" /> Сохранить комиссию
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Расписание -->
      <div
        class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden mb-6"
      >
        <div class="border-b border-slate-100 dark:border-slate-800 p-6">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarClock class="w-5 h-5 text-warning" />
            Расписание экзамена
          </h3>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div class="space-y-2">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Шаблон теста</label>
              <div class="relative">
                <select
                  v-model="schedule.testTemplateId"
                  class="w-full rounded-xl border border-slate-200 bg-transparent py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 appearance-none transition-all font-medium"
                >
                  <option value="">Не выбран</option>
                  <option v-for="t in testTemplates" :key="t.id" :value="t.id">{{ t.name }}</option>
                </select>
                <ChevronDown class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Начало</label>
              <input
                v-model="schedule.examStart"
                type="datetime-local"
                class="w-full rounded-xl border border-slate-200 bg-transparent py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 transition-all font-medium"
              />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Окончание</label>
              <input
                v-model="schedule.examEnd"
                type="datetime-local"
                class="w-full rounded-xl border border-slate-200 bg-transparent py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 transition-all font-medium"
              />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Место проведения</label>
              <input
                v-model="schedule.location"
                type="text"
                placeholder="Аудитория 17"
                class="w-full rounded-xl border border-slate-200 bg-transparent py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 transition-all font-medium"
              />
            </div>
          </div>
          <div class="mt-6 flex justify-end">
            <UiButton class="gap-2 font-bold px-6" :loading="savingSchedule" @click="saveSchedule">
              <Save class="w-4 h-4" /> Сохранить расписание
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Сертификат -->
      <div
        class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden mb-6"
      >
        <div class="border-b border-slate-100 dark:border-slate-800 p-6">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award class="w-5 h-5 text-success" />
            Сертификат
          </h3>
        </div>
        <div class="p-6">
          <div class="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 flex items-start gap-2.5 mb-5">
            <Info class="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p class="text-xs text-blue-800 dark:text-blue-300 font-medium leading-relaxed">
              Если шаблон назначен, сертификат будет выдаваться инструктору автоматически, как только комиссия
              отметит его решение как «Сдал».
            </p>
          </div>
          <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Шаблон сертификата</label>
          <div class="relative mt-2">
            <select
              v-model="certificateTemplateId"
              class="w-full rounded-xl border border-slate-200 bg-transparent py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 appearance-none transition-all font-medium"
            >
              <option value="">Не назначен (сертификаты не выдаются)</option>
              <option v-for="t in certificateTemplates" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
            <ChevronDown class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
          <div class="mt-4 flex justify-end">
            <UiButton class="gap-2 font-bold px-6" :loading="savingCertificateTemplate" @click="saveCertificateTemplate">
              <Save class="w-4 h-4" /> Сохранить
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Опасная зона -->
      <div class="rounded-2xl border border-danger/20 bg-danger/5 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h4 class="font-bold text-danger flex items-center gap-2"><AlertTriangle class="w-4 h-4" /> Удалить группу</h4>
          <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">Действие необратимо — все результаты и связи будут удалены.</p>
        </div>
        <UiButton
          variant="outline"
          size="sm"
          class="h-10 px-4 gap-2 font-bold text-danger border-danger/20 hover:bg-danger/5 hover:border-danger/40 shrink-0"
          @click="deleteGroup"
        >
          <Trash2 class="w-4 h-4" /> Удалить группу
        </UiButton>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import {
  ArrowLeft,
  Users,
  Gavel,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  X,
  Save,
  CalendarClock,
  AlertTriangle,
  Award,
  Info,
} from "lucide-vue-next";

definePageMeta({ layout: "default" });

const route = useRoute();
const { authFetch } = useAuthFetch();
const toast = useToast();

const groupId = route.params.id;

const loading = ref(true);
const group = ref(null);
const instructors = ref([]);
const commission = ref([]);
const commissionDraft = ref([]);
const allInstructors = ref([]);
const commissionMembers = ref([]);
const testTemplates = ref([]);
const certificateTemplates = ref([]);
const certificateTemplateId = ref("");

const selectedInstructorId = ref("");
const selectedCommissionMemberId = ref("");
const savingCommission = ref(false);
const savingSchedule = ref(false);
const savingCertificateTemplate = ref(false);

const schedule = ref({ testTemplateId: "", examStart: "", examEnd: "", location: "" });

const availableInstructors = computed(() =>
  allInstructors.value.filter((i) => !instructors.value.some((g) => g.instructorId === i.id))
);
const availableCommissionMembers = computed(() =>
  commissionMembers.value.filter((m) => !commissionDraft.value.some((r) => r.commissionMemberId === m.id))
);

const getInitials = (name) => {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
};

const commissionMemberName = (id) => commissionMembers.value.find((m) => m.id === id)?.fullName || id;

const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const load = async () => {
  loading.value = true;
  try {
    const [groupRes, instructorsRes, commissionMembersRes, templatesRes, certTemplatesRes] = await Promise.all([
      authFetch(`/api/attestation/groups/${groupId}`),
      authFetch("/api/instructors/all"),
      authFetch("/api/attestation/commission-members"),
      authFetch("/api/test-bank/templates?limit=100"),
      authFetch("/api/certificates/templates?isActive=true"),
    ]);

    if (groupRes.success) {
      group.value = groupRes.group;
      instructors.value = groupRes.instructors || [];
      commission.value = groupRes.commission || [];
      commissionDraft.value = commission.value.map((c) => ({ commissionMemberId: c.commissionMemberId, role: c.role }));
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

    if (instructorsRes.success) allInstructors.value = instructorsRes.instructors || [];
    if (commissionMembersRes.success) commissionMembers.value = commissionMembersRes.members || [];
    if (templatesRes.success) testTemplates.value = templatesRes.templates || [];
    if (certTemplatesRes.success) certificateTemplates.value = certTemplatesRes.templates || [];
  } finally {
    loading.value = false;
  }
};

const addInstructor = async () => {
  if (!selectedInstructorId.value) return;
  const res = await authFetch(`/api/attestation/groups/${groupId}/instructors`, {
    method: "POST",
    body: { instructorIds: [selectedInstructorId.value] },
  });
  if (res.success) {
    instructors.value = res.instructors;
    selectedInstructorId.value = "";
  } else {
    toast.error(res.message || "Не удалось добавить инструктора");
  }
};

const removeInstructor = async (instructorId) => {
  const res = await authFetch(`/api/attestation/groups/${groupId}/instructors/${instructorId}`, { method: "DELETE" });
  if (res.success) {
    instructors.value = instructors.value.filter((i) => i.instructorId !== instructorId);
  } else {
    toast.error(res.message || "Не удалось убрать инструктора");
  }
};

const addCommissionDraftMember = () => {
  if (!selectedCommissionMemberId.value) return;
  commissionDraft.value.push({ commissionMemberId: selectedCommissionMemberId.value, role: "member" });
  selectedCommissionMemberId.value = "";
};

const saveCommission = async () => {
  if (commissionDraft.value.length === 0) {
    toast.error("Добавьте хотя бы одного члена комиссии");
    return;
  }
  savingCommission.value = true;
  try {
    const res = await authFetch(`/api/attestation/groups/${groupId}/commission`, {
      method: "PUT",
      body: { members: commissionDraft.value },
    });
    if (res.success) {
      commission.value = res.commission;
      toast.success("Комиссия сохранена");
    } else {
      toast.error(res.message || "Не удалось сохранить комиссию");
    }
  } finally {
    savingCommission.value = false;
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

const deleteGroup = async () => {
  if (!confirm(`Удалить группу «${group.value.name}»? Это действие необратимо.`)) return;
  const res = await authFetch(`/api/attestation/groups/${groupId}`, { method: "DELETE" });
  if (res.success) {
    toast.success("Группа удалена");
    await navigateTo("/attestation");
  } else {
    toast.error(res.message || "Не удалось удалить группу");
  }
};

onMounted(load);
</script>
