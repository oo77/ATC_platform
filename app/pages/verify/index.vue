<template>
  <div class="verify-page dark-theme">
    <!-- Шапка -->
    <header class="verify-header">
      <div class="header-container">
        <NuxtLink to="/" class="verify-header-logo-wrap">
          <img src="/logo.png" alt="ATC Platform" class="verify-logo" />
          <span class="verify-header-brand">ATC Platform</span>
        </NuxtLink>
        <NuxtLink to="/auth/login" class="verify-header-login">
          <span>Войти в систему</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </NuxtLink>
      </div>
    </header>

    <main class="verify-index-main">
      <!-- Фоновые декорации -->
      <div class="glow-bg glow-bg-1"></div>
      <div class="glow-bg glow-bg-2"></div>
      <div class="glow-bg glow-bg-3"></div>

      <!-- Hero: поиск -->
      <section class="verify-hero">
        <div class="verify-hero-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          Публичный реестр
        </div>

        <h1 class="verify-hero-title">
          Проверка подлинности<br />
          <span class="text-gradient">сертификата</span>
        </h1>
        <p class="verify-hero-desc">
          Введите уникальный номер документа для мгновенного подтверждения квалификации и получения полной информации
        </p>

        <!-- Форма поиска -->
        <form class="verify-search-form" @submit.prevent="handleSearch" id="verify-search-form" novalidate>
          <div class="verify-search-wrap" :class="{ 'verify-search-wrap--error': fieldError }">
            <svg class="verify-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="verify-cert-input"
              v-model="certNumber"
              type="text"
              class="verify-search-input"
              placeholder="Например: CERT-2024-001234"
              autocomplete="off"
              autocorrect="off"
              spellcheck="false"
              maxlength="100"
              @input="onInput"
              @blur="onBlur"
            />
            <button
              type="submit"
              class="verify-search-btn"
              :disabled="isLoading"
              id="verify-search-submit"
            >
              <span v-if="isLoading" class="verify-search-btn-spinner"></span>
              <span v-else>Найти</span>
            </button>
          </div>
          <p v-if="fieldError" class="verify-field-error">{{ fieldError }}</p>
        </form>

        <div v-if="notFoundMsg" class="verify-not-found">
          <div class="not-found-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <span>{{ notFoundMsg }}</span>
        </div>
      </section>

      <!-- Статистика -->
      <section class="verify-stats">
        <div class="verify-stat-card">
          <div class="stat-icon-wrap icon-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="stat-info">
            <span class="verify-stat-value">{{ stats.totalCertificates.toLocaleString("ru-RU") }}</span>
            <span class="verify-stat-label">Сертификатов</span>
          </div>
        </div>
        
        <div class="verify-stat-card">
          <div class="stat-icon-wrap icon-purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div class="stat-info">
            <span class="verify-stat-value">{{ stats.totalOrganizations.toLocaleString("ru-RU") }}</span>
            <span class="verify-stat-label">Организаций</span>
          </div>
        </div>
        
        <div class="verify-stat-card">
          <div class="stat-icon-wrap icon-emerald">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="stat-info">
            <span class="verify-stat-value">С {{ stats.since }} года</span>
            <span class="verify-stat-label">В работе</span>
          </div>
        </div>
      </section>

      <!-- Как это работает -->
      <section class="verify-steps">
        <h2 class="section-title">Как проверить сертификат</h2>
        <div class="verify-steps-grid">
          <div class="verify-step">
            <div class="verify-step-num">1</div>
            <h3 class="verify-step-heading">Найдите номер</h3>
            <p class="verify-step-desc">Номер указан на лицевой стороне сертификата или зашифрован в QR-коде</p>
          </div>
          <div class="verify-step">
            <div class="verify-step-num">2</div>
            <h3 class="verify-step-heading">Введите или отсканируйте</h3>
            <p class="verify-step-desc">Введите номер в поле поиска выше или перейдите по ссылке в QR-коде</p>
          </div>
          <div class="verify-step">
            <div class="verify-step-num">3</div>
            <h3 class="verify-step-heading">Получите результат</h3>
            <p class="verify-step-desc">Система мгновенно покажет статус, детали курса и владельца</p>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section class="verify-faq">
        <h2 class="section-title">Вопросы и ответы</h2>
        <div class="verify-faq-list">
          <div
            v-for="(item, idx) in faqItems"
            :key="idx"
            class="verify-faq-item"
            :class="{ 'verify-faq-item--open': openFaq === idx }"
          >
            <button class="verify-faq-question" @click="toggleFaq(idx)" :id="`faq-${idx}`">
              <span>{{ item.q }}</span>
              <div class="faq-icon-wrapper">
                <svg class="verify-faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            <div class="verify-faq-answer">
              <div class="faq-answer-inner">{{ item.a }}</div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Футер -->
    <footer class="verify-footer">
      <div class="footer-content">
        <p class="footer-brand">ATC Platform</p>
        <p class="verify-footer-copy">© {{ new Date().getFullYear() }} Все данные защищены. Проверка не сохраняет личную информацию.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "blank" });

