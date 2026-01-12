<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок и навигация -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-4">
        <NuxtLink
          :to="`/programs/${id}`"
          class="flex items-center gap-2 text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Назад к программе
        </NuxtLink>
      </div>
      <h2 class="text-title-md2 font-bold text-black dark:text-white">
        Редактирование учебной программы
      </h2>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Внесите изменения в информацию о курсе и дисциплинах
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="pageLoading" class="flex justify-center items-center py-20">
      <div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="pageError" class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-8">
      <div class="text-center">
        <div class="mx-auto mb-4 h-16 w-16 rounded-full bg-danger/10 flex items-center justify-center">
          <svg class="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="mb-2 text-xl font-semibold text-black dark:text-white">Ошибка загрузки</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">{{ pageError }}</p>
        <UiButton variant="primary" @click="loadCourse">
          Попробовать снова
        </UiButton>
      </div>
    </div>

    <!-- Форма редактирования курса -->
    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Основная информация -->
      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <h3 class="text-lg font-semibold text-black dark:text-white mb-4">
          Основная информация
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Название курса -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Название курса <span class="text-danger">*</span>
            </label>
            <input
              v-model="formData.name"
              type="text"
              placeholder="Например: Основы программирования на Python"
              class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              :class="{ 'border-danger': errors.name }"
              required
            />
            <p v-if="errors.name" class="mt-1 text-sm text-danger">{{ errors.name }}</p>
          </div>

          <!-- Короткое название -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Короткое название <span class="text-danger">*</span>
            </label>
            <input
              v-model="formData.shortName"
              type="text"
              placeholder="PYTHON"
              maxlength="10"
              class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary uppercase"
              :class="{ 'border-danger': errors.shortName }"
              required
              @input="formData.shortName = formData.shortName.toUpperCase()"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">4-10 заглавных букв</p>
            <p v-if="errors.shortName" class="mt-1 text-sm text-danger">{{ errors.shortName }}</p>
          </div>

          <!-- Код курса -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Код курса <span class="text-danger">*</span>
            </label>
            <input
              v-model="formData.code"
              type="text"
              placeholder="2400001"
              class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              :class="{ 'border-danger': errors.code }"
              required
            />
            <p v-if="errors.code" class="mt-1 text-sm text-danger">{{ errors.code }}</p>
          </div>

          <!-- Шаблон сертификата -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Шаблон сертификата
            </label>
            <select
              v-model="formData.certificateTemplateId"
              class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            >
              <option :value="undefined">Не выбран</option>
              <option v-for="template in certificateTemplates" :key="template.id" :value="template.id">
                {{ template.name }}
              </option>
            </select>
          </div>

          <!-- Срок действия сертификата -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Срок действия сертификата
            </label>
            <div class="flex items-center gap-3">
              <input
                v-model.number="formData.certificateValidityMonths"
                type="number"
                min="1"
                max="120"
                placeholder="Не ограничен"
                class="w-40 rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              />
              <span class="text-sm text-gray-500 dark:text-gray-400">месяцев</span>
            </div>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Оставьте пустым для бессрочных сертификатов
            </p>
          </div>

          <!-- Статус -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Статус
            </label>
            <div class="flex items-center gap-3">
              <label class="inline-flex items-center cursor-pointer">
                <input
                  v-model="formData.isActive"
                  type="checkbox"
                  class="sr-only peer"
                />
                <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                  {{ formData.isActive ? 'Активен' : 'Неактивен' }}
                </span>
              </label>
            </div>
          </div>

          <!-- Описание -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Описание
            </label>
            <textarea
              v-model="formData.description"
              rows="4"
              placeholder="Краткое описание курса..."
              class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Дисциплины -->
      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-black dark:text-white">
              Дисциплины курса
            </h3>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Всего часов: {{ totalHours }}
            </p>
          </div>
          <UiButton
            type="button"
            @click="addDiscipline"
            class="flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Добавить дисциплину
          </UiButton>
        </div>

        <div v-if="formData.disciplines.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg class="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p>Дисциплины не добавлены</p>
          <p class="text-sm mt-1">Нажмите "Добавить дисциплину" чтобы начать</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="(discipline, index) in formData.disciplines"
            :key="discipline.id || `new-${index}`"
            class="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary/50 transition-colors"
          >
            <div class="flex items-center gap-3 flex-1">
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                {{ index + 1 }}
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h4 class="font-medium text-gray-900 dark:text-white">{{ discipline.name }}</h4>
                  <span v-if="discipline.id" class="text-xs text-gray-400">(существующая)</span>
                  <span v-else class="text-xs text-success">(новая)</span>
                </div>
                <div class="flex items-center gap-3 mt-1">
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    Теория: {{ discipline.theoryHours }}ч | Практика: {{ discipline.practiceHours }}ч | Проверка: {{ discipline.assessmentHours }}ч
                  </span>
                  <span class="text-xs font-semibold text-primary">
                    Всего: {{ getDisciplineTotal(discipline) }}ч
                  </span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="editDiscipline(index)"
                class="p-2 text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors"
                title="Редактировать"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                type="button"
                @click="removeDiscipline(index)"
                class="p-2 text-danger hover:text-danger/80 transition-colors"
                title="Удалить"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Кнопки действий -->
      <div class="flex items-center justify-end gap-4">
        <NuxtLink :to="`/programs/${id}`">
          <UiButton variant="danger">
            Отмена
          </UiButton>
        </NuxtLink>
        <UiButton
          type="submit"
          variant="success"
          :loading="loading"
        >
          Сохранить изменения
        </UiButton>
      </div>
    </form>

    <!-- Discipline Form Modal -->
    <ProgramsCreateDisciplineModal
      :is-open="isDisciplineModalOpen"
      :discipline="editingDiscipline"
      :instructor-options="instructorOptions"
      @close="closeDisciplineModal"
      @save="handleDisciplineSave"
    />
  </div>
