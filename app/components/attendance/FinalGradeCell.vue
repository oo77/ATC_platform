<template>
  <div class="inline-block">
    <button
      class="px-3 py-1 rounded text-sm font-medium transition-all"
      :class="buttonClass"
      @click="showModal = true"
      :title="tooltip"
    >
      {{ displayText }}
    </button>
    
    <!-- Модальное окно итоговой оценки -->
    <UiModal :is-open="showModal" title="Итоговая оценка" @close="showModal = false">
      <div class="space-y-4">
        <!-- Предупреждение о посещаемости -->
        <div 
          v-if="attendancePercent < 75"
          class="p-3 rounded-lg bg-warning/10 border border-warning/30"
        >
          <div class="flex items-start gap-2">
            <svg class="w-5 h-5 text-warning shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p class="text-sm font-medium text-warning">Низкая посещаемость</p>
              <p class="text-xs text-warning/80 mt-1">
                Посещаемость {{ attendancePercent.toFixed(1) }}% (минимум 75%)
              </p>
            </div>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Итоговая оценка (0-100)
          </label>
          <input
            v-model.number="gradeInput"
            type="number"
            min="0"
            max="100"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Статус
          </label>
          <select
            v-model="statusInput"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="in_progress">В процессе</option>
            <option value="passed">Сдано</option>
            <option value="failed">Не сдано</option>
            <option value="not_allowed">Не допущен</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Примечание (необязательно)
          </label>
          <textarea
            v-model="notesInput"
            rows="2"
            placeholder="Дополнительные комментарии"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          ></textarea>
        </div>
        
        <div class="flex justify-end gap-3 pt-4">
          <UiButton variant="outline" @click="showModal = false">
            Отмена
          </UiButton>
          <UiButton :loading="saving" @click="save">
            Сохранить
          </UiButton>
        </div>
      </div>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
type FinalGradeStatus = 'in_progress' | 'passed' | 'failed' | 'not_allowed';

interface FinalGrade {
  id: string;
  finalGrade?: number;
  attendancePercent?: number;
  status: FinalGradeStatus;
  notes?: string;
}

const props = defineProps<{
  finalGrade?: FinalGrade;
  studentId: string;
  groupId: string;
  disciplineId: string;
  attendancePercent: number;
}>();

const emit = defineEmits<{
  update: [];
}>();

const { authFetch } = useAuthFetch();
const toast = useNotification();

// State
const showModal = ref(false);
const saving = ref(false);
const gradeInput = ref<number | undefined>(undefined);
const statusInput = ref<FinalGradeStatus>('in_progress');
const notesInput = ref('');

// Computed
const displayText = computed(() => {
  if (!props.finalGrade) return '—';
  
  const fg = props.finalGrade;
  if (fg.finalGrade !== undefined) {
    return fg.finalGrade.toString();
  }
  
  // Показываем статус если нет оценки
  const statusLabels: Record<FinalGradeStatus, string> = {
    in_progress: '...',
    passed: '✓',
    failed: '✗',
    not_allowed: 'Н/Д',
  };
  
  return statusLabels[fg.status];
});

const buttonClass = computed(() => {
  if (!props.finalGrade) {
    return 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600';
  }
  
  const fg = props.finalGrade;
  
  switch (fg.status) {
    case 'passed':
      return 'bg-success/20 text-success hover:bg-success/30';
    case 'failed':
      return 'bg-danger/20 text-danger hover:bg-danger/30';
    case 'not_allowed':
      return 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500';
    default:
      if (fg.finalGrade !== undefined) {
        if (fg.finalGrade >= 60) return 'bg-success/20 text-success hover:bg-success/30';
        return 'bg-warning/20 text-warning hover:bg-warning/30';
      }
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50';
  }
});

const tooltip = computed(() => {
  if (!props.finalGrade) return 'Выставить итоговую оценку';
  
  const fg = props.finalGrade;
  const statusLabels: Record<FinalGradeStatus, string> = {
    in_progress: 'В процессе',
    passed: 'Сдано',
    failed: 'Не сдано',
    not_allowed: 'Не допущен',
  };
  
  let text = `Статус: ${statusLabels[fg.status]}`;
  if (fg.finalGrade !== undefined) {
    text = `Оценка: ${fg.finalGrade}\n${text}`;
  }
  if (fg.notes) {
    text += `\n${fg.notes}`;
  }
  
  return text;
});

// Watch for modal open to set initial values
watch(showModal, (isOpen) => {
  if (isOpen) {
    gradeInput.value = props.finalGrade?.finalGrade;
    statusInput.value = props.finalGrade?.status || 'in_progress';
    notesInput.value = props.finalGrade?.notes || '';
    
    // Авто-установка статуса "не допущен" при низкой посещаемости
    if (props.attendancePercent < 75 && !props.finalGrade) {
      statusInput.value = 'not_allowed';
    }
  }
});

// Methods
const save = async () => {
  if (gradeInput.value !== undefined && (gradeInput.value < 0 || gradeInput.value > 100)) {
    toast.error('Оценка должна быть от 0 до 100');
    return;
  }
  
  saving.value = true;
  try {
    const response = await authFetch<{ success: boolean; message?: string }>('/api/final-grades', {
      method: 'POST',
      body: {
        studentId: props.studentId,
        groupId: props.groupId,
        disciplineId: props.disciplineId,
        finalGrade: gradeInput.value,
        status: statusInput.value,
        notes: notesInput.value || undefined,
      },
    });
    
    if (response.success) {
      toast.success('Итоговая оценка сохранена');
      showModal.value = false;
      emit('update');
    } else {
      toast.error(response.message || 'Ошибка сохранения');
    }
  } catch (error: any) {
    toast.error(error.message || 'Ошибка сохранения');
  } finally {
    saving.value = false;
  }
};
</script>
