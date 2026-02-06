<template>
  <teleport to="body">
    <transition name="tg-modal-fade">
      <div v-if="show" class="tg-modal-overlay" @click.self="close">
        <div class="tg-modal-container">
          <!-- Заголовок -->
          <div class="tg-modal-header">
            <div class="tg-modal-title">
              <div class="tg-student-avatar-lg">
                {{ getInitials(student?.fullName) }}
              </div>
              <div>
                <h2>{{ student?.fullName }}</h2>
                <p class="tg-subtitle">{{ student?.position }}</p>
              </div>
            </div>
            <button class="tg-modal-close" @click="close">
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- Контент -->
          <div class="tg-modal-content">
            <!-- Загрузка -->
            <div v-if="loading" class="tg-loading-block">
              <div class="tg-spinner"></div>
              <p>Загрузка данных...</p>
            </div>

            <!-- Ошибка -->
            <div v-else-if="error" class="tg-error-block">
              <span class="tg-error-icon">⚠️</span>
              <p>{{ error }}</p>
              <button @click="loadDetails" class="tg-btn-retry">
                Повторить
              </button>
            </div>

            <!-- Данные -->
            <template v-else-if="studentDetail">
              <!-- Информация о слушателе -->
              <div class="tg-info-section">
                <h3 class="tg-section-title">
                  <span class="tg-section-icon">👤</span>
                  Информация
                </h3>
                <div class="tg-info-grid">
                  <div class="tg-info-item">
                    <span class="tg-info-label">Должность</span>
                    <span class="tg-info-value">{{
                      studentDetail.position
                    }}</span>
                  </div>
                  <div v-if="studentDetail.department" class="tg-info-item">
                    <span class="tg-info-label">Отдел</span>
                    <span class="tg-info-value">{{
                      studentDetail.department
                    }}</span>
                  </div>
                  <div class="tg-info-item">
                    <span class="tg-info-label">Организация</span>
                    <span class="tg-info-value">{{
                      studentDetail.organizationName
                    }}</span>
                  </div>
                  <div v-if="studentDetail.pinfl" class="tg-info-item">
                    <span class="tg-info-label">ПИНФЛ</span>
                    <span class="tg-info-value tg-pinfl">{{
                      studentDetail.pinfl
                    }}</span>
                  </div>
                  <div v-if="studentDetail.registeredAt" class="tg-info-item">
                    <span class="tg-info-label">В системе с</span>
                    <span class="tg-info-value">{{
                      studentDetail.registeredAt
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- Статистика сертификатов -->
              <div class="tg-stats-section">
                <div class="tg-stat-card tg-stat-total">
                  <span class="tg-stat-value">{{ stats.total }}</span>
                  <span class="tg-stat-label">Всего</span>
                </div>
                <div class="tg-stat-card tg-stat-issued">
                  <span class="tg-stat-value">{{ stats.issued }}</span>
                  <span class="tg-stat-label">Активных</span>
                </div>
                <div
                  v-if="stats.expired > 0"
                  class="tg-stat-card tg-stat-expired"
                >
                  <span class="tg-stat-value">{{ stats.expired }}</span>
                  <span class="tg-stat-label">Истёк срок</span>
                </div>
                <div
                  v-if="stats.revoked > 0"
                  class="tg-stat-card tg-stat-revoked"
                >
                  <span class="tg-stat-value">{{ stats.revoked }}</span>
                  <span class="tg-stat-label">Отозвано</span>
                </div>
              </div>

              <!-- Список сертификатов -->
              <div class="tg-certificates-section">
                <h3 class="tg-section-title">
                  <span class="tg-section-icon">📜</span>
                  Сертификаты
                </h3>

                <div v-if="certificates.length === 0" class="tg-empty-certs">
                  <span class="tg-empty-icon">📭</span>
                  <p>Сертификаты не найдены</p>
                </div>

                <div v-else class="tg-certificates-list">
                  <div
                    v-for="cert in certificates"
                    :key="cert.id"
                    class="tg-cert-card"
                    :class="{
                      'tg-cert-expired': cert.isExpired,
                      'tg-cert-revoked': cert.status === 'revoked',
                    }"
                  >
                    <div class="tg-cert-header">
                      <div class="tg-cert-info">
                        <h4>{{ cert.courseName }}</h4>
                        <span class="tg-cert-number">{{
                          cert.certificateNumber
                        }}</span>
                      </div>
                      <div class="tg-cert-badges">
                        <span
                          v-if="cert.isExpired"
                          class="tg-badge tg-badge-expired"
                        >
                          Истёк
                        </span>
                        <span
                          v-else-if="cert.status === 'revoked'"
                          class="tg-badge tg-badge-revoked"
                        >
                          Отозван
                        </span>
                        <span v-else class="tg-badge tg-badge-active">
                          Активен
                        </span>
                        <span
                          v-if="cert.importSource === 'ai_scan'"
                          class="tg-badge tg-badge-ai"
                        >
                          AI
                        </span>
                      </div>
                    </div>

                    <div class="tg-cert-details">
                      <div class="tg-cert-meta">
                        <span v-if="cert.issueDate" class="tg-meta-item">
                          📅 Выдан: {{ cert.issueDate }}
                        </span>
                        <span v-if="cert.expiryDate" class="tg-meta-item">
                          ⏰ До: {{ cert.expiryDate }}
                        </span>
                        <span v-if="cert.courseHours" class="tg-meta-item">
                          🕐 {{ cert.courseHours }} ч.
                        </span>
                        <span v-if="cert.groupCode" class="tg-meta-item">
                          👥 {{ cert.groupCode }}
                        </span>
                      </div>
                    </div>

                    <!-- Кнопка скачать (если есть PDF) -->
                    <button
                      v-if="cert.hasPdf && cert.status === 'issued'"
                      class="tg-btn-download"
                      @click="downloadCertificate(cert)"
                      :disabled="downloadingId === cert.id"
                    >
                      <div
                        v-if="downloadingId === cert.id"
                        class="tg-spinner-small"
                      ></div>
                      <template v-else>
                        <svg
                          class="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        Скачать
                      </template>
                    </button>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  studentId: {
    type: String,
    default: null,
  },
  student: {
    type: Object,
    default: null,
  },
  organizationId: {
    type: String,
    required: true,
  },
  representativeChatId: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["close"]);

