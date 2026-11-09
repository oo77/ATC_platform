<template>
  <!-- Внешний враппер без двойного отступа: отступы задаёт layout -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Загрузка -->
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div
          class="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
        ></div>
        <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Загрузка сертификатов...
        </p>
      </div>
    </div>

    <!-- Контент -->
    <template v-else-if="group">
      <!-- Шапка: UiPageHeader с хлебными крошками вместо большой ссылки «Назад» и CAPS-заголовка; код группы и курс — в мета-строке -->
      <UiPageHeader
        title="Выдача сертификатов"
        :breadcrumbs="[
          { label: 'Группы', to: '/groups' },
          { label: group.code, to: `/groups/${groupId}` },
          { label: 'Сертификаты' },
        ]"
      >
        <template #meta>
          <span class="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{{ group.code }}</span>
          <span>{{ group.course?.name }}</span>
        </template>
      </UiPageHeader>

      <!-- Настройки выдачи: одна компактная карточка с контролами h-9 вместо россыпи разнокалиберных блоков -->
      <div class="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]">
        <!-- Информация о шаблоне -->
        <div
          v-if="template"
          class="flex h-9 items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 text-sm font-medium text-primary"
        >
          <FileIcon class="w-4 h-4" />
          <span>{{ template.name }}</span>
        </div>

        <!-- Предупреждение если нет шаблона -->
        <div
          v-else
          class="flex h-9 items-center gap-2 rounded-lg border border-warning/20 bg-warning/10 px-3 text-sm font-medium text-warning"
        >
          <AlertTriangle class="w-4 h-4" />
          <span>Шаблон не назначен для курса</span>
          <NuxtLink
            :to="`/programs/edit/${group.course?.id}`"
            class="ml-1 text-xs underline hover:no-underline"
          >
            Настроить
          </NuxtLink>
        </div>

        <!-- Выбор инструктора -->
        <div v-if="instructors.length > 0" class="relative flex items-center">
          <UserIcon class="pointer-events-none absolute left-3 z-10 h-4 w-4 text-gray-400" />
          <select
            v-model="selectedInstructorId"
            class="h-9 cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white pl-9 pr-8 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            <option :value="null">Инструктор (не указан)</option>
            <option
              v-for="instructor in instructors"
              :key="instructor.id"
              :value="instructor.id"
            >
              {{ instructor.fullName }}
              <template v-if="instructor.isPrimary"> (основной)</template>
            </option>
          </select>
          <ChevronDown class="pointer-events-none absolute right-3 h-4 w-4 text-gray-400" />
        </div>

        <!-- Дата выдачи -->
        <input
          v-model="issueDate"
          type="date"
          title="Дата выдачи"
          class="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />

        <!-- Расширенные функции: дополнительные даты для шаблона -->
        <label
          class="flex h-9 cursor-pointer select-none items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 dark:border-gray-700 dark:bg-gray-900"
        >
          <input
            v-model="extendedFeatures"
            type="checkbox"
            class="h-4 w-4 rounded border-gray-300 bg-white text-primary focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">Расширенные функции</span>
        </label>
        <template v-if="extendedFeatures">
          <label
            class="flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white pl-3 pr-1 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 dark:border-gray-700 dark:bg-gray-900"
          >
            <span class="text-xs text-gray-500 dark:text-gray-400">Дата теоретического обучения</span>
            <input
              v-model="theoryDate"
              type="date"
              class="border-0 bg-transparent px-2 text-sm text-gray-800 focus:outline-none focus:ring-0 dark:text-gray-100"
            />
          </label>
          <label
            class="flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white pl-3 pr-1 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 dark:border-gray-700 dark:bg-gray-900"
          >
            <span class="text-xs text-gray-500 dark:text-gray-400">Дата проведения практического занятия</span>
            <input
              v-model="practiceDate"
              type="date"
              class="border-0 bg-transparent px-2 text-sm text-gray-800 focus:outline-none focus:ring-0 dark:text-gray-100"
            />
          </label>
        </template>

        <!-- Срок действия: один блок вместо двух дублей с v-if/v-else -->
        <div class="ml-auto flex h-9 items-center gap-2 rounded-lg bg-gray-100 px-3 text-sm text-gray-600 dark:bg-white/[0.06] dark:text-gray-300">
          <Clock class="h-4 w-4 text-gray-500" />
          <span v-if="group.course?.certificateValidityMonths">Срок: {{ group.course.certificateValidityMonths }} мес.</span>
          <span v-else>Бессрочный</span>
        </div>
      </div>

      <!-- Метрики одной строкой: 5 плоских UiStat вместо крупных bento-карточек -->
      <div class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <UiStat label="Слушателей" :value="stats.totalStudents" :icon="Users" />
        <UiStat label="Допущены" :value="stats.eligible" :icon="CheckCircle" tone="success" />
        <UiStat label="С предупреждениями" :value="stats.withWarnings" :icon="AlertTriangle" tone="warning" />
        <UiStat label="Выдано" :value="stats.issued" :icon="Award" tone="primary" />
        <UiStat label="Отозвано" :value="stats.revoked" :icon="XCircle" tone="danger" />
      </div>

      <!-- Панель действий: одна строка из 4 кнопок; главное действие — «Выдать всем допущенным», остальное вторично -->
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex flex-wrap items-center gap-2">
          <!-- Выдать всем допущенным (primary) -->
          <UiButton
            @click="openBulkIssueModal('eligible')"
            :disabled="
              eligibleWithoutCertificate === 0 ||
              isIssuing ||
              certIssueStore.isIssuing.value
            "
            variant="primary"
            :start-icon="Award"
          >
            Выдать всем допущенным ({{ eligibleWithoutCertificate }})
          </UiButton>

          <!-- Выдать выбранным -->
          <UiButton
            @click="openBulkIssueModal('selected')"
            :disabled="
              selectedStudentIds.length === 0 ||
              isIssuing ||
              certIssueStore.isIssuing.value
            "
            variant="outline"
            :start-icon="CheckCircle2"
          >
            Выдать выбранным ({{ selectedStudentIds.length }})
          </UiButton>

          <!-- Скачать все выданные сертификаты группы одним архивом -->
          <UiButton
            @click="downloadAllCertificates"
            :disabled="issuedCertificateIds.length === 0 || downloadingArchive"
            variant="outline"
            :loading="downloadingArchive"
            :start-icon="Download"
          >
            Скачать все ({{ issuedCertificateIds.length }})
          </UiButton>

          <!-- Перерисовать выданные PDF по текущей версии их шаблонов (номер и дата не меняются) -->
          <UiButton
            @click="regenerateAllCertificates"
            :disabled="issuedCertificateIds.length === 0 || regenerating || certIssueStore.isIssuing.value"
            variant="outline"
            :loading="regenerating"
            :start-icon="RefreshCw"
            title="Перерисовать PDF выданных сертификатов по текущей версии их шаблонов. Номер, дата выдачи и срок не меняются."
          >
            <template v-if="regenerating">
              Обновление {{ regenerateProgress }}/{{ issuedCertificateIds.length }}
            </template>
            <template v-else>
              Обновить по шаблонам ({{ issuedCertificateIds.length }})
            </template>
          </UiButton>

          <!-- Ведомость: UiDropdown вместо самописного меню (клик-вне, Esc, клавиатура); пункты блокируются, пока нет данных или идёт генерация -->
          <UiDropdown
            :label="generatingPdf ? 'Генерация...' : 'Ведомость'"
            variant="outline"
            :trigger-icon="FileIcon"
            :groups="reportMenuGroups"
            @select="downloadReport($event as 'pdf' | 'docx')"
          />
        </div>

        <!-- Индикатор активной фоновой выдачи -->
        <div
          v-if="
            certIssueStore.isIssuing.value &&
            certIssueStore.currentJob.value?.groupId === groupId
          "
          class="flex w-full items-center gap-3 rounded-lg border border-success/20 bg-success/5 px-3 py-2 sm:w-auto dark:bg-success/10"
        >
          <Loader2 class="h-5 w-5 animate-spin text-success" />
          <div class="min-w-[200px] flex-1">
            <div class="mb-1 flex items-center justify-between gap-4">
              <span class="text-sm font-medium text-success">Выдача сертификатов</span>
              <span class="text-xs font-medium text-success"
                >{{ certIssueStore.processedCount.value }}/{{
                  certIssueStore.totalCount.value
                }}</span
              >
            </div>
            <div class="h-1.5 w-full overflow-hidden rounded-full bg-success/20">
              <div
                class="h-full rounded-full bg-success transition-all duration-300"
                :style="{ width: `${certIssueStore.percentage.value}%` }"
              ></div>
            </div>
            <p class="mt-1 max-w-[200px] truncate text-xs text-success opacity-80">
              {{ certIssueStore.currentStudentName.value || "Обработка..." }}
            </p>
          </div>
        </div>
      </div>

      <!-- Таблица журнала: карточка единого стиля, sticky-шапка, без анимаций появления -->
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="custom-scrollbar max-h-[calc(100vh-20rem)] min-h-[240px] overflow-auto">
          <table class="w-full border-collapse text-left">
            <thead class="sticky top-0 z-10 bg-white dark:bg-gray-900">
              <tr class="border-b border-gray-200 dark:border-gray-800">
                <th class="w-12 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    :indeterminate="isPartialSelected"
                    @change="toggleSelectAll"
                    class="h-4 w-4 rounded border-gray-300 bg-white text-primary focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800"
                  />
                </th>
                <th class="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Слушатель</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Посещаемость</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Дисциплин</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Ср. балл</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Допуск</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Сертификат</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Действия</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr
                v-for="row in journal"
                :key="row.student.id"
                class="group transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]"
              >
                <!-- Чекбокс -->
                <td class="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    :checked="selectedStudentIds.includes(row.student.id)"
                    :disabled="row.certificate?.status === 'issued'"
                    @change="toggleStudent(row.student.id)"
                    class="h-4 w-4 rounded border-gray-300 bg-white text-primary focus:ring-primary/20 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800"
                  />
                </td>

                <!-- Слушатель -->
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-primary/10 text-sm font-semibold text-primary"
                    >
                      {{ getInitials(row.student.fullName) }}
                    </div>
                    <div class="min-w-0">
                      <p class="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {{ row.student.fullName }}
                      </p>
                      <p class="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                        {{ row.student.organization }}
                      </p>
                    </div>
                  </div>
                </td>

                <!-- Посещаемость -->
                <td class="px-4 py-3 text-center">
                  <span
                    class="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset"
                    :class="
                      row.totalAttendancePercent >= 75
                        ? 'bg-success/10 text-success ring-success/20'
                        : row.totalAttendancePercent >= 50
                          ? 'bg-warning/10 text-warning ring-warning/20'
                          : 'bg-danger/10 text-danger ring-danger/20'
                    "
                  >
                    {{ row.totalAttendancePercent.toFixed(0) }}%
                  </span>
                </td>

                <!-- Дисциплин пройдено -->
                <td class="px-4 py-3 text-center">
                  <span
                    class="inline-flex items-center justify-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium tabular-nums text-gray-700 dark:bg-white/[0.06] dark:text-gray-300"
                  >
                    {{ row.eligibility.completedDisciplines }} /
                    {{ row.eligibility.totalDisciplines }}
                  </span>
                </td>

                <!-- Средний балл -->
                <td class="px-4 py-3 text-center">
                  <span
                    v-if="row.averageGrade !== null"
                    class="text-sm font-semibold tabular-nums text-gray-900 dark:text-white"
                  >
                    {{ row.averageGrade.toFixed(1) }}
                  </span>
                  <span v-else class="text-gray-400">—</span>
                </td>

                <!-- Допуск -->
                <td class="px-4 py-3">
                  <div class="flex items-center justify-center">
                    <div
                      v-if="row.eligibility.isEligible"
                      class="flex items-center gap-1.5 font-medium text-success"
                    >
                      <CheckCircle class="w-4 h-4" />
                      <span class="text-xs">Допущен</span>
                    </div>
                    <button
                      v-else
                      @click="showWarnings(row)"
                      class="flex items-center gap-1.5 rounded-lg px-2 py-1 font-medium text-warning transition-colors hover:bg-warning/10 hover:text-warning/80"
                    >
                      <AlertTriangle class="w-4 h-4" />
                      <span class="text-xs">{{ row.eligibility.warnings.length }} замеч.</span>
                    </button>
                  </div>
                </td>

                <!-- Статус сертификата: без CAPS, шрифт 12px -->
                <td class="px-4 py-3 text-center">
                  <span
                    v-if="row.certificate"
                    class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
                    :class="[
                      row.certificate.status === 'issued'
                        ? 'bg-success/10 text-success border-success/20'
                        : row.certificate.status === 'revoked'
                          ? 'bg-danger/10 text-danger border-danger/20'
                          : 'border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-white/[0.06] dark:text-gray-400',
                    ]"
                  >
                    {{ certificateStatusLabels[row.certificate.status] }}
                  </span>
                  <span v-else class="text-xs text-gray-400">Не выдан</span>
                </td>

                <!-- Действия: ровно одна иконка в строке (скачать ИЛИ выдать), всегда видна, в т.ч. на touch -->
                <td class="px-4 py-3">
                  <div class="flex items-center justify-center gap-2">
                    <!-- Скачать (показываем для выданных сертификатов) -->
                    <a
                      v-if="row.certificate?.status === 'issued'"
                      :href="`/api/certificates/download/${row.certificate.id}`"
                      target="_blank"
                      class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-primary transition-colors hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                      title="Скачать сертификат"
                      aria-label="Скачать сертификат"
                    >
                      <Download class="h-4 w-4" />
                    </a>

                    <!-- Выдать -->
                    <button
                      v-if="
                        !row.certificate || row.certificate.status !== 'issued'
                      "
                      @click="issueSingle(row)"
                      :disabled="
                        isIssuing || issuingStudentId === row.student.id
                      "
                      class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Выдать сертификат"
                      aria-label="Выдать сертификат"
                    >
                      <!-- Спиннер при выдаче этому студенту -->
                      <Loader2 v-if="issuingStudentId === row.student.id" class="h-4 w-4 animate-spin" />
                      <CheckCircle2 v-else class="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Модалка выбора шаблона (для одиночной выдачи) -->
    <CertificatesTemplateSelectModal
      :is-open="templateSelectModalOpen"
      :student="templateSelectRow?.student ?? null"
      :standard-template="template"
      @close="templateSelectModalOpen = false"
      @confirm="handleTemplateSelected"
    />

    <!-- Модалка предупреждений -->
    <CertificatesWarningsModal
      :is-open="warningsModalOpen"
      :student="selectedStudent"
      :warnings="selectedWarnings"
      @close="warningsModalOpen = false"
      @confirm="handleIssueWithWarnings"
    />

    <!-- Модалка результатов (для одиночной выдачи) -->
    <CertificatesResultsModal
      :is-open="resultsModalOpen"
      :results="issueResults"
      @close="resultsModalOpen = false"
    />

    <!-- Модалка массовой выдачи с прогресс-баром -->
    <CertificatesBulkIssueModal
      ref="bulkIssueModalRef"
      :is-open="bulkIssueModalOpen"
      :students-count="bulkIssueStudentIds.length"
      :standard-template="template"
      @close="bulkIssueModalOpen = false"
      @confirm="executeBulkIssue"
      @complete="handleBulkIssueComplete"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  Award,
  XCircle,
  Download,
  FileText,
  FileIcon,
  User as UserIcon,
  ChevronDown,
  CheckCircle2,
  XCircle as XCircleIcon,
  Loader2,
  Play,
  RefreshCw,
} from "lucide-vue-next";
import type {
  CertificateTemplate,
  CertificateJournalRow,
  IssueWarning,
  CertificateJournalResponse,
  IssueCertificatesResponse,
} from "~/types/certificate";

