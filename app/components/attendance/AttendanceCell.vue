<template>
  <div class="inline-block">
    <!-- Скрытая ячейка (студент не участвует в пересдаче) -->
    <div
      v-if="cell.isHidden"
      class="w-10 h-8 flex items-center justify-center text-gray-300 dark:text-gray-600"
      title="Не участвует в этом занятии"
    >
      —
    </div>

    <!-- Ячейка для занятия с оценкой (assessment) -->
    <div v-else-if="column.hasGrade" class="flex flex-col items-center gap-1">
      <!-- Посещаемость -->
      <button
        class="w-10 h-6 rounded text-xs font-medium transition-all"
        :class="[attendanceButtonClass, { 'opacity-70 cursor-not-allowed': readOnly }]"
        :disabled="readOnly"
        @click="openAttendanceModal"
        :title="readOnly ? 'Редактирование недоступно (Архив или нет прав)' : attendanceTooltip"
      >
        {{ attendanceDisplay }}
      </button>

      <!-- Оценка -->
      <button
        class="w-10 h-6 rounded text-xs font-medium transition-all relative"
        :class="[
          gradeButtonClass,
          {
            'line-through opacity-70': isRetakeTarget && replacementGrade !== null,
             'opacity-70 cursor-not-allowed': readOnly
          },
        ]"
        :disabled="readOnly"
        @click="openGradeModal"
        :title="readOnly ? 'Редактирование недоступно (Архив или нет прав)' : gradeTooltip"
      >
        {{ gradeDisplay }}

        <!-- Индикатор пересданной оценки (красная точка) -->
        <span
          v-if="isRetakeTarget && replacementGrade !== null"
          class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500"
          title="Есть пересдача"
        ></span>

        <!-- Индикатор автоматической оценки -->
        <span
          v-else-if="
            props.cell.grade?.isFromTest && !props.cell.grade?.isModified
          "
          class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500"
          title="Автоматическая оценка из теста"
        ></span>
        <!-- Индикатор изменённой оценки -->
        <span
          v-else-if="props.cell.grade?.isModified"
          class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-purple-500"
          title="Оценка была изменена"
        ></span>
      </button>

      <!-- Баллы, на которые сдан тест (под оценкой по пятибалльной шкале) -->
      <span
        v-if="testPointsDisplay"
        class="text-[10px] leading-none font-medium tabular-nums"
        :class="gradeTextClass"
        :title="testPointsTooltip"
      >
        {{ testPointsDisplay }}
      </span>
    </div>

    <!-- Ячейка только для посещаемости -->
    <button
      v-else
      class="w-10 h-8 rounded text-xs font-medium transition-all"
      :class="[attendanceButtonClass, { 'opacity-70 cursor-not-allowed': readOnly }]"
      :disabled="readOnly"
      @click="openAttendanceModal"
      :title="readOnly ? 'Редактирование недоступно (Архив или нет прав)' : attendanceTooltip"
    >
      {{ attendanceDisplay }}
    </button>

    <!-- Модальное окно посещаемости -->
    <UiModal
      :is-open="showAttendanceModal"
      title="Отметка посещаемости"
      @close="showAttendanceModal = false"
    >
      <div class="space-y-4">
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Посещённые академические часы (из {{ maxHours }})
          </label>
          <div class="flex items-center gap-2">
            <input
              v-model.number="attendanceInput"
              type="number"
              step="0.5"
              min="0"
              :max="maxHours"
              class="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <span class="text-gray-500">а-ч</span>
          </div>
          <!-- Быстрые кнопки -->
          <div class="flex gap-2 mt-3">
            <button
              v-for="option in quickOptions"
              :key="option"
              class="px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors"
              :class="
                attendanceInput === option
                  ? 'bg-primary text-white border-primary'
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
              "
              @click="attendanceInput = option"
            >
              {{ option }}
            </button>
          </div>
        </div>

        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Примечание (необязательно)
          </label>
          <input
            v-model="attendanceNotes"
            type="text"
            placeholder="Причина отсутствия и т.д."
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <UiButton variant="outline" @click="showAttendanceModal = false">
            Отмена
          </UiButton>
          <UiButton :loading="saving" @click="saveAttendance">
            Сохранить
          </UiButton>
        </div>
      </div>
    </UiModal>

    <!-- Модальное окно оценки -->
    <UiModal
      :is-open="showGradeModal"
      title="Выставление оценки"
      @close="showGradeModal = false"
    >
      <div class="space-y-4">
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Оценка (0-100)
          </label>
          <input
            v-model.number="gradeInput"
            type="number"
            min="0"
            max="100"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <!-- Быстрые кнопки оценок -->
          <div class="flex flex-wrap gap-2 mt-3">
            <button
              v-for="grade in [100, 90, 80, 70, 60, 50, 40]"
              :key="grade"
              class="px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors"
              :class="
                gradeInput === grade
                  ? 'bg-primary text-white border-primary'
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
              "
              @click="gradeInput = grade"
            >
              {{ grade }}
            </button>
          </div>
        </div>

        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Комментарий (необязательно)
          </label>
          <input
            v-model="gradeNotes"
            type="text"
            placeholder="Комментарий к оценке"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <!-- Предупреждение об автоматической оценке -->
        <div
          v-if="props.cell.grade?.isFromTest && !props.cell.grade?.isModified"
          class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
        >
          <div class="flex items-start gap-2">
            <svg
              class="w-5 h-5 text-blue-500 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p class="text-sm text-blue-700 dark:text-blue-300">
              Эта оценка была автоматически выставлена на основе результатов
              теста. При изменении будет сохранена исходная оценка.
            </p>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <UiButton variant="outline" @click="showGradeModal = false">
            Отмена
          </UiButton>
          <UiButton :loading="saving" @click="() => saveGrade()">
            Сохранить
          </UiButton>
        </div>
      </div>
    </UiModal>

    <!-- Модальное окно подтверждения изменения автоматической оценки -->
    <UiModal
      :is-open="showConfirmModal"
      title="Изменение автоматической оценки"
      @close="cancelModifyGrade"
    >
      <div class="space-y-4">
        <div class="p-4 bg-warning/10 rounded-lg border border-warning/30">
          <div class="flex items-start gap-3">
            <svg
              class="w-6 h-6 text-warning shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h4 class="font-medium text-warning mb-1">Внимание!</h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Вы собираетесь изменить автоматически выставленную оценку из
                теста.
              </p>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Текущая оценка (из теста)
              </p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ props.cell.grade?.grade }}
              </p>
            </div>
            <svg
              class="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Новая оценка
              </p>
              <p
                class="text-2xl font-bold text-purple-600 dark:text-purple-400"
              >
                {{ pendingConfirmGrade }}
              </p>
            </div>
          </div>
        </div>

        <p class="text-sm text-gray-500 dark:text-gray-400">
          Исходная оценка будет сохранена в истории. Изменённая оценка будет
          отмечена специальным цветом.
        </p>

        <div class="flex justify-end gap-3 pt-4">
          <UiButton variant="outline" @click="cancelModifyGrade">
            Отмена
          </UiButton>
          <UiButton
            variant="warning"
            :loading="saving"
            @click="confirmModifyGrade"
          >
            Подтвердить изменение
          </UiButton>
        </div>
      </div>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
