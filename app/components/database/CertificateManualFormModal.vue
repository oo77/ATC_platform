<template>
  <UiModal 
    :is-open="isOpen" 
    @close="$emit('close')" 
    :title="preselectedStudent ? `Добавить сертификат: ${preselectedStudent.fullName}` : 'Добавить сертификат вручную'"
    size="lg"
  >
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Шаг 1: Выбор слушателя (скрываем если студент уже выбран) -->
      <div v-if="!preselectedStudent" class="border border-stroke dark:border-strokedark rounded-lg overflow-hidden">
        <div class="bg-gray-50 dark:bg-meta-4 px-4 py-3 border-b border-stroke dark:border-strokedark">
          <h4 class="font-semibold text-black dark:text-white flex items-center gap-2">
            <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Слушатель
          </h4>
        </div>
        <div class="p-4 space-y-4">
          <!-- Переключатель: существующий / новый -->
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                v-model="studentMode"
                value="existing"
                class="w-4 h-4 text-primary"
              />
              <span class="text-sm text-black dark:text-white">Выбрать существующего</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                v-model="studentMode"
                value="new"
                class="w-4 h-4 text-primary"
              />
              <span class="text-sm text-black dark:text-white">Создать нового</span>
            </label>
          </div>

          <!-- Выбор существующего слушателя -->
          <div v-if="studentMode === 'existing'" class="space-y-3">
            <div class="relative">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Поиск слушателя <span class="text-danger">*</span>
              </label>
              <input
                v-model="studentSearch"
                type="text"
                placeholder="Введите ФИО или ПИНФЛ..."
                class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                :class="{ 'border-danger': errors.studentId }"
                @input="searchStudents"
              />
              <!-- Результаты поиска -->
              <div 
                v-if="studentSearchResults.length > 0 && !selectedStudent" 
                class="absolute z-50 w-full mt-1 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg shadow-lg max-h-60 overflow-auto"
              >
                <button
                  v-for="student in studentSearchResults"
                  :key="student.id"
                  type="button"
                  @click="selectStudent(student)"
                  class="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-meta-4 border-b border-stroke dark:border-strokedark last:border-0"
                >
                  <p class="font-medium text-black dark:text-white">{{ student.fullName }}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    ПИНФЛ: {{ student.pinfl }} | {{ student.organization }}
                  </p>
                </button>
              </div>
              <!-- Выбранный слушатель -->
              <div v-if="selectedStudent" class="mt-3 p-3 bg-success/10 border border-success/20 rounded-lg">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-medium text-black dark:text-white">{{ selectedStudent.fullName }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      ПИНФЛ: {{ selectedStudent.pinfl }} | {{ selectedStudent.organization }}
                    </p>
                  </div>
                  <button 
                    type="button" 
                    @click="clearStudent" 
                    class="text-danger hover:text-danger/80"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <p v-if="errors.studentId" class="text-sm text-danger">{{ errors.studentId }}</p>
          </div>

          <!-- Создание нового слушателя -->
          <div v-if="studentMode === 'new'" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ФИО <span class="text-danger">*</span>
                </label>
                <input
                  v-model="newStudent.fullName"
                  type="text"
                  placeholder="Иванов Иван Иванович"
                  class="w-full rounded border-[1.5px] border-stroke bg-transparent px-4 py-2.5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  :class="{ 'border-danger': errors['studentData.fullName'] }"
                />
                <p v-if="errors['studentData.fullName']" class="mt-1 text-sm text-danger">
                  {{ errors['studentData.fullName'] }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ПИНФЛ <span class="text-danger">*</span>
                </label>
                <input
                  v-model="newStudent.pinfl"
                  type="text"
                  placeholder="12345678901234"
                  maxlength="14"
                  class="w-full rounded border-[1.5px] border-stroke bg-transparent px-4 py-2.5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary font-mono"
                  :class="{ 'border-danger': errors['studentData.pinfl'] }"
                />
                <p v-if="errors['studentData.pinfl']" class="mt-1 text-sm text-danger">
                  {{ errors['studentData.pinfl'] }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Организация <span class="text-danger">*</span>
                </label>
                <input
                  v-model="newStudent.organization"
                  type="text"
                  placeholder='ООО "Название"'
                  class="w-full rounded border-[1.5px] border-stroke bg-transparent px-4 py-2.5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  :class="{ 'border-danger': errors['studentData.organization'] }"
                />
                <p v-if="errors['studentData.organization']" class="mt-1 text-sm text-danger">
                  {{ errors['studentData.organization'] }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Должность <span class="text-danger">*</span>
                </label>
                <input
                  v-model="newStudent.position"
                  type="text"
                  placeholder="Инженер"
                  class="w-full rounded border-[1.5px] border-stroke bg-transparent px-4 py-2.5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  :class="{ 'border-danger': errors['studentData.position'] }"
                />
                <p v-if="errors['studentData.position']" class="mt-1 text-sm text-danger">
                  {{ errors['studentData.position'] }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Шаг 2: Данные курса -->
      <div class="border border-stroke dark:border-strokedark rounded-lg overflow-hidden">
        <div class="bg-gray-50 dark:bg-meta-4 px-4 py-3 border-b border-stroke dark:border-strokedark">
          <h4 class="font-semibold text-black dark:text-white flex items-center gap-2">
            <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Информация о курсе
          </h4>
        </div>
        <div class="p-4 space-y-4">
          <!-- Переключатель: существующий курс / ручной ввод -->
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                v-model="courseMode"
                value="existing"
                class="w-4 h-4 text-primary"
              />
              <span class="text-sm text-black dark:text-white">Выбрать из списка</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                v-model="courseMode"
                value="manual"
                class="w-4 h-4 text-primary"
              />
              <span class="text-sm text-black dark:text-white">Ввести вручную</span>
            </label>
          </div>

          <!-- Выбор существующего курса -->
          <div v-if="courseMode === 'existing'">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Курс <span class="text-danger">*</span>
            </label>
            <select
              v-model="selectedCourseId"
              @change="onCourseSelected"
              class="w-full rounded border-[1.5px] border-stroke bg-transparent px-4 py-2.5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              :class="{ 'border-danger': errors.courseName }"
            >
              <option value="">Выберите курс...</option>
              <option v-for="course in courses" :key="course.id" :value="course.id">
                {{ course.name }} ({{ course.code || 'без кода' }}, {{ course.hours || '?' }} ч.)
              </option>
            </select>
            <p v-if="errors.courseName" class="mt-1 text-sm text-danger">{{ errors.courseName }}</p>
          </div>

          <!-- Ручной ввод данных курса -->
          <div v-if="courseMode === 'manual'" class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Название курса <span class="text-danger">*</span>
              </label>
              <input
                v-model="formData.courseName"
                type="text"
                placeholder="Курс повышения квалификации"
                class="w-full rounded border-[1.5px] border-stroke bg-transparent px-4 py-2.5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                :class="{ 'border-danger': errors.courseName }"
              />
              <p v-if="errors.courseName" class="mt-1 text-sm text-danger">{{ errors.courseName }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Код курса
              </label>
              <input
                v-model="formData.courseCode"
                type="text"
                placeholder="ATC25"
                class="w-full rounded border-[1.5px] border-stroke bg-transparent px-4 py-2.5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary font-mono"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Количество часов
              </label>
              <input
                v-model.number="formData.courseHours"
                type="number"
                min="1"
                placeholder="72"
                class="w-full rounded border-[1.5px] border-stroke bg-transparent px-4 py-2.5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Шаг 3: Данные сертификата -->
      <div class="border border-stroke dark:border-strokedark rounded-lg overflow-hidden">
        <div class="bg-gray-50 dark:bg-meta-4 px-4 py-3 border-b border-stroke dark:border-strokedark">
          <h4 class="font-semibold text-black dark:text-white flex items-center gap-2">
            <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Данные сертификата
          </h4>
        </div>
        <div class="p-4 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Номер сертификата <span class="text-danger">*</span>
              </label>
              <input
                v-model="formData.certificateNumber"
                type="text"
                placeholder="ATC25-001"
                class="w-full rounded border-[1.5px] border-stroke bg-transparent px-4 py-2.5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary font-mono"
                :class="{ 'border-danger': errors.certificateNumber }"
              />
              <p v-if="errors.certificateNumber" class="mt-1 text-sm text-danger">{{ errors.certificateNumber }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Дата выдачи <span class="text-danger">*</span>
              </label>
              <input
                v-model="formData.issueDate"
                type="date"
                class="w-full rounded border-[1.5px] border-stroke bg-transparent px-4 py-2.5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                :class="{ 'border-danger': errors.issueDate }"
              />
              <p v-if="errors.issueDate" class="mt-1 text-sm text-danger">{{ errors.issueDate }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Срок действия до
              </label>
              <input
                v-model="formData.expiryDate"
                type="date"
                class="w-full rounded border-[1.5px] border-stroke bg-transparent px-4 py-2.5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                :class="{ 'border-danger': errors.expiryDate }"
              />
              <p v-if="errors.expiryDate" class="mt-1 text-sm text-danger">{{ errors.expiryDate }}</p>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Оставьте пустым, если сертификат бессрочный
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Шаг 4: Файл сертификата -->
      <div class="border border-stroke dark:border-strokedark rounded-lg overflow-hidden">
        <div class="bg-gray-50 dark:bg-meta-4 px-4 py-3 border-b border-stroke dark:border-strokedark">
          <h4 class="font-semibold text-black dark:text-white flex items-center gap-2">
            <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Файл сертификата
            <span class="text-xs text-gray-500 font-normal">(опционально)</span>
          </h4>
        </div>
        <div class="p-4">
          <div class="flex gap-4 mb-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                v-model="fileInputMode"
                value="url"
                class="w-4 h-4 text-primary"
              />
              <span class="text-sm text-black dark:text-white">Ввести URL</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                v-model="fileInputMode"
                value="none"
                class="w-4 h-4 text-primary"
              />
              <span class="text-sm text-black dark:text-white">Без файла</span>
            </label>
          </div>

          <div v-if="fileInputMode === 'url'">
            <input
              v-model="formData.fileUrl"
              type="url"
              placeholder="https://example.com/certificate.pdf"
              class="w-full rounded border-[1.5px] border-stroke bg-transparent px-4 py-2.5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              :class="{ 'border-danger': errors.fileUrl }"
            />
            <p v-if="errors.fileUrl" class="mt-1 text-sm text-danger">{{ errors.fileUrl }}</p>
          </div>
        </div>
      </div>

      <!-- Кнопки -->
      <div class="flex justify-end gap-4 pt-4 border-t border-stroke dark:border-strokedark">
        <UiButton
          type="button"
          variant="secondary"
          @click="$emit('close')"
          :disabled="isSubmitting"
        >
          Отмена
        </UiButton>
        <UiButton
          type="submit"
          variant="primary"
          :disabled="isSubmitting"
          class="min-w-[150px]"
        >
          <span v-if="!isSubmitting" class="flex items-center gap-2">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Создать сертификат
          </span>
          <span v-else class="flex items-center gap-2">
            <div class="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></div>
            Создание...
          </span>
        </UiButton>
      </div>
    </form>
  </UiModal>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  // Опциональный предвыбранный студент (если передан - секция выбора слушателя скрывается)
  preselectedStudent: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'created']);

// Composables
const notification = useNotification();
const { authFetch } = useAuthFetch();

// Режимы выбора
const studentMode = ref('existing'); // 'existing' | 'new'
const courseMode = ref('manual'); // 'existing' | 'manual'
const fileInputMode = ref('url'); // 'url' | 'none'

// Поиск слушателей
const studentSearch = ref('');
const studentSearchResults = ref([]);
const selectedStudent = ref(null);
const searchTimeout = ref(null);

// Создание нового слушателя
const newStudent = ref({
  fullName: '',
  pinfl: '',
  organization: '',
  position: '',
  department: ''
});

// Курсы
const courses = ref([]);
const selectedCourseId = ref('');

// Форма сертификата
const formData = ref({
  courseName: '',
  courseCode: '',
  courseHours: null,
  certificateNumber: '',
  issueDate: '',
  expiryDate: '',
  fileUrl: ''
});

// Состояние
const errors = ref({});
const isSubmitting = ref(false);

// Загрузка курсов при открытии модала
onMounted(async () => {
  await loadCourses();
});

watch(() => props.isOpen, async (newVal) => {
  if (newVal) {
    await loadCourses();
    resetForm();
  }
});

async function loadCourses() {
  try {
    const response = await authFetch('/api/courses');
    if (response.success) {
      courses.value = response.courses || [];
    }
  } catch (error) {
    console.error('Ошибка загрузки курсов:', error);
  }
}

// Поиск слушателей с debounce
function searchStudents() {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  
  if (studentSearch.value.length < 2) {
    studentSearchResults.value = [];
    return;
  }
  
  searchTimeout.value = setTimeout(async () => {
    try {
      const response = await authFetch(`/api/students?search=${encodeURIComponent(studentSearch.value)}&limit=10`);
      if (response.success) {
        studentSearchResults.value = response.students || [];
      }
    } catch (error) {
      console.error('Ошибка поиска слушателей:', error);
    }
  }, 300);
}

function selectStudent(student) {
  selectedStudent.value = student;
  studentSearch.value = student.fullName;
  studentSearchResults.value = [];
}

function clearStudent() {
  selectedStudent.value = null;
  studentSearch.value = '';
  studentSearchResults.value = [];
}

function onCourseSelected() {
  const course = courses.value.find(c => c.id === selectedCourseId.value);
  if (course) {
    formData.value.courseName = course.name;
    formData.value.courseCode = course.code || '';
    formData.value.courseHours = course.hours || null;
  }
}

function resetForm() {
  if (!props.preselectedStudent) {
    selectedStudent.value = null;
    studentMode.value = 'existing';
  } else {
    // Если студент предвыбран, можно сразу перейти к ручному вводу курса
    // studentMode не важен, так как он скрыт и игнорируется
  }
  
  courseMode.value = 'manual';
  fileInputMode.value = 'url';
  studentSearch.value = '';
  studentSearchResults.value = [];
  selectedCourseId.value = '';
  newStudent.value = {
    fullName: '',
    pinfl: '',
    organization: '',
    position: '',
    department: ''
  };
  formData.value = {
    courseName: '',
    courseCode: '',
    courseHours: null,
    certificateNumber: '',
    issueDate: '',
    expiryDate: '',
    fileUrl: ''
  };
  errors.value = {};
}

function validateForm() {
  errors.value = {};
  
  // Валидация слушателя (только если не предвыбран)
  if (!props.preselectedStudent) {
    if (studentMode.value === 'existing') {
      if (!selectedStudent.value) {
        errors.value.studentId = 'Выберите слушателя';
      }
    } else {
      if (!newStudent.value.fullName?.trim()) {
        errors.value['studentData.fullName'] = 'ФИО обязательно';
      }
      if (!newStudent.value.pinfl?.trim()) {
        errors.value['studentData.pinfl'] = 'ПИНФЛ обязателен';
      } else if (!/^\d{14}$/.test(newStudent.value.pinfl.trim())) {
        errors.value['studentData.pinfl'] = 'ПИНФЛ должен содержать 14 цифр';
      }
      if (!newStudent.value.organization?.trim()) {
        errors.value['studentData.organization'] = 'Организация обязательна';
      }
      if (!newStudent.value.position?.trim()) {
        errors.value['studentData.position'] = 'Должность обязательна';
      }
    }
  }
  
  // Валидация курса
  if (courseMode.value === 'existing') {
    if (!selectedCourseId.value) {
      errors.value.courseName = 'Выберите курс';
    }
  } else {
    if (!formData.value.courseName?.trim()) {
      errors.value.courseName = 'Название курса обязательно';
    }
  }
  
  // Валидация сертификата
  if (!formData.value.certificateNumber?.trim()) {
    errors.value.certificateNumber = 'Номер сертификата обязателен';
  }
  
  if (!formData.value.issueDate) {
    errors.value.issueDate = 'Дата выдачи обязательна';
  }
  
  if (formData.value.expiryDate && formData.value.issueDate) {
    const issueDate = new Date(formData.value.issueDate);
    const expiryDate = new Date(formData.value.expiryDate);
    if (expiryDate <= issueDate) {
      errors.value.expiryDate = 'Дата окончания должна быть позже даты выдачи';
    }
  }
  
  // Валидация URL
  if (fileInputMode.value === 'url' && formData.value.fileUrl) {
    try {
      new URL(formData.value.fileUrl);
    } catch {
      errors.value.fileUrl = 'Введите корректный URL';
    }
  }
  
  return Object.keys(errors.value).length === 0;
}

async function handleSubmit() {
  if (!validateForm()) {
    return;
  }
  
  isSubmitting.value = true;
  
  try {
    const payload = {
      // Слушатель
      studentId: props.preselectedStudent ? props.preselectedStudent.id : (studentMode.value === 'existing' ? selectedStudent.value?.id : undefined),
      createNewStudent: !props.preselectedStudent && studentMode.value === 'new',
      studentData: (!props.preselectedStudent && studentMode.value === 'new') ? {
        fullName: newStudent.value.fullName.trim(),
        pinfl: newStudent.value.pinfl.trim(),
        organization: newStudent.value.organization.trim(),
        position: newStudent.value.position.trim(),
        department: newStudent.value.department?.trim() || undefined
      } : undefined,
      
      // Сертификат
      certificateNumber: formData.value.certificateNumber.trim(),
      issueDate: formData.value.issueDate,
      expiryDate: formData.value.expiryDate || null,
      
      // Курс
      courseName: formData.value.courseName.trim(),
      courseCode: formData.value.courseCode?.trim() || undefined,
      courseHours: formData.value.courseHours || undefined,
      
      // Файл
      fileUrl: fileInputMode.value === 'url' && formData.value.fileUrl ? formData.value.fileUrl.trim() : undefined
    };
    
    const response = await authFetch('/api/certificates/manual', {
      method: 'POST',
      body: payload
    });
    
    if (response.success) {
      notification.success('Сертификат успешно создан', 'Успех');
      emit('created', response.certificate);
      emit('close');
      resetForm();
    } else {
      throw new Error(response.message || 'Ошибка создания сертификата');
    }
  } catch (error) {
    console.error('Ошибка создания сертификата:', error);
    
    // Обработка ошибок валидации с сервера
    if (error.data?.errors) {
      for (const err of error.data.errors) {
        errors.value[err.field] = err.message;
      }
    } else {
      notification.error(error.message || 'Произошла ошибка при создании сертификата', 'Ошибка');
    }
  } finally {
    isSubmitting.value = false;
  }
}
</script>
