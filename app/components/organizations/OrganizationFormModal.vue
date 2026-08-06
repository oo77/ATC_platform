<template>
  <UiModal :is-open="isOpen" @close="handleClose" size="xl">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <Building2 class="w-5 h-5" />
        </div>
        <div>
          <h3 class="text-xl font-bold text-slate-900 dark:text-white">
            {{ isEditMode ? "Редактирование организации" : "Создание организации" }}
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            {{ isEditMode ? "Изменение информации и реквизитов организации" : "Заполните реквизиты новой организации" }}
          </p>
        </div>
      </div>
    </template>

    <template #default>
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- 1. Идентификация и Название -->
        <div class="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
          <div class="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <FileText class="w-4 h-4 text-primary" />
            <span>Основные данные и Идентификация</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
            <!-- Название (Обязательное) -->
            <div class="md:col-span-12">
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Полное название организации <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                placeholder="Например: АО 'Узбекские Железные Дороги'"
                class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-2.5 px-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': errors.name }"
              />
              <p v-if="errors.name" class="mt-1 text-xs text-red-500">
                {{ errors.name }}
              </p>
            </div>

            <!-- ИНН организации (Главное поле для идентификации) -->
            <div class="md:col-span-6">
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ИНН (Идентификационный номер налогоплательщика)
              </label>
              <div class="relative">
                <input
                  v-model="form.inn"
                  type="text"
                  maxlength="12"
                  placeholder="9 цифр (например: 123456789)"
                  class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-2.5 px-3.5 text-sm font-mono text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  :class="{ 'border-red-500': errors.inn }"
                  @input="formatInn"
                />
                <div class="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">
                  {{ form.inn?.length || 0 }}/9
                </div>
              </div>
              <p v-if="errors.inn" class="mt-1 text-xs text-red-500">
                {{ errors.inn }}
              </p>
              <p v-else class="mt-1 text-[11px] text-slate-500">
                Уникальный ИНН используется для привязки и синхронизации слушателей
              </p>
            </div>

            <!-- Код организации -->
            <div class="md:col-span-6">
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Внутренний код организации
              </label>
              <input
                v-model="form.code"
                type="text"
                placeholder="Генерируется автоматически если пусто"
                class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-2.5 px-3.5 text-sm font-mono text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                :class="{ 'border-red-500': errors.code }"
              />
              <p v-if="errors.code" class="mt-1 text-xs text-red-500">
                {{ errors.code }}
              </p>
            </div>
          </div>
        </div>

        <!-- 2. Контактное лицо и Связь -->
        <div class="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
          <div class="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <UserCheck class="w-4 h-4 text-primary" />
            <span>Контактное лицо и связь</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- ФИО руководителя / Контактного лица -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ФИО руководителя / Контактное лицо
              </label>
              <input
                v-model="form.contactPerson"
                type="text"
                placeholder="например: Каримов А.Б."
                class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-2.5 px-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <!-- Телефон -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Контактный телефон
              </label>
              <input
                v-model="form.contactPhone"
                type="tel"
                placeholder="+998 90 123 45 67"
                class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-2.5 px-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <!-- Email -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Электронная почта (Email)
              </label>
              <input
                v-model="form.contactEmail"
                type="email"
                placeholder="info@organization.uz"
                class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-2.5 px-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                :class="{ 'border-red-500': errors.contactEmail }"
              />
              <p v-if="errors.contactEmail" class="mt-1 text-xs text-red-500">
                {{ errors.contactEmail }}
              </p>
            </div>
          </div>
        </div>

        <!-- 3. Адреса и Банковские реквизиты -->
        <div class="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
          <div class="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Landmark class="w-4 h-4 text-primary" />
            <span>Адреса и Банковские реквизиты</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
            <!-- Юридический адрес -->
            <div class="md:col-span-6">
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Юридический адрес
              </label>
              <input
                v-model="form.legalAddress"
                type="text"
                placeholder="Юридический адрес по документам"
                class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-2.5 px-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <!-- Фактический адрес -->
            <div class="md:col-span-6">
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Фактический адрес
              </label>
              <input
                v-model="form.address"
                type="text"
                placeholder="Фактический адрес расположения"
                class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-2.5 px-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <!-- МФО -->
            <div class="md:col-span-4">
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                МФО банка (5 цифр)
              </label>
              <input
                v-model="form.mfo"
                type="text"
                maxlength="5"
                placeholder="00123"
                class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-2.5 px-3.5 text-sm font-mono text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <!-- Расчетный счет -->
            <div class="md:col-span-5">
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Расчетный счет (20 цифр)
              </label>
              <input
                v-model="form.accountNumber"
                type="text"
                maxlength="20"
                placeholder="20208000..."
                class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-2.5 px-3.5 text-sm font-mono text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <!-- ОКЭД -->
            <div class="md:col-span-3">
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ОКЭД
              </label>
              <input
                v-model="form.oked"
                type="text"
                maxlength="10"
                placeholder="52210"
                class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-2.5 px-3.5 text-sm font-mono text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>
        </div>

        <!-- 4. Названия на других языках -->
        <div class="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
          <div class="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Globe class="w-4 h-4 text-primary" />
            <span>Перевод названия организации</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Название (UZ)
              </label>
              <input
                v-model="form.nameUz"
                type="text"
                placeholder="O'zbek tilida"
                class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-2.5 px-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Name (EN)
              </label>
              <input
                v-model="form.nameEn"
                type="text"
                placeholder="In English"
                class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-2.5 px-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Название (RU)
              </label>
              <input
                v-model="form.nameRu"
                type="text"
                placeholder="На русском языке"
                class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-2.5 px-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>
        </div>

        <!-- 5. Описание и Статус -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div class="md:col-span-8">
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Дополнительные заметки и описание
            </label>
            <textarea
              v-model="form.description"
              rows="2"
              placeholder="Краткое описание или примечания..."
              class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-2 px-3 text-sm text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none transition-all"
            ></textarea>
          </div>

          <div class="md:col-span-4 flex items-center pt-5">
            <label class="relative inline-flex items-center cursor-pointer select-none">
              <input
                v-model="form.isActive"
                type="checkbox"
                class="sr-only peer"
              />
              <div
                class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary"
              ></div>
              <span class="ml-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                Активная организация
              </span>
            </label>
          </div>
        </div>
      </form>
    </template>

    <template #footer>
      <div class="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
        <UiButton
          variant="outline"
          @click="handleClose"
          :disabled="isSubmitting"
        >
          Отмена
        </UiButton>
        <UiButton
          variant="primary"
          @click="handleSubmit"
          :loading="isSubmitting"
        >
          {{ isEditMode ? "Сохранить изменения" : "Создать организацию" }}
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from "vue";
import { Building2, FileText, UserCheck, Landmark, Globe } from "lucide-vue-next";
import type { Organization } from "~/types/organization";

