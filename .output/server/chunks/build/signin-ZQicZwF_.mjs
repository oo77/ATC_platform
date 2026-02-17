import { defineComponent, reactive, ref, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderStyle, ssrRenderAttr, ssrRenderClass, ssrIncludeBooleanAttr, ssrInterpolate, ssrRenderDynamicModel, ssrRenderComponent, ssrLooseContain } from 'vue/server-renderer';
import { _ as _imports_0 } from './virtual_public-IWZl7zz2.mjs';
import { Eye, EyeOff } from 'lucide-vue-next';
import { u as useHead, e as useAuth, a as useRouter } from './server.mjs';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import '../_/nitro.mjs';
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
import 'node:url';
import 'jsonwebtoken';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue-router';

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
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "relative min-h-screen w-full flex flex-col lg:flex-row overflow-hidden font-sans" }, _attrs))}><div class="relative w-full lg:w-1/2 min-h-[30vh] lg:min-h-screen bg-gray-50 dark:bg-gray-100 flex flex-col items-center justify-center p-8 lg:p-16 overflow-hidden"><div class="absolute inset-0 overflow-hidden pointer-events-none"><div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-100/80 rounded-full blur-[120px] opacity-60"></div><div class="absolute -top-32 -left-32 w-[500px] h-[500px] bg-linear-to-br from-brand-200 to-purple-200 rounded-full blur-[80px] opacity-50 animate-pulse-slow"></div><div class="absolute bottom-0 right-0 w-[600px] h-[600px] bg-linear-to-tl from-teal-200 to-brand-200 rounded-full blur-[90px] opacity-50"></div><div class="absolute top-[15%] right-[10%] w-24 h-24 border-8 border-brand-200/40 rounded-full animate-float-slow"></div><div class="absolute bottom-[20%] left-[10%] w-32 h-32 bg-purple-100/50 rounded-3xl rotate-12 backdrop-blur-sm animate-float-medium"></div><div class="absolute top-[40%] left-[5%] w-16 h-16 bg-teal-100/60 rounded-xl rotate-45 animate-spin-slow"></div><div class="absolute top-10 right-10 w-40 h-40 opacity-20" style="${ssrRenderStyle({ "background-image": "radial-gradient(#4f46e5 2px, transparent 2px)", "background-size": "10px 10px" })}"></div><div class="absolute bottom-10 left-10 w-64 h-24 opacity-20" style="${ssrRenderStyle({ "background-image": "radial-gradient(#4f46e5 2px, transparent 2px)", "background-size": "15px 15px" })}"></div><svg class="absolute top-1/4 left-0 w-full h-96 opacity-30 text-brand-200 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0 50 Q 25 30 50 50 T 100 50" stroke="currentColor" stroke-width="0.5" fill="none" vector-effect="non-scaling-stroke"></path><path d="M0 60 Q 25 40 50 60 T 100 60" stroke="currentColor" stroke-width="0.5" fill="none" vector-effect="non-scaling-stroke"></path><path d="M0 70 Q 25 50 50 70 T 100 70" stroke="currentColor" stroke-width="0.5" fill="none" vector-effect="non-scaling-stroke"></path></svg><div class="absolute top-[20%] left-[20%] w-4 h-4 bg-brand-400 rounded-full shadow-lg shadow-brand-500/50 animate-bounce delay-700"></div><div class="absolute bottom-[30%] right-[20%] w-6 h-6 bg-purple-400 rounded-full shadow-lg shadow-purple-500/50 animate-bounce delay-1000"></div><div class="absolute top-[60%] right-[30%] w-3 h-3 bg-teal-400 rounded-full shadow-lg shadow-teal-500/50 animate-bounce delay-150"></div><div class="absolute inset-0 bg-[linear-gradient(rgba(135,135,135,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(135,135,135,0.02)_1px,transparent_1px)] bg-size-[60px_60px]"></div></div><div class="relative z-10 flex flex-col items-center text-center"><div class="relative w-64 h-64 lg:w-96 lg:h-96 mb-10 flex items-center justify-center group perspective-1000"><div class="absolute inset-4 bg-linear-to-tr from-brand-400/20 to-purple-400/20 rounded-[3rem] blur-2xl group-hover:blur-3xl transition-all duration-700"></div><div class="absolute inset-0 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[3rem] rotate-6 transform transition-transform duration-700 group-hover:rotate-2"></div><div class="absolute inset-0 bg-white/90 backdrop-blur-xl rounded-[3rem] -rotate-6 border border-white/60 shadow-xl transform transition-transform duration-700 group-hover:rotate-0 flex items-center justify-center p-12"><img${ssrRenderAttr("src", _imports_0)} alt="АТЦ Logo" class="w-full h-full object-contain drop-shadow-2xl transform transition-transform duration-500 group-hover:scale-105"></div></div><h1 class="text-4xl lg:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight leading-none px-4"><span class="block text-transparent bg-clip-text bg-linear-to-r from-brand-600 to-purple-600 drop-shadow-sm">Эффективность</span><span class="block text-3xl lg:text-5xl mt-2 text-gray-800">в каждом действии</span></h1><p class="text-lg lg:text-2xl text-gray-500 font-medium max-w-lg mx-auto leading-relaxed"> Единая профессиональная среда для вашего роста и развития </p></div></div><div class="relative w-full lg:w-1/2 min-h-screen bg-slate-900 flex items-center justify-center p-6 lg:p-12 overflow-hidden"><div class="absolute inset-0 pointer-events-none overflow-hidden"><div class="absolute inset-0 bg-linear-to-br from-slate-900 via-[#0f172a] to-[#020617]"></div><div class="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] animate-blob mix-blend-screen"></div><div class="absolute top-[40%] -left-[20%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] animate-blob animation-delay-4000 mix-blend-screen"></div><div class="absolute -bottom-[10%] right-[10%] w-[400px] h-[400px] bg-brand-600/10 rounded-full blur-[80px] animate-blob animation-delay-2000 mix-blend-screen"></div><div class="absolute top-1/4 right-1/4 w-1 h-1 bg-blue-400 rounded-full animate-pulse-slow opacity-60"></div><div class="absolute bottom-1/3 left-1/4 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse opacity-40"></div><div class="absolute inset-0 bg-[url(&#39;https://grainy-gradients.vercel.app/noise.svg&#39;)] opacity-[0.03] mix-blend-overlay"></div></div><div class="relative z-20 w-full max-w-[450px]"><div class="mb-8 lg:hidden text-center"><h2 class="text-3xl font-bold text-white">АТЦ Digital</h2></div><div class="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-4xl p-8 sm:p-10 shadow-2xl shadow-blue-900/20 relative overflow-hidden group"><div class="absolute -top-32 -left-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-700"></div><div class="relative z-10 mb-10"><h2 class="text-3xl font-bold text-white mb-3 tracking-tight"> С возвращением </h2><p class="text-slate-400 text-lg">Войдите в свой аккаунт</p></div><form class="space-y-6 relative z-10"><div class="space-y-2"><label for="email" class="block text-sm font-semibold text-slate-300 ml-1">Email адрес</label><div class="relative group"><div class="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none"><svg class="h-6 w-6 text-slate-500 group-focus-within:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path></svg></div><input${ssrRenderAttr("value", unref(formData).email)} type="email" id="email" name="email" placeholder="user@example.com" required${ssrIncludeBooleanAttr(unref(isLoading)) ? " disabled" : ""} class="${ssrRenderClass([{
        "border-red-500 focus:border-red-500 focus:ring-red-500/20": unref(fieldErrors).email
      }, "block w-full h-14 pl-14 pr-4 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-500 focus:border-blue-500 focus:bg-slate-900/80 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none text-base shadow-inner"])}"></div>`);
      if (unref(fieldErrors).email) {
        _push(`<p class="text-xs text-red-400 font-medium ml-1">${ssrInterpolate(unref(fieldErrors).email)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="space-y-2"><label for="password" class="block text-sm font-semibold text-slate-300 ml-1">Пароль</label><div class="relative group"><div class="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none"><svg class="h-6 w-6 text-slate-500 group-focus-within:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg></div><input${ssrRenderDynamicModel(unref(showPassword) ? "text" : "password", unref(formData).password, null)}${ssrRenderAttr("type", unref(showPassword) ? "text" : "password")} id="password" name="password" placeholder="••••••••" required${ssrIncludeBooleanAttr(unref(isLoading)) ? " disabled" : ""} class="${ssrRenderClass([{
        "border-red-500 focus:border-red-500 focus:ring-red-500/20": unref(fieldErrors).password
      }, "block w-full h-14 pl-14 pr-14 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-500 focus:border-blue-500 focus:bg-slate-900/80 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none text-base shadow-inner"])}"><button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"${ssrIncludeBooleanAttr(unref(isLoading)) ? " disabled" : ""}>`);
      if (!unref(showPassword)) {
        _push(ssrRenderComponent(unref(Eye), { class: "w-6 h-6" }, null, _parent));
      } else {
        _push(ssrRenderComponent(unref(EyeOff), { class: "w-6 h-6" }, null, _parent));
      }
      _push(`</button></div>`);
      if (unref(fieldErrors).password) {
        _push(`<p class="text-xs text-red-400 font-medium ml-1">${ssrInterpolate(unref(fieldErrors).password)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="flex items-center justify-between pt-2"><label class="flex items-center cursor-pointer group/check select-none"><div class="relative"><input${ssrIncludeBooleanAttr(Array.isArray(unref(formData).keepLoggedIn) ? ssrLooseContain(unref(formData).keepLoggedIn, null) : unref(formData).keepLoggedIn) ? " checked" : ""} type="checkbox" class="sr-only"${ssrIncludeBooleanAttr(unref(isLoading)) ? " disabled" : ""}><div class="${ssrRenderClass([{
        "bg-blue-600! border-blue-600!": unref(formData).keepLoggedIn
      }, "w-6 h-6 border-2 border-slate-600 rounded-lg bg-slate-800/50 group-hover/check:border-blue-500 transition-all flex items-center justify-center shadow-inner"])}">`);
      if (unref(formData).keepLoggedIn) {
        _push(`<svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><span class="ml-3 text-sm text-slate-400 group-hover/check:text-slate-200 transition-colors">Запомнить меня</span></label></div><button type="submit"${ssrIncludeBooleanAttr(unref(isLoading)) ? " disabled" : ""} class="w-full py-4 px-6 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-lg font-bold rounded-xl shadow-lg shadow-blue-600/30 transform transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-3 mt-4 border border-white/10">`);
      if (!unref(isLoading)) {
        _push(`<span>Войти</span>`);
      } else {
        _push(`<span class="flex items-center text-white/90"><svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Проверка... </span>`);
      }
      _push(`</button></form></div><div class="mt-8 text-center"><p class="text-sm text-slate-500/80"> © ${ssrInterpolate((/* @__PURE__ */ new Date()).getFullYear())} АТЦ Платформа <span class="text-xs ml-1 opacity-70">v1.0</span><br> Все права защищены. </p></div></div></div></div>`);
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
//# sourceMappingURL=signin-ZQicZwF_.mjs.map
