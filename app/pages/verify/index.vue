<template>
  <div class="verify-page">
    <!-- Шапка -->
    <header class="verify-header">
      <NuxtLink to="/" class="verify-header-logo-wrap">
        <img src="/logo.png" alt="ATC Platform" class="verify-logo" />
        <span class="verify-header-brand">ATC Platform</span>
      </NuxtLink>
      <NuxtLink to="/auth/login" class="verify-header-login">
        Войти в систему →
      </NuxtLink>
    </header>

    <main class="verify-index-main">
      <!-- Hero: поиск -->
      <section class="verify-hero">
        <div class="verify-hero-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          Публичный реестр сертификатов
        </div>

        <h1 class="verify-hero-title">Проверка подлинности<br />сертификата</h1>
        <p class="verify-hero-desc">
          Введите номер сертификата для мгновенной проверки его подлинности и статуса
        </p>

        <!-- Форма поиска -->
        <form class="verify-search-form" @submit.prevent="handleSearch" id="verify-search-form" novalidate>
          <div class="verify-search-wrap" :class="{ 'verify-search-wrap--error': fieldError }">
            <svg class="verify-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
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
              <span v-else>Проверить</span>
            </button>
          </div>
          <p v-if="fieldError" class="verify-field-error">{{ fieldError }}</p>
        </form>

        <!-- Результат inline (ошибка или редирект) -->
        <p v-if="notFoundMsg" class="verify-not-found">{{ notFoundMsg }}</p>
      </section>

      <!-- Статистика -->
      <section class="verify-stats">
        <div class="verify-stat-item">
          <span class="verify-stat-value">{{ stats.totalCertificates.toLocaleString("ru-RU") }}</span>
          <span class="verify-stat-label">сертификатов в реестре</span>
        </div>
        <div class="verify-stat-divider"></div>
        <div class="verify-stat-item">
          <span class="verify-stat-value">{{ stats.totalOrganizations.toLocaleString("ru-RU") }}</span>
          <span class="verify-stat-label">организаций</span>
        </div>
        <div class="verify-stat-divider"></div>
        <div class="verify-stat-item">
          <span class="verify-stat-value">с {{ stats.since }} года</span>
          <span class="verify-stat-label">система работает</span>
        </div>
      </section>

      <!-- Как это работает -->
      <section class="verify-steps">
        <h2 class="verify-steps-title">Как проверить сертификат</h2>
        <div class="verify-steps-grid">
          <div class="verify-step">
            <div class="verify-step-num">1</div>
            <h3 class="verify-step-heading">Найдите номер</h3>
            <p class="verify-step-desc">Номер указан на лицевой стороне сертификата или в QR-коде</p>
          </div>
          <div class="verify-step">
            <div class="verify-step-num">2</div>
            <h3 class="verify-step-heading">Введите или отсканируйте</h3>
            <p class="verify-step-desc">Введите номер в поле выше или наведите камеру на QR-код</p>
          </div>
          <div class="verify-step">
            <div class="verify-step-num">3</div>
            <h3 class="verify-step-heading">Получите результат</h3>
            <p class="verify-step-desc">Система мгновенно покажет статус и данные владельца</p>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section class="verify-faq">
        <h2 class="verify-steps-title">Часто задаваемые вопросы</h2>
        <div class="verify-faq-list">
          <div
            v-for="(item, idx) in faqItems"
            :key="idx"
            class="verify-faq-item"
            :class="{ 'verify-faq-item--open': openFaq === idx }"
          >
            <button class="verify-faq-question" @click="toggleFaq(idx)" :id="`faq-${idx}`">
              {{ item.q }}
              <svg class="verify-faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div class="verify-faq-answer">{{ item.a }}</div>
          </div>
        </div>
      </section>
    </main>

    <!-- Футер -->
    <footer class="verify-footer">
      <p>ATC Platform — Система управления обучением</p>
      <p class="verify-footer-copy">Все данные защищены. Проверка не сохраняет личную информацию проверяющего.</p>
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

  isLoading.value   = true;
  notFoundMsg.value = "";

  try {
    const num = certNumber.value.trim();
    // Делаем preflight-запрос, чтобы проверить существование
    const result = await $fetch(`/api/certificates/verify/${encodeURIComponent(num)}`).catch((e) => {
      if (e?.statusCode === 404) return null;
      if (e?.statusCode === 429) {
        fieldError.value = "Слишком много запросов. Подождите несколько минут.";
        return undefined;
      }
      throw e;
    });

    if (result === undefined) return; // rate-limit обработан выше

    if (result === null) {
      notFoundMsg.value = `Сертификат с номером «${num}» не найден в реестре.`;
      return;
    }

    // Успех — переходим на страницу результата
    await router.push(`/verify/${encodeURIComponent(num)}`);
  } catch (err: any) {
    fieldError.value = "Ошибка соединения. Попробуйте ещё раз.";
  } finally {
    isLoading.value = false;
  }
}

// ── Статистика ────────────────────────────────────────────────
const stats = reactive({ totalCertificates: 0, totalOrganizations: 0, since: new Date().getFullYear() });