interface JournalCell {
  studentId: string;
  scheduleEventId: string;
  attendance?: {
    id: string;
    hoursAttended: number;
    maxHours: number;
    notes: string | null;
  };
  grade?: {
    id: string;
    grade: number;
    notes: string | null;
    isFromTest?: boolean;
    isModified?: boolean;
    originalGrade?: number | null;
    // Результат теста, из которого взята оценка
    testScorePercent?: number | null;
    testTotalPoints?: number | null;
    testMaxPoints?: number | null;
    fivePointScale?: boolean;
  };
  isHidden?: boolean;
}

interface JournalColumn {
  scheduleEvent: {
    id: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    eventType: "theory" | "practice" | "assessment" | "other";
    academicHours: number;
  };
  hasGrade: boolean;
}

const props = defineProps<{
  cell: JournalCell;
  column: JournalColumn;
  studentId: string;
  isRetakeTarget?: boolean;
  replacementGrade?: number | null;
  readOnly?: boolean;
}>();

const emit = defineEmits<{
  update: [
    data: {
      studentId: string;
      scheduleEventId: string;
      type: "attendance" | "grade";
    }
  ];
  requireApproval: [data: { scheduleEventId: string; message?: string }];
}>();

const { authFetch } = useAuthFetch();
const toast = useNotification();

// State
const showAttendanceModal = ref(false);
const showGradeModal = ref(false);
const showConfirmModal = ref(false);
const saving = ref(false);
const attendanceInput = ref(0);
const attendanceNotes = ref("");
const gradeInput = ref(0);
const gradeNotes = ref("");
const pendingConfirmGrade = ref<number | null>(null);