// Состояние
const loading = ref(false);
const error = ref(null);
const studentDetail = ref(null);
const certificates = ref([]);
const stats = ref({ total: 0, issued: 0, expired: 0, revoked: 0 });
const downloadingId = ref(null);

// Загрузка данных при открытии
watch(
  () => [props.show, props.studentId],
  ([isOpen, id]) => {
    if (isOpen && id) {
      loadDetails();
    } else if (!isOpen) {
      // Сброс при закрытии
      studentDetail.value = null;
      certificates.value = [];
      error.value = null;
    }
  },
  { immediate: true },
);

// Получить инициалы
function getInitials(fullName) {
  if (!fullName) return "?";
  const parts = fullName.trim().split(" ");
  if (parts.length >= 2) {
    return parts[0][0] + parts[1][0];
  }
  return fullName[0];
}

// Закрытие модалки
function close() {
  emit("close");
}

// Загрузка деталей
async function loadDetails() {
  if (!props.studentId) return;

  loading.value = true;
  error.value = null;

  try {
    const data = await $fetch(`/api/tg-app/students/${props.studentId}`, {
      params: {
        organizationId: props.organizationId,
      },
    });

    studentDetail.value = data.student;
    certificates.value = data.certificates || [];
    stats.value = data.stats || { total: 0, issued: 0, expired: 0, revoked: 0 };
  } catch (err) {
    console.error("Ошибка загрузки данных слушателя:", err);
    error.value = err.data?.message || "Не удалось загрузить данные";
  } finally {
    loading.value = false;
  }
}

// Скачать сертификат
async function downloadCertificate(cert) {
  if (!cert.hasPdf || !props.representativeChatId) return;

  downloadingId.value = cert.id;

  try {
    const response = await $fetch("/api/tg-app/send-certificate", {
      method: "POST",
      body: {
        certificateId: cert.id,
        chatId: props.representativeChatId,
        pdfUrl: cert.pdfFileUrl,
        studentName: studentDetail.value?.fullName,
        certificateNumber: cert.certificateNumber,
      },
    });

    if (response.success) {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert("Сертификат отправлен в чат!");
      }
    }
  } catch (err) {
    console.error("Ошибка отправки сертификата:", err);
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.showAlert("Ошибка отправки сертификата");
    }
  } finally {
    downloadingId.value = null;
  }
}
</script>

<style scoped>
/* Overlay */
.tg-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  padding: 0;
}