onMounted(async () => {
  try {
    const res = await $fetch<{ data: { totalCertificates: number; totalOrganizations: number; since: number } }>("/api/public/stats");
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
  background: #f0f4f8;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

/* ── Шапка ── */
.verify-header {
  background: #fff;
  border-bottom: 1px solid #e5eaf0;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
}
.verify-header-logo-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}
.verify-logo { height: 36px; width: auto; object-fit: contain; }
.verify-header-brand {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}
.verify-header-login {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  text-decoration: none;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all .15s ease;
}
.verify-header-login:hover { color: #2563eb; border-color: #2563eb; background: #eff6ff; }

/* ── Основной контент ── */
.verify-index-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 16px 60px;
  gap: 48px;
  max-width: 760px;
  width: 100%;
  margin: 0 auto;
}

/* ── Hero ── */
.verify-hero {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-top: 56px;
  gap: 16px;
}
.verify-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid #bfdbfe;
}
.verify-hero-badge svg { width: 14px; height: 14px; flex-shrink: 0; }
.verify-hero-title {
  font-size: clamp(26px, 5vw, 40px);
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
  margin: 0;
}
.verify-hero-desc {
  font-size: 15px;
  color: #64748b;
  max-width: 460px;
  line-height: 1.6;
  margin: 0;
}

/* ── Форма поиска ── */
.verify-search-form { width: 100%; max-width: 600px; display: flex; flex-direction: column; gap: 8px; }
.verify-search-wrap {
  display: flex;
  align-items: center;
  background: #fff;
  border: 2px solid #e5eaf0;
  border-radius: 14px;
  padding: 6px 6px 6px 16px;
  gap: 10px;
  box-shadow: 0 2px 12px rgba(0,0,0,.06);
  transition: border-color .15s ease, box-shadow .15s ease;
}
.verify-search-wrap:focus-within { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.verify-search-wrap--error { border-color: #f87171; }
.verify-search-icon { width: 18px; height: 18px; flex-shrink: 0; color: #94a3b8; }
.verify-search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 15px;
  font-weight: 500;
  color: #1e293b;
  background: transparent;
  font-family: inherit;
  letter-spacing: .03em;
}
.verify-search-input::placeholder { color: #cbd5e1; font-weight: 400; }
.verify-search-btn {
  flex-shrink: 0;
  padding: 10px 24px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: transform .15s ease, box-shadow .15s ease;
  box-shadow: 0 3px 10px rgba(37,99,235,.3);
  min-width: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.verify-search-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(37,99,235,.4); }
.verify-search-btn:disabled { opacity: .7; cursor: not-allowed; }
.verify-search-btn-spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.verify-field-error { font-size: 13px; color: #dc2626; text-align: left; margin: 0; }
.verify-not-found {
  font-size: 14px;
  color: #b91c1c;
  background: #fff1f2;
  border: 1px solid #fca5a5;
  border-radius: 10px;
  padding: 12px 20px;
  width: 100%;
  max-width: 600px;
  text-align: center;
}

/* ── Статистика ── */
.verify-stats {
  display: flex;
  align-items: center;
  gap: 24px;
  background: #fff;
  border: 1px solid #e5eaf0;
  border-radius: 16px;
  padding: 24px 36px;
  box-shadow: 0 1px 4px rgba(0,0,0,.04);
  width: 100%;
  justify-content: center;
  flex-wrap: wrap;
}
.verify-stat-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.verify-stat-value { font-size: 22px; font-weight: 800; color: #1e293b; }
.verify-stat-label { font-size: 12px; color: #94a3b8; font-weight: 500; }
.verify-stat-divider { width: 1px; height: 40px; background: #e5eaf0; }

/* ── Как работает ── */
.verify-steps { width: 100%; }
.verify-steps-title {
  font-size: 20px; font-weight: 700; color: #0f172a;
  margin: 0 0 24px; text-align: center;
}
.verify-steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.verify-step {
  background: #fff;
  border: 1px solid #e5eaf0;
  border-radius: 14px;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,.04);
}
.verify-step-num {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}
.verify-step-heading { font-size: 14px; font-weight: 700; color: #1e293b; margin: 0; }
.verify-step-desc { font-size: 13px; color: #64748b; line-height: 1.5; margin: 0; }

/* ── FAQ ── */
.verify-faq { width: 100%; }
.verify-faq-list { display: flex; flex-direction: column; gap: 8px; }
.verify-faq-item {
  background: #fff;
  border: 1px solid #e5eaf0;
  border-radius: 12px;
  overflow: hidden;
}
.verify-faq-question {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  text-align: left;
  gap: 12px;
  font-family: inherit;
}
.verify-faq-chevron {
  width: 16px; height: 16px; flex-shrink: 0; color: #94a3b8;
  transition: transform .2s ease;
}
.verify-faq-item--open .verify-faq-chevron { transform: rotate(180deg); }
.verify-faq-answer {
  max-height: 0;
  overflow: hidden;
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
  padding: 0 20px;
  transition: max-height .25s ease, padding .25s ease;
}
.verify-faq-item--open .verify-faq-answer {
  max-height: 200px;
  padding: 0 20px 16px;
}

/* ── Футер ── */
.verify-footer {
  background: #fff;
  border-top: 1px solid #e5eaf0;
  padding: 16px 24px;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.6;
}
.verify-footer-copy { margin-top: 4px; }

/* ── Адаптив ── */
@media (max-width: 600px) {
  .verify-steps-grid { grid-template-columns: 1fr; }
  .verify-stats { flex-direction: column; gap: 16px; }
  .verify-stat-divider { width: 40px; height: 1px; }
  .verify-hero { padding-top: 36px; }
  .verify-hero-title { font-size: 26px; }
}
</style>
