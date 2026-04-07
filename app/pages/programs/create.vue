<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Header Selection -->
    <div class="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
      <div class="mb-6">
        <NuxtLink
          to="/programs"
          class="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors"
        >
          <div
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft
              class="w-4 h-4 transition-transform group-hover:-translate-x-1"
            />
          </div>
          Назад к списку
        </NuxtLink>
      </div>

      <div class="flex flex-col gap-2">
        <h1
          class="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase"
        >
          Создание программы
        </h1>
        <p class="text-slate-500 font-medium">
          Заполните основную информацию и составьте план дисциплин
        </p>
      </div>
    </div>

    <!-- Main Content -->
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <!-- Левая колонка: Основная информация -->
        <div class="xl:col-span-2 space-y-6">
          <div
            class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all"
          >
            <div
              class="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-6 flex items-center gap-3"
            >
              <div
                class="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"
              >
                <LayoutDashboard class="w-5 h-5" />
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">
                Основная информация
              </h3>
            </div>

            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Название курса -->
                <div class="md:col-span-2 space-y-2">
                  <label
                    class="block text-xs font-bold text-slate-400 uppercase tracking-wider"
                  >
                    Название курса <span class="text-danger">*</span>
                  </label>
                  <input
                    v-model="formData.name"
                    type="text"
                    placeholder="Например: Основы программирования на Python"
                    class="w-full rounded-xl border border-slate-200 bg-transparent py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 transition-all font-medium"
                    :class="{
                      'border-danger focus:border-danger focus:ring-danger':
                        errors.name,
                    }"
                    required
                  />
                  <p
                    v-if="errors.name"
                    class="mt-1 text-xs font-bold text-danger"
                  >
                    {{ errors.name }}
                  </p>
                </div>

                <!-- Короткое название -->
                <div class="space-y-2">
                  <label
                    class="block text-xs font-bold text-slate-400 uppercase tracking-wider"
                  >
                    Короткое название <span class="text-danger">*</span>
                  </label>
                  <input
                    v-model="formData.shortName"
                    type="text"
                    placeholder="PYTHON"
                    maxlength="10"
                    class="w-full rounded-xl border border-slate-200 bg-transparent py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 uppercase transition-all font-medium"
                    :class="{
                      'border-danger focus:border-danger focus:ring-danger':
                        errors.shortName,
                    }"
                    required
                    @input="
                      formData.shortName = formData.shortName.toUpperCase()
                    "
                  />
                  <p class="text-[10px] uppercase font-bold text-slate-400">
                    4-10 заглавных букв
                  </p>
                  <p
                    v-if="errors.shortName"
                    class="mt-1 text-xs font-bold text-danger"
                  >
                    {{ errors.shortName }}
                  </p>
                </div>

                <!-- Код курса -->
                <div class="space-y-2">
                  <label
                    class="block text-xs font-bold text-slate-400 uppercase tracking-wider"
                  >
                    Код курса <span class="text-danger">*</span>
                  </label>
                  <input
                    v-model="formData.code"
                    type="text"
                    placeholder="2400001"
                    class="w-full rounded-xl border border-slate-200 bg-transparent py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 transition-all font-mono font-medium"
                    :class="{
                      'border-danger focus:border-danger focus:ring-danger':
                        errors.code,
                    }"
                    required
                  />
                  <p
                    v-if="errors.code"
                    class="mt-1 text-xs font-bold text-danger"
                  >
                    {{ errors.code }}
                  </p>
                </div>

                <!-- Описание -->
                <div class="md:col-span-2 space-y-2">
                  <label
                    class="block text-xs font-bold text-slate-400 uppercase tracking-wider"
                  >
                    Описание
                  </label>
                  <textarea
                    v-model="formData.description"
                    rows="3"
                    placeholder="Краткое описание курса..."
                    class="w-full rounded-xl border border-slate-200 bg-transparent py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 transition-all font-medium custom-scrollbar"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Правая колонка: Настройки Сертификации и Статус -->
        <div class="space-y-6">
          <div
            class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all"
          >
            <div
              class="bg-linear-to-br from-info/10 to-transparent p-6 border-b border-slate-100 dark:border-slate-800"
            >
              <h3
                class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"
              >
                <FileText class="w-5 h-5 text-info" />
                Настройки программы
              </h3>
            </div>

            <div class="p-6 space-y-6">
              <!-- Тип программы -->
              <div class="space-y-1">
                <label
                  class="block text-xs font-bold text-slate-400 uppercase tracking-wider"
                >
                  Тип программы <span class="text-danger">*</span>
                </label>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    v-for="type in courseTypeOptions"
                    :key="type.value"
                    type="button"
                    @click="formData.courseType = type.value"
                    class="relative flex flex-col items-center justify-center gap-1 rounded-xl border-2 px-4 py-2 font-bold transition-all text-center"
                    :class="
                      formData.courseType === type.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-primary/40 dark:text-slate-400'
                    "
                  >
                    <span class="text-xl font-black">{{ type.value }}</span>

                    <div
                      v-if="formData.courseType === type.value"
                      class="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center"
                    >
                      <svg
                        class="w-2.5 h-2.5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>

              <!-- Шаблон сертификата -->
              <div class="space-y-2">
                <label
                  class="block text-xs font-bold text-slate-400 uppercase tracking-wider"
                >
                  Шаблон сертификата
                </label>
                <div class="relative">
                  <select
                    v-model="formData.certificateTemplateId"
                    class="w-full rounded-xl border border-slate-200 bg-transparent py-3 pl-4 pr-10 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 appearance-none font-medium text-sm"
                  >
                    <option :value="undefined">Не выбран</option>
                    <option
                      v-for="template in certificateTemplates"
                      :key="template.id"
                      :value="template.id"
                    >
                      {{ template.name }}
                    </option>
                  </select>
                  <ChevronDown
                    class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

              <!-- Срок действия сертификата -->
              <div class="space-y-2">
                <label
                  class="block text-xs font-bold text-slate-400 uppercase tracking-wider"
                >
                  Срок действия (мес)
                </label>
                <div class="relative">
                  <input
                    v-model.number="formData.certificateValidityMonths"
                    type="number"
                    min="1"
                    max="120"
                    placeholder="Не ограничен"
                    class="w-full rounded-xl border border-slate-200 bg-transparent py-3 pl-10 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 font-medium"
                  />
                  <CalendarDays
                    class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                  />
                </div>
                <p class="text-[10px] uppercase font-bold text-slate-400">
                  Пусто для бессрочного
                </p>
              </div>

              <div class="border-t border-slate-100 dark:border-slate-800 pt-6">
                <!-- Статус -->
                <div class="space-y-3">
                  <label
                    class="block text-xs font-bold text-slate-400 uppercase tracking-wider"
                  >
                    Главный статус
                  </label>
                  <div
                    class="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
                  >
                    <span
                      class="font-bold text-sm"
                      :class="
                        formData.isActive ? 'text-success' : 'text-slate-500'
                      "
                    >
                      {{
                        formData.isActive
                          ? "Программа Активна"
                          : "Программа Неактивна"
                      }}
                    </span>
                    <label
                      class="relative inline-flex items-center cursor-pointer"
                    >
                      <input
                        v-model="formData.isActive"
                        type="checkbox"
                        class="sr-only peer"
                      />
                      <div
                        class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-success peer-checked:border-success"
                      ></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Дисциплины -->
      <div
        class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all"
      >
        <div
          class="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h3
              class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"
            >
              <BookOpen class="w-5 h-5 text-primary" />
              Дисциплины плана
            </h3>
            <p
              class="mt-1 text-xs font-bold text-slate-500 uppercase tracking-widest"
            >
              Всего часов: <span class="text-primary">{{ totalHours }}</span>
            </p>
          </div>
          <UiButton
            type="button"
            variant="outline"
            size="sm"
            @click="addDiscipline"
            class="flex items-center gap-2 font-bold"
          >
            <Plus class="w-4 h-4" />
            Добавить дисциплину
          </UiButton>
        </div>

        <div v-if="formData.disciplines.length === 0" class="p-16 text-center">
          <div
            class="bg-slate-50 dark:bg-slate-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <BookOpen class="w-8 h-8 text-slate-300" />
          </div>
          <p class="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Дисциплины еще не добавлены
          </p>
          <UiButton type="button" variant="primary" @click="addDiscipline">
            Добавить первую дисциплину
          </UiButton>
        </div>

        <div v-else class="p-6 space-y-4">
          <div
            v-for="(discipline, index) in formData.disciplines"
            :key="index"
            class="group flex flex-col sm:flex-row gap-4 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-primary/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all relative"
          >
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold group-hover:bg-primary group-hover:text-white transition-colors"
            >
              {{ index + 1 }}
            </div>

            <div class="flex-1 min-w-0">
              <h4 class="font-bold text-lg text-slate-900 dark:text-white">
                {{ discipline.name }}
              </h4>

              <div
                class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/50 shadow-sm"
              >
                <div>
                  <p
                    class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                  >
                    Теория
                  </p>
                  <p
                    class="text-sm font-bold text-slate-900 dark:text-white mt-0.5"
                  >
                    {{ discipline.theoryHours }} ч
                  </p>
                </div>
                <div>
                  <p
                    class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                  >
                    Практика
                  </p>
                  <p
                    class="text-sm font-bold text-slate-900 dark:text-white mt-0.5"
                  >
                    {{ discipline.practiceHours }} ч
                  </p>
                </div>
                <div>
                  <p
                    class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                  >
                    Проверка
                  </p>
                  <p
                    class="text-sm font-bold text-slate-900 dark:text-white mt-0.5"
                  >
                    {{ discipline.assessmentHours }} ч
                  </p>
                </div>
                <div
                  class="border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 pt-2 sm:pt-0 sm:pl-4"
                >
                  <p
                    class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                  >
                    Всего
                  </p>
                  <p class="text-sm font-black text-primary mt-0.5">
                    {{ getDisciplineTotal(discipline) }} ч
                  </p>
                </div>
              </div>
            </div>

            <div class="flex flex-row sm:flex-col gap-2 shrink-0">
              <UiButton
                type="button"
                variant="outline"
                size="sm"
                class="h-8 w-8 p-0!"
                @click="editDiscipline(index)"
                title="Редактировать"
              >
                <Settings class="w-4 h-4 text-slate-500" />
              </UiButton>
              <UiButton
                type="button"
                variant="outline"
                size="sm"
                class="h-8 w-8 p-0! border-danger/20 hover:bg-danger/5 hover:border-danger/40"
                @click="removeDiscipline(index)"
                title="Удалить"
              >
                <Trash2 class="w-4 h-4 text-danger" />
              </UiButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions Footer -->
      <div
        class="flex items-center justify-end gap-4 border-t border-stroke py-6 dark:border-strokedark"
      >
        <NuxtLink
          to="/programs"
          class="text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white px-4"
        >
          Отмена
        </NuxtLink>
        <UiButton
          type="submit"
          variant="primary"
          :loading="loading"
          class="px-8 shadow-md"
        >
          Создать учебную программу
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
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { definePageMeta, useAuthFetch, useNotification } from "#imports";
import {
  ArrowLeft,
  LayoutDashboard,
  FileText,
  CalendarDays,
  ChevronDown,
  BookOpen,
  Plus,
  Settings,
  Trash2,
} from "lucide-vue-next";
import type {
  CreateCourseData,
  CreateDisciplineData,
  CourseType,
} from "~/types/course";

