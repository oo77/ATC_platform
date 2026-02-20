<template>
  <div class="verify-page">
    <!-- Шапка -->
    <header class="verify-header">
      <img src="/logo.png" alt="ATC Platform" class="verify-logo" />
      <span class="verify-header-title">Проверка подлинности сертификата</span>
    </header>

    <!-- Контент -->
    <main class="verify-main">
      <!-- Загрузка -->
      <div v-if="pending" class="verify-card verify-card--loading">
        <div class="verify-spinner"></div>
        <p class="verify-loading-text">Проверяем сертификат...</p>
      </div>

      <!-- Ошибка: не найден -->
      <div v-else-if="error || !data" class="verify-card verify-card--error">
        <div class="verify-icon-wrap verify-icon-wrap--error">
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
        </div>
        <h1 class="verify-status-title verify-status-title--error">
          Сертификат не найден
        </h1>
        <p class="verify-status-desc">
          Сертификат с номером <strong>{{ number }}</strong> не существует в
          нашей базе данных. Возможно, QR-код повреждён или сертификат является
          поддельным.
        </p>
        <div class="verify-number-badge verify-number-badge--error">
          {{ number }}
        </div>
      </div>

      <!-- Данные сертификата -->
      <template v-else>
        <!-- Статус: действителен -->
        <div
          v-if="data.verificationStatus === 'valid'"
          class="verify-card verify-card--valid"
        >
          <div class="verify-icon-wrap verify-icon-wrap--valid">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>
          <h1 class="verify-status-title verify-status-title--valid">
            Сертификат подлинный
          </h1>
          <p class="verify-status-desc">
            Этот сертификат прошёл проверку и является действительным
            документом.
          </p>
        </div>

        <!-- Статус: истёк -->
        <div
          v-else-if="data.verificationStatus === 'expired'"
          class="verify-card verify-card--expired"
        >
          <div class="verify-icon-wrap verify-icon-wrap--expired">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h1 class="verify-status-title verify-status-title--expired">
            Срок действия истёк
          </h1>
          <p class="verify-status-desc">
            Сертификат подлинный, однако срок его действия истёк.
          </p>
        </div>

        <!-- Статус: отозван -->
        <div
          v-else-if="data.verificationStatus === 'revoked'"
          class="verify-card verify-card--revoked"
        >
          <div class="verify-icon-wrap verify-icon-wrap--revoked">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
          <h1 class="verify-status-title verify-status-title--revoked">
            Сертификат отозван
          </h1>
          <p class="verify-status-desc">
            Этот сертификат был отозван
            <template v-if="cert.revokedAt">
              {{ formatDate(cert.revokedAt) }}</template
            >.
            <template v-if="cert.revokeReason">
              Причина: {{ cert.revokeReason }}
            </template>
          </p>
        </div>

        <!-- Детали сертификата -->
        <div class="verify-details">
          <!-- Номер -->
          <div class="verify-detail-number">
            <span class="verify-detail-number-label">Номер сертификата</span>
            <span class="verify-detail-number-value">{{ cert.number }}</span>
          </div>

          <!-- Данные владельца -->
          <div class="verify-detail-section">
            <h2 class="verify-detail-section-title">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Владелец
            </h2>
            <div class="verify-detail-grid">
              <div class="verify-detail-item">
                <span class="verify-detail-label">ФИО</span>
                <span class="verify-detail-value">{{
                  cert.student.fullName
                }}</span>
              </div>
              <div v-if="cert.student.organization" class="verify-detail-item">
                <span class="verify-detail-label">Организация</span>
                <span class="verify-detail-value">{{
                  cert.student.organization
                }}</span>
              </div>
              <div v-if="cert.student.position" class="verify-detail-item">
                <span class="verify-detail-label">Должность</span>
                <span class="verify-detail-value">{{
                  cert.student.position
                }}</span>
              </div>
            </div>
          </div>

          <!-- Данные курса -->
          <div class="verify-detail-section">
            <h2 class="verify-detail-section-title">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              Курс
            </h2>
            <div class="verify-detail-grid">
              <div
                v-if="cert.course.name"
                class="verify-detail-item verify-detail-item--full"
              >
                <span class="verify-detail-label">Программа</span>
                <span class="verify-detail-value">{{ cert.course.name }}</span>
              </div>
              <div v-if="cert.course.code" class="verify-detail-item">
                <span class="verify-detail-label">Код курса</span>
                <span class="verify-detail-value">{{ cert.course.code }}</span>
              </div>
              <div v-if="cert.course.hours" class="verify-detail-item">
                <span class="verify-detail-label">Объём (часов)</span>
                <span class="verify-detail-value"
                  >{{ cert.course.hours }} ч.</span
                >
              </div>
              <div v-if="cert.group.code" class="verify-detail-item">
                <span class="verify-detail-label">Группа</span>
                <span class="verify-detail-value">{{ cert.group.code }}</span>
              </div>
              <div v-if="cert.group.startDate" class="verify-detail-item">
                <span class="verify-detail-label">Период обучения</span>
                <span class="verify-detail-value">
                  {{ formatDate(cert.group.startDate) }}
                  <template v-if="cert.group.endDate">
                    — {{ formatDate(cert.group.endDate) }}</template
                  >
                </span>
              </div>
            </div>
          </div>

          <!-- Данные о выдаче -->
          <div class="verify-detail-section">
            <h2 class="verify-detail-section-title">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Сведения о документе
            </h2>
            <div class="verify-detail-grid">
              <div
                v-if="cert.issuedAt || cert.issueDate"
                class="verify-detail-item"
              >
                <span class="verify-detail-label">Дата выдачи</span>
                <span class="verify-detail-value">{{
                  formatDate(cert.issuedAt || cert.issueDate)
                }}</span>
              </div>
              <div v-if="cert.expiryDate" class="verify-detail-item">
                <span class="verify-detail-label">Действителен до</span>
                <span
                  class="verify-detail-value"
                  :class="{
                    'verify-expired-date':
                      data.verificationStatus === 'expired',
                  }"
                >
                  {{ formatDate(cert.expiryDate) }}
                </span>
              </div>
              <div v-else class="verify-detail-item">
                <span class="verify-detail-label">Действителен до</span>
                <span class="verify-detail-value">Бессрочно</span>
              </div>
              <div
                v-if="cert.issuer.organizationName"
                class="verify-detail-item verify-detail-item--full"
              >
                <span class="verify-detail-label">Выдан организацией</span>
                <span class="verify-detail-value">{{
                  cert.issuer.organizationName
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Кнопка скачивания PDF -->
        <div
          v-if="data.verificationStatus === 'valid' && cert.id"
          class="verify-download-wrap"
        >
          <a
            :href="`/api/certificates/download/${cert.id}`"
            target="_blank"
            rel="noopener noreferrer"
            class="verify-download-btn"
            id="verify-download-pdf"
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
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Скачать сертификат (PDF)
          </a>
        </div>
      </template>
    </main>

    <!-- Футер -->
    <footer class="verify-footer">
      <p>
        Проверка выполнена автоматически ·
        {{ formatDate(new Date().toISOString()) }}
      </p>
      <p class="verify-footer-system">
        ATC Platform — Система управления обучением
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "blank",
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
});