definePageMeta({
  layout: "default",
});

const route = useRoute();
const { authFetch } = useAuthFetch();
const { success: showSuccess, error: showError } = useNotification();
const certIssueStore = useCertificateIssueStore();

// Route params
const groupId = computed(() => route.params.id as string);

// State
const loading = ref(true);
const group = ref<CertificateJournalResponse["group"] | null>(null);
const journal = ref<CertificateJournalRow[]>([]);
const stats = ref({
  totalStudents: 0,
  eligible: 0,
  withWarnings: 0,
  issued: 0,
  revoked: 0,
});

// Template (теперь берётся из курса)
const template = ref<CertificateTemplate | null>(null);

// Issue settings
const issueDate = ref(new Date().toISOString().split("T")[0]); // Сегодняшняя дата

// Расширенные функции: необязательные даты для переменных шаблона
const extendedFeatures = ref(false);
const theoryDate = ref("");
const practiceDate = ref("");
// Без галочки даты не отправляем — в сертификате будет пустая строка
const extendedDates = computed(() => ({
  theoryDate: extendedFeatures.value ? theoryDate.value || null : null,
  practiceDate: extendedFeatures.value ? practiceDate.value || null : null,
}));

// Инструкторы для выбора
interface InstructorOption {
  id: string;
  fullName: string;
  position: string | null;
  isPrimary: boolean;
}
const instructors = ref<InstructorOption[]>([]);
const selectedInstructorId = ref<string | null>(null);
const loadingInstructors = ref(false);

