<template>
  <UiModal :is-open="isOpen" @close="handleClose" size="xl">
    <template #header>
      <div class="flex items-center gap-4">
        <div class="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <Building2 class="w-7 h-7 text-primary" />
        </div>
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {{ organization?.name }}
            </h3>
            <span v-if="organization?.inn" class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20">
              <Hash class="w-3 h-3" />
              ИНН: {{ organization.inn }}
            </span>
            <span
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border"
              :class="organization?.isActive
                ? 'bg-success/5 text-success border-success/20'
                : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'"
            >
              <CheckCircle v-if="organization?.isActive" class="w-3 h-3" />
              <XCircle v-else class="w-3 h-3" />
              {{ organization?.isActive ? 'Активна' : 'Неактивна' }}
            </span>
          </div>
          <p class="text-xs font-medium text-slate-500 mt-1">
            Код организации: <span class="font-mono text-slate-700 dark:text-slate-300">{{ organization?.code }}</span>
          </p>
        </div>
      </div>
    </template>

    <template #default>
      <div v-if="organization" class="space-y-5">
        <!-- Вкладки -->
        <div class="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
            :class="activeTab === tab.id
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'"
            @click="activeTab = tab.id"
          >
            <component :is="tab.icon" class="w-4 h-4" />
            {{ tab.label }}
          </button>
        </div>

        <OrganizationsOrganizationTrainingDashboard
          v-show="activeTab === 'training'"
          :organization-id="organization.id"
          :organization-name="organization.name"
        />

        <!-- Контактные данные и Банковские реквизиты -->
        <div v-show="activeTab === 'details'" class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 overflow-hidden">
          <div class="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h4 class="font-bold text-slate-900 dark:text-white text-sm">Реквизиты и Данные организации</h4>
          </div>
          <div class="p-5 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- ИНН -->
              <div class="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">ИНН</p>
                <p class="text-sm font-bold font-mono text-slate-900 dark:text-white">
                  {{ organization.inn || 'Не указан' }}
                </p>
              </div>

              <!-- Контактное лицо -->
              <div class="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Руководитель / ФИО</p>
                <div class="flex items-center gap-2">
                  <UserCheck class="w-4 h-4 text-slate-400 shrink-0" />
                  <p class="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {{ organization.contactPerson || 'Не указано' }}
                  </p>
                </div>
              </div>

              <!-- ОКЭД -->
              <div class="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">ОКЭД</p>
                <p class="text-sm font-bold font-mono text-slate-900 dark:text-white">
                  {{ organization.oked || '—' }}
                </p>
              </div>

              <!-- Телефон -->
              <div class="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Телефон</p>
                <div class="flex items-center gap-2">
                  <Phone class="w-4 h-4 text-slate-400 shrink-0" />
                  <p class="text-sm font-medium" :class="organization.contactPhone ? 'text-slate-900 dark:text-white' : 'text-slate-400 italic'">
                    {{ organization.contactPhone || 'Не указан' }}
                  </p>
                </div>
              </div>
              
              <!-- Email -->
              <div class="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                <div class="flex items-center gap-2">
                  <Mail class="w-4 h-4 text-slate-400 shrink-0" />
                  <p class="text-sm font-medium truncate" :class="organization.contactEmail ? 'text-slate-900 dark:text-white' : 'text-slate-400 italic'">
                    {{ organization.contactEmail || 'Не указан' }}
                  </p>
                </div>
              </div>

              <!-- МФО -->
              <div class="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">МФО банка</p>
                <p class="text-sm font-bold font-mono text-slate-900 dark:text-white">
                  {{ organization.mfo || '—' }}
                </p>
              </div>

              <!-- Расчетный счет -->
              <div class="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 md:col-span-3">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Расчетный счет (р/с)</p>
                <p class="text-sm font-bold font-mono text-slate-900 dark:text-white">
                  {{ organization.accountNumber || 'Не указан' }}
                </p>
              </div>

              <!-- Юридический адрес -->
              <div v-if="organization.legalAddress" class="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 md:col-span-3">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Юридический адрес</p>
                <div class="flex items-start gap-2">
                  <Landmark class="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p class="text-sm font-medium text-slate-900 dark:text-white">
                    {{ organization.legalAddress }}
                  </p>
                </div>
              </div>
              
              <!-- Фактический адрес -->
              <div v-if="organization.address" class="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 md:col-span-3">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Фактический адрес</p>
                <div class="flex items-start gap-2">
                  <MapPin class="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p class="text-sm font-medium text-slate-900 dark:text-white">
                    {{ organization.address }}
                  </p>
                </div>
              </div>

              <div v-if="organization.description" class="md:col-span-3 mt-2">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Описание</p>
                <div class="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                  <p class="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{{ organization.description }}</p>
                </div>
              </div>
            </div>
            
            <!-- Dates footer -->
            <div class="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 text-xs font-medium text-slate-500">
              <div class="flex items-center gap-1.5">
                <Clock class="w-3.5 h-3.5" />
                Создана: {{ formatDateTime(organization.createdAt) }}
              </div>
              <div class="flex items-center gap-1.5">
                <RotateCcw class="w-3.5 h-3.5" />
                Обновлена: {{ formatDateTime(organization.updatedAt) }}
              </div>
            </div>
          </div>
        </div>

      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <UiButton variant="outline" class="font-bold gap-2" @click="emit('edit')">
          <Pencil class="w-4 h-4" />
          Редактировать
        </UiButton>
        <UiButton variant="primary" class="font-bold" @click="handleClose">
          Закрыть
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup>
import { ref } from 'vue';
import {
  Building2, CheckCircle, XCircle, BarChart3, Phone, Mail, MapPin, Clock, RotateCcw,
  Pencil, Hash, Landmark, UserCheck
} from 'lucide-vue-next';

defineProps({
  organization: {
    type: Object,
    default: null
  },
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'edit']);

const tabs = [
  { id: 'training', label: 'Аналитика обучения', icon: BarChart3 },
  { id: 'details', label: 'Реквизиты', icon: Landmark },
];
const activeTab = ref('training');

const formatDateTime = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const handleClose = () => {
  emit('close');
};
</script>