// Определяем мета-данные страницы
definePageMeta({
  layout: "default",
});

// Используем authFetch для авторизованных запросов
const { authFetch } = useAuthFetch();
const router = useRouter();

// Состояние
const loading = ref(false);
const certificateTemplates = ref<any[]>([]);
const instructors = ref<any[]>([]);
const isDisciplineModalOpen = ref(false);
const editingDisciplineIndex = ref<number | null>(null);
const editingDiscipline = ref<CreateDisciplineData | undefined>(undefined);

const formData = ref<
  CreateCourseData & { disciplines: CreateDisciplineData[] }
>({
  name: "",
  shortName: "",
  code: "",
  description: "",
  courseType: "КПП" as CourseType,
  certificateTemplateId: undefined,
  certificateValidityMonths: undefined,
  isActive: true,
  disciplines: [],
});

const courseTypeOptions: { value: CourseType; label: string }[] = [
  { value: "КПП", label: "Первоначальная подготовка" },
  { value: "КПК", label: "Повышение квалификации" },
];

const errors = ref<Record<string, string>>({});

// Вычисляемые свойства
const totalHours = computed(() => {
  return formData.value.disciplines.reduce((sum, d) => {
    return (
      sum +
      (d.theoryHours || 0) +
      (d.practiceHours || 0) +
      (d.assessmentHours || 0)
    );
  }, 0);
});

