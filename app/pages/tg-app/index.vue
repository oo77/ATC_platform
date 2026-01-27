<template>
  <div class="tg-app-root">
    <!-- Load/Init State -->
    <div v-if="state === 'loading' || state === 'init'" class="tg-loading">
      <div class="tg-spinner"></div>
      <p>Загрузка...</p>
      <small>{{ statusMessage }}</small>
    </div>

    <!-- Error State -->
    <div v-else-if="state === 'error'" class="tg-auth-error">
      <div class="tg-error-icon">
        <svg
          class="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2>Ошибка доступа</h2>
      <p>{{ errorMessage }}</p>

      <div class="tg-actions">
        <button @click="initialize" class="tg-btn-primary">
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Повторить
        </button>
        <button @click="showDebug = !showDebug" class="tg-btn-secondary">
          {{ showDebug ? "Скрыть детали" : "Детали ошибки" }}
        </button>
      </div>

      <!-- Debug Panel -->
      <div v-if="showDebug" class="tg-debug-info">
        <h3>Debug Info:</h3>
        <pre>{{ debugInfo }}</pre>
      </div>
    </div>

    <!-- Registration State -->
    <div v-else-if="state === 'registration'" class="tg-registration">
      <div class="tg-welcome">
        <div class="tg-logo">
          <img src="/logo.png" alt="Logo" />
        </div>
        <h1>Добро пожаловать</h1>
        <p>Для продолжения заполните форму</p>
      </div>
      <RegistrationForm
        :telegram-data="telegramData"
        @registered="onRegistered"
      />
    </div>

    <!-- App State (Approved/Pending/Blocked) -->
    <div v-else-if="state === 'ready'" class="tg-main-app">
      <header class="tg-header">
        <div class="tg-header-content">
          <div class="tg-user-info">
            <div class="tg-avatar">
              {{ getInitials(representative?.fullName) }}
            </div>
            <div class="tg-user-details">
              <h3>{{ representative?.fullName }}</h3>
              <p>{{ representative?.organizationName }}</p>
            </div>
          </div>
          <div class="tg-status" :class="`tg-status-${representative?.status}`">
            {{ getStatusLabel(representative?.status) }}
          </div>
        </div>
      </header>

      <!-- Status Notices -->
      <div
        v-if="representative?.status === 'pending'"
        class="tg-pending-notice"
      >
        <div class="tg-notice-icon">
          <svg
            class="w-10 h-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3>Заявка на рассмотрении</h3>
        <p>Ожидайте подтверждения от администратора.</p>
      </div>
      <div
        v-else-if="representative?.status === 'blocked'"
        class="tg-blocked-notice"
      >
        <div class="tg-notice-icon">
          <svg
            class="w-10 h-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>
        <h3>Доступ ограничен</h3>
        <p>{{ representative?.blockedReason || "Аккаунт заблокирован" }}</p>
      </div>

      <!-- Main Content -->
      <div v-else-if="representative?.status === 'approved'" class="tg-content">
        <component
          :is="activeTabComponent"
          :organization-id="representative.organizationId"
          :permissions="representative.permissions"
          :representative="representative"
        />
      </div>

      <!-- Navigation -->
      <nav v-if="representative?.status === 'approved'" class="tg-nav">
        <button
          v-for="tab in availableTabs"
          :key="tab.id"
          :class="['tg-nav-btn', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <span class="tg-nav-icon" v-html="tab.icon"></span>
          <span class="tg-nav-label">{{ tab.label }}</span>
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useHead } from "#imports";
import RegistrationForm from "~/components/tg-app/RegistrationForm.vue";
import StudentsTab from "~/components/tg-app/StudentsTab.vue";
import ScheduleTab from "~/components/tg-app/ScheduleTab.vue";
import CertificatesTab from "~/components/tg-app/CertificatesTab.vue";
import SettingsTab from "~/components/tg-app/SettingsTab.vue";

definePageMeta({ layout: false });

useHead({
  script: [
    {
      src: "https://telegram.org/js/telegram-web-app.js",
      onload: () => {
        console.log("TG SDK Loaded");
        setTimeout(initialize, 100);
      },
      defer: true,
    },
  ],
});