// Загрузка данных
const { data, pending, error } = await useFetch(
  () => `/api/certificates/verify/${number.value}`,
  { key: `verify-${number.value}` },
);

// Алиас для удобства шаблона
const cert = computed(
  () =>
    data.value?.certificate as
      | {
          id: string;
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
        }
      | undefined,
);

// Форматирование даты
const formatDate = (dateStr: string | Date | null | undefined): string => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
</script>

<style scoped>
/* =============================================
   Базовые переменные
   ============================================= */
.verify-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f4f8;
  font-family:
    "Inter",
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

/* =============================================
   Шапка
   ============================================= */
.verify-header {
  background: #fff;
  border-bottom: 1px solid #e5eaf0;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.verify-logo {
  height: 36px;
  width: auto;
  object-fit: contain;
}

.verify-header-title {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  letter-spacing: 0.01em;
}

/* =============================================
   Основной контент
   ============================================= */
.verify-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 16px;
  gap: 20px;
  max-width: 680px;
  width: 100%;
  margin: 0 auto;
}

/* =============================================
   Карточка статуса
   ============================================= */
.verify-card {
  width: 100%;
  border-radius: 16px;
  padding: 36px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  border: 2px solid transparent;
}

.verify-card--loading {
  background: #fff;
  border-color: #e5eaf0;
}