// Computed
const maxHours = computed(() => props.column.scheduleEvent.academicHours);

const quickOptions = computed(() => {
  const max = maxHours.value;
  const options = [0, max];

  // Добавляем промежуточные значения
  if (max >= 2) {
    options.push(max / 2);
    options.push(max - 0.5);
  }

  return [...new Set(options)].sort((a, b) => a - b);
});

const attendanceDisplay = computed(() => {
  if (!props.cell.attendance) return "—";
  const hours = props.cell.attendance.hoursAttended;
  if (hours === 0) return "0";
  if (hours === maxHours.value) return "✓";
  return hours.toString();
});

const attendanceButtonClass = computed(() => {
  if (!props.cell.attendance) {
    return "bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600";
  }
  const hours = props.cell.attendance.hoursAttended;
  const max = props.cell.attendance.maxHours;
  const percent = (hours / max) * 100;

  if (percent >= 100) return "bg-success/20 text-success hover:bg-success/30";
  if (percent > 0) return "bg-warning/20 text-warning hover:bg-warning/30";
  return "bg-danger/20 text-danger hover:bg-danger/30";
});

const attendanceTooltip = computed(() => {
  if (!props.cell.attendance) return "Отметить посещаемость";
  const a = props.cell.attendance;
  let text = `${a.hoursAttended} из ${a.maxHours} а-ч`;
  if (a.notes) text += `\n${a.notes}`;
  return text;
});

const gradeDisplay = computed(() => {
  if (!props.cell.grade) return "—";
  return props.cell.grade.grade.toString();
});

const gradeButtonClass = computed(() => {
  if (!props.cell.grade) {
    return "bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600";
  }
  const grade = props.cell.grade.grade;
  const isModified = props.cell.grade.isModified;

  // Изменённые оценки отображаются фиолетовым цветом
  if (isModified) {
    return "bg-purple-200 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 hover:bg-purple-300 dark:hover:bg-purple-800/50 ring-1 ring-purple-400";
  }

  // Пятибалльная шкала: 4 и выше — сдано (зелёный), 3 — предупреждение, 2 — красный
  if (props.cell.grade.fivePointScale) {
    if (grade >= 4) return "bg-success/20 text-success hover:bg-success/30";
    if (grade >= 3) return "bg-warning/20 text-warning hover:bg-warning/30";
    return "bg-danger/20 text-danger hover:bg-danger/30";
  }

  if (grade >= 60) return "bg-success/20 text-success hover:bg-success/30";
  if (grade >= 40) return "bg-warning/20 text-warning hover:bg-warning/30";
  return "bg-danger/20 text-danger hover:bg-danger/30";
});

// Цвет текста баллов — как у оценки (для изменённой вручную оценки баллы теста серые)
const gradeTextClass = computed(() => {
  const g = props.cell.grade;
  if (!g || g.isModified) return "text-gray-400";
  if (g.fivePointScale) {
    if (g.grade >= 4) return "text-success";
    if (g.grade >= 3) return "text-warning";
    return "text-danger";
  }
  return "text-gray-500";
});

// Баллы теста («78/100») — только для оценок по пятибалльной шкале из теста
const testPointsDisplay = computed(() => {
  const g = props.cell.grade;
  if (!g?.fivePointScale || !g.isFromTest || g.isModified) return "";
  if (g.testTotalPoints == null || g.testMaxPoints == null) return "";
  return `${g.testTotalPoints}/${g.testMaxPoints}`;
});

const testPointsTooltip = computed(() => {
  const g = props.cell.grade;
  if (!g || !testPointsDisplay.value) return "";
  const percent =
    g.testScorePercent != null ? ` (${Math.round(g.testScorePercent)}%)` : "";
  return `Набрано ${g.testTotalPoints} из ${g.testMaxPoints} баллов${percent}`;
});

const gradeTooltip = computed(() => {
  if (!props.cell.grade) return "Выставить оценку";
  const g = props.cell.grade;
  let text = `Оценка: ${g.grade}`;
  if (testPointsDisplay.value) text += `
${testPointsTooltip.value}`;

  if (
    props.isRetakeTarget &&
    props.replacementGrade !== null &&
    props.replacementGrade !== undefined
  ) {
    text += `\n🔄 Пересдано. Новая оценка: ${props.replacementGrade}`;
  }

  if (g.isFromTest && !g.isModified) {
    text += "\n🤖 Автоматическая оценка из теста";
  }

  if (
    g.isModified &&
    g.originalGrade !== null &&
    g.originalGrade !== undefined
  ) {
    text += `\n✏️ Изменена (из теста: ${g.originalGrade})`;
  }

  if (g.notes) text += `\n${g.notes}`;
  return text;
});

