<template>
  <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <div class="flex h-6 w-6 items-center justify-center rounded bg-primary/10">
          <svg class="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <span class="text-sm font-medium text-gray-900 dark:text-white">
          Тесты для контроля знаний
        </span>
        <span 
          v-if="tests.length > 0" 
          class="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary/10 text-xs font-medium text-primary"
        >
          {{ tests.length }}
        </span>
      </div>
      <button
        v-if="canManage"
        @click="openAddModal"
        class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Добавить тест
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-4">
      <div class="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="tests.length === 0" class="text-center py-4">
      <div class="mx-auto mb-2 h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Тесты не привязаны к дисциплине
      </p>
      <button
        v-if="canManage"
        @click="openAddModal"
        class="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-600 transition-colors"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Добавить первый тест
      </button>
    </div>

    <!-- Tests List -->
    <div v-else class="space-y-2">
      <div
        v-for="test in tests"
        :key="test.id"
        class="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50 hover:border-primary/30 transition-colors group"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <h5 class="text-sm font-medium text-gray-900 dark:text-white truncate">
              {{ test.template_name }}
            </h5>
            <span 
              v-if="test.is_required" 
              class="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-danger/10 text-danger"
            >
              Обязательный
            </span>
          </div>
          <div class="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span class="inline-flex items-center gap-1" :title="'Код: ' + test.template_code">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {{ test.template_code }}
            </span>
            <span class="inline-flex items-center gap-1" title="Количество вопросов">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ test.questions_count }} вопр.
            </span>
            <span v-if="test.time_limit_minutes" class="inline-flex items-center gap-1" title="Лимит времени">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ test.time_limit_minutes }} мин.
            </span>
            <span class="inline-flex items-center gap-1" title="Проходной балл">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ test.passing_score }}%
            </span>
          </div>
          <p v-if="test.notes" class="mt-1.5 text-xs text-gray-500 dark:text-gray-400 italic">
            {{ test.notes }}
          </p>
        </div>

        <!-- Actions -->
        <div v-if="canManage" class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            @click="openEditModal(test)"
            class="flex h-7 w-7 items-center justify-center rounded text-gray-500 hover:bg-gray-200 hover:text-primary dark:hover:bg-gray-700 transition-colors"
            title="Редактировать"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            @click="confirmRemoveTest(test)"
            class="flex h-7 w-7 items-center justify-center rounded text-gray-500 hover:bg-danger/10 hover:text-danger transition-colors"
            title="Удалить"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <UiModal
      :is-open="isModalOpen"
      :title="editingTest ? 'Редактировать привязку теста' : 'Добавить тест к дисциплине'"
      size="md"
      @close="closeModal"
    >
      <form @submit.prevent="handleSubmit">
        <div class="space-y-4">
          <!-- Template Select -->
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
              Шаблон теста <span class="text-danger">*</span>
            </label>
            <select
              v-model="formData.test_template_id"
              :disabled="!!editingTest"
              class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white disabled:bg-gray-100 disabled:dark:bg-gray-900"
              :class="{ 'border-danger': errors.test_template_id }"
            >
              <option value="">Выберите тест...</option>
              <option
                v-for="template in availableTemplates"
                :key="template.id"
                :value="template.id"
              >
                {{ template.name }} ({{ template.code }})
              </option>
            </select>
            <p v-if="errors.test_template_id" class="mt-1 text-sm text-danger">
              {{ errors.test_template_id }}
            </p>
            <p v-if="editingTest" class="mt-1 text-xs text-gray-500">
              Для изменения шаблона удалите эту привязку и создайте новую
            </p>
          </div>

          <!-- Is Required -->
          <div>
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                v-model="formData.is_required"
                type="checkbox"
                class="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800"
              />
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                Обязательный тест
              </span>
            </label>
            <p class="ml-8 text-xs text-gray-500 dark:text-gray-400">
              Студенты должны будут пройти этот тест для завершения дисциплины
            </p>
          </div>

          <!-- Notes -->
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
              Примечания
            </label>
            <textarea
              v-model="formData.notes"
              rows="2"
              placeholder="Дополнительная информация о тестировании..."
              class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            ></textarea>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <UiButton type="button" variant="outline" @click="closeModal">
            Отмена
          </UiButton>
          <UiButton type="submit" variant="primary" :loading="submitting">
            {{ editingTest ? 'Сохранить' : 'Добавить' }}
          </UiButton>
        </div>
      </form>
    </UiModal>

    <!-- Delete Confirmation Modal -->
    <UiConfirmModal
      :is-open="isDeleteModalOpen"
      title="Удаление теста из дисциплины"
      message="Вы уверены, что хотите отвязать этот тест от дисциплины?"
      :item-name="deletingTest?.template_name"
      warning="Это не удалит сам шаблон теста, только его привязку к дисциплине."
      :loading="deleting"
      @confirm="removeTest"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  disciplineId: {
    type: String,
    required: true,
  },
  canManage: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['updated']);

const { authFetch } = useAuthFetch();
const { success: showSuccess, error: showError } = useNotification();

