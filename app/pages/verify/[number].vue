<template>
  <div class="verify-layout">
    <!-- Загрузка -->
    <div v-if="pending" class="verify-loading-screen">
      <div class="verify-spinner"></div>
      <p>Загрузка документа...</p>
    </div>

    <!-- Сертификат не найден в реестре -->
    <div v-else-if="notFound" class="verify-error-screen">
      <div class="verify-error-box">
        <img src="/logo.png" alt="ATC Platform" class="verify-error-logo" />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <span class="verify-status status-revoked verify-status-lg">Недействителен</span>
        <h3>Сертификат не найден в реестре</h3>
        <p>
          Сертификат № <strong>{{ number }}</strong> не зарегистрирован в
          реестре выданных сертификатов. Подлинность документа
          не подтверждена.
        </p>
        <p class="verify-error-note">
          Проверьте правильность номера. Если документ был предъявлен вам
          как действительный, обратитесь в учебный центр, выдавший сертификат.
        </p>
      </div>
    </div>

    <!-- Сбой проверки (сеть, сервер, лимит запросов) -->
    <div v-else-if="error || !data" class="verify-error-screen">
      <div class="verify-error-box">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="icon-warn"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <h3>Не удалось выполнить проверку</h3>
        <p>
          Сервис проверки временно недоступен. Повторите попытку через
          несколько минут.
        </p>
        <button class="verify-btn btn-secondary verify-retry" @click="refresh()">
          Повторить
        </button>
      </div>
    </div>

    <!-- Показ сертификата -->
    <div v-else class="verify-preview-screen">
      <!-- Верхняя панель управления -->
      <header class="verify-topbar">
        <div class="verify-topbar-info">
          <img src="/logo.png" alt="ATC Platform" class="verify-logo" />
          <div class="verify-topbar-text">
            <h1 class="verify-title">Сертификат № {{ cert?.number }}</h1>
            <span
              class="verify-status"
              :class="'status-' + data.verificationStatus"
            >
              {{ statusText }}
            </span>
          </div>
        </div>

        <div class="verify-topbar-actions">
          <button @click="copyPageLink" class="verify-btn btn-secondary">
            <svg
              v-if="!linkCopied"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <svg
              v-else
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="icon-success"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span class="d-none d-sm-inline">{{
              linkCopied ? "Скопировано" : "Поделиться"
            }}</span>
          </button>

          <a
            v-if="cert?.number"
            :href="'/api/public/cert-download/' + encodeURIComponent(cert.number)"
            class="verify-btn btn-primary"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span class="d-none d-sm-inline">Скачать сертификат</span>
          </a>
        </div>
      </header>

      <!-- Подробная информация (Сверху) -->
      <section v-if="cert" class="verify-details-banner">
        <div class="verify-details-inner">
          <div class="verify-detail-item">
            <span class="detail-label">Владелец</span>
            <span class="detail-value highlight">{{ cert.student.fullName }}</span>
            <span v-if="cert.student.organization" class="detail-sub">{{ cert.student.organization }}</span>
          </div>
          
          <div class="verify-detail-item">
            <span class="detail-label">Курс / Программа</span>
            <span class="detail-value">{{ cert.course.name || '—' }}</span>
            <span v-if="cert.course.hours" class="detail-sub">{{ cert.course.hours }} ак. часов</span>
          </div>
          
          <div v-if="cert.group.startDate || cert.group.endDate" class="verify-detail-item">
            <span class="detail-label">Период обучения</span>
            <span class="detail-value">
              {{ formatDate(cert.group.startDate) }} — {{ formatDate(cert.group.endDate) }}
            </span>
          </div>

          <div class="verify-detail-item">
            <span class="detail-label">Дата выдачи</span>
            <span class="detail-value">{{ formatDate(cert.issueDate || cert.issuedAt) }}</span>
            <span class="detail-sub">Выдан: {{ cert.issuer.organizationName || 'ATC Platform' }}</span>
          </div>
        </div>
      </section>

      <!-- Сам сертификат -->
      <main class="verify-main-content">
        <div v-if="previewState === 'loading'" class="verify-empty-preview">
          <div class="verify-spinner"></div>
          <p>Загрузка сертификата...</p>
        </div>
        <div v-else-if="previewState === 'ready' && previewPages.length" class="verify-pages">
          <figure
            v-for="(src, i) in previewPages"
            :key="i"
            class="verify-page"
          >
            <img
              :src="src"
              :alt="`Сертификат № ${cert?.number}, страница ${i + 1}`"
              class="verify-cert-image"
            />
            <figcaption v-if="previewPages.length > 1" class="verify-page-label">
              Страница {{ i + 1 }} из {{ previewPages.length }}
            </figcaption>
          </figure>
        </div>
        <div v-else class="verify-empty-preview">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p>Файл сертификата недоступен для показа</p>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "blank",
  auth: false, // Отключаем проверку авторизации
});

