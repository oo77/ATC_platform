<template>
  <!-- Страница входа (layout: fullscreen). Редизайн: без анимированных блобов, стекла и градиентов — спокойная двухколоночная композиция -->
  <div class="flex min-h-screen w-full flex-col bg-white font-sans dark:bg-gray-950 lg:flex-row">
    <!-- ЛЕВАЯ ЧАСТЬ: бренд и слоган (только на lg+, на мобильном логотип показывается над формой) -->
    <div class="hidden flex-col items-center justify-center border-r border-gray-200 bg-gray-50 p-12 dark:border-gray-800 dark:bg-gray-900 lg:flex lg:w-1/2">
      <div class="flex max-w-md flex-col items-center text-center">
        <!-- Логотип в простой карточке вместо 3D-стопки с поворотами -->
        <div class="mb-8 flex h-56 w-56 items-center justify-center rounded-xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-white/[0.04]">
          <img src="/logo.png" alt="АТЦ Logo" class="h-full w-full object-contain" />
        </div>

        <h1 class="mb-3 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
          <span class="block text-primary">Эффективность</span>
          <span class="block text-gray-800 dark:text-gray-200">в каждом действии</span>
        </h1>
        <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
          Единая профессиональная среда для вашего роста и развития
        </p>
      </div>
    </div>

    <!-- ПРАВАЯ ЧАСТЬ: форма входа -->
    <div class="flex w-full flex-1 items-center justify-center p-6 lg:w-1/2 lg:p-12">
      <div class="w-full max-w-[420px]">
        <!-- Мобильный брендинг -->
        <div class="mb-8 flex items-center justify-center gap-3 lg:hidden">
          <img src="/logo.png" alt="АТЦ Logo" class="h-10 w-10 object-contain" />
          <span class="text-xl font-semibold text-gray-900 dark:text-white">АТЦ Digital</span>
        </div>

        <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-8">
          <div class="mb-6">
            <h2 class="mb-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">С возвращением</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">Войдите в свой аккаунт</p>
          </div>

          <!-- Баннер об истёкшей сессии: текст берётся из фиксированного словаря, значение query на экран не выводится -->
          <div
            v-if="sessionNotice"
            class="mb-5 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-gray-800 dark:text-gray-100"
            role="status"
          >
            <Clock class="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <span>{{ sessionNotice }}</span>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-4">
            <!-- Email -->
            <div class="space-y-1.5">
              <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email адрес</label>
              <div class="relative">
                <Mail class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  v-model="formData.email"
                  type="email"
                  id="email"
                  name="email"
                  placeholder="user@example.com"
                  required
                  :disabled="isLoading"
                  class="block h-10 w-full rounded-lg border border-gray-300 bg-transparent pl-10 pr-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60 dark:border-gray-700 dark:text-white"
                  :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500/20': fieldErrors.email }"
                />
              </div>
              <p v-if="fieldErrors.email" class="text-xs font-medium text-red-500">{{ fieldErrors.email }}</p>
            </div>

            <!-- Пароль -->
            <div class="space-y-1.5">
              <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Пароль</label>
              <div class="relative">
                <Lock class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  v-model="formData.password"
                  :type="showPassword ? 'text' : 'password'"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  :disabled="isLoading"
                  class="block h-10 w-full rounded-lg border border-gray-300 bg-transparent pl-10 pr-10 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60 dark:border-gray-700 dark:text-white"
                  :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500/20': fieldErrors.password }"
                />
                <button
                  type="button"
                  @click="togglePasswordVisibility"
                  class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
                  :aria-label="showPassword ? 'Скрыть пароль' : 'Показать пароль'"
                  :disabled="isLoading"
                >
                  <Eye v-if="!showPassword" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </button>
              </div>
              <p v-if="fieldErrors.password" class="text-xs font-medium text-red-500">{{ fieldErrors.password }}</p>
            </div>

            <!-- Запомнить меня: нативный чекбокс вместо самодельного -->
            <label class="flex cursor-pointer select-none items-center gap-2">
              <input
                v-model="formData.keepLoggedIn"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600"
                :disabled="isLoading"
              />
              <span class="text-sm text-gray-600 dark:text-gray-400">Запомнить меня</span>
            </label>

            <!-- Главное действие страницы: одна заметная кнопка, без градиента и «прыжков» -->
            <button
              type="submit"
              :disabled="isLoading"
              class="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span v-if="!isLoading">Войти</span>
              <span v-else class="flex items-center">
                <svg class="-ml-1 mr-2 h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Проверка...
              </span>
            </button>
          </form>
        </div>

        <div class="mt-6 text-center">
          <!-- Вторичное действие: публичная проверка сертификата -->
          <NuxtLink
            to="/verify"
            id="signin-goto-verify"
            class="mb-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.04] dark:hover:text-white"
          >
            <BadgeCheck class="h-4 w-4 text-gray-400" />
            Проверить подлинность сертификата
          </NuxtLink>

          <p class="text-xs text-gray-500 dark:text-gray-400">
            &copy; {{ new Date().getFullYear() }} АТЦ Платформа
            <span class="ml-1 opacity-70">v1.0</span><br />
            Все права защищены.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Mail/Lock/Clock/BadgeCheck — иконки lucide вместо inline-SVG; нужны для обновлённого шаблона
