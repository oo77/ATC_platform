<template>
  <Teleport to="body">
    <!-- Backdrop с анимацией -->
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isVisible"
        class="fixed inset-0 z-999999 flex items-center justify-center bg-black/80 px-4 py-5"
      >
        <!-- Модальное окно с анимацией -->
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 scale-95 -translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 -translate-y-4"
        >
          <div
            v-if="isVisible"
            class="w-full max-w-3xl rounded-2xl bg-white dark:bg-boxdark shadow-2xl overflow-hidden"
            @click.stop
          >
            <!-- Заголовок -->
            <div class="border-b border-stroke px-8 py-5 dark:border-strokedark flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-xl bg-primary/10 text-primary">
                  <GraduationCap class="w-6 h-6" />
                </div>
                <h3 class="text-xl font-bold text-black dark:text-white uppercase tracking-tight">
                  {{ modalTitle }}
                </h3>
              </div>
              <button
                @click="handleClose"
                class="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-600 transition-all"
              >
                <X class="w-6 h-6" />
              </button>
            </div>

            <!-- Форма -->
            <form @submit.prevent="handleSubmit" class="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <!-- Ф.И.О -->
                <div class="sm:col-span-2">
                  <label class="mb-2.5 block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Ф.И.О <span class="text-danger">*</span>
                  </label>
                  <input
                    v-model="formData.fullName"
                    type="text"
                    placeholder="Введите полное имя"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all dark:border-slate-700 dark:bg-slate-800/50"
                    :class="{ 'border-danger': errors.fullName }"
                    required
                  />
                  <p v-if="errors.fullName" class="mt-1 text-sm text-danger">
                    {{ errors.fullName[0] }}
                  </p>
                </div>

                <!-- Фото -->
                <div class="sm:col-span-2">
                  <label class="mb-2.5 block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Фотография
                  </label>
                  <div class="flex items-center gap-6 p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/30 hover:border-primary/50 transition-all group">
                    <div class="relative shrink-0">
                      <div v-if="formData.photo_base64" class="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-white dark:ring-slate-800 shadow-xl">
                        <img :src="formData.photo_base64" class="w-full h-full object-cover" />
                        <button 
                          @click="removePhoto" 
                          type="button"
                          class="absolute -top-2 -right-2 p-1.5 rounded-full bg-danger text-white shadow-lg hover:scale-110 transition-transform"
                        >
                          <X class="w-3 h-3" />
                        </button>
                      </div>
                      <div v-else class="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 ring-4 ring-white dark:ring-slate-800 shadow-inner group-hover:bg-slate-200 dark:group-hover:bg-slate-600 transition-colors">
                        <UserIcon class="w-10 h-10" />
                      </div>
                    </div>
                    
                    <div class="grow">
                      <p class="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
                        Загрузите фото слушателя
                      </p>
                      <p class="text-xs text-slate-500 dark:text-slate-400 mb-3">
                        PNG, JPG или WEBP. Максимум 2MB.
                      </p>
                      <input
                        type="file"
                        ref="fileInput"
                        class="hidden"
                        accept="image/*"
                        @change="handlePhotoUpload"
                      />
                        <UiButton
                        type="button"
                        variant="outline"
                        size="sm"
                        @click="fileInput?.click()"
                        class="h-9 px-4 rounded-xl border-slate-200 dark:border-slate-700"
                      >
                        <template #icon>
                          <Upload class="w-4 h-4" />
                        </template>
                        Выбрать файл
                      </UiButton>
                    </div>
                  </div>
                </div>

                <!-- ПИНФЛ -->
                <div>
                  <label class="mb-2.5 block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    ПИНФЛ <span class="text-danger">*</span>
                  </label>
                  <input
                    v-model="formData.pinfl"
                    type="text"
                    placeholder="14-значный ПИНФЛ"
                    maxlength="14"
                    pattern="[0-9]{14}"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all dark:border-slate-700 dark:bg-slate-800/50 font-mono"
                    :class="{ 'border-danger': errors.pinfl }"
                    required
                  />
                  <p v-if="errors.pinfl" class="mt-1 text-sm text-danger">
                    {{ errors.pinfl[0] }}
                  </p>
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    14 цифр без пробелов
                  </p>
                </div>

                <!-- Дата рождения -->
                <div>
                  <label class="mb-2.5 block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Дата рождения
                  </label>
                  <div class="relative">
                    <input
                      v-model="formData.birthDate"
                      type="date"
                      :max="new Date().toISOString().split('T')[0]"
                      class="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all dark:border-slate-700 dark:bg-slate-800/50"
                    />
                    <div class="absolute right-12 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <CalendarIcon class="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <!-- Организация с автокомплитом -->
                <div class="relative">
                  <label class="mb-2.5 block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Организация <span class="text-danger">*</span>
                  </label>
                  <div class="relative">
                    <input
                      v-model="formData.organization"
                      type="text"
                      placeholder="Введите название организации"
                      class="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all dark:border-slate-700 dark:bg-slate-800/50"
                      :class="{ 'border-danger': errors.organization }"
                      required
                      autocomplete="off"
                      @input="onOrganizationInput"
                      @focus="showOrganizationDropdown = true"
                      @blur="hideDropdownWithDelay"
                    />
                    <!-- Индикатор загрузки -->
                    <div v-if="isLoadingOrganizations" class="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg class="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  </div>
                  <!-- Dropdown с организациями -->
                  <div
                    v-if="showOrganizationDropdown && organizationSuggestions.length > 0"
                    class="absolute z-50 w-full mt-1 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    <button
                      v-for="org in organizationSuggestions"
                      :key="org.id"
                      type="button"
                      class="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors border-b border-stroke dark:border-strokedark last:border-b-0"
                      @mousedown.prevent="selectOrganization(org)"
                    >
                      <div class="font-medium text-black dark:text-white">{{ org.name }}</div>
                      <div v-if="org.shortName" class="text-sm text-gray-500 dark:text-gray-400">
                        {{ org.shortName }}
                      </div>
                      <div class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {{ org.studentsCount }} слушателей
                      </div>
                    </button>
                  </div>
                  <!-- Подсказка: будет создана новая организация -->
                  <div
                    v-if="showOrganizationDropdown && formData.organization.trim() && organizationSuggestions.length === 0 && !isLoadingOrganizations"
                    class="absolute z-50 w-full mt-1 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg shadow-lg"
                  >
                    <div class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      <span class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Будет создана новая организация: 
                        <span class="font-medium text-black dark:text-white">{{ formData.organization.trim() }}</span>
                      </span>
                    </div>
                  </div>
                  <p v-if="errors.organization" class="mt-1 text-sm text-danger">
                    {{ errors.organization[0] }}
                  </p>
                </div>

                <!-- Служба/Отдел -->
                <div>
                  <label class="mb-2.5 block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Служба/Отдел
                  </label>
                  <input
                    v-model="formData.department"
                    type="text"
                    placeholder="Введите название службы или отдела"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all dark:border-slate-700 dark:bg-slate-800/50"
                  />
                </div>

                <!-- Должность -->
                <div>
                  <label class="mb-2.5 block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Должность <span class="text-danger">*</span>
                  </label>
                  <input
                    v-model="formData.position"
                    type="text"
                    placeholder="Введите должность"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all dark:border-slate-700 dark:bg-slate-800/50"
                    :class="{ 'border-danger': errors.position }"
                    required
                  />
                  <p v-if="errors.position" class="mt-1 text-sm text-danger">
                    {{ errors.position[0] }}
                  </p>
                </div>

                <!-- Секция учётной записи -->
                <div class="sm:col-span-2 mt-4 pt-4 border-t border-stroke dark:border-strokedark">
                  <!-- При создании нового студента -->
                  <template v-if="!props.student">
                    <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div class="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="font-medium">Учётная запись создаётся автоматически</span>
                      </div>
                      <p class="mt-2 text-sm text-blue-600 dark:text-blue-400">
                        Логин: <span class="font-mono">{{ formData.pinfl || 'ПИНФЛ' }}@student.local</span><br>
                        Пароль: <span class="font-mono">{{ formData.pinfl || 'ПИНФЛ' }}</span>
                      </p>
                    </div>
                  </template>

                  <!-- При редактировании студента (только для ADMIN/MANAGER) -->
                  <template v-else-if="canManagePassword">
                    <h4 class="font-medium text-black dark:text-white mb-3">
                      Управление учётной записью
                    </h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Email для входа: <span class="font-mono">{{ props.student.pinfl }}@student.local</span>
                    </p>
                    
                    <div class="flex flex-wrap gap-3">
                      <UiButton
                        type="button"
                        variant="secondary"
                        size="sm"
                        @click="handleResetPassword"
                        :disabled="isResettingPassword"
                      >
                        <template #icon>
                          <svg v-if="isResettingPassword" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                          </svg>
                          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </template>
                        Сбросить пароль на ПИНФЛ
                      </UiButton>

                      <UiButton
                        type="button"
                        variant="outline"
                        size="sm"
                        @click="showChangePasswordModal = true"
                      >
                        <template #icon>
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        </template>
                        Изменить пароль
                      </UiButton>
                    </div>
                  </template>
                </div>
              </div>

              <!-- Кнопки -->
              <div class="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <UiButton
                  variant="outline"
                  @click="handleClose"
                  :disabled="isSubmitting"
                  class="h-11 px-8 rounded-xl font-bold"
                >
                  Отмена
                </UiButton>
                <UiButton
                  variant="success"
                  type="submit"
                  :loading="isSubmitting"
                  class="h-11 px-8 rounded-xl font-bold shadow-lg shadow-success/20"
                >
                  {{ submitButtonText }}
                </UiButton>
              </div>
            </form>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import type { Student, CreateStudentData, UpdateStudentData } from '~/types/student';