.verify-card--valid {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-color: #86efac;
}

.verify-card--expired {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border-color: #fcd34d;
}

.verify-card--revoked {
  background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%);
  border-color: #fca5a5;
}

.verify-card--error {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-color: #cbd5e1;
}

/* Иконки статуса */
.verify-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.verify-icon-wrap svg {
  width: 36px;
  height: 36px;
}

.verify-icon-wrap--valid {
  background: #dcfce7;
  color: #16a34a;
}

.verify-icon-wrap--expired {
  background: #fef3c7;
  color: #d97706;
}

.verify-icon-wrap--revoked {
  background: #ffe4e6;
  color: #dc2626;
}

.verify-icon-wrap--error {
  background: #f1f5f9;
  color: #94a3b8;
}

/* Тексты статуса */
.verify-status-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
}

.verify-status-title--valid {
  color: #15803d;
}
.verify-status-title--expired {
  color: #b45309;
}
.verify-status-title--revoked {
  color: #b91c1c;
}
.verify-status-title--error {
  color: #475569;
}

.verify-status-desc {
  font-size: 14px;
  color: #64748b;
  max-width: 420px;
  line-height: 1.6;
  margin: 0;
}

.verify-number-badge {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.03em;
  margin-top: 4px;
}

.verify-number-badge--error {
  background: #e2e8f0;
  color: #475569;
}

/* Спиннер */
.verify-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.verify-loading-text {
  color: #64748b;
  font-size: 14px;
  margin: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* =============================================
   Детали сертификата
   ============================================= */
.verify-details {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.verify-detail-number {
  background: #fff;
  border-radius: 12px;
  padding: 18px 24px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid #e5eaf0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.verify-detail-number-label {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
}

.verify-detail-number-value {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 0.02em;
}

.verify-detail-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  border: 1px solid #e5eaf0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.verify-detail-section-title {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 12px;
}

.verify-detail-section-title svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.verify-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.verify-detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.verify-detail-item--full {
  grid-column: 1 / -1;
}

.verify-detail-label {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
}

.verify-detail-value {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  line-height: 1.4;
}

.verify-expired-date {
  color: #d97706;
}

/* =============================================
   Кнопка скачивания
   ============================================= */
.verify-download-wrap {
  width: 100%;
  display: flex;
  justify-content: center;
}

.verify-download-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 32px;
  border-radius: 12px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
  letter-spacing: 0.01em;
}

.verify-download-btn svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.verify-download-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.45);
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.verify-download-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}

/* =============================================
   Футер
   ============================================= */
.verify-footer {
  background: #fff;
  border-top: 1px solid #e5eaf0;
  padding: 16px 24px;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.6;
}

.verify-footer-system {
  font-weight: 500;
}

/* =============================================
   Адаптив
   ============================================= */
@media (max-width: 480px) {
  .verify-card {
    padding: 24px 20px;
  }

  .verify-status-title {
    font-size: 18px;
  }

  .verify-detail-grid {
    grid-template-columns: 1fr;
  }

  .verify-detail-item--full {
    grid-column: 1;
  }

  .verify-detail-section {
    padding: 16px;
  }

  .verify-detail-number {
    padding: 14px 16px;
  }

  .verify-detail-number-value {
    font-size: 17px;
  }
}
</style>
