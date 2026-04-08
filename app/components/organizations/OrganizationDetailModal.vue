<template>
  <UiModal :is-open="isOpen" @close="handleClose" size="xl">
    <template #header>
      <div class="flex items-center gap-4">
        <div class="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <Building2 class="w-7 h-7 text-primary" />
        </div>
        <div>
          <h3 class="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {{ organization?.name }}
          </h3>
          <p class="text-sm font-medium text-slate-500 mt-1">
            Код организации: <span class="font-mono text-slate-700 dark:text-slate-300">{{ organization?.code }}</span>
          </p>
        </div>
      </div>
    </template>

    <template #default>
      <div v-if="organization" class="space-y-6">
        <!-- Status Badges -->
        <div class="flex items-center gap-2 flex-wrap">
          <span
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border"
            :class="organization.isActive 
              ? 'bg-success/5 text-success border-success/20' 
              : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'"
          >
            <CheckCircle v-if="organization.isActive" class="w-4 h-4" />
            <XCircle v-else class="w-4 h-4" />
            {{ organization.isActive ? 'Организация активна' : 'Организация неактивна' }}
          </span>
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-primary/5 text-primary border border-primary/20">
            <Users class="w-4 h-4" />
            Слушателей: {{ organization.studentsCount }}
          </span>
        </div>

        <!-- Статистика обучения (Bento Metrics) -->
        <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 overflow-hidden">
          <div class="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
            <div class="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp class="w-4 h-4" />
            </div>
            <h4 class="font-bold text-slate-900 dark:text-white text-sm">Статистика обучения</h4>
          </div>
          
          <div class="p-5">
            <!-- Загрузка статистики -->
            <div v-if="loadingStats" class="flex flex-col items-center justify-center py-8">
              <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-3"></div>
              <span class="text-sm font-bold text-slate-500 dark:text-slate-400 opacity-80">Загрузка данных...</span>
            </div>
            
            <!-- Карточки статистики -->
            <div v-else-if="stats" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                <p class="text-3xl font-black text-slate-900 dark:text-white">{{ stats.totalStudents }}</p>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Всего сотрудников</p>
              </div>
              <div class="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                <p class="text-3xl font-black text-success">{{ stats.trainedLastMonth }}</p>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">За текущий месяц</p>
              </div>
              <div class="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                <p class="text-3xl font-black text-info">{{ stats.trainedLast3Months }}</p>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">За 3 месяца</p>
              </div>
              <div class="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                <p class="text-3xl font-black text-primary">{{ stats.totalCertificates }}</p>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Всего сертификатов</p>
              </div>
            </div>
            
            <!-- Нет данных -->
            <div v-else class="text-center py-6 text-sm font-medium text-slate-500 dark:text-slate-400">
              Не удалось загрузить детальную статистику
            </div>
          </div>
        </div>

        <!-- Популярные курсы & Последние сертификаты Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Популярные курсы -->
          <div v-if="popularCourses?.length" class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col">
            <div class="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
              <div class="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
                <Star class="w-4 h-4" />
              </div>
              <h4 class="font-bold text-slate-900 dark:text-white text-sm">Топ курсов организации</h4>
            </div>
            <div class="p-2 grow">
              <div 
                v-for="(course, index) in popularCourses" 
                :key="index"
                class="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors"
              >
                <div class="flex-1 min-w-0 pr-4">
                  <p class="font-bold text-slate-900 dark:text-white truncate text-sm">{{ course.name }}</p>
                  <p v-if="course.code" class="text-xs font-medium text-slate-500 mt-0.5 font-mono">{{ course.code }}</p>
                </div>
                <span class="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Award class="w-3.5 h-3.5 text-primary" />
                  {{ course.certificatesCount }}
                </span>
              </div>
            </div>
          </div>

          <!-- Последние сертификаты -->
          <div v-if="recentCertificates?.length" class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col">
            <div class="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
              <div class="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center text-success">
                <FileCheck class="w-4 h-4" />
              </div>
              <h4 class="font-bold text-slate-900 dark:text-white text-sm">Новые сертификаты</h4>
            </div>
            <div class="p-2 grow flex flex-col gap-1">
              <div 
                v-for="cert in recentCertificates" 
                :key="cert.id"
                class="flex flex-col p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors"
              >
                <div class="flex items-start justify-between gap-4 mb-1">
                  <p class="font-bold text-slate-900 dark:text-white text-sm truncate">{{ cert.studentName }}</p>
                  <span class="shrink-0 text-xs font-bold text-slate-400">{{ formatShortDate(cert.issueDate) }}</span>
                </div>
                <div class="flex items-center justify-between gap-4 mt-auto">
                  <p class="text-xs font-medium text-slate-500 truncate">{{ cert.courseName }}</p>
                  <span class="shrink-0 font-mono text-[10px] font-bold text-primary bg-primary/5 px-1.5 py-0.5 rounded">{{ cert.certificateNumber }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Контактная информация -->
        <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 overflow-hidden">
          <div class="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
            <h4 class="font-bold text-slate-900 dark:text-white text-sm">Данные организации</h4>
          </div>
          <div class="p-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 gap-y-6">
              <InfoBlock v-if="organization.shortName" label="Краткое название" :value="organization.shortName" />
              <div v-else class="hidden md:block"></div>
              
              <div>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Телефон</p>
                <div class="flex items-center gap-2">
                  <Phone class="w-4 h-4 text-slate-400 shrink-0" />
                  <p class="text-sm font-medium" :class="organization.contactPhone ? 'text-slate-900 dark:text-white' : 'text-slate-400 italic'">
                    {{ organization.contactPhone || 'Не указан' }}
                  </p>
                </div>
              </div>
              
              <div>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email</p>
                <div class="flex items-center gap-2">
                  <Mail class="w-4 h-4 text-slate-400 shrink-0" />
                  <p class="text-sm font-medium" :class="organization.contactEmail ? 'text-slate-900 dark:text-white' : 'text-slate-400 italic'">
                    {{ organization.contactEmail || 'Не указан' }}
                  </p>
                </div>
              </div>
              
              <div v-if="organization.address" class="md:col-span-2 mt-2">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Адрес</p>
                <div class="flex items-start gap-2">
                  <MapPin class="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p class="text-sm font-medium text-slate-900 dark:text-white">
                    {{ organization.address }}
                  </p>
                </div>
              </div>

              <div v-if="organization.description" class="md:col-span-2 mt-2">
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
import { ref, watch, defineComponent, h } from 'vue';
import { 
  Building2, Users, CheckCircle, XCircle, TrendingUp, Star, Award, 
  FileCheck, Phone, Mail, MapPin, Clock, RotateCcw, Pencil
} from 'lucide-vue-next';

const { authFetch } = useAuthFetch();

// Helper component for layout
const InfoBlock = defineComponent({
  props: { label: String, value: String },
  setup(props) {
    return () => h('div', {}, [
      h('p', { class: 'text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5' }, props.label),
      h('p', { class: 'text-sm font-medium text-slate-900 dark:text-white' }, props.value || '—')
    ]);
  }
});

const props = defineProps({
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

// Статистика
const loadingStats = ref(false);
const stats = ref(null);
const popularCourses = ref([]);
const recentCertificates = ref([]);

// Загрузка статистики
const fetchStats = async () => {
  if (!props.organization?.id) return;
  
  loadingStats.value = true;
  try {
    const response = await authFetch(
      `/api/organizations/${props.organization.id}/stats`,
      { method: 'GET' }
    );
    
    if (response.success && response.data) {
      stats.value = response.data.stats;
      popularCourses.value = response.data.popularCourses || [];
      recentCertificates.value = response.data.recentCertificates || [];
    }
  } catch (error) {
    console.error('Ошибка загрузки статистики организации:', error);
  } finally {
    loadingStats.value = false;
  }
};

// Загрузка статистики при открытии модалки
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen && props.organization?.id) {
    await fetchStats();
  } else {
    // Сброс при закрытии
    stats.value = null;
    popularCourses.value = [];
    recentCertificates.value = [];
  }
}, { immediate: true });

const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

const formatShortDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

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