// Selection
const selectedStudentIds = ref<string[]>([]);

// Issue state
const isIssuing = ref(false);
const issuingStudentId = ref<string | null>(null);
const issueResults = ref<IssueCertificatesResponse["results"]>([]);
const resultsModalOpen = ref(false);
const generatingPdf = ref(false); // Состояние генерации ведомости
const showReportDropdown = ref(false); // Состояние выпадающего меню формата
const downloadingArchive = ref(false); // Состояние скачивания архива сертификатов

// Bulk issue modal
const bulkIssueModalOpen = ref(false);
const bulkIssueModalRef = ref<any>(null);
const bulkIssueStudentIds = ref<string[]>([]);
const bulkIssueMode = ref<"eligible" | "selected">("eligible");

// Выбор шаблона при одиночной выдаче
type IssueTemplate = Pick<CertificateTemplate, "id" | "name">;
const templateSelectModalOpen = ref(false);
const templateSelectRow = ref<CertificateJournalRow | null>(null);
const pendingIssueTemplateId = ref<string | null>(null);

// Warnings modal
const warningsModalOpen = ref(false);
const selectedStudent = ref<CertificateJournalRow["student"] | null>(null);
const selectedWarnings = ref<IssueWarning[]>([]);
const pendingIssueStudentId = ref<string | null>(null);

