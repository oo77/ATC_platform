import { defineComponent, ref, reactive, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderClass, ssrRenderAttr, ssrRenderDynamicModel, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual } from 'vue/server-renderer';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "environment",
  __ssrInlineRender: true,
  setup(__props) {
    const loading = ref(false);
    const showPassword = ref(false);
    const dbStatus = ref({
      connected: false,
      message: ""
    });
    const connectionTest = ref(null);
    const migrationsStatus = ref("⏸");
    const migrationsText = ref("Ожидание");
    const form = reactive({
      // Database
      DATABASE_HOST: "localhost",
      DATABASE_PORT: "3306",
      DATABASE_NAME: "atc_platform",
      DATABASE_USER: "root",
      DATABASE_PASSWORD: "",
      // Application
      APP_URL: "",
      APP_NAME: "ATC Platform",
      APP_TIMEZONE: "Asia/Almaty",
      // Telegram
      TELEGRAM_BOT_TOKEN: "",
      TELEGRAM_WEBHOOK_SECRET: "",
      // OpenAI
      OPENAI_API_KEY: "",
      USE_OPENROUTER: "true",
      OPENAI_VISION_MODEL: "openai/gpt-4o",
      OPENAI_TEXT_MODEL: "openai/gpt-3.5-turbo",
      OPENAI_MAX_TOKENS: "1500",
      OPENAI_TEMPERATURE: "0.1"
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4" }, _attrs))}><div class="max-w-5xl mx-auto"><div class="text-center mb-8"><h1 class="text-4xl font-bold text-gray-900 mb-3"> ⚙️ Настройка окружения </h1><p class="text-gray-600 text-lg"> Конфигурация базы данных и параметров приложения </p></div><div class="bg-white rounded-xl shadow-lg p-6 mb-6"><h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"><span>📊</span> Статус системы </h2><div class="grid grid-cols-1 md:grid-cols-3 gap-4"><div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"><span class="text-2xl">${ssrInterpolate(unref(dbStatus).connected ? "✅" : "❌")}</span><div><div class="text-sm text-gray-600">База данных</div><div class="${ssrRenderClass([unref(dbStatus).connected ? "text-green-600" : "text-red-600", "font-medium"])}">${ssrInterpolate(unref(dbStatus).connected ? "Подключена" : "Не подключена")}</div></div></div><div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"><span class="text-2xl">${ssrInterpolate(unref(migrationsStatus))}</span><div><div class="text-sm text-gray-600">Миграции</div><div class="font-medium text-gray-700">${ssrInterpolate(unref(migrationsText))}</div></div></div><div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"><span class="text-2xl">🟢</span><div><div class="text-sm text-gray-600">Приложение</div><div class="font-medium text-green-600">Запущено</div></div></div></div></div><form class="space-y-6"><div class="bg-white rounded-xl shadow-lg p-6"><h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"><span>🗄</span> База данных </h2><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label class="block text-sm font-medium text-gray-700 mb-2"> Хост </label><input${ssrRenderAttr("value", unref(form).DATABASE_HOST)} type="text" placeholder="localhost" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required></div><div><label class="block text-sm font-medium text-gray-700 mb-2"> Порт </label><input${ssrRenderAttr("value", unref(form).DATABASE_PORT)} type="number" placeholder="3306" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required></div><div><label class="block text-sm font-medium text-gray-700 mb-2"> Имя базы данных </label><input${ssrRenderAttr("value", unref(form).DATABASE_NAME)} type="text" placeholder="atc_platform" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required></div><div><label class="block text-sm font-medium text-gray-700 mb-2"> Пользователь </label><input${ssrRenderAttr("value", unref(form).DATABASE_USER)} type="text" placeholder="root" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required></div><div class="md:col-span-2"><label class="block text-sm font-medium text-gray-700 mb-2"> Пароль </label><div class="relative"><input${ssrRenderDynamicModel(unref(showPassword) ? "text" : "password", unref(form).DATABASE_PASSWORD, null)}${ssrRenderAttr("type", unref(showPassword) ? "text" : "password")} placeholder="••••••••" class="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"><button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">${ssrInterpolate(unref(showPassword) ? "🙈" : "👁")}</button></div></div></div>`);
      if (unref(connectionTest)) {
        _push(`<div class="${ssrRenderClass([{
          "bg-green-50 border border-green-200": unref(connectionTest).success,
          "bg-red-50 border border-red-200": !unref(connectionTest).success
        }, "mt-4 p-4 rounded-lg"])}"><p class="${ssrRenderClass({
          "text-green-800": unref(connectionTest).success,
          "text-red-800": !unref(connectionTest).success
        })}">${ssrInterpolate(unref(connectionTest).message)}</p>`);
        if (unref(connectionTest).details) {
          _push(`<p class="text-sm text-gray-600 mt-1"> База: ${ssrInterpolate(unref(connectionTest).details.database)} | Версия: ${ssrInterpolate(unref(connectionTest).details.version)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="flex gap-3 mt-4"><button type="button"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} class="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">${ssrInterpolate(unref(loading) ? "Проверка..." : "🔍 Проверить подключение")}</button><button type="button"${ssrIncludeBooleanAttr(unref(loading) || !unref(connectionTest)?.success) ? " disabled" : ""} class="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">${ssrInterpolate(unref(loading) ? "Выполнение..." : "🚀 Запустить миграции")}</button></div></div><div class="bg-white rounded-xl shadow-lg p-6"><h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"><span>🌐</span> Приложение </h2><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div class="md:col-span-2"><label class="block text-sm font-medium text-gray-700 mb-2"> URL приложения </label><input${ssrRenderAttr("value", unref(form).APP_URL)} type="url" placeholder="https://your-domain.com" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></div><div><label class="block text-sm font-medium text-gray-700 mb-2"> Название приложения </label><input${ssrRenderAttr("value", unref(form).APP_NAME)} type="text" placeholder="ATC Platform" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></div><div><label class="block text-sm font-medium text-gray-700 mb-2"> Часовой пояс </label><select class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"><option value="Asia/Almaty"${ssrIncludeBooleanAttr(Array.isArray(unref(form).APP_TIMEZONE) ? ssrLooseContain(unref(form).APP_TIMEZONE, "Asia/Almaty") : ssrLooseEqual(unref(form).APP_TIMEZONE, "Asia/Almaty")) ? " selected" : ""}>Asia/Almaty (GMT+6)</option><option value="Asia/Tashkent"${ssrIncludeBooleanAttr(Array.isArray(unref(form).APP_TIMEZONE) ? ssrLooseContain(unref(form).APP_TIMEZONE, "Asia/Tashkent") : ssrLooseEqual(unref(form).APP_TIMEZONE, "Asia/Tashkent")) ? " selected" : ""}>Asia/Tashkent (GMT+5)</option><option value="Asia/Bishkek"${ssrIncludeBooleanAttr(Array.isArray(unref(form).APP_TIMEZONE) ? ssrLooseContain(unref(form).APP_TIMEZONE, "Asia/Bishkek") : ssrLooseEqual(unref(form).APP_TIMEZONE, "Asia/Bishkek")) ? " selected" : ""}>Asia/Bishkek (GMT+6)</option><option value="Europe/Moscow"${ssrIncludeBooleanAttr(Array.isArray(unref(form).APP_TIMEZONE) ? ssrLooseContain(unref(form).APP_TIMEZONE, "Europe/Moscow") : ssrLooseEqual(unref(form).APP_TIMEZONE, "Europe/Moscow")) ? " selected" : ""}>Europe/Moscow (GMT+3)</option><option value="UTC"${ssrIncludeBooleanAttr(Array.isArray(unref(form).APP_TIMEZONE) ? ssrLooseContain(unref(form).APP_TIMEZONE, "UTC") : ssrLooseEqual(unref(form).APP_TIMEZONE, "UTC")) ? " selected" : ""}>UTC (GMT+0)</option></select></div></div></div><div class="bg-white rounded-xl shadow-lg p-6"><h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"><span>📱</span> Telegram Bot </h2><div class="grid grid-cols-1 gap-4"><div><label class="block text-sm font-medium text-gray-700 mb-2"> Bot Token </label><input${ssrRenderAttr("value", unref(form).TELEGRAM_BOT_TOKEN)} type="text" placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"><p class="text-xs text-gray-500 mt-1"> Получите токен у @BotFather в Telegram </p></div><div><label class="block text-sm font-medium text-gray-700 mb-2"> Webhook Secret </label><input${ssrRenderAttr("value", unref(form).TELEGRAM_WEBHOOK_SECRET)} type="text" placeholder="your_webhook_secret" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></div></div></div><div class="bg-white rounded-xl shadow-lg p-6"><h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"><span>🤖</span> OpenAI / OpenRouter </h2><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div class="md:col-span-2"><label class="block text-sm font-medium text-gray-700 mb-2"> API Key </label><input${ssrRenderAttr("value", unref(form).OPENAI_API_KEY)} type="text" placeholder="sk-or-v1-..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></div><div><label class="block text-sm font-medium text-gray-700 mb-2"> Использовать OpenRouter </label><select class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"><option value="true"${ssrIncludeBooleanAttr(Array.isArray(unref(form).USE_OPENROUTER) ? ssrLooseContain(unref(form).USE_OPENROUTER, "true") : ssrLooseEqual(unref(form).USE_OPENROUTER, "true")) ? " selected" : ""}>Да (рекомендуется)</option><option value="false"${ssrIncludeBooleanAttr(Array.isArray(unref(form).USE_OPENROUTER) ? ssrLooseContain(unref(form).USE_OPENROUTER, "false") : ssrLooseEqual(unref(form).USE_OPENROUTER, "false")) ? " selected" : ""}>Нет (OpenAI напрямую)</option></select></div><div><label class="block text-sm font-medium text-gray-700 mb-2"> Vision Model </label><input${ssrRenderAttr("value", unref(form).OPENAI_VISION_MODEL)} type="text" placeholder="openai/gpt-4o" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></div><div><label class="block text-sm font-medium text-gray-700 mb-2"> Text Model </label><input${ssrRenderAttr("value", unref(form).OPENAI_TEXT_MODEL)} type="text" placeholder="openai/gpt-3.5-turbo" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></div></div></div><div class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6"><button type="submit"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} class="w-full px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-lg">${ssrInterpolate(unref(loading) ? "Сохранение..." : "💾 Сохранить все настройки и перезапустить")}</button><p class="text-white text-sm text-center mt-3"> Все изменения будут сохранены в .env файл и приложение перезапустится </p></div></form></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/environment.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=environment-CwBIZ8jS.mjs.map
