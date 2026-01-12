import { defineComponent, reactive, ref, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr, ssrRenderClass, ssrIncludeBooleanAttr, ssrInterpolate, ssrRenderDynamicModel, ssrRenderComponent, ssrLooseContain } from 'vue/server-renderer';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';
import { _ as _imports_0 } from './virtual_public-IWZl7zz2.mjs';
import { u as useHead, a as useAuth, d as useRouter } from './server.mjs';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import '../nitro/nitro.mjs';
import 'grammy';
import 'uuid';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'mysql2/promise';
import 'bcryptjs';
import 'crypto';
import 'jsonwebtoken';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue-router';

const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "EyeIcon",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<svg${ssrRenderAttrs(mergeProps({
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        "stroke-width": "1.5",
        stroke: "currentColor",
        class: "icon-eye"
      }, _attrs))} data-v-be8bdc45><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" data-v-be8bdc45></path><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" data-v-be8bdc45></path></svg>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/EyeIcon.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$2, [["__scopeId", "data-v-be8bdc45"]]), { __name: "EyeIcon" });
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "EyeOffIcon",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<svg${ssrRenderAttrs(mergeProps({
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        "stroke-width": "1.5",
        stroke: "currentColor",
        class: "icon-eye-off"
      }, _attrs))} data-v-b67bfc34><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" data-v-b67bfc34></path></svg>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/EyeOffIcon.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_1 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$1, [["__scopeId", "data-v-b67bfc34"]]), { __name: "EyeOffIcon" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "signin",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      title: "Вход в систему - АТЦ Платформа"
    });
    useAuth();
    useRouter();
    const formData = reactive({
      email: "",
      password: "",
      keepLoggedIn: false
    });
    const showPassword = ref(false);
    const isLoading = ref(false);
    const fieldErrors = reactive({});
    return (_ctx, _push, _parent, _attrs) => {
      const _component_EyeIcon = __nuxt_component_0;
      const _component_EyeOffIcon = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0" }, _attrs))}><div class="relative flex justify-center w-full min-h-screen lg:flex-row dark:bg-gray-900"><div class="flex flex-col flex-1 w-full lg:w-1/2"><div class="flex flex-col justify-center flex-1 w-full max-w-md px-6 mx-auto py-12"><div><div class="flex justify-center mb-6"><div class="relative group"><div class="absolute -inset-2 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div><div class="relative p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700"><img${ssrRenderAttr("src", _imports_0)} alt="АТЦ Logo" class="h-16 w-auto object-contain"></div></div></div><div class="mb-8 text-center"><h1 class="mb-2 text-3xl font-bold text-gray-800 dark:text-white"> Вход в систему </h1><p class="text-sm text-gray-500 dark:text-gray-400"> Учебно-тренировочный центр АТЦ </p></div><form class="space-y-5"><div><label for="email" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"> Email <span class="text-red-500">*</span></label><input${ssrRenderAttr("value", unref(formData).email)} type="email" id="email" name="email" placeholder="admin@atc.uz" required${ssrIncludeBooleanAttr(unref(isLoading)) ? " disabled" : ""} class="${ssrRenderClass([{ "border-red-500": unref(fieldErrors).email, "border-gray-300": !unref(fieldErrors).email }, "h-11 w-full rounded-lg border bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-800 dark:text-white shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600"])}">`);
      if (unref(fieldErrors).email) {
        _push(`<p class="mt-1 text-sm text-red-600 dark:text-red-400">${ssrInterpolate(unref(fieldErrors).email)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div><label for="password" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"> Пароль <span class="text-red-500">*</span></label><div class="relative"><input${ssrRenderDynamicModel(unref(showPassword) ? "text" : "password", unref(formData).password, null)}${ssrRenderAttr("type", unref(showPassword) ? "text" : "password")} id="password" name="password" placeholder="Введите пароль" required${ssrIncludeBooleanAttr(unref(isLoading)) ? " disabled" : ""} class="${ssrRenderClass([{ "border-red-500": unref(fieldErrors).password, "border-gray-300": !unref(fieldErrors).password }, "h-11 w-full rounded-lg border bg-white dark:bg-gray-800 py-2.5 pl-4 pr-11 text-sm text-gray-800 dark:text-white shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600"])}"><button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"${ssrIncludeBooleanAttr(unref(isLoading)) ? " disabled" : ""}>`);
      if (!unref(showPassword)) {
        _push(ssrRenderComponent(_component_EyeIcon, { class: "w-5 h-5" }, null, _parent));
      } else {
        _push(ssrRenderComponent(_component_EyeOffIcon, { class: "w-5 h-5" }, null, _parent));
      }
      _push(`</button></div>`);
      if (unref(fieldErrors).password) {
        _push(`<p class="mt-1 text-sm text-red-600 dark:text-red-400">${ssrInterpolate(unref(fieldErrors).password)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="flex items-center"><label for="keepLoggedIn" class="flex items-center text-sm font-normal text-gray-700 dark:text-gray-300 cursor-pointer select-none"><div class="relative"><input${ssrIncludeBooleanAttr(Array.isArray(unref(formData).keepLoggedIn) ? ssrLooseContain(unref(formData).keepLoggedIn, null) : unref(formData).keepLoggedIn) ? " checked" : ""} type="checkbox" id="keepLoggedIn" class="sr-only"${ssrIncludeBooleanAttr(unref(isLoading)) ? " disabled" : ""}><div class="${ssrRenderClass([
        "mr-3 flex h-5 w-5 items-center justify-center rounded border-2 transition-colors",
        unref(formData).keepLoggedIn ? "border-blue-500 bg-blue-500" : "border-gray-300 dark:border-gray-600 bg-transparent"
      ])}">`);
      if (unref(formData).keepLoggedIn) {
        _push(`<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div> Запомнить меня </label></div><div><button type="submit"${ssrIncludeBooleanAttr(unref(isLoading)) ? " disabled" : ""} class="flex items-center justify-center w-full px-4 py-3 text-sm font-semibold text-white transition-all rounded-lg bg-primary hover:bg-opacity-90 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">`);
      if (unref(isLoading)) {
        _push(`<svg class="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`);
      } else {
        _push(`<!---->`);
      }
      _push(` ${ssrInterpolate(unref(isLoading) ? "Вход..." : "Войти в систему")}</button></div></form><div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"><p class="text-xs text-blue-800 dark:text-blue-200"><strong>Тестовый доступ:</strong><br> Email: admin@atc.uz<br> Пароль: admin123 </p></div></div></div></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/auth/signin.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=signin-qgsfnfLm.mjs.map
