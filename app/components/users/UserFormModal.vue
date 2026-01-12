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
            class="w-full max-w-3xl rounded-lg bg-white dark:bg-boxdark shadow-xl"
            @click.stop
          >
            <!-- Заголовок -->
            <div class="border-b border-stroke px-6 py-4 dark:border-strokedark flex items-center justify-between">
              <h3 class="text-xl font-semibold text-black dark:text-white">
                {{ isEditMode ? 'Редактировать' : 'Добавить' }} {{ roleLabel.toLowerCase() }}а
              </h3>
              <button
                @click="handleClose"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Форма -->
            <form @submit.prevent="handleSubmit" class="p-6">
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <!-- Имя -->
                <div class="sm:col-span-2">
                  <label class="mb-3 block text-sm font-medium text-black dark:text-white">
                    Полное имя <span class="text-danger">*</span>
                  </label>
                  <input
                    v-model="formData.name"
                    type="text"
                    placeholder="Введите полное имя"
                    class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    :class="{ 'border-danger': errors.name }"
                    required
                  />
                  <p v-if="errors.name" class="mt-1 text-sm text-danger">
                    {{ errors.name[0] }}
                  </p>
                </div>

                <!-- Email -->
                <div>
                  <label class="mb-3 block text-sm font-medium text-black dark:text-white">
                    Email <span class="text-danger">*</span>
                  </label>
                  <input
                    v-model="formData.email"
                    type="email"
                    placeholder="email@example.com"
                    class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    :class="{ 'border-danger': errors.email }"
                    :disabled="isEditMode"
                    required
                  />
                  <p v-if="errors.email" class="mt-1 text-sm text-danger">
                    {{ errors.email[0] }}
                  </p>
                </div>

                <!-- Телефон -->
                <div>
                  <label class="mb-3 block text-sm font-medium text-black dark:text-white">
                    Телефон
                  </label>
                  <input
                    v-model="formData.phone"
                    type="tel"
                    placeholder="+998901234567"
                    class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    :class="{ 'border-danger': errors.phone }"
                  />
                  <p v-if="errors.phone" class="mt-1 text-sm text-danger">
                    {{ errors.phone[0] }}
                  </p>
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Формат: +998XXXXXXXXX
                  </p>
                </div>

                <!-- Пароль (только при создании) -->
                <div v-if="!isEditMode">
                  <label class="mb-3 block text-sm font-medium text-black dark:text-white">
                    Пароль <span class="text-danger">*</span>
                  </label>
                  <input
                    v-model="formData.password"
                    type="password"
                    placeholder="Минимум 6 символов"
                    class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    :class="{ 'border-danger': errors.password }"
                    :required="!isEditMode"
                  />
                  <p v-if="errors.password" class="mt-1 text-sm text-danger">
                    {{ errors.password[0] }}
                  </p>
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Должен содержать заглавную букву, строчную букву и цифру
                  </p>
                </div>

                <!-- Подтверждение пароля (только при создании) -->
                <div v-if="!isEditMode">
                  <label class="mb-3 block text-sm font-medium text-black dark:text-white">
                    Подтвердите пароль <span class="text-danger">*</span>
                  </label>
                  <input
                    v-model="formData.confirmPassword"
                    type="password"
                    placeholder="Повторите пароль"
                    class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    :class="{ 'border-danger': errors.confirmPassword }"
                    :required="!isEditMode"
                  />
                  <p v-if="errors.confirmPassword" class="mt-1 text-sm text-danger">
                    {{ errors.confirmPassword[0] }}
                  </p>
                </div>

                <!-- Место работы -->
                <div>
                  <label class="mb-3 block text-sm font-medium text-black dark:text-white">
                    Место работы
                  </label>
                  <input
                    v-model="formData.workplace"
                    type="text"
                    placeholder="Название организации"
                    class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    :class="{ 'border-danger': errors.workplace }"
                  />
                  <p v-if="errors.workplace" class="mt-1 text-sm text-danger">
                    {{ errors.workplace[0] }}
                  </p>
                </div>

                <!-- Должность -->
                <div>
                  <label class="mb-3 block text-sm font-medium text-black dark:text-white">
                    Должность
                  </label>
                  <input
                    v-model="formData.position"
                    type="text"
                    placeholder="Должность"
                    class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    :class="{ 'border-danger': errors.position }"
                  />
                  <p v-if="errors.position" class="mt-1 text-sm text-danger">
                    {{ errors.position[0] }}
                  </p>
                </div>

                <!-- ПИНФЛ -->
                <div class="sm:col-span-2">
                  <label class="mb-3 block text-sm font-medium text-black dark:text-white">
                    ПИНФЛ
                  </label>
                  <input
                    v-model="formData.pinfl"
                    type="text"
                    placeholder="14 цифр"
                    maxlength="14"
                    class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    :class="{ 'border-danger': errors.pinfl }"
                  />
                  <p v-if="errors.pinfl" class="mt-1 text-sm text-danger">
                    {{ errors.pinfl[0] }}
                  </p>
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Персональный идентификационный номер физического лица (14 цифр)
                  </p>
                </div>
              </div>

              <!-- Кнопки -->
              <div class="mt-6 flex justify-end gap-4">
                <UiButton
                  variant="danger"
                  @click="handleClose"
                  :disabled="loading"
                >
                  Отмена
                </UiButton>
                <UiButton
                  variant="success"
                  type="submit"
                  :loading="loading"
                >
                  {{ isEditMode ? 'Сохранить' : 'Создать' }}
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
import type { UserRole, UserPublic } from '~/types/auth';

