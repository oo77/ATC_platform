<template>
  <UiModal
    :is-open="isOpen"
    title="Быстрое создание слушателя"
    size="md"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div class="p-3 bg-primary/5 rounded-xl border border-primary/15 text-xs text-slate-600 dark:text-slate-300">
        Слушатель будет добавлен в базу и сможет быть сразу зачислен в группу.
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          ФИО <span class="text-danger">*</span>
        </label>
        <input
          v-model="form.fullName"
          type="text"
          placeholder="Иванов Иван Иванович"
          class="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3.5 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800"
          :class="{ 'border-danger focus:border-danger focus:ring-danger': errors.fullName }"
        />
        <p v-if="errors.fullName" class="mt-1 text-xs text-danger">{{ errors.fullName }}</p>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          ПИНФЛ (14 цифр) <span class="text-danger">*</span>
        </label>
        <input
          v-model="form.pinfl"
          type="text"
          maxlength="14"
          placeholder="12345678901234"
          class="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3.5 text-sm font-medium font-mono outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800"
          :class="{ 'border-danger focus:border-danger focus:ring-danger': errors.pinfl }"
        />
        <p v-if="errors.pinfl" class="mt-1 text-xs text-danger">{{ errors.pinfl }}</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Организация <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.organization"
            type="text"
            placeholder="АО Uzbekistan Airways"
            class="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3.5 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800"
            :class="{ 'border-danger focus:border-danger focus:ring-danger': errors.organization }"
          />
          <p v-if="errors.organization" class="mt-1 text-xs text-danger">{{ errors.organization }}</p>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Должность <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.position"
            type="text"
            placeholder="Инженер / Техник"
            class="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3.5 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800"
            :class="{ 'border-danger focus:border-danger focus:ring-danger': errors.position }"
          />
          <p v-if="errors.position" class="mt-1 text-xs text-danger">{{ errors.position }}</p>
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Подразделение / Департамент
        </label>
        <input
          v-model="form.department"
          type="text"
          placeholder="Служба эксплуатации"
          class="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3.5 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800"
        />
      </div>

      <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        <UiButton type="button" variant="outline" @click="$emit('close')">
          Отмена
        </UiButton>
        <UiButton type="submit" variant="primary" :disabled="loading">
          <svg v-if="loading" class="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Создать слушателя
        </UiButton>
      </div>
    </form>
  </UiModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  isOpen: boolean;
  initialData?: {
    fullName?: string;
    pinfl?: string;
    organization?: string;
    position?: string;
    department?: string;
  } | null;
}>();

const emit = defineEmits<{
  close: [];
  created: [student: any];
}>();

const { authFetch } = useAuthFetch();
const toast = useNotification();

const loading = ref(false);
const form = ref({
  fullName: '',
  pinfl: '',
  organization: '',
  position: '',
  department: '',
});
const errors = ref<Record<string, string>>({});

watch(
  () => props.initialData,
  (val) => {
    if (val) {
      form.value = {
        fullName: val.fullName || '',
        pinfl: val.pinfl || '',
        organization: val.organization || 'АО Uzbekistan Airways',
        position: val.position || '',
        department: val.department || '',
      };
    }
  },
  { immediate: true }
);

const validate = () => {
  errors.value = {};
  if (!form.value.fullName.trim()) errors.value.fullName = 'Укажите ФИО';
  if (!form.value.pinfl.trim()) {
    errors.value.pinfl = 'Укажите ПИНФЛ';
  } else if (!/^\d{14}$/.test(form.value.pinfl.trim())) {
    errors.value.pinfl = 'ПИНФЛ должен содержать ровно 14 цифр';
  }
  if (!form.value.organization.trim()) errors.value.organization = 'Укажите организацию';
  if (!form.value.position.trim()) errors.value.position = 'Укажите должность';
  return Object.keys(errors.value).length === 0;
};

const handleSubmit = async () => {
  if (!validate() || loading.value) return;

  loading.value = true;
  try {
    const res = await authFetch<any>('/api/students', {
      method: 'POST',
      body: {
        fullName: form.value.fullName.trim(),
        pinfl: form.value.pinfl.trim(),
        organization: form.value.organization.trim(),
        position: form.value.position.trim(),
        department: form.value.department.trim() || undefined,
      },
    });

    if (res.success && res.student) {
      toast.success('Слушатель успешно создан');
      emit('created', res.student);
      emit('close');
    } else {
      toast.error(res.message || 'Ошибка создания слушателя');
    }
  } catch (err: any) {
    toast.error(err.data?.message || err.message || 'Не удалось создать слушателя');
  } finally {
    loading.value = false;
  }
};
</script>