</template>

<script setup lang="ts">
import type { Course, Discipline, CreateDisciplineData } from '~/types/course';

// Определяем мета-данные страницы
definePageMeta({
  layout: 'default',
});

useHead({
  title: 'Редактирование программы - АТЦ Платформа',
});

const route = useRoute();
const router = useRouter();
const id = route.params.id as string;

// Используем authFetch для авторизованных запросов
const { authFetch } = useAuthFetch();
const { success: showSuccess, error: showError } = useNotification();

// Интерфейс для дисциплины в форме редактирования
interface EditableDiscipline extends CreateDisciplineData {
  id?: string;
}

// Состояние
const pageLoading = ref(true);
const pageError = ref<string | null>(null);
const loading = ref(false);
const certificateTemplates = ref<any[]>([]);
const instructors = ref<any[]>([]);
const isDisciplineModalOpen = ref(false);
const editingDisciplineIndex = ref<number | null>(null);
const editingDiscipline = ref<CreateDisciplineData | undefined>(undefined);

const formData = ref<{
  name: string;
  shortName: string;
  code: string;
  description?: string;
  certificateTemplateId?: string;
  certificateValidityMonths?: number;
  isActive: boolean;
  disciplines: EditableDiscipline[];
}>({
  name: '',
  shortName: '',
  code: '',
  description: '',
  certificateTemplateId: undefined,
  certificateValidityMonths: undefined,
  isActive: true,
  disciplines: [],
});

const errors = ref<Record<string, string>>({});

// Вычисляемые свойства
const totalHours = computed(() => {
  return formData.value.disciplines.reduce((sum, d) => {
    return sum + (d.theoryHours || 0) + (d.practiceHours || 0) + (d.assessmentHours || 0);
  }, 0);
});

// Функция для подсчета часов отдельной дисциплины
const getDisciplineTotal = (discipline: EditableDiscipline) => {
  return (discipline.theoryHours || 0) + (discipline.practiceHours || 0) + (discipline.assessmentHours || 0);
};

const instructorOptions = computed(() => {
  return instructors.value.map(instructor => ({
    id: instructor.id,
    label: instructor.fullName,
    description: instructor.email,
  }));
});

// Загрузка курса
const loadCourse = async () => {
  pageLoading.value = true;
  pageError.value = null;

  try {
    const response = await authFetch<{ success: boolean; course?: Course; message?: string }>(
      `/api/courses/${id}`,
      { method: 'GET' }
    );

    if (response.success && response.course) {
      const course = response.course;
      
      // Заполняем форму данными курса
      formData.value = {
        name: course.name,
        shortName: course.shortName,
        code: course.code,
        description: course.description || '',
        certificateTemplateId: course.certificateTemplateId,
        certificateValidityMonths: course.certificateValidityMonths || undefined,
        isActive: course.isActive,
        disciplines: (course.disciplines || []).map((d: Discipline, index: number) => ({
          id: d.id,
          name: d.name,
          description: d.description || '',
          theoryHours: d.theoryHours || 0,
          practiceHours: d.practiceHours || 0,
          assessmentHours: d.assessmentHours || 0,
          orderIndex: d.orderIndex ?? index,
          instructorIds: d.instructors?.map(di => di.instructorId) || [],
        })),
      };
    } else {
      pageError.value = response.message || 'Не удалось загрузить данные учебной программы';
    }
  } catch (err: any) {
    console.error('Error loading course:', err);
    pageError.value = err.data?.message || err.message || 'Не удалось загрузить данные учебной программы';
  } finally {
    pageLoading.value = false;
  }
};