import { GraduationCap, X, User as UserIcon, Upload, Calendar as CalendarIcon } from 'lucide-vue-next';

// Интерфейс для организации
interface Organization {
  id: string;
  name: string;
  shortName: string | null;
  studentsCount: number;
}

interface Props {
  student?: Student | null;
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  submit: [data: CreateStudentData | UpdateStudentData];
}>();

// Используем authFetch для авторизованных запросов
const { authFetch } = useAuthFetch();

// Проверка прав доступа
const { user } = useAuth();
const canManagePassword = computed(() => {
  return user.value && ['ADMIN', 'MANAGER'].includes(user.value.role);
});

// Состояние
const isSubmitting = ref(false);
const isVisible = ref(false);
const isResettingPassword = ref(false);
const showChangePasswordModal = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const errors = reactive<Record<string, string[]>>({});
const notification = useNotification();

// Автокомплит организаций
const isLoadingOrganizations = ref(false);
const showOrganizationDropdown = ref(false);
const organizationSuggestions = ref<Organization[]>([]);
let organizationSearchTimer: ReturnType<typeof setTimeout> | null = null;

// Данные формы
const formData = reactive({
  fullName: '',
  pinfl: '',
  organization: '',
  department: '',
  position: '',
  birthDate: null as string | null,
  photo_base64: null as string | null,
  accountPassword: '',
});

