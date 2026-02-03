<template>
  <div
    class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
  >
    <div class="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
      <div class="flex items-center justify-between">
        <h3 class="font-medium text-black dark:text-white">
          Проверка извлечённых данных
        </h3>
        <div
          class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium"
          :class="badgeClasses"
        >
          <span class="h-2 w-2 rounded-full" :class="dotClasses"></span>
          Уверенность AI: {{ formattedConfidence }}
        </div>
      </div>
    </div>

    <div class="p-6.5">
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <!-- Номер сертификата -->
        <div>
          <label class="mb-2.5 block text-black dark:text-white">
            Номер сертификата <span class="text-danger">*</span>
          </label>
          <input
            v-model="localModel.certificateNumber"
            type="text"
            placeholder="Введите номер"
            class="w-full rounded border-[1.5px] bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:bg-form-input"
            :class="getErrorClasses('certificateNumber')"
            @input="validateField('certificateNumber')"
          />
          <span
            v-if="errors.certificateNumber"
            class="mt-1 block text-sm text-danger"
          >
            {{ errors.certificateNumber }}
          </span>
        </div>

        <!-- Дата выдачи -->
        <div>
          <label class="mb-2.5 block text-black dark:text-white">
            Дата выдачи <span class="text-danger">*</span>
          </label>
          <input
            v-model="localModel.issueDate"
            type="date"
            class="w-full rounded border-[1.5px] bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:bg-form-input"
            :class="getErrorClasses('issueDate')"
            @input="validateField('issueDate')"
          />
          <span v-if="errors.issueDate" class="mt-1 block text-sm text-danger">
            {{ errors.issueDate }}
          </span>
        </div>

        <!-- ФИО -->
        <div class="md:col-span-2">
          <label class="mb-2.5 block text-black dark:text-white">
            ФИО Слушателя <span class="text-danger">*</span>
          </label>
          <input
            v-model="localModel.fullName"
            type="text"
            placeholder="Фамилия Имя Отчество"
            class="w-full rounded border-[1.5px] bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:bg-form-input"
            :class="getErrorClasses('fullName')"
            @input="validateField('fullName')"
          />
          <span v-if="errors.fullName" class="mt-1 block text-sm text-danger">
            {{ errors.fullName }}
          </span>
        </div>

        <!-- Курс -->
        <div class="md:col-span-2">
          <label class="mb-2.5 block text-black dark:text-white">
            Название курса <span class="text-danger">*</span>
          </label>
          <input
            v-model="localModel.courseName"
            type="text"
            placeholder="Полное название курса"
            class="w-full rounded border-[1.5px] bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:bg-form-input"
            :class="getErrorClasses('courseName')"
            @input="validateField('courseName')"
          />
          <span v-if="errors.courseName" class="mt-1 block text-sm text-danger">
            {{ errors.courseName }}
          </span>
        </div>

        <!-- Организация -->
        <div>
          <label class="mb-2.5 block text-black dark:text-white">
            Организация <span class="text-danger">*</span>
          </label>
          <input
            v-model="localModel.organization"
            type="text"
            placeholder="Кем выдан"
            class="w-full rounded border-[1.5px] bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:bg-form-input"
            :class="getErrorClasses('organization')"
            @input="validateField('organization')"
          />
          <span
            v-if="errors.organization"
            class="mt-1 block text-sm text-danger"
          >
            {{ errors.organization }}
          </span>
        </div>

        <!-- Часы -->
        <div>
          <label class="mb-2.5 block text-black dark:text-white">
            Количество часов
          </label>
          <input
            v-model.number="localModel.courseHours"
            type="number"
            placeholder="0"
            class="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
          />
        </div>
      </div>

      <!-- Дополнительные поля -->
      <div class="mt-8">
        <h4 class="mb-5 text-title-xs font-semibold text-black dark:text-white">
          Дополнительная информация
        </h4>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <!-- ПИНФЛ -->
          <div>
            <label class="mb-2.5 block text-black dark:text-white">ПИНФЛ</label>
            <input
              v-model="localModel.pinfl"
              type="text"
              placeholder="Если указан в сертификате"
              class="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />
          </div>

          <!-- Срок действия -->
          <div>
            <label class="mb-2.5 block text-black dark:text-white">
              Дата окончания (Expiry)
            </label>
            <input
              v-model="localModel.expiryDate"
              type="date"
              class="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />
          </div>

          <!-- Должность -->
          <div>
            <label class="mb-2.5 block text-black dark:text-white"
              >Должность</label
            >
            <input
              v-model="localModel.position"
              type="text"
              placeholder="Должность слушателя"
              class="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />
          </div>

          <!-- Отдел -->
          <div>
            <label class="mb-2.5 block text-black dark:text-white">Отдел</label>
            <input
              v-model="localModel.department"
              type="text"
              placeholder="Подразделение"
              class="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { ExtractedCertificateData } from "~/../server/types/aiCertificateImport";
import { formatConfidence } from "~/utils/ai-import/formatters";
import { validateExtractedData } from "~/utils/ai-import/validators";

const props = defineProps<{
  modelValue: ExtractedCertificateData;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: ExtractedCertificateData): void;
  (e: "validation", isValid: boolean): void;
}>();

// Local copy to avoid prop mutation
const localModel = ref<ExtractedCertificateData>({ ...props.modelValue });
const errors = ref<Record<string, string>>({});

// Sync from props (external updates)
watch(
  () => props.modelValue,
  (newVal) => {
    if (JSON.stringify(newVal) !== JSON.stringify(localModel.value)) {
      localModel.value = { ...newVal };
    }
  },
  { deep: true },
);

// Sync to parent (internal updates)
watch(
  localModel,
  (newVal) => {
    emit("update:modelValue", newVal);
    validate();
  },
  { deep: true },
);

const validate = () => {
  const allErrors = validateExtractedData(localModel.value);
  errors.value = allErrors;
  emit("validation", Object.keys(allErrors).length === 0);
};

const validateField = (field: string) => {
  validate();
};

const getErrorClasses = (field: string) => {
  return errors.value[field]
    ? "border-danger text-danger focus:border-danger dark:border-danger"
    : "border-stroke text-black dark:text-white dark:border-form-strokedark dark:focus:border-primary";
};

const formattedConfidence = computed(() =>
  formatConfidence(props.modelValue.confidence),
);

const badgeClasses = computed(() => {
  const conf = props.modelValue.confidence;
  if (conf >= 0.8) return "border-success/20 bg-success/10 text-success";
  if (conf >= 0.5) return "border-warning/20 bg-warning/10 text-warning";
  return "border-danger/20 bg-danger/10 text-danger";
});

const dotClasses = computed(() => {
  const conf = props.modelValue.confidence;
  if (conf >= 0.8) return "bg-success";
  if (conf >= 0.5) return "bg-warning";
  return "bg-danger";
});

// Initial validation
validate();
</script>
