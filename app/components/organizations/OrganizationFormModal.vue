<template>
  <UiModal :is-open="isOpen" @close="handleClose" size="lg">
    <template #header>
      <h3 class="text-xl font-semibold text-black dark:text-white">
        {{ isEditMode ? 'Редактирование организации' : 'Создание организации' }}
      </h3>
    </template>

    <template #default>
      <form @submit.prevent="handleSubmit" class="space-y-5">
        <!-- Название -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Название <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            placeholder="Полное название организации"
            class="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
            :class="{ 'border-red-500': errors.name }"
          />
          <p v-if="errors.name" class="mt-1 text-sm text-red-500">{{ errors.name }}</p>
        </div>

        <!-- Краткое название и Код -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Краткое название
            </label>
            <input
              v-model="form.shortName"
              type="text"
              placeholder="Сокращённое название"
              class="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Код
            </label>
            <input
              v-model="form.code"
              type="text"
              placeholder="Уникальный код (генерируется автоматически)"
              class="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
              :class="{ 'border-red-500': errors.code }"
            />
            <p v-if="errors.code" class="mt-1 text-sm text-red-500">{{ errors.code }}</p>
          </div>
        </div>

        <!-- Телефон и Email -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Контактный телефон
            </label>
            <input
              v-model="form.contactPhone"
              type="tel"
              placeholder="+998 XX XXX XX XX"
              class="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              v-model="form.contactEmail"
              type="email"
              placeholder="email@example.com"
              class="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
              :class="{ 'border-red-500': errors.contactEmail }"
            />
            <p v-if="errors.contactEmail" class="mt-1 text-sm text-red-500">{{ errors.contactEmail }}</p>
          </div>
        </div>

        <!-- Адрес -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Адрес
          </label>
          <input
            v-model="form.address"
            type="text"
            placeholder="Полный адрес организации"
            class="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
          />
        </div>

        <!-- Описание -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Описание
          </label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="Дополнительная информация об организации"
            class="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary resize-none"
          ></textarea>
        </div>

        <!-- Статус -->
        <div class="flex items-center gap-3">
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              v-model="form.isActive"
              type="checkbox"
              class="sr-only peer"
            />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
          </label>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Активная организация
          </span>
        </div>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UiButton variant="outline" @click="handleClose" :disabled="isSubmitting">
          Отмена
        </UiButton>
        <UiButton variant="primary" @click="handleSubmit" :loading="isSubmitting">
          {{ isEditMode ? 'Сохранить' : 'Создать' }}
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';

interface Organization {
  id: string;
  code: string;
  name: string;
  shortName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
  description: string | null;
  isActive: boolean;
  studentsCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface FormData {
  name: string;
  code: string;
  shortName: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  description: string;
  isActive: boolean;
}

const props = defineProps<{
  organization: Organization | null;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit', data: Partial<Organization>): void;
}>();

const isSubmitting = ref(false);
const errors = ref<Record<string, string>>({});

const isEditMode = computed(() => !!props.organization);

const form = ref<FormData>({
  name: '',
  code: '',
  shortName: '',
  contactPhone: '',
  contactEmail: '',
  address: '',
  description: '',
  isActive: true,
});

// Инициализация формы при открытии
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    if (props.organization) {
      form.value = {
        name: props.organization.name,
        code: props.organization.code,
        shortName: props.organization.shortName || '',
        contactPhone: props.organization.contactPhone || '',
        contactEmail: props.organization.contactEmail || '',
        address: props.organization.address || '',
        description: props.organization.description || '',
        isActive: props.organization.isActive,
      };
    } else {
      form.value = {
        name: '',
        code: '',
        shortName: '',
        contactPhone: '',
        contactEmail: '',
        address: '',
        description: '',
        isActive: true,
      };
    }
    errors.value = {};
  }
});

// Валидация
const validate = (): boolean => {
  errors.value = {};

  if (!form.value.name.trim()) {
    errors.value.name = 'Название обязательно';
  }

  if (form.value.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.contactEmail)) {
    errors.value.contactEmail = 'Некорректный email';
  }

  return Object.keys(errors.value).length === 0;
};

// Отправка формы
const handleSubmit = async () => {
  // Защита от двойного вызова при быстром клике
  if (isSubmitting.value) return;
  
  if (!validate()) return;

  isSubmitting.value = true;
  try {
    const data: Partial<Organization> = {
      name: form.value.name.trim(),
      isActive: form.value.isActive,
    };

    if (form.value.code.trim()) {
      data.code = form.value.code.trim();
    }
    if (form.value.shortName.trim()) {
      data.shortName = form.value.shortName.trim();
    } else {
      data.shortName = null;
    }
    if (form.value.contactPhone.trim()) {
      data.contactPhone = form.value.contactPhone.trim();
    } else {
      data.contactPhone = null;
    }
    if (form.value.contactEmail.trim()) {
      data.contactEmail = form.value.contactEmail.trim();
    } else {
      data.contactEmail = null;
    }
    if (form.value.address.trim()) {
      data.address = form.value.address.trim();
    } else {
      data.address = null;
    }
    if (form.value.description.trim()) {
      data.description = form.value.description.trim();
    } else {
      data.description = null;
    }

    emit('submit', data);
  } finally {
    isSubmitting.value = false;
  }
};

// Закрытие модального окна
const handleClose = () => {
  if (!isSubmitting.value) {
    emit('close');
  }
};
</script>