const route = useRoute();
const number = computed(() => route.params.number as string);

useHead({
  title: `Верификация сертификата ${number.value}`,
  meta: [
    {
      name: "description",
      content: `Проверка подлинности сертификата № ${number.value}`,
    },
    { name: "robots", content: "noindex, nofollow" },
  ],
  link: [
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap",
    },
  ],
});

type CertificatePublic = {
  number: string;
  issueDate: string;
  expiryDate: string | null;
  issuedAt: string | null;
  revokedAt: string | null;
  revokeReason: string | null;
  student: {
    fullName: string;
    organization: string | null;
    position: string | null;
  };
  group: {
    code: string | null;
    startDate: string | null;
    endDate: string | null;
  };
  course: {
    name: string | null;
    code: string | null;
    hours: number | null;
  };
  issuer: { organizationName: string | null };
  previewUrl: string;
};

type CertificateVerifyResponse = {
  success: boolean;
  verificationStatus: "valid" | "expired" | "revoked";
  certificate: CertificatePublic;
};

const certNum = number.value;
const { data, pending, error, refresh } = await useAsyncData(
  `verify-${certNum}`,
  () =>
    ($fetch as any)(
      `/api/certificates/verify/${encodeURIComponent(certNum)}`,
    ) as Promise<CertificateVerifyResponse>,
);

const cert = computed(() => data.value?.certificate);

// 404 — номера нет в реестре; прочие ошибки (сеть, 429, 500) — сбой проверки
const notFound = computed(() => {
  const e = error.value as any;
  return (e?.statusCode ?? e?.status) === 404;
});

// Сертификат показываем картинкой, отрисованной через pdf.js:
// мобильные браузеры не умеют показывать PDF во <iframe>
// Все страницы сертификата (у части шаблонов их две: на узбекском и английском)
const previewPages = ref<string[]>([]);
const previewState = ref<"loading" | "ready" | "failed">("loading");

async function loadPreview(url: string) {
  previewState.value = "loading";
  const width = Math.min(Math.max(window.innerWidth, 800), 1600);
  const pages = await renderDocumentPages(url, width);
  previewPages.value.forEach((u) => URL.revokeObjectURL(u));
  previewPages.value = pages;
  previewState.value = pages.length ? "ready" : "failed";
}

onMounted(() => {
  watch(
    () => cert.value?.previewUrl,
    (url) => {
      if (url) loadPreview(url);
      else previewState.value = "failed";
    },
    { immediate: true },
  );
});

const statusText = computed(() => {
  if (data.value?.verificationStatus === "valid") return "Действителен";
  if (data.value?.verificationStatus === "expired") return "Истёк срок";
  if (data.value?.verificationStatus === "revoked") return "Отозван";
  return "";
});

