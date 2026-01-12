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
        v-if="isVisible"
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
            v-if="isVisible"
            class="w-full max-w-2xl rounded-lg bg-white dark:bg-boxdark shadow-xl"
            @click.stop
          >
            <!-- Заголовок -->
            <div class="border-b border-stroke px-6 py-4 dark:border-strokedark flex items-center justify-between">
              <h3 class="text-xl font-semibold text-black dark:text-white">
                Одобрение представителя
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

            <!-- Контент -->
            <form @submit.prevent="handleSubmit" class="p-6">
              <!-- Информация о представителе -->
              <div class="mb-6 rounded-lg bg-gray-50 dark:bg-meta-4 p-4">
                <h4 class="font-medium text-black dark:text-white mb-3">Информация о представителе</h4>
                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span class="text-gray-600 dark:text-gray-400">ФИО:</span>
                    <span class="ml-2 font-medium text-black dark:text-white">{{ representative.fullName }}</span>
                  </div>
                  <div>
                    <span class="text-gray-600 dark:text-gray-400">Телефон:</span>
                    <span class="ml-2 font-medium text-black dark:text-white">{{ representative.phone }}</span>
                  </div>
                  <div class="col-span-2">
                    <span class="text-gray-600 dark:text-gray-400">Организация:</span>
                    <span class="ml-2 font-medium text-black dark:text-white">{{ representative.organizationName }}</span>
                  </div>
                  <div v-if="representative.telegramUsername">
                    <span class="text-gray-600 dark:text-gray-400">Telegram:</span>
                    <span class="ml-2 font-medium text-black dark:text-white">@{{ representative.telegramUsername }}</span>
                  </div>
                </div>
              </div>

              <!-- Настройка доступа -->
              <div class="mb-6">
                <label class="mb-3 block text-sm font-medium text-black dark:text-white">
                  Доступ к группам
                </label>
                <div class="space-y-3">
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input
                      v-model="accessType"
                      type="radio"
                      value="all"
                      class="h-4 w-4 text-primary focus:ring-primary"
                    />
                    <div>
                      <div class="font-medium text-black dark:text-white">Все группы организации</div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">
                        Представитель сможет видеть всех слушателей и расписание всех групп своей организации
                      </div>
                    </div>
                  </label>

                  <label class="flex items-center gap-3 cursor-pointer">
                    <input
                      v-model="accessType"
                      type="radio"
                      value="specific"
                      class="h-4 w-4 text-primary focus:ring-primary"
                    />
                    <div>
                      <div class="font-medium text-black dark:text-white">Выбранные группы</div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">
                        Ограничить доступ только к определённым группам
                      </div>
                    </div>
                  </label>
                </div>

                <!-- Выбор групп (если выбран specific) -->
                <div v-if="accessType === 'specific'" class="mt-4 p-4 rounded-lg border border-stroke dark:border-strokedark">
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Выберите группы для доступа:
                  </p>
                  <div class="max-h-48 overflow-y-auto space-y-2">
                    <label
                      v-for="group in availableGroups"
                      :key="group.id"
                      class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-meta-4 p-2 rounded"
                    >
                      <input
                        v-model="selectedGroups"
                        type="checkbox"
                        :value="group.id"
                        class="h-4 w-4 text-primary focus:ring-primary"
                      />
                      <span class="text-sm text-black dark:text-white">{{ group.code }} - {{ group.courseName }}</span>
                    </label>
                  </div>
                  <p v-if="availableGroups.length === 0" class="text-sm text-gray-500 dark:text-gray-400 italic">
                    Нет доступных групп для этой организации
                  </p>
                </div>
              </div>

              <!-- Кнопки -->
              <div class="flex justify-end gap-4">
                <UiButton
                  variant="danger"
                  @click="handleClose"
                  :disabled="isSubmitting"
                >
                  Отмена
                </UiButton>
                <UiButton
                  variant="success"
                  type="submit"
                  :loading="isSubmitting"
                >
                  Одобрить
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
import { ref, reactive, onMounted } from 'vue';

interface Representative {
  id: string;
  organizationId: string;
  organizationName?: string;
  fullName: string;
  phone: string;
  telegramUsername: string | null;
}

interface Group {
  id: string;
  code: string;
  courseName: string;
}

interface Props {
  representative: Representative;
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  submit: [data: { accessGroups?: string[] }];
}>();

// Состояние
const isSubmitting = ref(false);
const isVisible = ref(false);
const accessType = ref<'all' | 'specific'>('all');
const selectedGroups = ref<string[]>([]);
const availableGroups = ref<Group[]>([]);

// Методы
const handleClose = () => {
  isVisible.value = false;
  setTimeout(() => {
    emit('close');
  }, 300);
};

const handleSubmit = async () => {
  // Защита от двойного вызова при быстром клике
  if (isSubmitting.value) return;
  
  isSubmitting.value = true;

  try {
    const data: { accessGroups?: string[] } = {};
    
    if (accessType.value === 'specific') {
      if (selectedGroups.value.length === 0) {
        alert('Выберите хотя бы одну группу');
        return;
      }
      data.accessGroups = selectedGroups.value;
    }

    emit('submit', data);
  } finally {
    isSubmitting.value = false;
  }
};

// Инициализация
onMounted(() => {
  setTimeout(() => {
    isVisible.value = true;
  }, 10);

  // TODO: Загрузить группы организации
  // Пока оставляем пустым массив
  availableGroups.value = [];
});
</script>