interface FormData {
  name: string;
  code: string;
  inn: string;
  nameUz: string;
  nameEn: string;
  nameRu: string;
  contactPhone: string;
  contactEmail: string;
  contactPerson: string;
  address: string;
  legalAddress: string;
  mfo: string;
  accountNumber: string;
  oked: string;
  description: string;
  isActive: boolean;
}

const props = defineProps<{
  organization: Organization | null;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "submit", data: Partial<Organization>): void;
}>();

const isSubmitting = ref(false);
const errors = ref<Record<string, string>>({});

const isEditMode = computed(() => !!props.organization);

const form = ref<FormData>({
  name: "",
  code: "",
  inn: "",
  nameUz: "",
  nameEn: "",
  nameRu: "",
  contactPhone: "",
  contactEmail: "",
  contactPerson: "",
  address: "",
  legalAddress: "",
  mfo: "",
  accountNumber: "",
  oked: "",
  description: "",
  isActive: true,
});

const formatInn = () => {
  if (form.value.inn) {
    form.value.inn = form.value.inn.replace(/\D/g, "").slice(0, 12);
  }
};

// Инициализация формы
const initForm = () => {
  if (props.organization) {
    form.value = {
      name: props.organization.name || "",
      code: props.organization.code || "",
      inn: props.organization.inn || "",
      nameUz: props.organization.nameUz || "",
      nameEn: props.organization.nameEn || "",
      nameRu: props.organization.nameRu || "",
      contactPhone: props.organization.contactPhone || "",
      contactEmail: props.organization.contactEmail || "",
      contactPerson: props.organization.contactPerson || "",
      address: props.organization.address || "",
      legalAddress: props.organization.legalAddress || "",
      mfo: props.organization.mfo || "",
      accountNumber: props.organization.accountNumber || "",
      oked: props.organization.oked || "",
      description: props.organization.description || "",
      isActive: props.organization.isActive !== false,
    };
  } else {
    form.value = {
      name: "",
      code: "",
      inn: "",
      nameUz: "",
      nameEn: "",
      nameRu: "",
      contactPhone: "",
      contactEmail: "",
      contactPerson: "",
      address: "",
      legalAddress: "",
      mfo: "",
      accountNumber: "",
      oked: "",
      description: "",
      isActive: true,
    };
  }
  errors.value = {};
};

watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
      initForm();
    }
  },
);

onMounted(() => {
  if (props.isOpen) {
    initForm();
  }
});

const validate = (): boolean => {
  errors.value = {};

  if (!form.value.name.trim()) {
    errors.value.name = "Название организации обязательно";
  }

  if (form.value.inn && form.value.inn.trim()) {
    const cleanInn = form.value.inn.trim();
    if (!/^(\d{9}|\d{12})$/.test(cleanInn)) {
      errors.value.inn = "ИНН должен состоять из 9 (или 12) цифр";
    }
  }

  if (
    form.value.contactEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.contactEmail)
  ) {
    errors.value.contactEmail = "Некорректный адрес электронной почты";
  }

  return Object.keys(errors.value).length === 0;
};

const handleSubmit = async () => {
  if (isSubmitting.value) return;
  if (!validate()) return;

  isSubmitting.value = true;
  try {
    const data: Partial<Organization> = {
      name: form.value.name.trim(),
      isActive: form.value.isActive,
      inn: form.value.inn.trim() || null,
      contactPerson: form.value.contactPerson.trim() || null,
      legalAddress: form.value.legalAddress.trim() || null,
      mfo: form.value.mfo.trim() || null,
      accountNumber: form.value.accountNumber.trim() || null,
      oked: form.value.oked.trim() || null,
    };

    if (form.value.code.trim()) {
      data.code = form.value.code.trim();
    }

    data.nameUz = form.value.nameUz.trim() || null;
    data.nameEn = form.value.nameEn.trim() || null;
    data.nameRu = form.value.nameRu.trim() || null;
    data.contactPhone = form.value.contactPhone.trim() || null;
    data.contactEmail = form.value.contactEmail.trim() || null;
    data.address = form.value.address.trim() || null;
    data.description = form.value.description.trim() || null;

    emit("submit", data);
  } finally {
    isSubmitting.value = false;
  }
};

const handleClose = () => {
  if (!isSubmitting.value) {
    emit("close");
  }
};
</script>