// Labels
const certificateStatusLabels: Record<string, string> = {
  draft: "Черновик",
  issued: "Выдан",
  revoked: "Отозван",
};

// Computed
const isAllSelected = computed(() => {
  const available = journal.value.filter(
    (r) => r.certificate?.status !== "issued",
  );
  return (
    available.length > 0 &&
    available.every((r) => selectedStudentIds.value.includes(r.student.id))
  );
});

const isPartialSelected = computed(() => {
  if (isAllSelected.value) return false;
  return selectedStudentIds.value.length > 0;
});

// Идентификаторы выданных сертификатов группы (для архива)
const issuedCertificateIds = computed(() =>
  journal.value.flatMap((r) =>
    r.certificate?.status === "issued" ? [r.certificate.id] : [],
  ),
);

// Количество допущенных без сертификата
const eligibleWithoutCertificate = computed(() => {
  return journal.value.filter(
    (r) => r.eligibility.isEligible && r.certificate?.status !== "issued",
  ).length;
});

// Title
useHead(() => ({
  title: group.value
    ? `Выдача сертификатов — ${group.value.code}`
    : "Загрузка...",
}));

// Load data
const loadData = async () => {
  loading.value = true;
  try {
    const journalRes = await authFetch<CertificateJournalResponse>(
      `/api/certificates/issue/${groupId.value}`,
    );

    if (journalRes.success) {
      group.value = journalRes.group;
      journal.value = journalRes.journal;
      stats.value = journalRes.stats;
      template.value = journalRes.template;
    }

    // Загружаем инструкторов для выбора
    loadingInstructors.value = true;
    try {
      const instructorsRes = await authFetch<{
        success: boolean;
        instructors: InstructorOption[];
        defaultInstructorId: string | null;
      }>(`/api/certificates/issue/${groupId.value}/instructors`);

      if (instructorsRes.success) {
        instructors.value = instructorsRes.instructors;
        // Устанавливаем дефолтного инструктора
        if (instructorsRes.defaultInstructorId && !selectedInstructorId.value) {
          selectedInstructorId.value = instructorsRes.defaultInstructorId;
        }
      }
    } catch (instrError: any) {
      console.error("Error loading instructors:", instrError);
      // Не показываем ошибку - инструкторы не обязательны
    } finally {
      loadingInstructors.value = false;
    }
  } catch (e: any) {
    console.error("Error loading data:", e);
    showError(e.message || "Ошибка загрузки данных");
  } finally {
    loading.value = false;
  }
};