// Methods
const openAttendanceModal = () => {
  attendanceInput.value =
    props.cell.attendance?.hoursAttended ?? maxHours.value;
  attendanceNotes.value = props.cell.attendance?.notes ?? "";
  showAttendanceModal.value = true;
};

const openGradeModal = () => {
  gradeInput.value = props.cell.grade?.grade ?? 0;
  gradeNotes.value = props.cell.grade?.notes ?? "";
  showGradeModal.value = true;
};

const saveAttendance = async () => {
  if (attendanceInput.value < 0 || attendanceInput.value > maxHours.value) {
    toast.error(`Часы должны быть от 0 до ${maxHours.value}`);
    return;
  }

  saving.value = true;
  try {
    const response = await authFetch<{
      success: boolean;
      message?: string;
      requiresApproval?: boolean;
      scheduleEventId?: string;
    }>("/api/attendance", {
      method: "POST",
      body: {
        studentId: props.studentId,
        scheduleEventId: props.column.scheduleEvent.id,
        hoursAttended: attendanceInput.value,
        maxHours: maxHours.value,
        notes: attendanceNotes.value || undefined,
      },
    });

    // Если требуется одобрение администратора
    if (response.requiresApproval) {
      showAttendanceModal.value = false;
      toast.warning(
        response.message ||
          "Срок отметки истёк. Требуется одобрение администратора"
      );
      // Эмитим событие чтобы родитель показал модальное окно запроса
      emit("requireApproval", {
        scheduleEventId: props.column.scheduleEvent.id,
        message: response.message,
      });
      return;
    }

    if (response.success) {
      toast.success("Посещаемость сохранена");
      showAttendanceModal.value = false;
      emit("update", {
        studentId: props.studentId,
        scheduleEventId: props.column.scheduleEvent.id,
        type: "attendance",
      });
    } else {
      toast.error(response.message || "Ошибка сохранения");
    }
  } catch (error: any) {
    // Обработка ошибки 403 с требованием одобрения
    if (error?.statusCode === 403 || error?.status === 403) {
      const message = error.data?.message || error.message || "Доступ запрещён";
      if (
        message.includes("одобрение") ||
        message.includes("Требуется одобрение")
      ) {
        showAttendanceModal.value = false;
        toast.warning(message);
        emit("requireApproval", {
          scheduleEventId: props.column.scheduleEvent.id,
          message,
        });
        return;
      }
    }
    toast.error(error.data?.message || error.message || "Ошибка сохранения");
  } finally {
    saving.value = false;
  }
};

const saveGrade = async (confirmModify = false) => {
  if (gradeInput.value < 0 || gradeInput.value > 100) {
    toast.error("Оценка должна быть от 0 до 100");
    return;
  }

  saving.value = true;
  try {
    const response = await authFetch<{
      success: boolean;
      message?: string;
      requireConfirmation?: boolean;
      originalGrade?: number;
    }>("/api/grades", {
      method: "POST",
      body: {
        studentId: props.studentId,
        scheduleEventId: props.column.scheduleEvent.id,
        grade: gradeInput.value,
        notes: gradeNotes.value || undefined,
        confirmModify,
      },
    });

    // Если требуется подтверждение изменения автоматической оценки
    if (response.requireConfirmation) {
      pendingConfirmGrade.value = gradeInput.value;
      showGradeModal.value = false;
      showConfirmModal.value = true;
      saving.value = false;
      return;
    }

    if (response.success) {
      toast.success("Оценка сохранена");
      showGradeModal.value = false;
      showConfirmModal.value = false;
      emit("update", {
        studentId: props.studentId,
        scheduleEventId: props.column.scheduleEvent.id,
        type: "grade",
      });
    } else {
      toast.error(response.message || "Ошибка сохранения");
    }
  } catch (error: any) {
    toast.error(error.message || "Ошибка сохранения");
  } finally {
    saving.value = false;
  }
};

// Подтверждение изменения автоматической оценки
const confirmModifyGrade = async () => {
  if (pendingConfirmGrade.value !== null) {
    gradeInput.value = pendingConfirmGrade.value;
    await saveGrade(true);
    pendingConfirmGrade.value = null;
  }
};

const cancelModifyGrade = () => {
  showConfirmModal.value = false;
  pendingConfirmGrade.value = null;
};
</script>