// Функция для подсчета часов отдельной дисциплины
const getDisciplineTotal = (discipline: CreateDisciplineData) => {
  return (
    (discipline.theoryHours || 0) +
    (discipline.practiceHours || 0) +
    (discipline.assessmentHours || 0)
  );
};

const instructorOptions = computed(() => {
  return instructors.value.map((instructor) => ({
    id: instructor.id,
    label: instructor.fullName,
    description: instructor.email,
  }));
});

// Уведомления
const { success: showSuccess, error: showError } = useNotification();

// Загрузка данных
const loadCertificateTemplates = async () => {
  try {
    const response = await authFetch<{ success: boolean; templates: any[] }>(
      "/api/courses/templates",
    );
    if (response.success) {
      certificateTemplates.value = response.templates;
    }
  } catch (error) {
    console.error("Ошибка загрузки шаблонов сертификатов:", error);
  }
};

const loadInstructors = async () => {
  try {
    const response = await authFetch<{ success: boolean; instructors: any[] }>(
      "/api/instructors/all",
    );
    if (response.success) {
      instructors.value = response.instructors;
    }
  } catch (error) {
    console.error("Ошибка загрузки инструкторов:", error);
  }
};

// Управление дисциплинами
const addDiscipline = () => {
  editingDisciplineIndex.value = null;
  editingDiscipline.value = undefined;
  isDisciplineModalOpen.value = true;
};