// Helpers
const getInitials = (name: string): string => {
  if (!name) return "?";
  const parts = name.split(" ");
  return parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
};

// Selection handlers
const toggleSelectAll = () => {
  const available = journal.value.filter(
    (r) => r.certificate?.status !== "issued",
  );
  if (isAllSelected.value) {
    selectedStudentIds.value = [];
  } else {
    selectedStudentIds.value = available.map((r) => r.student.id);
  }
};

const toggleStudent = (studentId: string) => {
  const idx = selectedStudentIds.value.indexOf(studentId);
  if (idx === -1) {
    selectedStudentIds.value.push(studentId);
  } else {
    selectedStudentIds.value.splice(idx, 1);
  }
};

// Show warnings
const showWarnings = (row: CertificateJournalRow) => {
  selectedStudent.value = row.student;
  selectedWarnings.value = row.eligibility.warnings;
  pendingIssueStudentId.value = null;
  warningsModalOpen.value = true;
};

// Issue single: сначала спрашиваем, по какому шаблону выдать
const issueSingle = (row: CertificateJournalRow) => {
  if (isIssuing.value || issuingStudentId.value) return;

  templateSelectRow.value = row;
  templateSelectModalOpen.value = true;
};

// Шаблон выбран — выдаём (или сначала показываем предупреждения)
const handleTemplateSelected = (selected: IssueTemplate) => {
  const row = templateSelectRow.value;
  templateSelectModalOpen.value = false;
  if (!row || isIssuing.value || issuingStudentId.value) return;

  if (!row.eligibility.isEligible) {
    selectedStudent.value = row.student;
    selectedWarnings.value = row.eligibility.warnings;
    pendingIssueStudentId.value = row.student.id;
    pendingIssueTemplateId.value = selected.id;
    warningsModalOpen.value = true;
    return;
  }

  issuingStudentId.value = row.student.id;
  issueToStudents([row.student.id], false, selected.id);
};