useHead({
  title: "Проверка подлинности сертификата — ATC Platform",
  meta: [
    { name: "description", content: "Проверьте подлинность сертификата ATC Platform по его номеру. Мгновенный результат." },
    { name: "robots", content: "index, follow" },
  ],
  link: [
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap",
    },
  ],
});

const router = useRouter();

// ── Форма поиска ──────────────────────────────────────────────
const certNumber  = ref("");
const fieldError  = ref("");
const notFoundMsg = ref("");
const isLoading   = ref(false);

function onInput() {
  // Приводим к верхнему регистру, убираем лишние пробелы
  certNumber.value = certNumber.value.toUpperCase().trim();
  fieldError.value = "";
  notFoundMsg.value = "";
}

function onBlur() {
  if (certNumber.value) validate();
}

function validate(): boolean {
  if (!certNumber.value.trim()) {
    fieldError.value = "Введите номер сертификата";
    return false;
  }
  if (certNumber.value.trim().length < 3) {
    fieldError.value = "Номер должен содержать минимум 3 символа";
    return false;
  }
  fieldError.value = "";
  return true;
}

async function handleSearch() {
  if (!validate()) return;

  isLoading.value = true;
  notFoundMsg.value = "";

  try {
    const num = certNumber.value.trim();
    // Переходим на страницу результата напрямую без preflight-проверки
    await router.push(`/verify/${encodeURIComponent(num)}`);
  } catch (err: any) {
    fieldError.value = "Ошибка навигации. Попробуйте ещё раз.";
  } finally {
    isLoading.value = false;
  }
}

// ── Статистика ────────────────────────────────────────────────
const stats = reactive({ totalCertificates: 0, totalOrganizations: 0, since: new Date().getFullYear() });

onMounted(async () => {
  try {
    const res: any = await $fetch("/api/public/stats");
    if (res?.data) {
      stats.totalCertificates  = res.data.totalCertificates;
      stats.totalOrganizations = res.data.totalOrganizations;
      stats.since              = res.data.since;
    }
  } catch { /* не критично */ }
});

// ── FAQ ───────────────────────────────────────────────────────
const openFaq = ref<number | null>(null);

const faqItems = [
  { q: "Где найти номер сертификата?", a: "Номер сертификата напечатан в нижней части документа и закодирован в QR-коде. Обычно он выглядит как CERT-ГГГГ-XXXXXX." },
  { q: "Что означает статус «Истёк»?", a: "Сертификат является подлинным и был выдан нашей системой, однако его срок действия закончился. Для получения актуального документа необходимо пройти переобучение." },
  { q: "Что делать, если сертификат не найден?", a: "Убедитесь, что номер введён правильно. Если сертификат действительно существует, но не найден — обратитесь в учебный центр по контактам, указанным в документе." },
  { q: "Безопасно ли использовать эту страницу?", a: "Да. Система не собирает персональные данные проверяющего. Все запросы ограничены по частоте для защиты от злоупотреблений." },
];

function toggleFaq(idx: number) {
  openFaq.value = openFaq.value === idx ? null : idx;
}
</script>

<style scoped>
/* ── Базовые ── */
.verify-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0f172a;
  color: #f8fafc;
  font-family: "Montserrat", -apple-system, BlinkMacSystemFont, sans-serif;
  overflow-x: hidden;
  position: relative;
}