// SVG иконки для навигации
const icons = {
  students: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>`,
  schedule: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`,
  certificates: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>`,
  settings: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>`,
};

// States: 'loading' | 'init' | 'check_auth' | 'registration' | 'ready' | 'error'
const state = ref("loading");
const statusMessage = ref("Инициализация...");
const errorMessage = ref("");
const showDebug = ref(false);

const telegramData = ref(null);
const representative = ref(null);
const activeTab = ref("students");
const debugInfo = ref("");

/**
 * Парсинг initData из URL hash (для веб-версии Telegram)
 */
function parseInitDataFromHash(hash) {
  try {
    console.log("[TG] Parsing hash, length:", hash.length);

    const cleanHash = hash.startsWith("#") ? hash.substring(1) : hash;
    console.log("[TG] Clean hash (first 300):", cleanHash.substring(0, 300));

    const tgWebAppDataMatch = cleanHash.match(
      /tgWebAppData=([^&]*(?:&(?!tgWebApp)[^&]*)*)/,
    );

    if (!tgWebAppDataMatch) {
      console.warn("[TG] No tgWebAppData found in hash");
      return null;
    }

    let initData = tgWebAppDataMatch[1];
    console.log("[TG] Extracted tgWebAppData length:", initData.length);
    console.log(
      "[TG] Extracted tgWebAppData (first 300):",
      initData.substring(0, 300),
    );

    const hashParams = new URLSearchParams(cleanHash);

    const importantParams = ["auth_date", "hash", "signature"];
    importantParams.forEach((param) => {
      const value = hashParams.get(param);
      if (value && !initData.includes(`${param}=`)) {
        console.log(
          `[TG] Adding ${param} from hash:`,
          value.substring(0, 20) + "...",
        );
        initData += `&${param}=${value}`;
      }
    });

    console.log("[TG] Final initData length:", initData.length);
    console.log("[TG] Final initData (first 300):", initData.substring(0, 300));

    const hasUser = initData.includes("user=");
    const hasHash = initData.includes("hash=");
    const hasAuthDate = initData.includes("auth_date=");

    console.log("[TG] Validation:", { hasUser, hasHash, hasAuthDate });

    if (!hasUser || !hasHash) {
      console.error("[TG] Missing required parameters in initData");
      return null;
    }

    return initData;
  } catch (error) {
    console.error("[TG] Error parsing hash:", error);
    return null;
  }
}

// Initialize
async function initialize() {
  state.value = "init";
  statusMessage.value = "Подключение к Telegram...";

  try {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      throw new Error("Telegram WebApp не найден. Откройте через Telegram.");
    }

    tg.expand();

    let rawInitData = tg.initData || "";

    console.log(
      "[TG] SDK initData:",
      rawInitData ? `length ${rawInitData.length}` : "empty",
    );

    if ((!rawInitData || rawInitData.length < 50) && window.location.hash) {
      console.warn(
        "[TG] SDK initData пуст или слишком короткий, парсим из hash...",
      );
      const parsedData = parseInitDataFromHash(window.location.hash);

      if (parsedData && parsedData.length > 50) {
        rawInitData = parsedData;
        console.log("[TG] ✅ initData успешно извлечен из hash");
        console.log("[TG] initData length:", rawInitData.length);
        console.log("[TG] initData sample:", rawInitData.substring(0, 150));
      } else {
        console.error("[TG] ❌ Не удалось извлечь initData из hash");
      }
    }

    const platform = tg.platform || "unknown";

    updateDebugInfo(tg, rawInitData);

    if (!rawInitData) {
      throw new Error("Отсутствуют данные авторизации (initData пуст).");
    }

    let userData = tg.initDataUnsafe?.user || null;
    if (!userData && rawInitData) {
      try {
        const params = new URLSearchParams(rawInitData);
        const userStr = params.get("user");
        if (userStr) {
          userData = JSON.parse(decodeURIComponent(userStr));
        }
      } catch (e) {
        console.warn("[TG] Could not parse user from initData:", e);
      }
    }

    telegramData.value = {
      initData: rawInitData,
      user: userData || {},
    };

    await checkAuth();
  } catch (e) {
    console.error("Init Error:", e);
    state.value = "error";
    errorMessage.value = e.message;
  }
}