// Issue with warnings
const handleIssueWithWarnings = () => {
  if (isIssuing.value || issuingStudentId.value) return;

  if (pendingIssueStudentId.value && pendingIssueTemplateId.value) {
    issuingStudentId.value = pendingIssueStudentId.value;
    issueToStudents(
      [pendingIssueStudentId.value],
      true,
      pendingIssueTemplateId.value,
    );
  }
  warningsModalOpen.value = false;
};

// Открыть модалку массовой выдачи
const openBulkIssueModal = (mode: "eligible" | "selected") => {
  // Защита от открытия во время обработки
  if (isIssuing.value || certIssueStore.isIssuing.value) {
    console.warn("[Certificates] Выдача уже выполняется");
    return;
  }

  bulkIssueMode.value = mode;

  if (mode === "eligible") {
    // Все допущенные без сертификата
    bulkIssueStudentIds.value = journal.value
      .filter(
        (r) => r.eligibility.isEligible && r.certificate?.status !== "issued",
      )
      .map((r) => r.student.id);
  } else {
    // Выбранные
    bulkIssueStudentIds.value = [...selectedStudentIds.value];
  }

  if (bulkIssueStudentIds.value.length === 0) {
    showError("Нет студентов для выдачи сертификатов");
    return;
  }

  bulkIssueModalOpen.value = true;
};

