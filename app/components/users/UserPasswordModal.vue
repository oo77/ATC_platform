<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-999999 flex items-center justify-center bg-black/80 px-4 py-5"
      >
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 scale-95 -translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 -translate-y-4"
        >
          <div
            v-if="isOpen"
            class="w-full max-w-md rounded-lg bg-white dark:bg-boxdark shadow-xl"
            @click.stop
          >
            <!-- Header -->
            <div class="border-b border-stroke px-6 py-4 dark:border-strokedark flex items-center justify-between">
              <h3 class="text-xl font-semibold text-black dark:text-white">
                Сброс пароля
              </h3>
              <button
                @click="close"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                :disabled="loading"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Body -->
            <form @submit.prevent="handleSubmit" class="p-6">
              <div class="mb-4">
                <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Установите новый пароль для пользователя <span class="font-medium text-black dark:text-white">{{ userName }}</span>.
                </p>

                <div class="mb-4">
                  <label class="mb-2.5 block font-medium text-black dark:text-white">
                    Новый пароль
                  </label>
                  <div class="relative">
                    <input
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      placeholder="Введите новый пароль"
                      class="w-full rounded-lg border border-stroke bg-transparent py-3 pl-6 pr-10 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                      required
                      minlength="6"
                    />
                    <span
                        class="absolute right-4 top-3 cursor-pointer p-0.5 z-10" 
                        @click.prevent="showPassword = !showPassword"
                    >
                      <svg v-if="!showPassword" class="h-5 w-5 text-gray-500 hover:text-primary transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <svg v-else class="h-5 w-5 text-gray-500 hover:text-primary transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    </span>
                  </div>
                </div>

                <div class="mb-4">
                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      @click="generatePassword"
                      class="text-xs text-primary hover:underline"
                    >
                      Сгенерировать случайный пароль
                    </button>
                    <button
                        type="button"
                        @click="copyPassword"
                        v-if="password"
                        class="text-xs text-primary hover:underline ml-auto"
                    >
                        Скопировать
                    </button>
                  </div>
                </div>
              </div>

              <div class="flex justify-end gap-4 mt-6">
                <UiButton
                  type="button"
                  variant="danger"
                  @click="close"
                  :disabled="loading"
                >
                  Отмена
                </UiButton>
                <UiButton
                  type="submit"
                  variant="success"
                  :loading="loading"
                  :disabled="loading || !password || password.length < 6"
                >
                  Сохранить
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
import { ref } from 'vue';

interface Props {
  isOpen: boolean;
  userId: string;
  userName: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const { authFetch } = useAuthFetch();
const notification = useNotification();

const loading = ref(false);
const password = ref('');
const showPassword = ref(false);

const generatePassword = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let pass = '';
  // Ensure strict requirements: 1 upper, 1 lower, 1 digit
  pass += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.charAt(Math.floor(Math.random() * 26));
  pass += 'abcdefghijklmnopqrstuvwxyz'.charAt(Math.floor(Math.random() * 26));
  pass += '0123456789'.charAt(Math.floor(Math.random() * 10));
  
  for (let i = 0; i < 9; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Shuffle
  password.value = pass.split('').sort(() => 0.5 - Math.random()).join('');
  showPassword.value = true;
};

const copyPassword = () => {
    if (password.value) {
        navigator.clipboard.writeText(password.value);
        notification.success('Пароль скопирован в буфер обмена', 'Скопировано');
    }
}

const close = () => {
  password.value = '';
  showPassword.value = false;
  emit('close');
};

const handleSubmit = async () => {
  // Защита от двойного вызова при быстром клике
  if (loading.value) return;
  
  if (!password.value || password.value.length < 6) return;

  loading.value = true;
  try {
    const response = await authFetch(`/api/users/${props.userId}/password`, {
      method: 'PUT',
      body: {
        password: password.value,
      },
    });

    if ((response as any).success) {
      notification.success('Пароль пользователя успешно изменен', 'Успех');
      emit('success');
      close();
    }
  } catch (error: any) {
    console.error('Password reset error:', error);
    notification.error(error.message || 'Ошибка сброса пароля');
  } finally {
    loading.value = false;
  }
};
</script>
