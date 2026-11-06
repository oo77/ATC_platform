<template>
  <!-- Обёртка без двойного отступа (отступы задаёт layout) -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Единый заголовок вместо h2 text-title-md2 -->
    <UiPageHeader title="Мои сертификаты" description="Просмотр и скачивание полученных сертификатов" />

    <!-- Загрузка -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
    </div>

    <!-- Контент -->
    <template v-else>
      <!-- Метрики одной плоской строкой (UiStat вместо 4 самодельных карточек) -->
      <div v-if="certificates.length > 0" class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <UiStat label="Всего" :value="certificates.length" />
        <UiStat label="Действительных" :value="validCount" tone="success" />
        <UiStat label="Истёк срок" :value="expiredCount" tone="warning" />
        <UiStat label="Отозванных" :value="revokedCount" tone="danger" />
      </div>

      <!-- Фильтры: контролы h-9, единый стиль -->
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600 dark:text-gray-400">Статус:</label>
          <select
            v-model="filterStatus"
            class="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            <option value="">Все</option>
            <option value="issued">Выданные</option>
            <option value="revoked">Отозванные</option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600 dark:text-gray-400">Период:</label>
          <select
            v-model="filterPeriod"
            class="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            <option value="">Все</option>
            <option v-for="period in availablePeriods" :key="period" :value="period">{{ period }}</option>
          </select>
        </div>
      </div>

      <!-- Пустое состояние: общий компонент -->
      <div
        v-if="filteredCertificates.length === 0"
        class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <UiEmptyState
          :icon="BadgeCheck"
          :title="filterStatus || filterPeriod ? 'Сертификаты не найдены' : 'У вас пока нет сертификатов'"
          :description="filterStatus || filterPeriod ? 'Попробуйте изменить фильтры' : 'После прохождения обучения здесь появятся ваши сертификаты'"
        />
      </div>

      <!-- Сетка сертификатов: плоские карточки без градиентов и масштабирования -->
      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="cert in filteredCertificates"
          :key="cert.id"
          class="overflow-hidden rounded-xl border border-gray-200 bg-white transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700"
        >
          <!-- Превью сертификата: спокойная плашка вместо градиента -->
          <div class="relative flex aspect-[2/1] items-center justify-center bg-primary/5 dark:bg-primary/10">
            <BadgeCheck class="h-16 w-16 text-primary/40" />

            <!-- Статус через UiBadge -->
            <div class="absolute right-3 top-3">
              <UiBadge
                size="sm"
                :color="cert.status === 'issued' ? (isExpired(cert) ? 'warning' : 'success') : 'error'"
              >
                {{ cert.status === "issued" ? (isExpired(cert) ? "Истёк срок" : "Действителен") : "Отозван" }}
              </UiBadge>
            </div>
          </div>

          <!-- Информация -->
          <div class="p-4">
            <h3 class="mb-2 line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">{{ cert.courseName }}</h3>

            <p v-if="cert.certificateNumber" class="mb-1 text-xs font-medium text-primary">№ {{ cert.certificateNumber }}</p>

            <p class="mb-3 text-sm text-gray-500 dark:text-gray-400">
              <span v-if="cert.groupCode">Группа: {{ cert.groupCode }}</span>
              <span v-if="cert.groupCode && cert.courseHours"> · </span>
              <span v-if="cert.courseHours">{{ cert.courseHours }} ч.</span>
              <span v-if="!cert.groupCode && !cert.courseHours">—</span>
            </p>

            <!-- Даты -->
            <div class="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
              <div class="flex items-center gap-1">
                <CalendarDays class="h-4 w-4" />
                <span>Выдан: {{ formatDate(cert.issuedAt) }}</span>
              </div>

              <div v-if="cert.expiresAt" class="flex items-center gap-1">
                <Clock class="h-4 w-4" />
                <span :class="{ 'text-warning': isExpired(cert) }">До: {{ formatDate(cert.expiresAt) }}</span>
              </div>

              <div v-else class="flex items-center gap-1">
                <Check class="h-4 w-4" />
                <span>Бессрочный</span>
              </div>
            </div>

            <!-- Главное действие — скачать (primary), «Поделиться» — вторичное -->
            <a
              v-if="cert.status === 'issued' && cert.id"
              :href="`/api/certificates/download/${cert.id}`"
              target="_blank"
              class="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              <Download class="h-4 w-4" />
              Скачать сертификат
            </a>

            <!-- Кнопка «Поделиться» (только если есть номер сертификата) -->
            <button
              v-if="cert.certificateNumber"
              @click="shareVerifyLink(cert.certificateNumber)"
              class="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.04]"
              :id="`share-cert-${cert.id}`"
            >
              <Share2 class="h-4 w-4" />
              {{ copiedId === cert.certificateNumber ? 'Ссылка скопирована!' : 'Поделиться ссылкой' }}
            </button>

            <!-- Исправление: блок «отозван» раньше был v-else-if к кнопке «Поделиться» и не показывался
                 у отозванных сертификатов с номером; теперь это независимое условие -->
            <div
              v-if="cert.status === 'revoked'"
              class="mt-2 inline-flex h-9 w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 text-sm text-gray-500 dark:bg-white/[0.06] dark:text-gray-400"
            >
              <Ban class="h-4 w-4" />
              Сертификат отозван
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
// Иконки lucide вместо inline-SVG (единый набор; нужны для переработанного шаблона)
import { BadgeCheck, CalendarDays, Clock, Check, Download, Share2, Ban } from "lucide-vue-next";