/* ── Декорации (Glassmorphism / Glow) ── */
.glow-bg {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  z-index: 0;
  opacity: 0.6;
  pointer-events: none;
}

.glow-bg-1 {
  top: -10%;
  left: -10%;
  width: 50vw;
  height: 50vw;
  background: rgba(37, 99, 235, 0.15); /* Blue */
}

.glow-bg-2 {
  top: 40%;
  right: -20%;
  width: 60vw;
  height: 60vw;
  background: rgba(147, 51, 234, 0.1); /* Purple */
}

.glow-bg-3 {
  bottom: -20%;
  left: 20%;
  width: 40vw;
  height: 40vw;
  background: rgba(16, 185, 129, 0.1); /* Emerald */
}

/* ── Шапка ── */
.verify-header {
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.verify-header-logo-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  transition: opacity 0.2s;
}

.verify-header-logo-wrap:hover {
  opacity: 0.8;
}

.verify-logo { 
  height: 36px; 
  width: auto; 
  object-fit: contain; 
}

.verify-header-brand {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.02em;
}

.verify-header-login {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  text-decoration: none;
  padding: 10px 20px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all .2s ease;
}

.verify-header-login svg {
  width: 16px;
  height: 16px;
  transition: transform 0.2s ease;
}

.verify-header-login:hover { 
  background: rgba(255, 255, 255, 0.15); 
  border-color: rgba(255, 255, 255, 0.2); 
}

.verify-header-login:hover svg {
  transform: translateX(3px);
}

/* ── Основной контент ── */
.verify-index-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 20px 80px;
  gap: 60px;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  z-index: 10;
  position: relative;
}

/* ── Hero ── */
.verify-hero {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-top: 80px;
  gap: 20px;
}

.verify-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(37, 99, 235, 0.15);
  color: #60a5fa;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.verify-hero-badge svg { 
  width: 16px; 
  height: 16px; 
}

.verify-hero-title {
  font-size: clamp(32px, 6vw, 56px);
  font-weight: 800;
  color: #fff;
  line-height: 1.15;
  margin: 0;
  letter-spacing: -0.01em;
}

.text-gradient {
  background: linear-gradient(135deg, #60a5fa 0%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.verify-hero-desc {
  font-size: 16px;
  color: #94a3b8;
  max-width: 540px;
  line-height: 1.6;
  margin: 0;
}

/* ── Форма поиска ── */
.verify-search-form { 
  width: 100%; 
  max-width: 640px; 
  display: flex; 
  flex-direction: column; 
  gap: 8px; 
  margin-top: 10px;
}

.verify-search-wrap {
  display: flex;
  align-items: center;
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 8px 8px 8px 20px;
  gap: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  transition: all .2s ease;
}

.verify-search-wrap:focus-within { 
  border-color: #3b82f6; 
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15), 0 4px 20px rgba(0, 0, 0, 0.3); 
  background: rgba(30, 41, 59, 0.9);
}

.verify-search-wrap--error { 
  border-color: #ef4444; 
}

.verify-search-icon { 
  width: 20px; 
  height: 20px; 
  color: #64748b; 
}

.verify-search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  font-weight: 500;
  color: #fff;
  background: transparent;
  font-family: "Montserrat", sans-serif;
  letter-spacing: .02em;
}

.verify-search-input::placeholder { 
  color: #64748b; 
  font-weight: 400; 
}

.verify-search-btn {
  flex-shrink: 0;
  padding: 12px 28px;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  font-family: "Montserrat", sans-serif;
  border: none;
  cursor: pointer;
  transition: all .2s ease;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.verify-search-btn:hover:not(:disabled) { 
  transform: translateY(-2px); 
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.5); 
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
}

.verify-search-btn:active:not(:disabled) {
  transform: translateY(0);
}

.verify-search-btn:disabled { 
  opacity: .7; 
  cursor: not-allowed; 
}

.verify-search-btn-spinner {
  width: 18px; 
  height: 18px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .8s linear infinite;
}

@keyframes spin { 
  to { transform: rotate(360deg); } 
}

.verify-field-error { 
  font-size: 13px; 
  color: #ef4444; 
  text-align: left; 
  margin: 4px 0 0 16px; 
  font-weight: 500;
}