// Выполнить массовую выдачу с прогрессом (теперь использует глобальный store)
const executeBulkIssue = async (selected: IssueTemplate) => {
  // Защита от двойного вызова
  if (isIssuing.value || certIssueStore.isIssuing.value) {
    console.warn("[Certificates] executeBulkIssue уже выполняется, пропускаем");
    return;
  }

  if (!group.value) return;

  // Получаем данные студентов для отображения имён
  const studentRows = journal.value.filter((r) =>
    bulkIssueStudentIds.value.includes(r.student.id),
  );

  // Формируем job для глобального store
  const job: Parameters<typeof certIssueStore.startBulkIssue>[0] = {
    groupId: groupId.value,
    groupCode: group.value.code,
    courseName: group.value.course?.name || "",
    templateId: selected.id,
    templateName: selected.name,
    issueDate: issueDate.value ?? new Date().toISOString().split("T")[0]!,
    instructorId: selectedInstructorId.value,
    ...extendedDates.value,
    studentIds: bulkIssueStudentIds.value,
    studentData: studentRows.map((r) => ({
      id: r.student.id,
      fullName: r.student.fullName,
      isEligible: r.eligibility.isEligible,
    })),
    expiryMode: group.value.course?.certificateValidityMonths
      ? ("auto" as const)
      : ("none" as const),
  };

  // Закрываем модалку и запускаем выдачу в store
  bulkIssueModalOpen.value = false;
  selectedStudentIds.value = [];

  // Запускаем выдачу через глобальный store (продолжится даже при переходе на другую страницу)
  console.log(
    `[Certificates] Запускаем фоновую выдачу через store: ${job.studentIds.length} студентов`,
  );
  certIssueStore.startBulkIssue(job);
};

// Обработка завершения массовой выдачи (для обратной совместимости с модалкой)
const handleBulkIssueComplete = async (
  _results: IssueCertificatesResponse["results"],
) => {
  // Clear selection
  selectedStudentIds.value = [];

  // Reload data
  await loadData();
};

// Отслеживаем завершение выдачи из store для обновления данных
watch(
  () => certIssueStore.isCompleted.value,
  async (isCompleted) => {
    // Если выдача завершена и это была выдача для текущей группы
    if (
      isCompleted &&
      certIssueStore.currentJob.value?.groupId === groupId.value
    ) {
      console.log("[Certificates] Выдача завершена, обновляем данные");
      await loadData();
    }
  },
);

// Issue to students (для одиночной выдачи)
const issueToStudents = async (
  studentIds: string[],
  overrideWarnings: boolean,
  templateId: string,
) => {
  isIssuing.value = true;
  try {
    const response = await authFetch<IssueCertificatesResponse>(
      `/api/certificates/issue/${groupId.value}`,
      {
        method: "POST",
        body: {
          templateId,
          studentIds,
          issueDate: issueDate.value,
          instructorId: selectedInstructorId.value,
          ...extendedDates.value,
          expiryMode: group.value?.course?.certificateValidityMonths
            ? "auto"
            : "none",
          overrideWarnings,
        },
      },
    );

    if (response.success) {
      issueResults.value = response.results;
      resultsModalOpen.value = true;

      // Reload data
      await loadData();

      showSuccess(response.message);
    }
  } catch (e: any) {
    console.error("Issue error:", e);
    showError(e.data?.message || e.message || "Ошибка выдачи сертификатов");
  } finally {
    isIssuing.value = false;
    issuingStudentId.value = null;
  }
};

// Пункты меню «Ведомость» для UiDropdown: те же обработчики downloadReport, блокировка — пока нет данных или идёт генерация
const reportMenuGroups = computed(() => [
  {
    items: [
      { key: "pdf", label: "Скачать PDF", icon: FileText, disabled: generatingPdf.value || journal.value.length === 0, loading: generatingPdf.value },
      { key: "docx", label: "Скачать Word", icon: FileIcon, disabled: generatingPdf.value || journal.value.length === 0 },
    ],
  },
]);

// Функция переключения выпадающего меню формата ведомости
const toggleReportDropdown = () => {
  showReportDropdown.value = !showReportDropdown.value;
};