/* Container */
.tg-modal-container {
  background: white;
  width: 100%;
  max-height: 90vh;
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Header */
.tg-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.25rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.tg-modal-title {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.tg-student-avatar-lg {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.125rem;
  color: white;
  flex-shrink: 0;
}

.tg-modal-title h2 {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.125rem 0;
}

.tg-subtitle {
  font-size: 0.8125rem;
  color: #64748b;
  margin: 0;
}

.tg-modal-close {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f1f5f9;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.tg-modal-close:active {
  background: #e2e8f0;
  transform: scale(0.95);
}

/* Content */
.tg-modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

/* Loading & Error */
.tg-loading-block,
.tg-error-block {
  text-align: center;
  padding: 2rem 1rem;
}

.tg-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  margin: 0 auto 1rem;
}

.tg-spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.tg-error-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
}

.tg-error-block p {
  color: #dc2626;
  margin-bottom: 1rem;
}

.tg-btn-retry {
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}

/* Sections */
.tg-section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.75rem 0;
}

.tg-section-icon {
  font-size: 1rem;
}

/* Info Section */
.tg-info-section {
  margin-bottom: 1.25rem;
}

.tg-info-grid {
  background: #f8fafc;
  border-radius: 12px;
  padding: 0.75rem;
}

.tg-info-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e2e8f0;
}

.tg-info-item:last-child {
  border-bottom: none;
}

.tg-info-label {
  font-size: 0.8125rem;
  color: #64748b;
}

.tg-info-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1e293b;
  text-align: right;
}

.tg-pinfl {
  font-family: ui-monospace, monospace;
  background: #f1f5f9;
  padding: 0.125rem 0.5rem;
  border-radius: 6px;
}

/* Stats Section */
.tg-stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  gap: 0.625rem;
  margin-bottom: 1.25rem;
}

.tg-stat-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 0.75rem;
  text-align: center;
  border: 1px solid #e2e8f0;
}

.tg-stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.tg-stat-label {
  display: block;
  font-size: 0.6875rem;
  color: #64748b;
  margin-top: 0.125rem;
}

.tg-stat-total {
  background: #eff6ff;
  border-color: #bfdbfe;
}
.tg-stat-issued {
  background: #f0fdf4;
  border-color: #bbf7d0;
}
.tg-stat-issued .tg-stat-value {
  color: #16a34a;
}
.tg-stat-expired {
  background: #fef3c7;
  border-color: #fcd34d;
}
.tg-stat-expired .tg-stat-value {
  color: #d97706;
}
.tg-stat-revoked {
  background: #fee2e2;
  border-color: #fca5a5;
}
.tg-stat-revoked .tg-stat-value {
  color: #dc2626;
}

/* Certificates Section */
.tg-certificates-section {
  margin-bottom: 1rem;
}

.tg-empty-certs {
  text-align: center;
  padding: 2rem 1rem;
  background: #f8fafc;
  border-radius: 12px;
}

.tg-empty-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
}

.tg-empty-certs p {
  color: #64748b;
  margin: 0;
}

.tg-certificates-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Certificate Card */
.tg-cert-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.875rem;
  position: relative;
  transition: all 0.2s;
}

.tg-cert-card.tg-cert-expired {
  background: #fffbeb;
  border-color: #fcd34d;
}

.tg-cert-card.tg-cert-revoked {
  background: #fef2f2;
  border-color: #fca5a5;
  opacity: 0.75;
}

.tg-cert-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
}

.tg-cert-info h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.125rem 0;
  line-height: 1.3;
}

.tg-cert-number {
  font-size: 0.75rem;
  font-family: ui-monospace, monospace;
  color: #64748b;
  background: #f1f5f9;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
}

.tg-cert-badges {
  display: flex;
  gap: 0.375rem;
  flex-shrink: 0;
}

.tg-badge {
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.tg-badge-active {
  background: #dcfce7;
  color: #16a34a;
}

.tg-badge-expired {
  background: #fef3c7;
  color: #d97706;
}

.tg-badge-revoked {
  background: #fee2e2;
  color: #dc2626;
}

.tg-badge-ai {
  background: #e0e7ff;
  color: #4f46e5;
}

.tg-cert-details {
  margin-bottom: 0.625rem;
}

.tg-cert-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tg-meta-item {
  font-size: 0.75rem;
  color: #64748b;
}

.tg-btn-download {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  width: 100%;
  padding: 0.625rem;
  background: #eff6ff;
  color: #2563eb;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tg-btn-download:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tg-btn-download:not(:disabled):active {
  background: #dbeafe;
  transform: scale(0.98);
}

/* Animations */
.tg-modal-fade-enter-active,
.tg-modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.tg-modal-fade-enter-from,
.tg-modal-fade-leave-to {
  opacity: 0;
}
</style>