definePageMeta({
  layout: "default",
});

useHead({
  title: "Мои сертификаты",
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
  status: "issued" | "revoked";
  sourceType: "group_journal" | "import" | "manual";
  issuedAt: string;
  expiresAt: string | null;
  fileUrl: string | null;
}

// State
const loading = ref(true);
const certificates = ref<StudentCertificate[]>([]);
const filterStatus = ref<string>("");
const filterPeriod = ref<string>("");

// Computed
const availablePeriods = computed(() => {
  const periods = new Set<string>();
  certificates.value.forEach((cert) => {
    const date = new Date(cert.issuedAt);
    const period = `${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}.${date.getFullYear()}`;
    periods.add(period);
  });
  return Array.from(periods).sort().reverse();
});

const filteredCertificates = computed(() => {
  let result = [...certificates.value];

  // Фильтр по статусу
  if (filterStatus.value) {
    result = result.filter((c) => c.status === filterStatus.value);
  }

  // Фильтр по периоду (mm.yyyy)
  if (filterPeriod.value) {
    const [month, year] = filterPeriod.value.split(".").map(Number);
    result = result.filter((c) => {
      const date = new Date(c.issuedAt);
      return date.getMonth() + 1 === month && date.getFullYear() === year;
    });
  }

  return result;
});

const validCount = computed(() => {
  return certificates.value.filter(
    (c) => c.status === "issued" && !isExpired(c)
  ).length;
});

const expiredCount = computed(() => {
  return certificates.value.filter((c) => c.status === "issued" && isExpired(c))
    .length;
});

const revokedCount = computed(() => {
  return certificates.value.filter((c) => c.status === "revoked").length;
});

// Helpers
const formatDate = (dateStr: string): string => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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
    const response = await authFetch<{
      success: boolean;
      certificates: StudentCertificate[];
    }>("/api/certificates/my");

    if (response.success) {
      certificates.value = response.certificates;
    }
  } catch (e: any) {
    console.error("Error loading certificates:", e);
    showError(e.message || "Ошибка загрузки сертификатов");
  } finally {
    loading.value = false;
  }
};

// Поделиться ссылкой верификации
const copiedId = ref<string | null>(null);

async function shareVerifyLink(certNumber: string) {
  const url = `${window.location.origin}/verify/${encodeURIComponent(certNumber)}`;
  try {
    await navigator.clipboard.writeText(url);
    copiedId.value = certNumber;
    setTimeout(() => { copiedId.value = null; }, 2500);
  } catch {
    // fallback для браузеров без Clipboard API
    const el = document.createElement("input");
    el.value = url;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    copiedId.value = certNumber;
    setTimeout(() => { copiedId.value = null; }, 2500);
  }
}

// Load on mount
onMounted(() => {
  loadData();
});
</script>
