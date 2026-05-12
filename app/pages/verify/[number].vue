<template>
  <div class="verify-layout">
    <!-- Шапка (компактная) -->
    <header class="verify-header">
      <div class="verify-header-inner">
        <img src="/logo.png" alt="ATC Platform" class="verify-logo" />
        <div class="verify-header-info">
          <span class="verify-header-title">Система верификации ATC</span>
          <span v-if="cert" class="verify-header-number">№ {{ cert.number }}</span>
        </div>
      </div>
      <div class="verify-header-actions">
        <button @click="copyPageLink" class="verify-action-btn" :title="linkCopied ? 'Скопировано!' : 'Копировать ссылку'">
          <svg v-if="!linkCopied" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-green-500">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span class="d-none d-sm-inline">{{ linkCopied ? 'Скопировано' : 'Поделиться' }}</span>
        </button>
      </div>
    </header>

    <main class="verify-container">
      <!-- ЛЕВАЯ ПАНЕЛЬ: ИНФОРМАЦИЯ -->
      <aside class="verify-sidebar">
        <div class="verify-sidebar-scroll">
          <!-- Загрузка -->
          <div v-if="pending" class="verify-info-loading">
            <div class="verify-spinner"></div>
            <p>Проверка подлинности...</p>
          </div>

          <!-- Ошибка -->
          <div v-else-if="error || !data" class="verify-status-box verify-status-box--error">
            <div class="verify-status-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3>Сертификат не найден</h3>
            <p>Документ с номером <strong>{{ number }}</strong> не зарегистрирован в системе.</p>
          </div>

          <!-- Успех / Статусы -->
          <template v-else>
            <!-- Статус блок -->
            <div 
              class="verify-status-box" 
              :class="{
                'verify-status-box--valid':   data.verificationStatus === 'valid',
                'verify-status-box--expired': data.verificationStatus === 'expired',
                'verify-status-box--revoked': data.verificationStatus === 'revoked'
              }"
            >
              <div class="verify-status-icon">
                <svg v-if="data.verificationStatus === 'valid'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-else-if="data.verificationStatus === 'expired'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
              </div>
              <div class="verify-status-text">
                <h3 v-if="data.verificationStatus === 'valid'">Сертификат действителен</h3>
                <h3 v-else-if="data.verificationStatus === 'expired'">Срок действия истёк</h3>
                <h3 v-else>Сертификат отозван</h3>
                <p v-if="cert?.revokedAt && data.verificationStatus === 'revoked'" class="text-xs mt-1">
                  Дата отзыва: {{ formatDate(cert.revokedAt) }}
                </p>
              </div>
            </div>

            <!-- Детали -->
            <div v-if="cert" class="verify-data-sections">
              <div class="verify-data-group">
                <label>Владелец</label>
                <div class="verify-data-value verify-data-value--highlight">{{ cert.student.fullName }}</div>
                <div v-if="cert.student.organization" class="verify-data-subvalue">{{ cert.student.organization }}</div>
              </div>

              <div class="verify-data-group">
                <label>Курс / Программа</label>
                <div class="verify-data-value">{{ cert.course.name }}</div>
                <div v-if="cert.course.hours" class="verify-data-subvalue">{{ cert.course.hours }} ак. часов</div>
              </div>

              <div class="verify-data-grid">
                <div class="verify-data-group">
                  <label>Выдан</label>
                  <div class="verify-data-value">{{ formatDate(cert.issuedAt) }}</div>
                </div>
                <div class="verify-data-group">
                  <label>Действует до</label>
                  <div class="verify-data-value" :class="{ 'verify-text-expired': data.verificationStatus === 'expired' }">
                    {{ cert.expiryDate ? formatDate(cert.expiryDate) : 'Бессрочно' }}
                  </div>
                </div>
              </div>

              <div class="verify-data-group">
                <label>Организация</label>
                <div class="verify-data-value">{{ cert.issuer.organizationName || 'ATC Platform' }}</div>
              </div>
            </div>
          </template>

          <footer class="verify-sidebar-footer">
            <p>© {{ new Date().getFullYear() }} ATC Platform</p>
            <p>ID: {{ number }}</p>
          </footer>
        </div>
      </aside>

      <!-- ПРАВАЯ ПАНЕЛЬ: ДОКУМЕНТ -->
      <section class="verify-content">
        <div v-if="cert?.previewUrl" class="verify-preview-frame">
          <iframe
            :src="cert.previewUrl"
            class="verify-iframe"
            frameborder="0"
            allowfullscreen
          ></iframe>
          
          <div class="verify-preview-actions">
            <a :href="cert.previewUrl" target="_blank" class="verify-preview-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              На весь экран
            </a>
          </div>
        </div>
        <div v-else class="verify-preview-placeholder">
          <div v-if="pending" class="verify-preview-loading">
            <div class="verify-pulse"></div>
            <span>Загрузка документа...</span>
          </div>
          <div v-else class="verify-preview-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>Файл сертификата недоступен для предварительного просмотра</p>
          </div>
        </div>
      </section>
    </main>
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
    { name: "description", content: `Проверка подлинности сертификата № ${number.value}` },
    { name: "robots", content: "noindex, nofollow" },
  ],
});