// Загрузка фото
const handlePhotoUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;

  // Валидация размера (2MB)
  if (file.size > 2 * 1024 * 1024) {
    notification.error('Размер файла не должен превышать 2MB', 'Ошибка');
    if (fileInput.value) fileInput.value.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    formData.photo_base64 = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

const removePhoto = () => {
  formData.photo_base64 = null;
  if (fileInput.value) fileInput.value.value = '';
};

// Сброс пароля на ПИНФЛ
const handleResetPassword = async () => {
  if (!props.student) return;
  
  isResettingPassword.value = true;
  
  try {
    const response = await authFetch<{ success: boolean; message: string }>(
      `/api/students/${props.student.id}/reset-password`,
      {
        method: 'POST',
        body: { resetToPinfl: true },
      }
    );
    
    if (response.success) {
      notification.success(response.message || 'Пароль сброшен на ПИНФЛ', 'Успешно');
    } else {
      notification.error(response.message || 'Ошибка сброса пароля', 'Ошибка');
    }
  } catch (error: any) {
    notification.error(error.message || 'Ошибка сброса пароля', 'Ошибка');
  } finally {
    isResettingPassword.value = false;
  }
};

// Вычисляемые свойства
const modalTitle = computed(() => {
  return props.student ? 'Редактировать слушателя' : 'Добавить слушателя';
});

const submitButtonText = computed(() => {
  return props.student ? 'Сохранить' : 'Создать';
});

// Валидация отдельных полей
const validateField = (field: string, value: string): string | null => {
  switch (field) {
    case 'fullName':
      if (!value || value.trim().length < 2) {
        return 'Ф.И.О должно содержать минимум 2 символа';
      }
      break;
    
    case 'pinfl':
      if (!value || !/^\d{14}$/.test(value)) {
        return 'ПИНФЛ должен содержать ровно 14 цифр';
      }
      break;
    
    case 'organization':
      if (!value || value.trim().length < 2) {
        return 'Название организации обязательно для заполнения';
      }
      break;
    
    case 'position':
      if (!value || value.trim().length < 2) {
        return 'Должность обязательна для заполнения';
      }
      break;
  }
  
  return null;
};

// Методы
const handleClose = () => {
  isVisible.value = false;
  setTimeout(() => {
    emit('close');
  }, 300); // Ждем завершения анимации
};

// Автокомплит организаций
const searchOrganizations = async (query: string) => {
  if (!query.trim()) {
    organizationSuggestions.value = [];
    return;
  }

  isLoadingOrganizations.value = true;
  try {
    const response = await authFetch<{ success: boolean; data: Organization[] }>(
      `/api/organizations/search?q=${encodeURIComponent(query.trim())}&limit=5`,
      { method: 'GET' }
    );

    if (response.success) {
      organizationSuggestions.value = response.data;
    }
  } catch (error) {
    console.error('Error searching organizations:', error);
    organizationSuggestions.value = [];
  } finally {
    isLoadingOrganizations.value = false;
  }
};

const onOrganizationInput = () => {
  // Debounce поиск
  if (organizationSearchTimer) {
    clearTimeout(organizationSearchTimer);
  }
  organizationSearchTimer = setTimeout(() => {
    searchOrganizations(formData.organization);
  }, 300);
};

const selectOrganization = (org: Organization) => {
  formData.organization = org.name;
  organizationSuggestions.value = [];
  showOrganizationDropdown.value = false;
};

const hideDropdownWithDelay = () => {
  // Задержка чтобы успеть кликнуть на элемент
  setTimeout(() => {
    showOrganizationDropdown.value = false;
  }, 200);
};

const handleSubmit = async () => {
  // Защита от двойного вызова при быстром клике
  if (isSubmitting.value) return;
  
  // Очистка ошибок
  Object.keys(errors).forEach((key) => delete errors[key]);

  // Валидация всех полей
  const fieldsToValidate = ['fullName', 'pinfl', 'organization', 'position'];
  let hasErrors = false;
  
  for (const field of fieldsToValidate) {
    const value = formData[field as keyof typeof formData] as string;
    const error = validateField(field, value);
    
    if (error) {
      errors[field] = [error];
      notification.error(error, 'Ошибка валидации');
      hasErrors = true;
    }
  }

  if (hasErrors) {
    return;
  }

  isSubmitting.value = true;

  try {
    // Базовые данные студента
    const submitData: any = {
      fullName: formData.fullName.trim(),
      pinfl: formData.pinfl.trim(),
      organization: formData.organization.trim(),
      department: formData.department?.trim() || undefined,
      position: formData.position.trim(),
      birthDate: formData.birthDate || null,
      photo_base64: formData.photo_base64 || null,
    };

    // Добавляем пароль если указан (иначе будет использован ПИНФЛ)
    if (!props.student && formData.accountPassword) {
      submitData.accountPassword = formData.accountPassword;
    }

    emit('submit', submitData);
    
    // Уведомление об успехе будет показано в родительском компоненте
    handleClose();
  } catch (error: any) {
    console.error('Error saving student:', error);
    
    // Обработка ошибок валидации с сервера
    if (error.data?.errors) {
      const serverErrors = error.data.errors;
      Object.assign(errors, serverErrors);
      
      // Показываем уведомление для каждой ошибки
      Object.entries(serverErrors).forEach(([field, messages]) => {
        const fieldLabels: Record<string, string> = {
          fullName: 'Ф.И.О',
          pinfl: 'ПИНФЛ',
          organization: 'Организация',
          department: 'Служба/Отдел',
          position: 'Должность',
        };
        
        const fieldLabel = fieldLabels[field] || field;
        const message = Array.isArray(messages) ? messages[0] : messages;
        notification.error(`${fieldLabel}: ${message}`, 'Ошибка валидации');
      });
    } else {
      const errorMessage = error.data?.message || 'Произошла ошибка при сохранении';
      notification.error(errorMessage, 'Ошибка');
    }
  } finally {
    isSubmitting.value = false;
  }
};

// Инициализация формы при редактировании
onMounted(() => {
  // Показываем модальное окно с анимацией
  setTimeout(() => {
    isVisible.value = true;
  }, 10);

  if (props.student) {
    formData.fullName = props.student.fullName;
    formData.pinfl = props.student.pinfl;
    formData.organization = props.student.organization;
    formData.department = props.student.department || '';
    formData.position = props.student.position;
    
    // Новые поля
    if (props.student.birthDate) {
      const date = new Date(props.student.birthDate);
      formData.birthDate = date.toISOString().split('T')[0] || null;
    }
    
    if (props.student.photo_base64) {
      formData.photo_base64 = props.student.photo_base64;
    }
  }
});
</script>