// Download certificate report
const downloadReport = async (format: "pdf" | "docx" = "pdf") => {
  if (generatingPdf.value) return;

  // Закрываем выпадающее меню
  showReportDropdown.value = false;

  generatingPdf.value = true;
  try {
    // Получаем данные для ведомости
    const reportData = await authFetch<{
      success: boolean;
      groupCode: string;
      courseName: string;
      instructors: string[];
      students: any[];
      startDate?: string;
      endDate?: string;
      generatedBy: string;
    }>(`/api/certificates/report/${groupId.value}`);

    if (!reportData.success) {
      throw new Error("Не удалось получить данные для ведомости");
    }

    // Генерируем документ в выбранном формате
    if (format === "pdf") {
      const { generateCertificateReport } =
        await import("~/utils/pdf/generateCertificateReport");
      await generateCertificateReport({
        groupCode: reportData.groupCode,
        courseName: reportData.courseName,
        instructors: reportData.instructors,
        students: reportData.students,
        startDate: reportData.startDate,
        endDate: reportData.endDate,
        generatedBy: reportData.generatedBy,
      });
    } else {
      const { generateCertificateReportDocx } =
        await import("~/utils/docx/generateCertificateReport");
      await generateCertificateReportDocx({
        groupCode: reportData.groupCode,
        courseName: reportData.courseName,
        instructors: reportData.instructors,
        students: reportData.students,
        startDate: reportData.startDate,
        endDate: reportData.endDate,
        generatedBy: reportData.generatedBy,
      });
    }

    // Логируем скачивание
    try {
      await authFetch("/api/reports/log-download", {
        method: "POST",
        body: {
          reportType: "certificate_report",
          format,
          groupCode: reportData.groupCode,
          groupId: groupId.value,
        },
      });
    } catch (logError) {
      console.error("Failed to log download:", logError);
    }

    showSuccess(`Ведомость успешно сформирована (${format.toUpperCase()})`);
  } catch (error: any) {
    console.error("Error generating certificate report:", error);
    showError(error.message || "Ошибка при формировании ведомости");
  } finally {
    generatingPdf.value = false;
  }
};

// Скачивание всех выданных сертификатов группы одним ZIP-архивом
// (server/api/certificates/archive.post.ts, не больше 200 за раз)
const downloadAllCertificates = async () => {
  if (downloadingArchive.value || issuedCertificateIds.value.length === 0) return;

  downloadingArchive.value = true;
  try {
    const blob = await authFetch<Blob>("/api/certificates/archive", {
      method: "POST",
      body: {
        certificateIds: issuedCertificateIds.value,
        byOrganization: true,
      },
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Sertifikaty_${group.value?.code || groupId.value}.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    console.error("Error downloading certificates archive:", error);
    showError(
      error?.data?.message || error.message || "Ошибка при формировании архива",
    );
  } finally {
    downloadingArchive.value = false;
  }
};

// Перегенерация PDF всех выданных сертификатов группы по текущей версии их
// шаблонов (шаблон каждого сертификата — тот, что выбрали при выдаче).
// По одному запросу на сертификат, чтобы не упереться в таймаут
const regenerating = ref(false);
const regenerateProgress = ref(0);

const regenerateAllCertificates = async () => {
  const ids = [...issuedCertificateIds.value];
  if (regenerating.value || ids.length === 0) return;

  const ok = window.confirm(
    `Перерисовать ${ids.length} выданных сертификатов по текущей версии их шаблонов?\n\n` +
      "Номера, даты выдачи и сроки действия не изменятся, PDF-файлы будут заменены. " +
      "Данные слушателей (ФИО, организация) возьмутся актуальные.",
  );
  if (!ok) return;

  regenerating.value = true;
  regenerateProgress.value = 0;
  const failed: string[] = [];

  try {
    for (const id of ids) {
      try {
        await authFetch(`/api/certificates/${id}/regenerate`, {
          method: "POST",
          // Заменяет инструктора в снимке сертификата (в т.ч. у старых, где он не сохранён)
          body: { instructorId: selectedInstructorId.value },
        });
      } catch (error: any) {
        const row = journal.value.find((r) => r.certificate?.id === id);
        failed.push(
          `${row?.student.fullName || id}: ${error?.data?.message || error.message || "ошибка"}`,
        );
      }
      regenerateProgress.value++;
    }

    if (failed.length === 0) {
      showSuccess(`Обновлено сертификатов: ${ids.length}`);
    } else {
      console.error("[Regenerate] Ошибки:", failed);
      showError(
        `Обновлено ${ids.length - failed.length} из ${ids.length}. Ошибки: ${failed.slice(0, 3).join("; ")}${failed.length > 3 ? "…" : ""}`,
      );
    }
    await loadData();
  } finally {
    regenerating.value = false;
  }
};

// Load on mount
onMounted(() => {
  loadData();
});
</script>
