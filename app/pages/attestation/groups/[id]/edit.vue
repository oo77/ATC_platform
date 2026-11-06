<template>
  <!-- Внешний враппер без двойного отступа (отступ задаёт layout) -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Загрузка: компактный спиннер -->
    <div v-if="loading" class="flex min-h-[400px] items-center justify-center">
      <div class="text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
        <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">Загрузка...</p>
      </div>
    </div>

    <template v-else-if="group">
      <!-- Единая шапка: крошки вместо ссылки «Назад к группе»; главное действие — вернуться к просмотру -->
      <UiPageHeader
        title="Настройка группы аттестации"
        :description="`${group.code} — ${group.name}`"
        :breadcrumbs="[
          { label: 'Аттестация', to: '/attestation' },
          { label: group.code, to: `/attestation/groups/${groupId}` },
          { label: 'Настройка' },
        ]"
      >
        <template #actions>
          <UiButton variant="outline" :to="`/attestation/groups/${groupId}`" :start-icon="Eye">К просмотру группы</UiButton>
        </template>
      </UiPageHeader>

      <!-- Два основных блока: инструкторы и комиссия -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <!-- Инструкторы -->
        <div class="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <Users class="h-4 w-4 text-gray-400" />
              Инструкторы ({{ instructors.length }})
            </h3>
            <UiButton variant="outline" size="sm" :start-icon="UserPlus" @click="showInstructorsModal = true">Добавить</UiButton>
          </div>

          <div class="flex-1 p-4">
            <UiEmptyState v-if="instructors.length === 0" title="Инструкторы пока не добавлены" :icon="Users" />
            <div v-else class="max-h-[320px] space-y-1.5 overflow-y-auto pr-1">
              <div
                v-for="ins in instructors"
                :key="ins.id"
                class="group flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-2 transition-colors hover:bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
              >
                <div class="flex min-w-0 items-center gap-2.5">
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-xs font-semibold text-primary">
                    {{ getInitials(ins.fullName) }}
                  </div>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium text-gray-900 dark:text-white">{{ ins.fullName }}</p>
                    <p class="truncate text-xs text-gray-500">{{ ins.positionSnapshot || "Инструктор" }}</p>
                  </div>
                </div>
                <!-- Убрать: видно всегда на touch; теперь с подтверждением через UiConfirmModal (раньше удаляло сразу) -->
                <button
                  type="button"
                  class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-danger/10 hover:text-danger lg:opacity-40 lg:focus-visible:opacity-100 lg:group-hover:opacity-100"
                  title="Убрать из группы"
                  aria-label="Убрать из группы"
                  @click="requestRemoveInstructor(ins)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Комиссия -->
        <div class="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <Gavel class="h-4 w-4 text-gray-400" />
              Комиссия ({{ commission.length }})
            </h3>
            <UiButton variant="outline" size="sm" :start-icon="Settings" @click="showCommissionModal = true">Назначить</UiButton>
          </div>

          <div class="flex-1 p-4">
            <UiEmptyState v-if="commission.length === 0" title="Комиссия ещё не сформирована" :icon="Gavel" />
            <div v-else class="max-h-[320px] space-y-1.5 overflow-y-auto pr-1">
              <div
                v-for="c in sortedCommission"
                :key="c.id"
                class="flex items-center justify-between rounded-lg border p-2 transition-colors"
                :class="[
                  c.role === 'chairman'
                    ? 'border-warning/30 bg-warning/5'
                    : 'border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]',
                ]"
              >
                <div class="flex min-w-0 items-center gap-2.5">
                  <div
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold"
                    :class="[
                      c.role === 'chairman'
                        ? 'border-warning bg-warning text-white'
                        : 'border-primary/20 bg-primary/10 text-primary',
                    ]"
                  >
                    <Crown v-if="c.role === 'chairman'" class="h-4 w-4" />
                    <span v-else>{{ getInitials(c.fullName) }}</span>
                  </div>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium text-gray-900 dark:text-white">{{ c.fullName }}</p>
                    <p class="truncate text-xs text-gray-500">{{ c.position || c.organization || "Член комиссии" }}</p>
                  </div>
                </div>

                <!-- Роль: одно семейство нейтральных/акцентных бейджей, без CAPS и 10px -->
                <span
                  class="shrink-0 rounded-md px-2 py-0.5 text-xs font-medium"
                  :class="[
                    c.role === 'chairman'
                      ? 'bg-warning/15 text-warning'
                      : c.role === 'responsible'
                        ? 'bg-success/10 text-success'
                        : c.role === 'secretary'
                          ? 'bg-info/10 text-info'
                          : 'bg-gray-200/60 text-gray-600 dark:bg-white/[0.08] dark:text-gray-300',
                  ]"
                >
                  {{ roleLabel(c.role) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Расписание, тест и сертификаты -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <!-- Расписание -->
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <CalendarClock class="h-4 w-4 text-gray-400" />
              Расписание и тест
            </h3>
          </div>
          <div class="space-y-3 p-4">
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Шаблон теста</label>
              <div class="relative">
                <select
                  v-model="schedule.testTemplateId"
                  class="h-9 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 pr-9 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Не назначен</option>
                  <option v-for="t in testTemplates" :key="t.id" :value="t.id">{{ t.name }} (порог: {{ t.passingScore ?? 75 }}%)</option>
                </select>
                <ChevronDown class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div class="space-y-1.5">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Начало</label>
                <input
                  v-model="schedule.examStart"
                  type="datetime-local"
                  class="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div class="space-y-1.5">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Окончание</label>
                <input
                  v-model="schedule.examEnd"
                  type="datetime-local"
                  class="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Место проведения</label>
              <input
                v-model="schedule.location"
                type="text"
                placeholder="Аудитория 17"
                class="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <div class="flex justify-end pt-1">
              <UiButton :start-icon="Save" :loading="savingSchedule" @click="saveSchedule">Сохранить расписание</UiButton>
            </div>
          </div>
        </div>

        <!-- Сертификат -->
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <Award class="h-4 w-4 text-gray-400" />
              Шаблон сертификата
            </h3>
          </div>
          <div class="space-y-3 p-4">
            <div class="flex items-start gap-2 rounded-lg bg-info/10 p-3 text-sm text-info">
              <Info class="mt-0.5 h-4 w-4 shrink-0" />
              <p class="leading-relaxed">Сертификат будет выдан автоматически, когда комиссия утвердит решение «Сдал».</p>
            </div>

            <div class="space-y-1.5">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Шаблон</label>
              <div class="relative">
                <select
                  v-model="certificateTemplateId"
                  class="h-9 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 pr-9 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Не назначен (автовыдача отключена)</option>
                  <option v-for="t in certificateTemplates" :key="t.id" :value="t.id">{{ t.name }}</option>
                </select>
                <ChevronDown class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div class="flex justify-end pt-1">
              <UiButton :start-icon="Save" :loading="savingCertificateTemplate" @click="saveCertificateTemplate">Сохранить сертификат</UiButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Опасная зона: отделена визуально, кнопка danger-ghost (вторичная), финальное подтверждение — в модалке -->
      <div class="flex flex-col gap-3 rounded-xl border border-danger/20 bg-danger/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 class="flex items-center gap-2 text-sm font-semibold text-danger">
            <AlertTriangle class="h-4 w-4" /> Удалить группу
          </h4>
          <p class="mt-0.5 text-sm text-gray-600 dark:text-gray-400">Все результаты экзаменов и связи участников будут удалены безвозвратно.</p>
        </div>
        <UiButton variant="danger-ghost" class="shrink-0" :start-icon="Trash2" @click="showDeleteModal = true">Удалить группу</UiButton>
      </div>
    </template>

    <!-- Модалка выбора инструкторов (мультиселект) -->
    <AttestationSelectInstructorsModal
      :is-open="showInstructorsModal"
      :group-id="groupId"
      :already-selected-ids="instructors.map((i) => i.instructorId)"
      @close="showInstructorsModal = false"
      @added="onInstructorsAdded"
    />

    <!-- Модалка выбора членов комиссии (мультиселект) -->
    <AttestationSelectCommissionModal
      :is-open="showCommissionModal"
      :group-id="groupId"
      :current-members="commission.map((c) => ({ commissionMemberId: c.commissionMemberId, role: c.role }))"
      @close="showCommissionModal = false"
      @saved="onCommissionSaved"
    />

    <!-- НОВОЕ: подтверждение удаления инструктора из группы; onConfirm вызывает прежний removeInstructor -->
    <UiConfirmModal
      :is-open="isRemoveInstructorOpen"
      title="Убрать инструктора из группы"
      :message="`Убрать инструктора «${instructorToRemove?.fullName}» из состава группы?`"
      confirm-text="Убрать"
      loading-text="Удаление…"
      :loading="removingInstructor"
      @confirm="confirmRemoveInstructor"
      @cancel="cancelRemoveInstructor"
    />

    <!-- Модалка удаления группы: для необратимого действия требуем ввести код группы -->
    <UiConfirmModal
      :is-open="showDeleteModal"
      title="Удаление группы"
      :message="`Вы уверены, что хотите удалить группу «${group?.name}»?`"
      confirm-text="Удалить навсегда"
      cancel-text="Отмена"
      variant="danger"
      :require-text="group?.code"
      loading-text="Удаление…"
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

// Подтверждение удаления инструктора: раньше removeInstructor вызывался сразу по клику на корзину —
// теперь клик только открывает UiConfirmModal, а сам removeInstructor остаётся onConfirm без изменений.
const isRemoveInstructorOpen = ref(false);
const instructorToRemove = ref<any>(null);
const removingInstructor = ref(false);

const requestRemoveInstructor = (ins: any) => {
  instructorToRemove.value = ins;
  isRemoveInstructorOpen.value = true;
};

const cancelRemoveInstructor = () => {
  // Во время запроса закрывать нельзя, чтобы не потерять состояние
  if (removingInstructor.value) return;
  isRemoveInstructorOpen.value = false;
  instructorToRemove.value = null;
};

const confirmRemoveInstructor = async () => {
  if (!instructorToRemove.value) return;
  removingInstructor.value = true;
  try {
    await removeInstructor(instructorToRemove.value.instructorId);
  } finally {
    removingInstructor.value = false;
    isRemoveInstructorOpen.value = false;
    instructorToRemove.value = null;
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