// Auth Logic
async function checkAuth() {
  state.value = "loading";
  statusMessage.value = "Проверка доступа...";

  try {
    const payload = {
      initData: telegramData.value.initData,
    };

    console.log(
      "[TG Client] Sending Auth with initData length:",
      payload.initData.length,
    );

    const res = await $fetch("/api/tg-app/auth", {
      method: "POST",
      body: payload,
    });

    if (res.representative) {
      representative.value = res.representative;
      state.value = "ready";
    }
  } catch (e) {
    console.error("Auth Failed:", e);
    console.log("Error statusCode:", e.statusCode);
    console.log("Error data:", e.data);

    if (e.statusCode === 404) {
      console.log("[TG] ✅ Пользователь не найден, переход к регистрации");
      state.value = "registration";
    } else {
      console.error("[TG] ❌ Ошибка авторизации, показ экрана ошибки");
      state.value = "error";
      errorMessage.value =
        e.data?.message || e.message || "Ошибка соединения с сервером";
    }
  }
}

// Helpers
function updateDebugInfo(tg, parsedInitData) {
  let extractedUser = null;
  if (parsedInitData) {
    try {
      const params = new URLSearchParams(parsedInitData);
      const userStr = params.get("user");
      if (userStr) {
        extractedUser = JSON.parse(decodeURIComponent(userStr));
      }
    } catch (e) {
      console.warn("[TG] Could not extract user from parsedInitData:", e);
    }
  }

  debugInfo.value = JSON.stringify(
    {
      version: tg.version,
      platform: tg.platform,
      locationHash: window.location.hash.substring(0, 300) + "...",
      locationSearch: window.location.search,
      sdkInitDataLen: tg.initData?.length || 0,
      parsedInitDataLen: parsedInitData?.length || 0,
      initDataSample: parsedInitData
        ? parsedInitData.substring(0, 150) + "..."
        : "empty",
      sdkUser: tg.initDataUnsafe?.user,
      extractedUser: extractedUser,
      hasHash: parsedInitData?.includes("hash=") || false,
      hasAuthDate: parsedInitData?.includes("auth_date=") || false,
      hasUser: parsedInitData?.includes("user=") || false,
    },
    null,
    2,
  );
}

function onRegistered(data) {
  representative.value = data.representative;
  state.value = "ready";
}

function getInitials(name) {
  return name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "?";
}

function getStatusLabel(status) {
  const map = { pending: "Ожидание", approved: "Активен", blocked: "Блок" };
  return map[status] || status;
}

// Tabs
const activeTabComponent = computed(() => {
  switch (activeTab.value) {
    case "students":
      return StudentsTab;
    case "schedule":
      return ScheduleTab;
    case "certificates":
      return CertificatesTab;
    case "settings":
      return SettingsTab;
    default:
      return StudentsTab;
  }
});

const availableTabs = computed(() => {
  if (!representative.value) return [];
  const p = representative.value.permissions || {};
  const list = [];
  if (p.can_view_students)
    list.push({ id: "students", label: "Студенты", icon: icons.students });
  if (p.can_view_schedule)
    list.push({ id: "schedule", label: "Расписание", icon: icons.schedule });
  if (p.can_view_certificates)
    list.push({
      id: "certificates",
      label: "Сертификаты",
      icon: icons.certificates,
    });
  list.push({ id: "settings", label: "Меню", icon: icons.settings });
  return list;
});
</script>

<style scoped>
/* 
  ЦВЕТОВАЯ СХЕМА (3 цвета):
  - Основной: #2563eb (синий)
  - Фон: #ffffff (белый)
  - Текст: #1e293b (темно-серый)
*/

.tg-app-root {
  min-height: 100vh;
  background: #ffffff;
  color: #1e293b;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* Загрузка */
.tg-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 1rem;
}