// State
const tests = ref([]);
const loading = ref(true);
const isModalOpen = ref(false);
const editingTest = ref(null);
const submitting = ref(false);
const isDeleteModalOpen = ref(false);
const deletingTest = ref(null);
const deleting = ref(false);

// Templates for select
const allTemplates = ref([]);
const loadingTemplates = ref(false);

// Form data
const formData = ref({
  test_template_id: '',
  is_required: false,
  notes: '',
});

const errors = ref({});

// Computed: available templates (excluding already added)
const availableTemplates = computed(() => {
  const addedIds = new Set(tests.value.map((t) => t.test_template_id));
  return allTemplates.value.filter(
    (t) => !addedIds.has(t.id) || t.id === editingTest.value?.test_template_id
  );
});

// Load tests
const loadTests = async () => {
  loading.value = true;
  try {
    const response = await authFetch(`/api/discipline-tests?discipline_id=${props.disciplineId}`);
    if (response.success) {
      tests.value = response.tests || [];
    } else {
      tests.value = [];
    }
  } catch (err) {
    console.error('Error loading discipline tests:', err);
    tests.value = [];
  } finally {
    loading.value = false;
  }
};

// Load all active templates
const loadTemplates = async () => {
  loadingTemplates.value = true;
  try {
    const response = await authFetch('/api/test-bank/templates/select');
    if (response.success) {
      allTemplates.value = response.templates || [];
    }
  } catch (err) {
    console.error('Error loading templates:', err);
  } finally {
    loadingTemplates.value = false;
  }
};

// Open add modal
const openAddModal = async () => {
  editingTest.value = null;
  formData.value = {
    test_template_id: '',
    is_required: false,
    notes: '',
  };
  errors.value = {};
  await loadTemplates();
  isModalOpen.value = true;
};

// Open edit modal
const openEditModal = async (test) => {
  editingTest.value = test;
  formData.value = {
    test_template_id: test.test_template_id,
    is_required: test.is_required,
    notes: test.notes || '',
  };
  errors.value = {};
  await loadTemplates();
  isModalOpen.value = true;
};

// Close modal
const closeModal = () => {
  if (!submitting.value) {
    isModalOpen.value = false;
    editingTest.value = null;
  }
};

// Validate form
const validateForm = () => {
  const newErrors = {};

  if (!formData.value.test_template_id) {
    newErrors.test_template_id = 'Выберите шаблон теста';
  }

  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
};

// Handle submit
const handleSubmit = async () => {
  // Защита от двойного вызова при быстром клике
  if (submitting.value) return;
  
  if (!validateForm()) return;

  submitting.value = true;
  try {
    if (editingTest.value) {
      // Update existing
      const response = await authFetch(`/api/discipline-tests/${editingTest.value.id}`, {
        method: 'PUT',
        body: {
          is_required: formData.value.is_required,
          notes: formData.value.notes,
        },
      });

      if (response.success) {
        showSuccess('Привязка теста обновлена', 'Успех');
        await loadTests();
        emit('updated');
        closeModal();
      } else {
        showError(response.message || 'Ошибка сохранения', 'Ошибка');
      }
    } else {
      // Create new
      const response = await authFetch('/api/discipline-tests', {
        method: 'POST',
        body: {
          discipline_id: props.disciplineId,
          test_template_id: formData.value.test_template_id,
          is_required: formData.value.is_required,
          notes: formData.value.notes,
        },
      });

      if (response.success) {
        showSuccess('Тест привязан к дисциплине', 'Успех');
        await loadTests();
        emit('updated');
        closeModal();
      } else {
        showError(response.message || 'Ошибка привязки теста', 'Ошибка');
      }
    }
  } catch (err) {
    console.error('Error saving discipline test:', err);
    showError(err.data?.message || 'Ошибка сохранения', 'Ошибка');
  } finally {
    submitting.value = false;
  }
};

// Confirm remove test
const confirmRemoveTest = (test) => {
  deletingTest.value = test;
  isDeleteModalOpen.value = true;
};

// Close delete modal
const closeDeleteModal = () => {
  if (!deleting.value) {
    isDeleteModalOpen.value = false;
    deletingTest.value = null;
  }
};

// Remove test
const removeTest = async () => {
  if (!deletingTest.value) return;

  deleting.value = true;
  try {
    const response = await authFetch(`/api/discipline-tests/${deletingTest.value.id}`, {
      method: 'DELETE',
    });

    if (response.success) {
      showSuccess('Тест отвязан от дисциплины', 'Успех');
      await loadTests();
      emit('updated');
    } else {
      showError(response.message || 'Ошибка удаления', 'Ошибка');
    }
  } catch (err) {
    console.error('Error removing discipline test:', err);
    showError(err.data?.message || 'Ошибка удаления', 'Ошибка');
  } finally {
    deleting.value = false;
    closeDeleteModal();
  }
};

// Load on mount
onMounted(() => {
  loadTests();
});

// Watch discipline ID changes
watch(
  () => props.disciplineId,
  () => {
    loadTests();
  }
);
</script>
