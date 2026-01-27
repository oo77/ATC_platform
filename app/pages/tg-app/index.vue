<template>
  <div class="tg-app-root">
    <!-- Load/Init State -->
    <div v-if="state === 'loading' || state === 'init'" class="tg-loading">
      <div class="tg-spinner"></div>
      <p>Загрузка...</p>
      <small style="opacity: 0.7; margin-top: 10px">{{ statusMessage }}</small>
    </div>

    <!-- Error State -->
    <div v-else-if="state === 'error'" class="tg-auth-error">
      <div class="tg-error-icon">⚠️</div>
      <h2>Ошибка доступа</h2>
      <p>{{ errorMessage }}</p>

      <div class="tg-actions">
        <button @click="initialize" class="tg-btn-primary">Повторить</button>
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
        <div class="tg-logo"><img src="/logo.png" alt="Logo" /></div>
        <h1>Добро пожаловать</h1>
        <p>Для продолжения необходимо зарегистрироваться</p>
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
        <div class="tg-notice-icon">⏳</div>
        <h3>Заявка на рассмотрении</h3>
        <p>Ожидайте подтверждения от администратора.</p>
      </div>
      <div
        v-else-if="representative?.status === 'blocked'"
        class="tg-blocked-notice"
      >
        <div class="tg-notice-icon">🚫</div>
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
          <span class="tg-nav-icon">{{ tab.icon }}</span>
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
 * Формат: #tgWebAppData=user={...}&chat_instance=...&hash=...&...
 */
function parseInitDataFromHash(hash) {
  try {
    console.log("[TG] Parsing hash, length:", hash.length);

    // Убираем # в начале
    const cleanHash = hash.startsWith("#") ? hash.substring(1) : hash;
    console.log("[TG] Clean hash (first 300):", cleanHash.substring(0, 300));

    // Находим tgWebAppData=... и извлекаем все после него до следующего &tgWebApp
    const tgWebAppDataMatch = cleanHash.match(
      /tgWebAppData=([^&]*(?:&(?!tgWebApp)[^&]*)*)/,
    );

    if (!tgWebAppDataMatch) {
      console.warn("[TG] No tgWebAppData found in hash");
      return null;
    }

    // Это содержит: user={...}&chat_instance=...&auth_date=...&hash=... и т.д.
    let initData = tgWebAppDataMatch[1];
    console.log("[TG] Extracted tgWebAppData length:", initData.length);
    console.log(
      "[TG] Extracted tgWebAppData (first 300):",
      initData.substring(0, 300),
    );

    // Теперь извлекаем остальные параметры, которые могут быть вне tgWebAppData
    // Парсим весь hash как URLSearchParams чтобы получить отдельные параметры
    const hashParams = new URLSearchParams(cleanHash);

    // Проверяем, есть ли важные параметры отдельно в hash
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

    // Проверяем наличие ключевых параметров
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
    // 1. Check for Telegram WebApp environment
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      throw new Error("Telegram WebApp не найден. Откройте через Telegram.");
    }

    tg.expand();

    // 2. Extract initData
    let rawInitData = tg.initData || "";

    console.log(
      "[TG] SDK initData:",
      rawInitData ? `length ${rawInitData.length}` : "empty",
    );

    // ИСПРАВЛЕНИЕ: Если SDK не вернул initData, парсим из hash
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

    // 3. Validate presence of data
    if (!rawInitData) {
      throw new Error("Отсутствуют данные авторизации (initData пуст).");
    }

    // 4. Парсим user из initData для отображения (необязательно для сервера)
    let userData = tg.initDataUnsafe?.user || null;
    if (!userData && rawInitData) {
      // Пытаемся извлечь user из initData
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

    // 5. Set Data
    telegramData.value = {
      initData: rawInitData,
      user: userData || {},
    };

    // 6. Check Auth
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
  // Пытаемся извлечь user из parsedInitData
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
    list.push({ id: "students", label: "Студенты", icon: "👥" });
  if (p.can_view_schedule)
    list.push({ id: "schedule", label: "Расписание", icon: "📅" });
  if (p.can_view_certificates)
    list.push({ id: "certificates", label: "Сертификаты", icon: "📜" });
  list.push({ id: "settings", label: "Меню", icon: "⚙️" });
  return list;
});
</script>

<style scoped>
/* Корневой контейнер */
.tg-app-root {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #f1f5f9;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
    Cantarell, sans-serif;
  overflow-x: hidden;
}

/* Загрузка */
.tg-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 1.5rem;
}

.tg-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(59, 130, 246, 0.2);
  border-top-color: #3b82f6;
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
  font-size: 4rem;
  margin-bottom: 1rem;
}

.tg-auth-error h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #fbbf24;
}

.tg-auth-error p {
  color: #94a3b8;
  margin-bottom: 2rem;
}

.tg-debug-info {
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  max-width: 100%;
  overflow-x: auto;
  text-align: left;
}

.tg-debug-info pre {
  font-family: monospace;
  font-size: 0.75rem;
  color: #fca5a5;
  white-space: pre-wrap;
  word-break: break-all;
}

.tg-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 300px;
}

.tg-btn-secondary {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #94a3b8;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.tg-input-debug {
  width: 100%;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: white;
  margin-bottom: 0.5rem;
}

.tg-btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  width: 100%;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

/* Регистрация */
.tg-registration {
  min-height: 100vh;
  padding: 2rem 1rem;
}

.tg-welcome {
  text-align: center;
  margin-bottom: 2rem;
}

.tg-logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
}

.tg-logo img {
  width: 50px;
  height: 50px;
  object-fit: contain;
}

.tg-welcome h1 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tg-welcome p {
  color: #94a3b8;
  line-height: 1.6;
}

/* Основное приложение */
.tg-main-app {
  min-height: 100vh;
}

/* Заголовок */
.tg-header {
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
  position: sticky;
  top: 0;
  z-index: 100;
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
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.125rem;
  color: white;
}

.tg-user-details h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: #f1f5f9;
}

.tg-user-details p {
  font-size: 0.875rem;
  margin: 0;
  color: #94a3b8;
}

.tg-status {
  padding: 0.375rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.tg-status-approved {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.tg-status-pending {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.tg-status-blocked {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

/* Уведомления */
.tg-pending-notice,
.tg-blocked-notice {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1.5rem;
  border-radius: 16px;
  text-align: center;
}

.tg-pending-notice {
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.tg-blocked-notice {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.tg-notice-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.tg-pending-notice h3,
.tg-blocked-notice h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.tg-pending-notice p,
.tg-blocked-notice p {
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 0;
}

/* Контент */
.tg-content {
  max-width: 600px;
  margin: 0 auto;
  padding-bottom: 80px; /* Место для навигации */
}

/* Навигация */
.tg-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.5rem;
  gap: 0.5rem;
  z-index: 100;
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
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}

.tg-nav-btn:active {
  transform: scale(0.95);
}

.tg-nav-btn.active {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.tg-nav-icon {
  font-size: 1.5rem;
}

.tg-nav-label {
  font-size: 0.75rem;
  font-weight: 500;
}

/* Кнопки */
.tg-btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  border: none;
  padding: 0.875rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.tg-btn-primary:active {
  transform: translateY(0);
}
</style>