type CertificateVerifyResponse = {
  success: boolean;
  verificationStatus: 'valid' | 'expired' | 'revoked';
  certificate: CertificatePublic;
}

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
}

const certNum = number.value;
const { data, pending, error } = await useAsyncData(
  `verify-${certNum}`,
  () => ($fetch as any)(`/api/certificates/verify/${certNum}`) as Promise<CertificateVerifyResponse>
);

const cert = computed(() => data.value?.certificate);

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
  setTimeout(() => { linkCopied.value = false; }, 2500);
}
</script>

<style scoped>
.verify-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  overflow: hidden;
  font-family: 'Inter', -apple-system, sans-serif;
}

/* Header */
.verify-header {
  height: 64px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
  z-index: 10;
}

.verify-header-inner {
  display: flex;
  align-items: center;
  gap: 16px;
}

.verify-logo {
  height: 32px;
  width: auto;
}

.verify-header-info {
  display: flex;
  flex-direction: column;
}

.verify-header-title {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.verify-header-number {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.verify-action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f1f5f9;
  border-radius: 8px;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

.verify-action-btn:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.verify-action-btn svg {
  width: 16px;
  height: 16px;
}

/* Container */
.verify-container {
  flex: 1;
  display: grid;
  grid-template-columns: 400px 1fr;
  overflow: hidden;
}

/* Sidebar */
.verify-sidebar {
  background: #fff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.verify-sidebar-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Status Box */
.verify-status-box {
  padding: 24px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 20px;
  text-align: left;
}

.verify-status-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.verify-status-icon svg {
  width: 24px;
  height: 24px;
}

.verify-status-box h3 {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}

.verify-status-box p {
  font-size: 13px;
  margin: 4px 0 0 0;
  line-height: 1.5;
}

/* Status Variations */
.verify-status-box--valid {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}
.verify-status-box--valid .verify-status-icon { background: #dcfce7; color: #16a34a; }

.verify-status-box--expired {
  background: #fffbeb;
  color: #92400e;
  border: 1px solid #fef3c7;
}
.verify-status-box--expired .verify-status-icon { background: #fef3c7; color: #d97706; }

.verify-status-box--revoked {
  background: #fff1f2;
  color: #991b1b;
  border: 1px solid #ffe4e6;
}
.verify-status-box--revoked .verify-status-icon { background: #ffe4e6; color: #dc2626; }

.verify-status-box--error {
  background: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
}
.verify-status-box--error .verify-status-icon { background: #f1f5f9; color: #64748b; }

/* Data Sections */
.verify-data-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.verify-data-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.verify-data-group label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.05em;
}

.verify-data-value {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
}

.verify-data-value--highlight {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
}

.verify-data-subvalue {
  font-size: 13px;
  color: #64748b;
}

.verify-data-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.verify-text-expired {
  color: #b45309;
}

/* Preview Area */
.verify-content {
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  position: relative;
}

.verify-preview-frame {
  width: 100%;
  height: 100%;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
  max-width: 900px;
}

.verify-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.verify-preview-actions {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 5;
}

.verify-preview-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(8px);
  color: #fff;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s;
}

.verify-preview-btn:hover {
  background: rgba(15, 23, 42, 1);
}

.verify-preview-btn svg {
  width: 16px;
  height: 16px;
}

/* Placeholders */
.verify-preview-empty {
  text-align: center;
  color: #94a3b8;
}

.verify-preview-empty svg {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
}

.verify-preview-empty p {
  font-size: 14px;
  max-width: 280px;
}

.verify-preview-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #64748b;
}

.verify-pulse {
  width: 40px;
  height: 40px;
  background: #3b82f6;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.5; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(0.95); opacity: 0.5; }
}

.verify-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Footer */
.verify-sidebar-footer {
  margin-top: auto;
  padding-top: 32px;
  border-top: 1px solid #f1f5f9;
  font-size: 12px;
  color: #94a3b8;
}

.verify-sidebar-footer p { margin: 2px 0; }

/* Mobile */
@media (max-width: 1024px) {
  .verify-layout { height: auto; overflow: auto; }
  .verify-container { grid-template-columns: 1fr; height: auto; overflow: visible; }
  .verify-sidebar { border-right: none; border-bottom: 1px solid #e2e8f0; }
  .verify-content { height: 600px; padding: 20px; }
}

@media (max-width: 640px) {
  .verify-header { padding: 0 16px; }
  .d-none { display: none; }
  .verify-sidebar-scroll { padding: 24px 16px; }
  .verify-content { height: 500px; }
}
</style>