interface Props {
  user: UserPublic | null;
  role: UserRole;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  save: [];
}>();

// Состояние
const loading = ref(false);
const isVisible = ref(false);
const errors = reactive<Record<string, string[]>>({});
const notification = useNotification();

// Данные формы
const formData = reactive({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  workplace: '',
  position: '',
  pinfl: '',
});

// Вычисляемые свойства
const isEditMode = computed(() => !!props.user);

const roleLabel = computed(() => {
  const labels: Record<UserRole, string> = {
    ADMIN: 'Администратор',
    MANAGER: 'Модератор',
    TEACHER: 'Учитель',
    STUDENT: 'Студент',
  };
  return labels[props.role];
});

// Валидация отдельных полей
const validateField = (field: string, value: string): string | null => {
  switch (field) {
    case 'name':
      if (!value || value.trim().length < 2) {
        return 'Имя должно содержать минимум 2 символа';
      }
      break;
    
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value || !emailRegex.test(value)) {
        return 'Введите корректный email адрес';
      }
      break;
    
    case 'phone':
      if (value) {
        const phoneRegex = /^\+998\d{9}$/;
        if (!phoneRegex.test(value)) {
          return 'Номер телефона должен быть в формате +998XXXXXXXXX';
        }
      }
      break;
    
    case 'password':
      if (!isEditMode.value) {
        if (!value || value.length < 6) {
          return 'Пароль должен содержать минимум 6 символов';
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return 'Пароль должен содержать заглавную букву, строчную букву и цифру';
        }
      }
      break;
    
    case 'confirmPassword':
      if (!isEditMode.value && value !== formData.password) {
        return 'Пароли не совпадают';
      }
      break;
    
    case 'pinfl':
      if (value && !/^\d{14}$/.test(value)) {
        return 'ПИНФЛ должен содержать ровно 14 цифр';
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

const handleSubmit = async () => {
  // Защита от двойного вызова при быстром клике
  if (loading.value) return;
  
  // Очистка ошибок
  Object.keys(errors).forEach((key) => delete errors[key]);

  // Валидация всех полей
  const fieldsToValidate = ['name', 'email', 'phone'];
  if (!isEditMode.value) {
    fieldsToValidate.push('password', 'confirmPassword');
  }
  fieldsToValidate.push('pinfl');

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

  loading.value = true;

  try {
    if (isEditMode.value) {
      // Обновление пользователя
      const { token } = useAuth();
      
      await $fetch(`/api/users/${props.user!.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
        body: {
          name: formData.name,
          phone: formData.phone || undefined,
          workplace: formData.workplace || undefined,
          position: formData.position || undefined,
          pinfl: formData.pinfl || undefined,
        },
      });
      
      notification.success('Пользователь успешно обновлен', 'Успех');
    } else {
      // Создание пользователя
      const { token } = useAuth();
      
      await $fetch('/api/users', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
        body: {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || undefined,
          workplace: formData.workplace || undefined,
          position: formData.position || undefined,
          pinfl: formData.pinfl || undefined,
          role: props.role,
        },
      });
      
      notification.success('Пользователь успешно создан', 'Успех');
    }

    emit('save');
    handleClose();
  } catch (error: any) {
    console.error('Error saving user:', error);
    
    // Обработка ошибок валидации с сервера
    if (error.data?.errors) {
      const serverErrors = error.data.errors;
      Object.assign(errors, serverErrors);
      
      // Показываем уведомление для каждой ошибки
      Object.entries(serverErrors).forEach(([field, messages]) => {
        const fieldLabels: Record<string, string> = {
          name: 'Имя',
          email: 'Email',
          phone: 'Телефон',
          password: 'Пароль',
          pinfl: 'ПИНФЛ',
          workplace: 'Место работы',
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
    loading.value = false;
  }
};

// Инициализация формы при редактировании
onMounted(() => {
  // Показываем модальное окно с анимацией
  setTimeout(() => {
    isVisible.value = true;
  }, 10);

  if (props.user) {
    formData.name = props.user.name;
    formData.email = props.user.email;
    formData.phone = props.user.phone || '';
    formData.workplace = props.user.workplace || '';
    formData.position = props.user.position || '';
    formData.pinfl = props.user.pinfl || '';
  }
});
</script>