.verify-not-found {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  font-weight: 500;
  color: #fca5a5;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
  padding: 14px 20px;
  width: 100%;
  max-width: 640px;
  text-align: left;
  backdrop-filter: blur(8px);
}

.not-found-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #f87171;
}

.not-found-icon svg {
  width: 18px;
  height: 18px;
}

/* ── Статистика ── */
.verify-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  width: 100%;
}

.verify-stat-card {
  background: rgba(30, 41, 59, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s, background 0.2s;
}

.verify-stat-card:hover {
  background: rgba(30, 41, 59, 0.8);
  transform: translateY(-2px);
}

.stat-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon-wrap svg {
  width: 24px;
  height: 24px;
}

.icon-blue { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
.icon-purple { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
.icon-emerald { background: rgba(16, 185, 129, 0.15); color: #34d399; }

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.verify-stat-value { 
  font-size: 22px; 
  font-weight: 800; 
  color: #fff; 
}

.verify-stat-label { 
  font-size: 13px; 
  color: #94a3b8; 
  font-weight: 500; 
}

/* ── Как работает ── */
.verify-steps { 
  width: 100%; 
}

.section-title {
  font-size: 24px; 
  font-weight: 700; 
  color: #fff;
  margin: 0 0 24px; 
  text-align: center;
}

.verify-steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.verify-step {
  background: rgba(30, 41, 59, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s, background 0.2s;
}

.verify-step:hover {
  background: rgba(30, 41, 59, 0.8);
  transform: translateY(-2px);
}

.verify-step-num {
  width: 44px; 
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: #60a5fa;
  font-size: 20px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.verify-step-heading { 
  font-size: 16px; 
  font-weight: 700; 
  color: #fff; 
  margin: 0; 
}

.verify-step-desc { 
  font-size: 14px; 
  color: #94a3b8; 
  line-height: 1.5; 
  margin: 0; 
}

/* ── FAQ ── */
.verify-faq { 
  width: 100%; 
}

.verify-faq-list { 
  display: flex; 
  flex-direction: column; 
  gap: 12px; 
}

.verify-faq-item {
  background: rgba(30, 41, 59, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.verify-faq-item:hover {
  background: rgba(30, 41, 59, 0.8);
}

.verify-faq-item--open {
  border-color: rgba(59, 130, 246, 0.3);
  background: rgba(30, 41, 59, 0.8);
}

.verify-faq-question {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  text-align: left;
  gap: 16px;
  font-family: inherit;
}

.faq-icon-wrapper {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s;
}

.verify-faq-question:hover .faq-icon-wrapper {
  background: rgba(255, 255, 255, 0.1);
}

.verify-faq-chevron {
  width: 16px; 
  height: 16px; 
  color: #94a3b8;
  transition: transform .3s ease;
}

.verify-faq-item--open .verify-faq-chevron { 
  transform: rotate(180deg); 
  color: #60a5fa;
}

.verify-faq-answer {
  max-height: 0;
  overflow: hidden;
  transition: max-height .3s ease;
}

.faq-answer-inner {
  font-size: 14px;
  color: #cbd5e1;
  line-height: 1.6;
  padding: 0 24px 20px;
}

.verify-faq-item--open .verify-faq-answer {
  max-height: 300px;
}

/* ── Футер ── */
.verify-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding: 24px;
  text-align: center;
  z-index: 10;
  position: relative;
}

.footer-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.footer-brand {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.verify-footer-copy { 
  font-size: 12px;
  color: #64748b;
  margin: 0; 
}

/* ── Адаптив ── */
@media (max-width: 768px) {
  .verify-steps-grid { grid-template-columns: 1fr; }
  .verify-stats { grid-template-columns: 1fr; }
}

@media (max-width: 600px) {
  .verify-hero { padding-top: 40px; }
  .verify-hero-title { font-size: 32px; }
  .verify-search-wrap { flex-direction: column; padding: 12px; gap: 12px; }
  .verify-search-input { width: 100%; text-align: center; padding: 8px 0; }
  .verify-search-icon { display: none; }
  .verify-search-btn { width: 100%; }
}
</style>