// Загрузка шаблонов сертификатов
const loadCertificateTemplates = async () => {
  try {
    const response = await authFetch('/api/courses/templates');
    if (response.success) {
      certificateTemplates.value = response.templates;
    }
  } catch (error) {
    console.error('Ошибка загрузки шаблонов сертификатов:', error);
  }
};

// Загрузка инструкторов
const loadInstructors = async () => {
  try {
    const response = await authFetch('/api/instructors/all');
    if (response.success) {
      instructors.value = response.instructors;
    }
  } catch (error) {
    console.error('Ошибка загрузки инструкторов:', error);
  }
};

// Управление дисциплинами
const addDiscipline = () => {
  editingDisciplineIndex.value = null;
  editingDiscipline.value = undefined;
  isDisciplineModalOpen.value = true;
};

const editDiscipline = (index: number) => {
  const discipline = formData.value.disciplines[index];
  if (!discipline) return;
  
  editingDisciplineIndex.value = index;
  editingDiscipline.value = {
    name: discipline.name,
    description: discipline.description,
    theoryHours: discipline.theoryHours,
    practiceHours: discipline.practiceHours,
    assessmentHours: discipline.assessmentHours,
    orderIndex: discipline.orderIndex,
    instructorIds: discipline.instructorIds || [],
  };
  isDisciplineModalOpen.value = true;
};

const closeDisciplineModal = () => {
  isDisciplineModalOpen.value = false;
  editingDisciplineIndex.value = null;
  editingDiscipline.value = undefined;
};

const handleDisciplineSave = (discipline: CreateDisciplineData) => {
  if (editingDisciplineIndex.value !== null) {
    // Редактирование существующей дисциплины - сохраняем id
    const existingDiscipline = formData.value.disciplines[editingDisciplineIndex.value];
    const existingId = existingDiscipline?.id;
    formData.value.disciplines[editingDisciplineIndex.value] = {
      ...discipline,
      id: existingId,
      orderIndex: editingDisciplineIndex.value,
    };
  } else {
    // Добавление новой дисциплины
    formData.value.disciplines.push({
      ...discipline,
      orderIndex: formData.value.disciplines.length,
    });
  }
  closeDisciplineModal();
};

const removeDiscipline = (index: number) => {
  formData.value.disciplines.splice(index, 1);
  // Обновляем orderIndex
  formData.value.disciplines.forEach((d, i) => {
    d.orderIndex = i;
  });
};

// Валидация
const validateForm = (): boolean => {
  errors.value = {};

  if (!formData.value.name || formData.value.name.trim().length === 0) {
    errors.value.name = 'Название курса обязательно';
  }

  if (!formData.value.shortName || formData.value.shortName.trim().length < 2) {
    errors.value.shortName = 'Короткое название должно быть от 2 до 10 символов';
  }

  if (!formData.value.code || formData.value.code.trim().length === 0) {
    errors.value.code = 'Код курса обязателен';
  }

  return Object.keys(errors.value).length === 0;
};

// Отправка формы
const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  loading.value = true;

  try {
    // Подготавливаем данные для отправки
    const updateData = {
      name: formData.value.name,
      shortName: formData.value.shortName,
      code: formData.value.code,
      description: formData.value.description || null,
      certificateTemplateId: formData.value.certificateTemplateId || null,
      certificateValidityMonths: formData.value.certificateValidityMonths || null,
      isActive: formData.value.isActive,
      disciplines: formData.value.disciplines.map((d, index) => ({
        id: d.id,
        name: d.name,
        description: d.description || null,
        theoryHours: d.theoryHours,
        practiceHours: d.practiceHours,
        assessmentHours: d.assessmentHours,
        orderIndex: index,
        instructorIds: d.instructorIds,
      })),
    };

    const response = await authFetch(`/api/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    if (response.success) {
      showSuccess('Учебная программа успешно обновлена', 'Успех');
      setTimeout(() => {
        router.push(`/programs/${id}`);
      }, 1000);
    } else {
      if (response.field) {
        errors.value[response.field] = response.message;
      }
      showError(response.message || 'Ошибка при обновлении учебной программы', 'Ошибка');
    }
  } catch (error: any) {
    console.error('Ошибка обновления учебной программы:', error);
    showError(error.data?.message || 'Произошла ошибка при обновлении учебной программы', 'Ошибка');
  } finally {
    loading.value = false;
  }
};

// Инициализация
onMounted(async () => {
  await Promise.all([
    loadCourse(),
    loadCertificateTemplates(),
    loadInstructors(),
  ]);
});
</script>