const formatDate = (dateStr: string | Date | null | undefined): string => {
  if (!dateStr) return "—";
  // Календарная дата YYYY-MM-DD — форматируем как есть, без часового пояса
  if (typeof dateStr === "string") {
    const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return `${m[3]}.${m[2]}.${m[1]}`;
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const linkCopied = ref(false);
async function copyPageLink() {
  const url = window.location.href;
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    const el = document.createElement("input");
    el.value = url;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }
  linkCopied.value = true;
  setTimeout(() => {
    linkCopied.value = false;
  }, 2500);
}
</script>

<style scoped>
.verify-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0f172a; /* Темный премиальный фон */
  font-family: "Montserrat", -apple-system, sans-serif;
  overflow: hidden;
}

/* Loading & Error */
.verify-loading-screen,
.verify-error-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.verify-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.verify-error-box {
  background: #1e293b;
  padding: 32px;
  border-radius: 16px;
  text-align: center;
  max-width: 400px;
  border: 1px solid #334155;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.verify-error-box svg {
  width: 48px;
  height: 48px;
  color: #ef4444;
  margin-bottom: 16px;
}

.verify-error-box h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px;
  font-family: "Montserrat", sans-serif;
}

.verify-error-box p {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
  line-height: 1.5;
}

.verify-error-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 460px;
  margin: 0 16px;
}

.verify-error-logo {
  height: 36px;
  width: auto;
  margin-bottom: 24px;
}

.verify-error-box .verify-status-lg {
  font-size: 13px;
  padding: 4px 12px;
  margin-bottom: 12px;
}

.verify-error-box .verify-error-note {
  margin-top: 12px;
  font-size: 13px;
  color: #64748b;
}

.verify-error-box svg.icon-warn {
  color: #fbbf24;
}

.verify-retry {
  margin-top: 20px;
}

/* Main Preview Layout */
.verify-preview-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.verify-topbar {
  height: 72px;
  background: rgba(15, 23, 42, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
  z-index: 10;
}

.verify-topbar-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.verify-logo {
  height: 32px;
  width: auto;
}

.verify-topbar-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.verify-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin: 0;
  font-family: "Montserrat", sans-serif;
}

.verify-status {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
  width: fit-content;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-valid {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}
.status-expired {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}
.status-revoked {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.verify-topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.verify-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: "Montserrat", sans-serif;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  text-decoration: none;
}

.verify-btn svg {
  width: 18px;
  height: 18px;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-primary {
  background: #3b82f6;
  color: #fff;
}

.btn-primary:hover {
  background: #2563eb;
}

.icon-success {
  color: #4ade80;
}

/* Banner details */
.verify-details-banner {
  background: #1e293b;
  border-bottom: 1px solid #334155;
  padding: 20px 24px;
  flex-shrink: 0;
  z-index: 5;
}

.verify-details-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
}

.verify-detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.05em;
}

.detail-value {
  font-size: 15px;
  font-weight: 600;
  color: #f8fafc;
  line-height: 1.4;
}

.detail-value.highlight {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.text-expired {
  color: #fbbf24;
}

.detail-sub {
  font-size: 13px;
  color: #cbd5e1;
}

/* Content */
.verify-main-content {
  flex: 1;
  min-height: 0;
  padding: 24px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow-y: auto;
  background: #0f172a;
}

/* Страницы сертификата одна под другой, область прокручивается */
.verify-pages {
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.verify-page {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.verify-cert-image {
  display: block;
  width: 100%;
  height: auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.verify-page-label {
  font-size: 12px;
  color: #94a3b8;
}

.verify-empty-preview {
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #64748b;
}

.verify-empty-preview svg {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.verify-empty-preview p {
  font-size: 16px;
  font-family: "Montserrat", sans-serif;
}

@media (max-width: 768px) {
  .verify-details-inner {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  /* На телефоне страница прокручивается целиком, сертификат — во всю ширину */
  .verify-layout {
    height: auto;
    min-height: 100vh;
    overflow: visible;
  }
  .verify-main-content {
    overflow: visible;
  }
}

@media (max-width: 640px) {
  .verify-topbar {
    padding: 0 16px;
  }
  .verify-logo {
    display: none;
  }
  .verify-main-content {
    padding: 12px;
  }
  .d-none {
    display: none;
  }
  .verify-btn {
    padding: 10px;
  }
}
</style>
