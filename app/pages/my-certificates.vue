<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок -->
    <div class="mb-6">
      <h2 class="text-title-md2 font-bold text-black dark:text-white">
        Мои сертификаты
      </h2>
      <p class="mt-1 text-gray-500 dark:text-gray-400">
        Просмотр и скачивание полученных сертификатов
      </p>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
    </div>

    <!-- Контент -->
    <template v-else>
      <!-- Фильтры -->
      <div class="mb-6 flex flex-wrap gap-4">
        <!-- Фильтр по статусу -->
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600 dark:text-gray-400">Статус:</label>
          <select
            v-model="filterStatus"
            class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Все</option>
            <option value="issued">Выданные</option>
            <option value="revoked">Отозванные</option>
          </select>
        </div>

        <!-- Фильтр по периоду -->
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600 dark:text-gray-400">Период:</label>
          <select
            v-model="filterPeriod"
            class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Все</option>
            <option v-for="period in availablePeriods" :key="period" :value="period">
              {{ period }}
            </option>
          </select>
        </div>
      </div>

      <!-- Пустое состояние -->
      <div 
        v-if="filteredCertificates.length === 0" 
        class="flex flex-col items-center justify-center py-20 rounded-xl bg-white dark:bg-boxdark shadow-md"
      >
        <svg class="w-20 h-20 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
        <h3 class="text-lg font-semibold text-gray-600 dark:text-gray-400">
          {{ filterStatus || filterPeriod ? 'Сертификаты не найдены' : 'У вас пока нет сертификатов' }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-500 mt-1">
          {{ filterStatus || filterPeriod ? 'Попробуйте изменить фильтры' : 'После прохождения обучения здесь появятся ваши сертификаты' }}
        </p>
      </div>

      <!-- Сетка сертификатов -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div
          v-for="cert in filteredCertificates"
          :key="cert.id"
          class="group rounded-xl bg-white dark:bg-boxdark shadow-md overflow-hidden hover:shadow-lg transition-all duration-300"
        >
          <!-- Превью сертификата -->
          <div class="relative aspect-[1.4/1] bg-linear-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 flex items-center justify-center overflow-hidden">
            <!-- Иконка сертификата -->
            <svg class="w-24 h-24 text-primary/40 transform group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>

            <!-- Статус бейдж -->
            <div 
              :class="[
                'absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium',
                cert.status === 'issued' && !isExpired(cert)
                  ? 'bg-success/20 text-success'
                  : cert.status === 'issued' && isExpired(cert)
                    ? 'bg-warning/20 text-warning'
                    : 'bg-danger/20 text-danger'
              ]"
            >
              {{ cert.status === 'issued' 
                ? (isExpired(cert) ? 'Истёк срок' : 'Действителен')
                : 'Отозван' 
              }}
            </div>
          </div>

          <!-- Информация -->
          <div class="p-4">
            <!-- Название курса -->
            <h3 class="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
              {{ cert.courseName }}
            </h3>

            <!-- Номер сертификата -->
            <p v-if="cert.certificateNumber" class="text-xs text-primary dark:text-primary/80 font-medium mb-1">
              № {{ cert.certificateNumber }}
            </p>

            <!-- Группа / Часы -->
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
              <span v-if="cert.groupCode">Группа: {{ cert.groupCode }}</span>
              <span v-if="cert.groupCode && cert.courseHours"> · </span>
              <span v-if="cert.courseHours">{{ cert.courseHours }} ч.</span>
              <span v-if="!cert.groupCode && !cert.courseHours">—</span>
            </p>

            <!-- Даты -->
            <div class="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
              <div class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Выдан: {{ formatDate(cert.issuedAt) }}</span>
              </div>

              <div v-if="cert.expiresAt" class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span :class="{ 'text-warning': isExpired(cert) }">
                  До: {{ formatDate(cert.expiresAt) }}
                </span>
              </div>

              <div v-else class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Бессрочный</span>
              </div>
            </div>

            <!-- Кнопка скачивания -->
            <a
              v-if="cert.status === 'issued' && (cert.fileUrl || cert.id)"
              :href="cert.fileUrl || `/api/certificates/download/${cert.id}`"
              target="_blank"
              class="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Скачать сертификат
            </a>

            <!-- Кнопка для отозванных -->
            <div
              v-else
              class="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              Сертификат отозван
            </div>
          </div>
        </div>
      </div>

      <!-- Статистика внизу -->
      <div v-if="certificates.length > 0" class="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm">
          <p class="text-sm text-gray-500 dark:text-gray-400">Всего</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ certificates.length }}</p>
        </div>
        <div class="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm">
          <p class="text-sm text-gray-500 dark:text-gray-400">Действительных</p>
          <p class="text-2xl font-bold text-success">{{ validCount }}</p>
        </div>
        <div class="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm">
          <p class="text-sm text-gray-500 dark:text-gray-400">Истёк срок</p>
          <p class="text-2xl font-bold text-warning">{{ expiredCount }}</p>
        </div>
        <div class="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm">
          <p class="text-sm text-gray-500 dark:text-gray-400">Отозванных</p>
          <p class="text-2xl font-bold text-danger">{{ revokedCount }}</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
});

useHead({
  title: 'Мои сертификаты',
});

const { authFetch } = useAuthFetch();
const { error: showError } = useNotification();

// Types
interface StudentCertificate {
  id: string;
  certificateNumber: string;
  courseName: string;
  courseCode: string | null;
  courseHours: number | null;
  groupCode: string | null;
  status: 'issued' | 'revoked';
  sourceType: 'group_journal' | 'import' | 'manual';
  issuedAt: string;
  expiresAt: string | null;
  fileUrl: string | null;
}

// State
const loading = ref(true);
const certificates = ref<StudentCertificate[]>([]);
const filterStatus = ref<string>('');
const filterPeriod = ref<string>('');

// Computed
const availablePeriods = computed(() => {
  const periods = new Set<string>();
  certificates.value.forEach(cert => {
    const date = new Date(cert.issuedAt);
    const period = `${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
    periods.add(period);
  });
  return Array.from(periods).sort().reverse();
});

const filteredCertificates = computed(() => {
  let result = [...certificates.value];

  // Фильтр по статусу
  if (filterStatus.value) {
    result = result.filter(c => c.status === filterStatus.value);
  }

  // Фильтр по периоду (mm.yyyy)
  if (filterPeriod.value) {
    const [month, year] = filterPeriod.value.split('.').map(Number);
    result = result.filter(c => {
      const date = new Date(c.issuedAt);
      return date.getMonth() + 1 === month && date.getFullYear() === year;
    });
  }

  return result;
});

const validCount = computed(() => {
  return certificates.value.filter(c => c.status === 'issued' && !isExpired(c)).length;
});

const expiredCount = computed(() => {
  return certificates.value.filter(c => c.status === 'issued' && isExpired(c)).length;
});

const revokedCount = computed(() => {
  return certificates.value.filter(c => c.status === 'revoked').length;
});

// Helpers
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const isExpired = (cert: StudentCertificate): boolean => {
  if (!cert.expiresAt) return false;
  return new Date(cert.expiresAt) < new Date();
};

// Load data
const loadData = async () => {
  loading.value = true;
  try {
    const response = await authFetch<{ success: boolean; certificates: StudentCertificate[] }>('/api/certificates/my');

    if (response.success) {
      certificates.value = response.certificates;
    }
  } catch (e: any) {
    console.error('Error loading certificates:', e);
    showError(e.message || 'Ошибка загрузки сертификатов');
  } finally {
    loading.value = false;
  }
};

// Load on mount
onMounted(() => {
  loadData();
});
</script>