import { Eye, EyeOff, Mail, Lock, Clock, BadgeCheck } from "lucide-vue-next";

definePageMeta({
  layout: "fullscreen",
  title: "Вход в систему",
});

useHead({
  title: "Вход в систему - АТЦ Платформа",
});

const { login } = useAuth();
const router = useRouter();

// Баннер «Сессия истекла»: показываем только текст из фиксированного словаря по известному коду,
// сам query-параметр на экран не выводится (защита от подмены текста через URL)
const route = useRoute();
const SESSION_NOTICES: Record<string, string> = {
  session_expired: "Сессия истекла, войдите снова",
};
const sessionNotice = computed(() => {
  const code = route.query.error;
  return typeof code === "string" && Object.prototype.hasOwnProperty.call(SESSION_NOTICES, code)
    ? SESSION_NOTICES[code]
    : "";
});
const notification = useNotification();

// Состояние формы
const formData = reactive({
  email: "",
  password: "",
  keepLoggedIn: false,
});

const showPassword = ref(false);
const isLoading = ref(false);
const fieldErrors = reactive<Record<string, string>>({});

// Переключение видимости пароля
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// Валидация отдельных полей
const validateField = (field: string, value: string): string | null => {
  switch (field) {
    case "email":
      if (!value) {
        return "Email обязателен для заполнения";
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return "Введите корректный email адрес";
      }
      break;

    case "password":
      if (!value) {
        return "Пароль обязателен для заполнения";
      }
      if (value.length < 6) {
        return "Пароль должен содержать минимум 6 символов";
      }
      break;
  }

  return null;
};

// Обработка отправки формы
const handleSubmit = async () => {
  // Очистка предыдущих ошибок
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key]);

  // Валидация полей
  const emailError = validateField("email", formData.email);
  const passwordError = validateField("password", formData.password);

  if (emailError) {
    fieldErrors.email = emailError;
    notification.error(emailError, "Ошибка валидации");
    return;
  }

  if (passwordError) {
    fieldErrors.password = passwordError;
    notification.error(passwordError, "Ошибка валидации");
    return;
  }

  isLoading.value = true;

  try {
    const result = await login({
      email: formData.email,
      password: formData.password,
    });

    if (result.success) {
      // Успешный вход
      notification.success("Вы успешно вошли в систему", "Добро пожаловать!");

      // Редирект на главную или на страницу из query параметра
      const route = useRoute();
      const redirectTo = (route.query.redirect as string) || "/";

      setTimeout(() => {
        router.push(redirectTo);
      }, 500);
    } else {
      // Ошибка входа
      const errorMessage = result.error || "Неверный email или пароль";

      // Определяем, какое поле неверное
      if (errorMessage.toLowerCase().includes("email")) {
        fieldErrors.email = errorMessage;
      } else if (
        errorMessage.toLowerCase().includes("пароль") ||
        errorMessage.toLowerCase().includes("password")
      ) {
        fieldErrors.password = errorMessage;
      }

      notification.error(errorMessage, "Ошибка входа");
    }
  } catch (error: any) {
    console.error("Login error:", error);
    const errorMessage = "Ошибка подключения к серверу. Попробуйте позже.";
    notification.error(errorMessage, "Ошибка");
  } finally {
    isLoading.value = false;
  }
};
</script>