const editDiscipline = (index: number) => {
  editingDisciplineIndex.value = index;
  editingDiscipline.value = { ...formData.value.disciplines[index] } as any;
  isDisciplineModalOpen.value = true;
};

const closeDisciplineModal = () => {
  isDisciplineModalOpen.value = false;
  editingDisciplineIndex.value = null;
  editingDiscipline.value = undefined;
};

const handleDisciplineSave = (discipline: CreateDisciplineData) => {
  if (editingDisciplineIndex.value !== null) {
    // Редактирование существующей дисциплины
    formData.value.disciplines[editingDisciplineIndex.value] = {
      ...discipline,
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
    errors.value.name = "Название курса обязательно";
  }

  if (!formData.value.shortName || formData.value.shortName.trim().length < 2) {
    errors.value.shortName =
      "Короткое название должно быть от 2 до 10 символов";
  }

  if (!formData.value.code || formData.value.code.trim().length === 0) {
    errors.value.code = "Код курса обязателен";
  }

  return Object.keys(errors.value).length === 0;
};

// Отправка формы
const handleSubmit = async () => {
  if (!validateForm()) {
    showError("Пожалуйста, исправьте ошибки в форме", "Ошибка валидации");
    return;
  }

  loading.value = true;

  try {
    const response = await authFetch<{
      success: boolean;
      message?: string;
      field?: string;
    }>("/api/courses", {
      method: "POST",
      body: JSON.stringify(formData.value),
    });

    if (response.success) {
      showSuccess("Учебная программа успешно создана", "Успех");
      setTimeout(() => {
        router.push("/programs");
      }, 1000);
    } else {
      if (response.field) {
        errors.value[response.field] = response.message || "Ошибка";
      }
      showError(
        response.message || "Ошибка при создании учебной программы",
        "Ошибка",
      );
    }
  } catch (error: any) {
    let errorMessage = "Произошла ошибка при создании учебной программы";

    if (error.data?.message) {
      errorMessage = error.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    if (error.data?.field) {
      errors.value[error.data.field] = error.data.message;
      errorMessage = `${error.data.field}: ${error.data.message}`;
    }

    showError(errorMessage, "Ошибка сервера");
  } finally {
    loading.value = false;
  }
};

// Инициализация
onMounted(() => {
  loadCertificateTemplates();
  loadInstructors();
});
</script>