.tg-loading p {
  color: #1e293b;
  font-weight: 500;
}

.tg-loading small {
  color: #64748b;
  font-size: 0.875rem;
}

.tg-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: tg-spin 0.8s linear infinite;
}

@keyframes tg-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Ошибка */
.tg-auth-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
}

.tg-error-icon {
  width: 80px;
  height: 80px;
  background: #fee2e2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  color: #dc2626;
}

.tg-auth-error h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #1e293b;
}

.tg-auth-error p {
  color: #64748b;
  margin-bottom: 2rem;
}

.tg-debug-info {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
  margin: 1rem 0;
  max-width: 100%;
  overflow-x: auto;
  text-align: left;
}

.tg-debug-info h3 {
  color: #475569;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.tg-debug-info pre {
  font-family: monospace;
  font-size: 0.75rem;
  color: #2563eb;
  white-space: pre-wrap;
  word-break: break-all;
}

.tg-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-width: 300px;
}

.tg-btn-secondary {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #64748b;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.tg-btn-secondary:hover {
  background: #f1f5f9;
}

/* Регистрация */
.tg-registration {
  min-height: 100vh;
  padding: 1rem 0.75rem;
  display: flex;
  flex-direction: column;
}

.tg-welcome {
  text-align: center;
  margin-bottom: 1.25rem;
  padding-top: 0.5rem;
}

.tg-logo {
  width: 200px;
  height: 100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tg-logo img {
  width: 200px;
  height: 200px;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(37, 99, 235, 0.2));
}

.tg-welcome h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #2563eb;
}

.tg-welcome p {
  color: #64748b;
  line-height: 1.4;
  font-size: 0.9375rem;
}

/* Основное приложение */
.tg-main-app {
  min-height: 100vh;
  background: #f8fafc;
}

/* Заголовок */
.tg-header {
  background: #2563eb;
  padding: 1rem;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
}

.tg-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 600px;
  margin: 0 auto;
}

.tg-user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tg-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.125rem;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.tg-user-details h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: white;
}

.tg-user-details p {
  font-size: 0.875rem;
  margin: 0;
  color: rgba(255, 255, 255, 0.85);
}

.tg-status {
  padding: 0.375rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.tg-status-approved {
  background: rgba(255, 255, 255, 0.25);
  color: white;
}

.tg-status-pending {
  background: #fbbf24;
  color: #1e293b;
}

.tg-status-blocked {
  background: #dc2626;
  color: white;
}

/* Уведомления */
.tg-pending-notice,
.tg-blocked-notice {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1.5rem;
  border-radius: 16px;
  text-align: center;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.tg-pending-notice {
  border: 2px solid #fbbf24;
}

.tg-blocked-notice {
  border: 2px solid #dc2626;
}

.tg-notice-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.tg-pending-notice .tg-notice-icon {
  background: #fef3c7;
  color: #f59e0b;
}

.tg-blocked-notice .tg-notice-icon {
  background: #fee2e2;
  color: #dc2626;
}

.tg-pending-notice h3,
.tg-blocked-notice h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #1e293b;
}

.tg-pending-notice p,
.tg-blocked-notice p {
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 0;
}

/* Контент */
.tg-content {
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem;
  padding-bottom: 80px;
}

/* Навигация */
.tg-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  padding: 0.5rem;
  gap: 0.25rem;
  z-index: 100;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.tg-nav-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  background: transparent;
  border: none;
  border-radius: 12px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.tg-nav-btn:active {
  transform: scale(0.95);
}

.tg-nav-btn.active {
  background: #eff6ff;
  color: #2563eb;
}

.tg-nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.tg-nav-icon :deep(svg) {
  width: 24px;
  height: 24px;
}

.tg-nav-label {
  font-size: 0.7rem;
  font-weight: 600;
}

/* Кнопки */
.tg-btn-primary {
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.875rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.tg-btn-primary:hover {
  background: #1d4ed8;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
}

.tg-btn-primary:active {
  transform: translateY(0);
}
</style>
