import process from 'node:process';globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env};import { computed, readonly, toRef, isRef, hasInjectionContext, inject, ref, getCurrentInstance, defineComponent, createElementBlock, shallowRef, provide, cloneVNode, h, defineAsyncComponent, unref, shallowReactive, Suspense, Fragment, useSSRContext, createApp, withCtx, createVNode, onErrorCaptured, onServerPrefetch, resolveDynamicComponent, reactive, effectScope, isReadonly, isShallow, isReactive, toRaw, nextTick, mergeProps, getCurrentScope } from 'vue';
import { $ as destr, a2 as klona, a3 as hasProtocol, a4 as isScriptProtocol, a5 as joinURL, a6 as withQuery, a7 as parse, a8 as getRequestHeader, a9 as isEqual, aa as sanitizeStatusCode, ab as getContext, ac as setCookie, ad as getCookie, ae as deleteCookie, af as $fetch$1, ag as createHooks, ah as executeAsync, c as createError$1, ai as toRouteMatcher, aj as createRouter$1, ak as defu } from '../nitro/nitro.mjs';
import { u as useHead$1, h as headSymbol, b as baseURL } from '../routes/renderer.mjs';
import { useRoute as useRoute$1, RouterView, createMemoryHistory, createRouter, START_LOCATION } from 'vue-router';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderSuspense, ssrRenderVNode } from 'vue/server-renderer';
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
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';

if (!globalThis.$fetch) {
  globalThis.$fetch = $fetch$1.create({
    baseURL: baseURL()
  });
}
if (!("global" in globalThis)) {
  globalThis.global = globalThis;
}
const appLayoutTransition = false;
const nuxtLinkDefaults = { "componentName": "NuxtLink" };
const appId = "nuxt-app";
function getNuxtAppCtx(id = appId) {
  return getContext(id, {
    asyncContext: false
  });
}
const NuxtPluginIndicator = "__nuxt_plugin";
function createNuxtApp(options) {
  let hydratingCount = 0;
  const nuxtApp = {
    _id: options.id || appId || "nuxt-app",
    _scope: effectScope(),
    provide: void 0,
    versions: {
      get nuxt() {
        return "4.2.2";
      },
      get vue() {
        return nuxtApp.vueApp.version;
      }
    },
    payload: shallowReactive({
      ...options.ssrContext?.payload || {},
      data: shallowReactive({}),
      state: reactive({}),
      once: /* @__PURE__ */ new Set(),
      _errors: shallowReactive({})
    }),
    static: {
      data: {}
    },
    runWithContext(fn) {
      if (nuxtApp._scope.active && !getCurrentScope()) {
        return nuxtApp._scope.run(() => callWithNuxt(nuxtApp, fn));
      }
      return callWithNuxt(nuxtApp, fn);
    },
    isHydrating: false,
    deferHydration() {
      if (!nuxtApp.isHydrating) {
        return () => {
        };
      }
      hydratingCount++;
      let called = false;
      return () => {
        if (called) {
          return;
        }
        called = true;
        hydratingCount--;
        if (hydratingCount === 0) {
          nuxtApp.isHydrating = false;
          return nuxtApp.callHook("app:suspense:resolve");
        }
      };
    },
    _asyncDataPromises: {},
    _asyncData: shallowReactive({}),
    _payloadRevivers: {},
    ...options
  };
  {
    nuxtApp.payload.serverRendered = true;
  }
  if (nuxtApp.ssrContext) {
    nuxtApp.payload.path = nuxtApp.ssrContext.url;
    nuxtApp.ssrContext.nuxt = nuxtApp;
    nuxtApp.ssrContext.payload = nuxtApp.payload;
    nuxtApp.ssrContext.config = {
      public: nuxtApp.ssrContext.runtimeConfig.public,
      app: nuxtApp.ssrContext.runtimeConfig.app
    };
  }
  nuxtApp.hooks = createHooks();
  nuxtApp.hook = nuxtApp.hooks.hook;
  {
    const contextCaller = async function(hooks, args) {
      for (const hook of hooks) {
        await nuxtApp.runWithContext(() => hook(...args));
      }
    };
    nuxtApp.hooks.callHook = (name, ...args) => nuxtApp.hooks.callHookWith(contextCaller, name, ...args);
  }
  nuxtApp.callHook = nuxtApp.hooks.callHook;
  nuxtApp.provide = (name, value) => {
    const $name = "$" + name;
    defineGetter(nuxtApp, $name, value);
    defineGetter(nuxtApp.vueApp.config.globalProperties, $name, value);
  };
  defineGetter(nuxtApp.vueApp, "$nuxt", nuxtApp);
  defineGetter(nuxtApp.vueApp.config.globalProperties, "$nuxt", nuxtApp);
  const runtimeConfig = options.ssrContext.runtimeConfig;
  nuxtApp.provide("config", runtimeConfig);
  return nuxtApp;
}
function registerPluginHooks(nuxtApp, plugin2) {
  if (plugin2.hooks) {
    nuxtApp.hooks.addHooks(plugin2.hooks);
  }
}
async function applyPlugin(nuxtApp, plugin2) {
  if (typeof plugin2 === "function") {
    const { provide: provide2 } = await nuxtApp.runWithContext(() => plugin2(nuxtApp)) || {};
    if (provide2 && typeof provide2 === "object") {
      for (const key in provide2) {
        nuxtApp.provide(key, provide2[key]);
      }
    }
  }
}
async function applyPlugins(nuxtApp, plugins2) {
  const resolvedPlugins = /* @__PURE__ */ new Set();
  const unresolvedPlugins = [];
  const parallels = [];
  let error = void 0;
  let promiseDepth = 0;
  async function executePlugin(plugin2) {
    const unresolvedPluginsForThisPlugin = plugin2.dependsOn?.filter((name) => plugins2.some((p) => p._name === name) && !resolvedPlugins.has(name)) ?? [];
    if (unresolvedPluginsForThisPlugin.length > 0) {
      unresolvedPlugins.push([new Set(unresolvedPluginsForThisPlugin), plugin2]);
    } else {
      const promise = applyPlugin(nuxtApp, plugin2).then(async () => {
        if (plugin2._name) {
          resolvedPlugins.add(plugin2._name);
          await Promise.all(unresolvedPlugins.map(async ([dependsOn, unexecutedPlugin]) => {
            if (dependsOn.has(plugin2._name)) {
              dependsOn.delete(plugin2._name);
              if (dependsOn.size === 0) {
                promiseDepth++;
                await executePlugin(unexecutedPlugin);
              }
            }
          }));
        }
      }).catch((e) => {
        if (!plugin2.parallel && !nuxtApp.payload.error) {
          throw e;
        }
        error ||= e;
      });
      if (plugin2.parallel) {
        parallels.push(promise);
      } else {
        await promise;
      }
    }
  }
  for (const plugin2 of plugins2) {
    if (nuxtApp.ssrContext?.islandContext && plugin2.env?.islands === false) {
      continue;
    }
    registerPluginHooks(nuxtApp, plugin2);
  }
  for (const plugin2 of plugins2) {
    if (nuxtApp.ssrContext?.islandContext && plugin2.env?.islands === false) {
      continue;
    }
    await executePlugin(plugin2);
  }
  await Promise.all(parallels);
  if (promiseDepth) {
    for (let i = 0; i < promiseDepth; i++) {
      await Promise.all(parallels);
    }
  }
  if (error) {
    throw nuxtApp.payload.error || error;
  }
}
// @__NO_SIDE_EFFECTS__
function defineNuxtPlugin(plugin2) {
  if (typeof plugin2 === "function") {
    return plugin2;
  }
  const _name = plugin2._name || plugin2.name;
  delete plugin2.name;
  return Object.assign(plugin2.setup || (() => {
  }), plugin2, { [NuxtPluginIndicator]: true, _name });
}
function callWithNuxt(nuxt, setup, args) {
  const fn = () => setup();
  const nuxtAppCtx = getNuxtAppCtx(nuxt._id);
  {
    return nuxt.vueApp.runWithContext(() => nuxtAppCtx.callAsync(nuxt, fn));
  }
}
function tryUseNuxtApp(id) {
  let nuxtAppInstance;
  if (hasInjectionContext()) {
    nuxtAppInstance = getCurrentInstance()?.appContext.app.$nuxt;
  }
  nuxtAppInstance ||= getNuxtAppCtx(id).tryUse();
  return nuxtAppInstance || null;
}
function useNuxtApp(id) {
  const nuxtAppInstance = tryUseNuxtApp(id);
  if (!nuxtAppInstance) {
    {
      throw new Error("[nuxt] instance unavailable");
    }
  }
  return nuxtAppInstance;
}
// @__NO_SIDE_EFFECTS__
function useRuntimeConfig(_event) {
  return useNuxtApp().$config;
}
function defineGetter(obj, key, val) {
  Object.defineProperty(obj, key, { get: () => val });
}
const LayoutMetaSymbol = /* @__PURE__ */ Symbol("layout-meta");
const PageRouteSymbol = /* @__PURE__ */ Symbol("route");
globalThis._importMeta_.url.replace(/\/app\/.*$/, "/");
const useRouter = () => {
  return useNuxtApp()?.$router;
};
const useRoute = () => {
  if (hasInjectionContext()) {
    return inject(PageRouteSymbol, useNuxtApp()._route);
  }
  return useNuxtApp()._route;
};
// @__NO_SIDE_EFFECTS__
function defineNuxtRouteMiddleware(middleware) {
  return middleware;
}
const isProcessingMiddleware = () => {
  try {
    if (useNuxtApp()._processingMiddleware) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
};
const URL_QUOTE_RE = /"/g;
const navigateTo = (to, options) => {
  to ||= "/";
  const toPath = typeof to === "string" ? to : "path" in to ? resolveRouteObject(to) : useRouter().resolve(to).href;
  const isExternalHost = hasProtocol(toPath, { acceptRelative: true });
  const isExternal = options?.external || isExternalHost;
  if (isExternal) {
    if (!options?.external) {
      throw new Error("Navigating to an external URL is not allowed by default. Use `navigateTo(url, { external: true })`.");
    }
    const { protocol } = new URL(toPath, "http://localhost");
    if (protocol && isScriptProtocol(protocol)) {
      throw new Error(`Cannot navigate to a URL with '${protocol}' protocol.`);
    }
  }
  const inMiddleware = isProcessingMiddleware();
  const router = useRouter();
  const nuxtApp = useNuxtApp();
  {
    if (nuxtApp.ssrContext) {
      const fullPath = typeof to === "string" || isExternal ? toPath : router.resolve(to).fullPath || "/";
      const location2 = isExternal ? toPath : joinURL((/* @__PURE__ */ useRuntimeConfig()).app.baseURL, fullPath);
      const redirect = async function(response) {
        await nuxtApp.callHook("app:redirected");
        const encodedLoc = location2.replace(URL_QUOTE_RE, "%22");
        const encodedHeader = encodeURL(location2, isExternalHost);
        nuxtApp.ssrContext._renderResponse = {
          statusCode: sanitizeStatusCode(options?.redirectCode || 302, 302),
          body: `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`,
          headers: { location: encodedHeader }
        };
        return response;
      };
      if (!isExternal && inMiddleware) {
        router.afterEach((final) => final.fullPath === fullPath ? redirect(false) : void 0);
        return to;
      }
      return redirect(!inMiddleware ? void 0 : (
        /* abort route navigation */
        false
      ));
    }
  }
  if (isExternal) {
    nuxtApp._scope.stop();
    if (options?.replace) {
      (void 0).replace(toPath);
    } else {
      (void 0).href = toPath;
    }
    if (inMiddleware) {
      if (!nuxtApp.isHydrating) {
        return false;
      }
      return new Promise(() => {
      });
    }
    return Promise.resolve();
  }
  return options?.replace ? router.replace(to) : router.push(to);
};
function resolveRouteObject(to) {
  return withQuery(to.path || "", to.query || {}) + (to.hash || "");
}
function encodeURL(location2, isExternalHost = false) {
  const url = new URL(location2, "http://localhost");
  if (!isExternalHost) {
    return url.pathname + url.search + url.hash;
  }
  if (location2.startsWith("//")) {
    return url.toString().replace(url.protocol, "");
  }
  return url.toString();
}
const NUXT_ERROR_SIGNATURE = "__nuxt_error";
const useError = /* @__NO_SIDE_EFFECTS__ */ () => toRef(useNuxtApp().payload, "error");
const showError = (error) => {
  const nuxtError = createError(error);
  try {
    const error2 = /* @__PURE__ */ useError();
    if (false) ;
    error2.value ||= nuxtError;
  } catch {
    throw nuxtError;
  }
  return nuxtError;
};
const isNuxtError = (error) => !!error && typeof error === "object" && NUXT_ERROR_SIGNATURE in error;
const createError = (error) => {
  const nuxtError = createError$1(error);
  Object.defineProperty(nuxtError, NUXT_ERROR_SIGNATURE, {
    value: true,
    configurable: false,
    writable: false
  });
  return nuxtError;
};
const unhead_k2P3m_ZDyjlr2mMYnoDPwavjsDN8hBlk9cFai0bbopU = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:head",
  enforce: "pre",
  setup(nuxtApp) {
    const head = nuxtApp.ssrContext.head;
    nuxtApp.vueApp.use(head);
  }
});
function toArray(value) {
  return Array.isArray(value) ? value : [value];
}
async function getRouteRules(arg) {
  const path = typeof arg === "string" ? arg : arg.path;
  {
    useNuxtApp().ssrContext._preloadManifest = true;
    const _routeRulesMatcher = toRouteMatcher(
      createRouter$1({ routes: (/* @__PURE__ */ useRuntimeConfig()).nitro.routeRules })
    );
    return defu({}, ..._routeRulesMatcher.matchAll(path).reverse());
  }
}
const __nuxt_page_meta$u = {
  layout: "default",
  title: "Панель управления"
};
const __nuxt_page_meta$t = {
  layout: "default"
};
const __nuxt_page_meta$s = {
  layout: "default"
};
const __nuxt_page_meta$r = {
  layout: "default"
};
const __nuxt_page_meta$q = {
  layout: "default"
};
const __nuxt_page_meta$p = {
  layout: "default"
};
const __nuxt_page_meta$o = {
  layout: "default"
};
const __nuxt_page_meta$n = {
  layout: "fullscreen",
  title: "Вход в систему"
};
const __nuxt_page_meta$m = {
  layout: "default"
};
const __nuxt_page_meta$l = {
  layout: "default"
};
const __nuxt_page_meta$k = {
  layout: "default"
};
const __nuxt_page_meta$j = {
  title: "Учебная программа"
};
const __nuxt_page_meta$i = {
  layout: "default"
};
const __nuxt_page_meta$h = {
  layout: "default"
};
const __nuxt_page_meta$g = {
  layout: "default"
};
const __nuxt_page_meta$f = {
  layout: "default"
};
const __nuxt_page_meta$e = {
  layout: "default"
};
const __nuxt_page_meta$d = {
  layout: "default"
};
const __nuxt_page_meta$c = {
  layout: "default"
};
const __nuxt_page_meta$b = {
  layout: false
  // Полноэкранный режим
};
const __nuxt_page_meta$a = {
  title: "Профиль инструктора"
};
const __nuxt_page_meta$9 = {
  layout: "default"
};
const __nuxt_page_meta$8 = {
  layout: "default"
};
const __nuxt_page_meta$7 = {
  layout: "default"
};
const __nuxt_page_meta$6 = {
  layout: "default"
};
const __nuxt_page_meta$5 = {
  layout: "default"
};
const __nuxt_page_meta$4 = {
  layout: "default"
};
const __nuxt_page_meta$3 = {
  layout: "default",
  title: "Шаблоны сертификатов"
};
const __nuxt_page_meta$2 = {
  layout: "default"
};
const __nuxt_page_meta$1 = {
  layout: "default"
};
const __nuxt_page_meta = {
  layout: "blank"
};
const _routes = [
  {
    name: "blank",
    path: "/blank",
    component: () => import('./blank-CBkPlxQB.mjs')
  },
  {
    name: "index",
    path: "/",
    meta: __nuxt_page_meta$u || {},
    component: () => import('./index-CZw0vtlD.mjs')
  },
  {
    name: "profile",
    path: "/profile",
    meta: __nuxt_page_meta$t || {},
    component: () => import('./profile-Doztsxcz.mjs')
  },
  {
    name: "support",
    path: "/support",
    meta: __nuxt_page_meta$s || {},
    component: () => import('./support-0OheoZMA.mjs')
  },
  {
    name: "calendar",
    path: "/calendar",
    component: () => import('./calendar-Dd0BcPG_.mjs')
  },
  {
    name: "schedule",
    path: "/schedule",
    meta: __nuxt_page_meta$r || {},
    component: () => import('./schedule-BcMfRny-.mjs')
  },
  {
    name: "settings",
    path: "/settings",
    meta: __nuxt_page_meta$q || {},
    component: () => import('./settings-HLqfDWQK.mjs')
  },
  {
    name: "tests-my",
    path: "/tests/my",
    meta: __nuxt_page_meta$p || {},
    component: () => import('./my-CQ6hW7Bs.mjs')
  },
  {
    name: "error-404",
    path: "/error-404",
    component: () => import('./error-404-BbPtM7GT.mjs')
  },
  {
    name: "users-id",
    path: "/users/:id()",
    meta: __nuxt_page_meta$o || {},
    component: () => import('./_id_-ERtDslis.mjs')
  },
  {
    name: "auth-signin",
    path: "/auth/signin",
    meta: __nuxt_page_meta$n || {},
    component: () => import('./signin-qgsfnfLm.mjs')
  },
  {
    name: "files",
    path: "/files",
    meta: __nuxt_page_meta$m || {},
    component: () => import('./index-CDGXZtm6.mjs')
  },
  {
    name: "users",
    path: "/users",
    meta: __nuxt_page_meta$l || {},
    component: () => import('./index-wzHKAeTv.mjs')
  },
  {
    name: "basic-tables",
    path: "/basic-tables",
    component: () => import('./basic-tables-CA8PiYB8.mjs')
  },
  {
    name: "groups",
    path: "/groups",
    meta: __nuxt_page_meta$k || {},
    component: () => import('./index-pVdi3LRF.mjs')
  },
  {
    name: "form-elements",
    path: "/form-elements",
    component: () => import('./form-elements-C33le2QW.mjs')
  },
  {
    name: "programs-id",
    path: "/programs/:id()",
    meta: __nuxt_page_meta$j || {},
    component: () => import('./_id_-CbvheQea.mjs')
  },
  {
    name: "students-id",
    path: "/students/:id()",
    component: () => import('./_id_-Kgnu5cDz.mjs')
  },
  {
    name: "database",
    path: "/database",
    meta: __nuxt_page_meta$i || {},
    component: () => import('./index-rAQu8NAo.mjs')
  },
  {
    name: "programs",
    path: "/programs",
    meta: __nuxt_page_meta$h || {},
    component: () => import('./index-BM2SfSgY.mjs')
  },
  {
    name: "test-bank-id",
    path: "/test-bank/:id()",
    meta: __nuxt_page_meta$g || {},
    component: () => import('./_id_-pCNky3AH.mjs')
  },
  {
    name: "database-import",
    path: "/database/import",
    meta: __nuxt_page_meta$f || {},
    component: () => import('./import-C_xQj6-e.mjs')
  },
  {
    name: "my-certificates",
    path: "/my-certificates",
    meta: __nuxt_page_meta$e || {},
    component: () => import('./my-certificates-Cqspnp9V.mjs')
  },
  {
    name: "programs-create",
    path: "/programs/create",
    meta: __nuxt_page_meta$d || {},
    component: () => import('./create-CWo3s7zU.mjs')
  },
  {
    name: "test-bank",
    path: "/test-bank",
    meta: __nuxt_page_meta$c || {},
    component: () => import('./index-BjW-WzWH.mjs')
  },
  {
    name: "tests-take-id",
    path: "/tests/take/:id()",
    meta: __nuxt_page_meta$b || {},
    component: () => import('./_id_-DK-n5-05.mjs')
  },
  {
    name: "instructors-id",
    path: "/instructors/:id()",
    meta: __nuxt_page_meta$a || {},
    component: () => import('./_id_-_rrG52rP.mjs')
  },
  {
    name: "groups-id",
    path: "/groups/:id()",
    meta: __nuxt_page_meta$9 || {},
    component: () => import('./index-N2YtvEOs.mjs')
  },
  {
    name: "programs-edit-id",
    path: "/programs/edit/:id()",
    meta: __nuxt_page_meta$8 || {},
    component: () => import('./_id_-Cdq9ufAv.mjs')
  },
  {
    name: "groups-journal-slug",
    path: "/groups/journal/:slug()",
    meta: __nuxt_page_meta$7 || {},
    component: () => import('./_slug_-DfizDrJc.mjs')
  },
  {
    name: "groups-id-certificates",
    path: "/groups/:id()/certificates",
    meta: __nuxt_page_meta$6 || {},
    component: () => import('./certificates-Beh8Cwqe.mjs')
  },
  {
    name: "test-bank-templates-id",
    path: "/test-bank/templates/:id()",
    meta: __nuxt_page_meta$5 || {},
    component: () => import('./_id_-D-vqw9OK.mjs')
  },
  {
    name: "test-bank-templates",
    path: "/test-bank/templates",
    meta: __nuxt_page_meta$4 || {},
    component: () => import('./index-BUXID75_.mjs')
  },
  {
    name: "certificates-templates",
    path: "/certificates/templates",
    meta: __nuxt_page_meta$3 || {},
    component: () => import('./index-CfCeuJC2.mjs')
  },
  {
    name: "database-import-certificates",
    path: "/database/import-certificates",
    meta: __nuxt_page_meta$2 || {},
    component: () => import('./import-certificates-6HsO-U-t.mjs')
  },
  {
    name: "certificates-templates-id",
    path: "/certificates/templates/:id()",
    meta: __nuxt_page_meta$1 || {},
    component: () => import('./index-Djlv5bKx.mjs')
  },
  {
    name: "certificates-templates-id-editor",
    path: "/certificates/templates/:id()/editor",
    meta: __nuxt_page_meta || {},
    component: () => import('./editor-Thgc-66I.mjs')
  }
];
const _wrapInTransition = (props, children) => {
  return { default: () => children.default?.() };
};
const ROUTE_KEY_PARENTHESES_RE = /(:\w+)\([^)]+\)/g;
const ROUTE_KEY_SYMBOLS_RE = /(:\w+)[?+*]/g;
const ROUTE_KEY_NORMAL_RE = /:\w+/g;
function generateRouteKey(route) {
  const source = route?.meta.key ?? route.path.replace(ROUTE_KEY_PARENTHESES_RE, "$1").replace(ROUTE_KEY_SYMBOLS_RE, "$1").replace(ROUTE_KEY_NORMAL_RE, (r) => route.params[r.slice(1)]?.toString() || "");
  return typeof source === "function" ? source(route) : source;
}
function isChangingPage(to, from) {
  if (to === from || from === START_LOCATION) {
    return false;
  }
  if (generateRouteKey(to) !== generateRouteKey(from)) {
    return true;
  }
  const areComponentsSame = to.matched.every(
    (comp, index) => comp.components && comp.components.default === from.matched[index]?.components?.default
  );
  if (areComponentsSame) {
    return false;
  }
  return true;
}
const routerOptions0 = {
  scrollBehavior(to, from, savedPosition) {
    const nuxtApp = useNuxtApp();
    const hashScrollBehaviour = useRouter().options?.scrollBehaviorType ?? "auto";
    if (to.path.replace(/\/$/, "") === from.path.replace(/\/$/, "")) {
      if (from.hash && !to.hash) {
        return { left: 0, top: 0 };
      }
      if (to.hash) {
        return { el: to.hash, top: _getHashElementScrollMarginTop(to.hash), behavior: hashScrollBehaviour };
      }
      return false;
    }
    const routeAllowsScrollToTop = typeof to.meta.scrollToTop === "function" ? to.meta.scrollToTop(to, from) : to.meta.scrollToTop;
    if (routeAllowsScrollToTop === false) {
      return false;
    }
    const hookToWait = nuxtApp._runningTransition ? "page:transition:finish" : "page:loading:end";
    return new Promise((resolve) => {
      if (from === START_LOCATION) {
        resolve(_calculatePosition(to, from, savedPosition, hashScrollBehaviour));
        return;
      }
      nuxtApp.hooks.hookOnce(hookToWait, () => {
        requestAnimationFrame(() => resolve(_calculatePosition(to, from, savedPosition, hashScrollBehaviour)));
      });
    });
  }
};
function _getHashElementScrollMarginTop(selector) {
  try {
    const elem = (void 0).querySelector(selector);
    if (elem) {
      return (Number.parseFloat(getComputedStyle(elem).scrollMarginTop) || 0) + (Number.parseFloat(getComputedStyle((void 0).documentElement).scrollPaddingTop) || 0);
    }
  } catch {
  }
  return 0;
}
function _calculatePosition(to, from, savedPosition, defaultHashScrollBehaviour) {
  if (savedPosition) {
    return savedPosition;
  }
  const isPageNavigation = isChangingPage(to, from);
  if (to.hash) {
    return {
      el: to.hash,
      top: _getHashElementScrollMarginTop(to.hash),
      behavior: isPageNavigation ? defaultHashScrollBehaviour : "instant"
    };
  }
  return {
    left: 0,
    top: 0
  };
}
const configRouterOptions = {
  hashMode: false,
  scrollBehaviorType: "auto"
};
const routerOptions = {
  ...configRouterOptions,
  ...routerOptions0
};
const validate = /* @__PURE__ */ defineNuxtRouteMiddleware(async (to, from) => {
  let __temp, __restore;
  if (!to.meta?.validate) {
    return;
  }
  const result = ([__temp, __restore] = executeAsync(() => Promise.resolve(to.meta.validate(to))), __temp = await __temp, __restore(), __temp);
  if (result === true) {
    return;
  }
  const error = createError({
    fatal: false,
    statusCode: result && result.statusCode || 404,
    statusMessage: result && result.statusMessage || `Page Not Found: ${to.fullPath}`,
    data: {
      path: to.fullPath
    }
  });
  return error;
});
var UserRole = /* @__PURE__ */ ((UserRole2) => {
  UserRole2["ADMIN"] = "ADMIN";
  UserRole2["MANAGER"] = "MANAGER";
  UserRole2["TEACHER"] = "TEACHER";
  UserRole2["STUDENT"] = "STUDENT";
  return UserRole2;
})(UserRole || {});
var Permission = /* @__PURE__ */ ((Permission2) => {
  Permission2["DASHBOARD_VIEW"] = "dashboard:view";
  Permission2["DASHBOARD_STATS"] = "dashboard:stats";
  Permission2["USERS_VIEW"] = "users:view";
  Permission2["USERS_CREATE"] = "users:create";
  Permission2["USERS_UPDATE"] = "users:update";
  Permission2["USERS_DELETE"] = "users:delete";
  Permission2["USERS_MANAGE_ROLES"] = "users:manage_roles";
  Permission2["STUDENTS_VIEW"] = "students:view";
  Permission2["STUDENTS_VIEW_OWN"] = "students:view_own";
  Permission2["STUDENTS_VIEW_ALL"] = "students:view_all";
  Permission2["STUDENTS_CREATE"] = "students:create";
  Permission2["STUDENTS_UPDATE"] = "students:update";
  Permission2["STUDENTS_DELETE"] = "students:delete";
  Permission2["STUDENTS_IMPORT"] = "students:import";
  Permission2["STUDENTS_EXPORT"] = "students:export";
  Permission2["INSTRUCTORS_VIEW"] = "instructors:view";
  Permission2["INSTRUCTORS_CREATE"] = "instructors:create";
  Permission2["INSTRUCTORS_UPDATE"] = "instructors:update";
  Permission2["INSTRUCTORS_DELETE"] = "instructors:delete";
  Permission2["INSTRUCTORS_HOURS"] = "instructors:hours";
  Permission2["ORGANIZATIONS_VIEW"] = "organizations:view";
  Permission2["ORGANIZATIONS_CREATE"] = "organizations:create";
  Permission2["ORGANIZATIONS_UPDATE"] = "organizations:update";
  Permission2["ORGANIZATIONS_DELETE"] = "organizations:delete";
  Permission2["REPRESENTATIVES_VIEW"] = "representatives:view";
  Permission2["REPRESENTATIVES_APPROVE"] = "representatives:approve";
  Permission2["REPRESENTATIVES_BLOCK"] = "representatives:block";
  Permission2["REPRESENTATIVES_MANAGE"] = "representatives:manage";
  Permission2["COURSES_VIEW"] = "courses:view";
  Permission2["COURSES_CREATE"] = "courses:create";
  Permission2["COURSES_UPDATE"] = "courses:update";
  Permission2["COURSES_DELETE"] = "courses:delete";
  Permission2["DISCIPLINES_VIEW"] = "disciplines:view";
  Permission2["DISCIPLINES_MANAGE"] = "disciplines:manage";
  Permission2["GROUPS_VIEW"] = "groups:view";
  Permission2["GROUPS_VIEW_OWN"] = "groups:view_own";
  Permission2["GROUPS_VIEW_ALL"] = "groups:view_all";
  Permission2["GROUPS_CREATE"] = "groups:create";
  Permission2["GROUPS_UPDATE"] = "groups:update";
  Permission2["GROUPS_DELETE"] = "groups:delete";
  Permission2["GROUPS_MANAGE_STUDENTS"] = "groups:manage_students";
  Permission2["SCHEDULE_VIEW"] = "schedule:view";
  Permission2["SCHEDULE_VIEW_OWN"] = "schedule:view_own";
  Permission2["SCHEDULE_VIEW_ALL"] = "schedule:view_all";
  Permission2["SCHEDULE_CREATE"] = "schedule:create";
  Permission2["SCHEDULE_UPDATE"] = "schedule:update";
  Permission2["SCHEDULE_DELETE"] = "schedule:delete";
  Permission2["ATTENDANCE_VIEW"] = "attendance:view";
  Permission2["ATTENDANCE_MARK"] = "attendance:mark";
  Permission2["ATTENDANCE_EDIT"] = "attendance:edit";
  Permission2["GRADES_VIEW"] = "grades:view";
  Permission2["GRADES_MANAGE"] = "grades:manage";
  Permission2["CERTIFICATES_VIEW"] = "certificates:view";
  Permission2["CERTIFICATES_VIEW_OWN"] = "certificates:view_own";
  Permission2["CERTIFICATES_ISSUE"] = "certificates:issue";
  Permission2["CERTIFICATES_REVOKE"] = "certificates:revoke";
  Permission2["CERTIFICATES_DOWNLOAD"] = "certificates:download";
  Permission2["TEMPLATES_VIEW"] = "templates:view";
  Permission2["TEMPLATES_CREATE"] = "templates:create";
  Permission2["TEMPLATES_UPDATE"] = "templates:update";
  Permission2["TEMPLATES_DELETE"] = "templates:delete";
  Permission2["FILES_VIEW"] = "files:view";
  Permission2["FILES_UPLOAD"] = "files:upload";
  Permission2["FILES_DELETE"] = "files:delete";
  Permission2["FILES_MANAGE"] = "files:manage";
  Permission2["SETTINGS_VIEW"] = "settings:view";
  Permission2["SETTINGS_MANAGE"] = "settings:manage";
  Permission2["LOGS_VIEW"] = "logs:view";
  Permission2["TEST_BANKS_VIEW"] = "test_banks:view";
  Permission2["TEST_BANKS_MANAGE"] = "test_banks:manage";
  Permission2["TEST_TEMPLATES_VIEW"] = "test_templates:view";
  Permission2["TEST_TEMPLATES_MANAGE"] = "test_templates:manage";
  Permission2["TESTS_ASSIGN"] = "tests:assign";
  Permission2["TESTS_TAKE"] = "tests:take";
  Permission2["TESTS_VIEW_RESULTS"] = "tests:view_results";
  return Permission2;
})(Permission || {});
const ROLE_PERMISSIONS = {
  // =========================================================
  // ADMIN — Полный доступ ко всему
  // =========================================================
  [UserRole.ADMIN]: Object.values(Permission),
  // =========================================================
  // MANAGER — Управление контентом
  // =========================================================
  [UserRole.MANAGER]: [
    // Dashboard
    "dashboard:view",
    "dashboard:stats",
    // Users (ограниченно — только просмотр)
    "users:view",
    // Students
    "students:view",
    "students:view_all",
    "students:create",
    "students:update",
    "students:import",
    "students:export",
    // НЕ может удалять слушателей
    // Instructors
    "instructors:view",
    "instructors:create",
    // Может создавать инструкторов
    "instructors:update",
    // Может редактировать инструкторов
    "instructors:hours",
    // НЕ может удалять инструкторов
    // Organizations
    "organizations:view",
    "organizations:create",
    "organizations:update",
    // НЕ может удалять
    // Representatives
    "representatives:view",
    "representatives:approve",
    "representatives:block",
    // НЕ может полностью управлять (удалять)
    // Courses (только просмотр)
    "courses:view",
    // Disciplines (только просмотр)
    "disciplines:view",
    // Groups
    "groups:view",
    "groups:view_all",
    "groups:create",
    "groups:update",
    "groups:manage_students",
    // НЕ может удалять группы
    // Schedule
    "schedule:view",
    "schedule:view_all",
    "schedule:create",
    "schedule:update",
    // НЕ может удалять события
    // Attendance
    "attendance:view",
    "attendance:mark",
    "attendance:edit",
    // Grades
    "grades:view",
    "grades:manage",
    // Certificates
    "certificates:view",
    "certificates:issue",
    "certificates:download",
    // НЕ может отзывать сертификаты
    // Templates (только просмотр)
    "templates:view",
    // Files
    "files:view",
    "files:upload",
    // НЕ может удалять/управлять
    // Settings (только просмотр)
    "settings:view",
    // Logs
    "logs:view",
    // Test Banks (полный доступ)
    "test_banks:view",
    "test_banks:manage",
    // Test Templates (полный доступ)
    "test_templates:view",
    "test_templates:manage",
    // Tests (назначение и просмотр результатов)
    "tests:assign",
    "tests:view_results"
    /* TESTS_VIEW_RESULTS */
  ],
  // =========================================================
  // TEACHER — Преподаватель
  // =========================================================
  [UserRole.TEACHER]: [
    // Dashboard
    "dashboard:view",
    // Students (только просмотр своих групп)
    "students:view",
    "students:view_own",
    // Только слушатели из своих групп
    // Groups (свои группы)
    "groups:view",
    "groups:view_own",
    // Schedule (своё расписание)
    "schedule:view",
    "schedule:view_own",
    // Attendance (для своих групп)
    "attendance:view",
    "attendance:mark",
    // Grades (для своих групп)
    "grades:view",
    "grades:manage",
    // Files (только просмотр)
    "files:view",
    // Courses (только просмотр)
    "courses:view",
    "disciplines:view",
    // Test Banks (только просмотр)
    "test_banks:view",
    // Test Templates (только просмотр)
    "test_templates:view",
    // Tests (назначение и просмотр результатов)
    "tests:assign",
    "tests:view_results"
    /* TESTS_VIEW_RESULTS */
  ],
  // =========================================================
  // STUDENT — Слушатель
  // =========================================================
  [UserRole.STUDENT]: [
    // Dashboard (минимальный)
    "dashboard:view",
    // Свои данные
    "students:view_own",
    // Schedule (своё)
    "schedule:view",
    "schedule:view_own",
    // Attendance (только просмотр своего)
    "attendance:view",
    // Grades (только просмотр своих)
    "grades:view",
    // Certificates (свои)
    "certificates:view",
    "certificates:view_own",
    "certificates:download",
    // Tests (прохождение тестов)
    "tests:take"
    /* TESTS_TAKE */
  ]
};
const PAGE_PERMISSIONS = [
  // Публичные страницы (без проверки)
  { path: "/login", allowedRoles: [] },
  { path: "/register", allowedRoles: [] },
  // Dashboard
  { path: "/", requiredPermissions: [
    "dashboard:view"
    /* DASHBOARD_VIEW */
  ] },
  // Users
  { path: "/users", requiredPermissions: [
    "users:view"
    /* USERS_VIEW */
  ] },
  { path: "/users/create", requiredPermissions: [
    "users:create"
    /* USERS_CREATE */
  ] },
  // Programs (Courses)
  { path: "/programs", requiredPermissions: [
    "courses:view"
    /* COURSES_VIEW */
  ] },
  { path: "/programs/create", requiredPermissions: [
    "courses:create"
    /* COURSES_CREATE */
  ] },
  { path: "/programs/[id]", requiredPermissions: [
    "courses:view"
    /* COURSES_VIEW */
  ] },
  { path: "/programs/edit/[id]", requiredPermissions: [
    "courses:update"
    /* COURSES_UPDATE */
  ] },
  // Groups
  { path: "/groups", anyPermissions: [
    "groups:view_all",
    "groups:view_own"
    /* GROUPS_VIEW_OWN */
  ] },
  { path: "/groups/create", requiredPermissions: [
    "groups:create"
    /* GROUPS_CREATE */
  ] },
  { path: "/groups/[id]", anyPermissions: [
    "groups:view_all",
    "groups:view_own"
    /* GROUPS_VIEW_OWN */
  ], requiresOwnerCheck: true },
  { path: "/groups/journal/[id]", anyPermissions: [
    "attendance:view",
    "attendance:mark"
    /* ATTENDANCE_MARK */
  ], requiresOwnerCheck: true },
  { path: "/groups/[id]/certificates", requiredPermissions: [
    "certificates:issue"
    /* CERTIFICATES_ISSUE */
  ] },
  // Schedule
  { path: "/schedule", anyPermissions: [
    "schedule:view_all",
    "schedule:view_own"
    /* SCHEDULE_VIEW_OWN */
  ] },
  // Database (Students/Instructors)
  { path: "/database", requiredPermissions: [
    "students:view_all"
    /* STUDENTS_VIEW_ALL */
  ] },
  { path: "/database/import", requiredPermissions: [
    "students:import"
    /* STUDENTS_IMPORT */
  ] },
  { path: "/students/[id]", anyPermissions: [
    "students:view_all",
    "students:view_own"
    /* STUDENTS_VIEW_OWN */
  ], requiresOwnerCheck: true },
  { path: "/instructors/[id]", requiredPermissions: [
    "instructors:view"
    /* INSTRUCTORS_VIEW */
  ], requiresOwnerCheck: true },
  // Files
  { path: "/files", requiredPermissions: [
    "files:view"
    /* FILES_VIEW */
  ] },
  // Certificates
  { path: "/certificates/templates", requiredPermissions: [
    "templates:view"
    /* TEMPLATES_VIEW */
  ] },
  { path: "/certificates/templates/create", requiredPermissions: [
    "templates:create"
    /* TEMPLATES_CREATE */
  ] },
  { path: "/certificates/templates/[id]", requiredPermissions: [
    "templates:update"
    /* TEMPLATES_UPDATE */
  ] },
  { path: "/my-certificates", requiredPermissions: [
    "certificates:view_own"
    /* CERTIFICATES_VIEW_OWN */
  ] },
  // Settings
  { path: "/settings", requiredPermissions: [
    "settings:view"
    /* SETTINGS_VIEW */
  ] },
  // Test Banks
  { path: "/test-bank", anyPermissions: [
    "test_banks:view",
    "test_banks:manage"
    /* TEST_BANKS_MANAGE */
  ] },
  { path: "/test-bank/[id]", anyPermissions: [
    "test_banks:view",
    "test_banks:manage"
    /* TEST_BANKS_MANAGE */
  ] },
  { path: "/test-bank/templates", anyPermissions: [
    "test_templates:view",
    "test_templates:manage"
    /* TEST_TEMPLATES_MANAGE */
  ] },
  { path: "/test-bank/templates/[id]", anyPermissions: [
    "test_templates:view",
    "test_templates:manage"
    /* TEST_TEMPLATES_MANAGE */
  ] },
  // Tests (Student)
  { path: "/tests/my", requiredPermissions: [
    "tests:take"
    /* TESTS_TAKE */
  ] },
  { path: "/tests/take/[id]", requiredPermissions: [
    "tests:take"
    /* TESTS_TAKE */
  ] }
];
function roleHasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions?.includes(permission) ?? false;
}
function roleHasAllPermissions(role, permissions) {
  return permissions.every((p) => roleHasPermission(role, p));
}
function roleHasAnyPermission(role, permissions) {
  return permissions.some((p) => roleHasPermission(role, p));
}
function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || [];
}
function injectHead(nuxtApp) {
  const nuxt = nuxtApp || useNuxtApp();
  return nuxt.ssrContext?.head || nuxt.runWithContext(() => {
    if (hasInjectionContext()) {
      const head = inject(headSymbol);
      if (!head) {
        throw new Error("[nuxt] [unhead] Missing Unhead instance.");
      }
      return head;
    }
  });
}
function useHead(input, options = {}) {
  const head = options.head || injectHead(options.nuxt);
  return useHead$1(input, { head, ...options });
}
function useRequestEvent(nuxtApp) {
  nuxtApp ||= useNuxtApp();
  return nuxtApp.ssrContext?.event;
}
const CookieDefaults = {
  path: "/",
  watch: true,
  decode: (val) => destr(decodeURIComponent(val)),
  encode: (val) => encodeURIComponent(typeof val === "string" ? val : JSON.stringify(val))
};
function useCookie(name, _opts) {
  const opts = { ...CookieDefaults, ..._opts };
  opts.filter ??= (key) => key === name;
  const cookies = readRawCookies(opts) || {};
  let delay;
  if (opts.maxAge !== void 0) {
    delay = opts.maxAge * 1e3;
  } else if (opts.expires) {
    delay = opts.expires.getTime() - Date.now();
  }
  const hasExpired = delay !== void 0 && delay <= 0;
  const cookieValue = klona(hasExpired ? void 0 : cookies[name] ?? opts.default?.());
  const cookie = ref(cookieValue);
  {
    const nuxtApp = useNuxtApp();
    const writeFinalCookieValue = () => {
      if (opts.readonly || isEqual(cookie.value, cookies[name])) {
        return;
      }
      nuxtApp._cookies ||= {};
      if (name in nuxtApp._cookies) {
        if (isEqual(cookie.value, nuxtApp._cookies[name])) {
          return;
        }
      }
      nuxtApp._cookies[name] = cookie.value;
      writeServerCookie(useRequestEvent(nuxtApp), name, cookie.value, opts);
    };
    const unhook = nuxtApp.hooks.hookOnce("app:rendered", writeFinalCookieValue);
    nuxtApp.hooks.hookOnce("app:error", () => {
      unhook();
      return writeFinalCookieValue();
    });
  }
  return cookie;
}
function readRawCookies(opts = {}) {
  {
    return parse(getRequestHeader(useRequestEvent(), "cookie") || "", opts);
  }
}
function writeServerCookie(event, name, value, opts = {}) {
  if (event) {
    if (value !== null && value !== void 0) {
      return setCookie(event, name, value, opts);
    }
    if (getCookie(event, name) !== void 0) {
      return deleteCookie(event, name, opts);
    }
  }
}
const useStateKeyPrefix = "$s";
function useState(...args) {
  const autoKey = typeof args[args.length - 1] === "string" ? args.pop() : void 0;
  if (typeof args[0] !== "string") {
    args.unshift(autoKey);
  }
  const [_key, init] = args;
  if (!_key || typeof _key !== "string") {
    throw new TypeError("[nuxt] [useState] key must be a string: " + _key);
  }
  if (init !== void 0 && typeof init !== "function") {
    throw new Error("[nuxt] [useState] init must be a function: " + init);
  }
  const key = useStateKeyPrefix + _key;
  const nuxtApp = useNuxtApp();
  const state = toRef(nuxtApp.payload.state, key);
  if (state.value === void 0 && init) {
    const initialValue = init();
    if (isRef(initialValue)) {
      nuxtApp.payload.state[key] = initialValue;
      return initialValue;
    }
    state.value = initialValue;
  }
  return state;
}
const PUBLIC_PAGES = [
  "/auth/signin",
  "/auth/signup",
  "/auth/forgot-password"
];
function isPublicPage(path) {
  return PUBLIC_PAGES.some((page) => path.startsWith(page));
}
function matchPath(path, pattern) {
  const regexPattern = pattern.replace(/\[.*?\]/g, "[^/]+").replace(/\//g, "\\/");
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}
function findPagePermissionConfig(path) {
  for (const config of PAGE_PERMISSIONS) {
    if (matchPath(path, config.path)) {
      return config;
    }
  }
  return null;
}
function checkPageAccess(path, userRole) {
  const config = findPagePermissionConfig(path);
  if (!config) {
    return { allowed: true };
  }
  if (config.allowedRoles && config.allowedRoles.length > 0) {
    if (!config.allowedRoles.includes(userRole)) {
      return {
        allowed: false,
        reason: `Требуется одна из ролей: ${config.allowedRoles.join(", ")}`
      };
    }
  }
  if (config.requiredPermissions && config.requiredPermissions.length > 0) {
    if (!roleHasAllPermissions(userRole, config.requiredPermissions)) {
      const missing = config.requiredPermissions.filter((p) => !roleHasPermission(userRole, p));
      return {
        allowed: false,
        reason: `Недостаточно прав: ${missing.join(", ")}`
      };
    }
  }
  if (config.anyPermissions && config.anyPermissions.length > 0) {
    if (!roleHasAnyPermission(userRole, config.anyPermissions)) {
      return {
        allowed: false,
        reason: `Требуется одно из разрешений: ${config.anyPermissions.join(", ")}`
      };
    }
  }
  return { allowed: true };
}
const auth_45global = /* @__PURE__ */ defineNuxtRouteMiddleware(async (to, from) => {
  let __temp, __restore;
  if (isPublicPage(to.path)) {
    return;
  }
  const token = useCookie("auth_token");
  if (!token.value) {
    return navigateTo({
      path: "/auth/signin",
      query: { redirect: to.fullPath }
    });
  }
  const userState = useState("auth:user");
  let user = userState.value;
  if (!user) {
    try {
      const response = ([__temp, __restore] = executeAsync(() => $fetch("/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })), __temp = await __temp, __restore(), __temp);
      if (!response.success || !response.user) {
        throw new Error("Верификация не удалась");
      }
      user = response.user;
      userState.value = user;
    } catch (error) {
      console.error("[Auth Middleware] Ошибка верификации:", error);
      token.value = null;
      userState.value = null;
      return navigateTo({
        path: "/auth/signin",
        query: {
          redirect: to.fullPath,
          error: "session_expired"
        }
      });
    }
  }
  const accessCheck = checkPageAccess(to.path, user.role);
  if (!accessCheck.allowed) {
    console.warn(`[Auth Middleware] Доступ запрещён для ${user.email} (${user.role}) к ${to.path}: ${accessCheck.reason}`);
    return navigateTo({
      path: "/",
      query: {
        error: "access_denied",
        message: accessCheck.reason
      }
    });
  }
});
const manifest_45route_45rule = /* @__PURE__ */ defineNuxtRouteMiddleware(async (to) => {
  {
    return;
  }
});
const globalMiddleware = [
  validate,
  auth_45global,
  manifest_45route_45rule
];
const namedMiddleware = {};
const plugin = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:router",
  enforce: "pre",
  async setup(nuxtApp) {
    let __temp, __restore;
    let routerBase = (/* @__PURE__ */ useRuntimeConfig()).app.baseURL;
    const history = routerOptions.history?.(routerBase) ?? createMemoryHistory(routerBase);
    const routes = routerOptions.routes ? ([__temp, __restore] = executeAsync(() => routerOptions.routes(_routes)), __temp = await __temp, __restore(), __temp) ?? _routes : _routes;
    let startPosition;
    const router = createRouter({
      ...routerOptions,
      scrollBehavior: (to, from, savedPosition) => {
        if (from === START_LOCATION) {
          startPosition = savedPosition;
          return;
        }
        if (routerOptions.scrollBehavior) {
          router.options.scrollBehavior = routerOptions.scrollBehavior;
          if ("scrollRestoration" in (void 0).history) {
            const unsub = router.beforeEach(() => {
              unsub();
              (void 0).history.scrollRestoration = "manual";
            });
          }
          return routerOptions.scrollBehavior(to, START_LOCATION, startPosition || savedPosition);
        }
      },
      history,
      routes
    });
    nuxtApp.vueApp.use(router);
    const previousRoute = shallowRef(router.currentRoute.value);
    router.afterEach((_to, from) => {
      previousRoute.value = from;
    });
    Object.defineProperty(nuxtApp.vueApp.config.globalProperties, "previousRoute", {
      get: () => previousRoute.value
    });
    const initialURL = nuxtApp.ssrContext.url;
    const _route = shallowRef(router.currentRoute.value);
    const syncCurrentRoute = () => {
      _route.value = router.currentRoute.value;
    };
    router.afterEach((to, from) => {
      if (to.matched.at(-1)?.components?.default === from.matched.at(-1)?.components?.default) {
        syncCurrentRoute();
      }
    });
    const route = { sync: syncCurrentRoute };
    for (const key in _route.value) {
      Object.defineProperty(route, key, {
        get: () => _route.value[key],
        enumerable: true
      });
    }
    nuxtApp._route = shallowReactive(route);
    nuxtApp._middleware ||= {
      global: [],
      named: {}
    };
    if (!nuxtApp.ssrContext?.islandContext) {
      router.afterEach(async (to, _from, failure) => {
        delete nuxtApp._processingMiddleware;
        if (failure) {
          await nuxtApp.callHook("page:loading:end");
        }
        if (failure?.type === 4) {
          return;
        }
        if (to.redirectedFrom && to.fullPath !== initialURL) {
          await nuxtApp.runWithContext(() => navigateTo(to.fullPath || "/"));
        }
      });
    }
    try {
      if (true) {
        ;
        [__temp, __restore] = executeAsync(() => router.push(initialURL)), await __temp, __restore();
        ;
      }
      ;
      [__temp, __restore] = executeAsync(() => router.isReady()), await __temp, __restore();
      ;
    } catch (error2) {
      [__temp, __restore] = executeAsync(() => nuxtApp.runWithContext(() => showError(error2))), await __temp, __restore();
    }
    const resolvedInitialRoute = router.currentRoute.value;
    syncCurrentRoute();
    if (nuxtApp.ssrContext?.islandContext) {
      return { provide: { router } };
    }
    const initialLayout = nuxtApp.payload.state._layout;
    router.beforeEach(async (to, from) => {
      await nuxtApp.callHook("page:loading:start");
      to.meta = reactive(to.meta);
      if (nuxtApp.isHydrating && initialLayout && !isReadonly(to.meta.layout)) {
        to.meta.layout = initialLayout;
      }
      nuxtApp._processingMiddleware = true;
      if (!nuxtApp.ssrContext?.islandContext) {
        const middlewareEntries = /* @__PURE__ */ new Set([...globalMiddleware, ...nuxtApp._middleware.global]);
        for (const component of to.matched) {
          const componentMiddleware = component.meta.middleware;
          if (!componentMiddleware) {
            continue;
          }
          for (const entry2 of toArray(componentMiddleware)) {
            middlewareEntries.add(entry2);
          }
        }
        {
          const routeRules = await nuxtApp.runWithContext(() => getRouteRules({ path: to.path }));
          if (routeRules.appMiddleware) {
            for (const key in routeRules.appMiddleware) {
              if (routeRules.appMiddleware[key]) {
                middlewareEntries.add(key);
              } else {
                middlewareEntries.delete(key);
              }
            }
          }
        }
        for (const entry2 of middlewareEntries) {
          const middleware = typeof entry2 === "string" ? nuxtApp._middleware.named[entry2] || await namedMiddleware[entry2]?.().then((r) => r.default || r) : entry2;
          if (!middleware) {
            throw new Error(`Unknown route middleware: '${entry2}'.`);
          }
          try {
            if (false) ;
            const result = await nuxtApp.runWithContext(() => middleware(to, from));
            if (true) {
              if (result === false || result instanceof Error) {
                const error2 = result || createError({
                  statusCode: 404,
                  statusMessage: `Page Not Found: ${initialURL}`
                });
                await nuxtApp.runWithContext(() => showError(error2));
                return false;
              }
            }
            if (result === true) {
              continue;
            }
            if (result === false) {
              return result;
            }
            if (result) {
              if (isNuxtError(result) && result.fatal) {
                await nuxtApp.runWithContext(() => showError(result));
              }
              return result;
            }
          } catch (err) {
            const error2 = createError(err);
            if (error2.fatal) {
              await nuxtApp.runWithContext(() => showError(error2));
            }
            return error2;
          }
        }
      }
    });
    router.onError(async () => {
      delete nuxtApp._processingMiddleware;
      await nuxtApp.callHook("page:loading:end");
    });
    router.afterEach((to) => {
      if (to.matched.length === 0) {
        return nuxtApp.runWithContext(() => showError(createError({
          statusCode: 404,
          fatal: false,
          statusMessage: `Page not found: ${to.fullPath}`,
          data: {
            path: to.fullPath
          }
        })));
      }
    });
    nuxtApp.hooks.hookOnce("app:created", async () => {
      try {
        if ("name" in resolvedInitialRoute) {
          resolvedInitialRoute.name = void 0;
        }
        await router.replace({
          ...resolvedInitialRoute,
          force: true
        });
        router.options.scrollBehavior = routerOptions.scrollBehavior;
      } catch (error2) {
        await nuxtApp.runWithContext(() => showError(error2));
      }
    });
    return { provide: { router } };
  }
});
function definePayloadReducer(name, reduce) {
  {
    useNuxtApp().ssrContext._payloadReducers[name] = reduce;
  }
}
const reducers = [
  ["NuxtError", (data) => isNuxtError(data) && data.toJSON()],
  ["EmptyShallowRef", (data) => isRef(data) && isShallow(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_")],
  ["EmptyRef", (data) => isRef(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_")],
  ["ShallowRef", (data) => isRef(data) && isShallow(data) && data.value],
  ["ShallowReactive", (data) => isReactive(data) && isShallow(data) && toRaw(data)],
  ["Ref", (data) => isRef(data) && data.value],
  ["Reactive", (data) => isReactive(data) && toRaw(data)]
];
const revive_payload_server_MVtmlZaQpj6ApFmshWfUWl5PehCebzaBf2NuRMiIbms = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:revive-payload:server",
  setup() {
    for (const [reducer, fn] of reducers) {
      definePayloadReducer(reducer, fn);
    }
  }
});
const components_plugin_4kY4pyzJIYX99vmMAAIorFf3CnAaptHitJgf7JxiED8 = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:global-components"
});
const __nuxt_component_0 = defineComponent({
  name: "ServerPlaceholder",
  render() {
    return createElementBlock("div");
  }
});
const clientOnlySymbol = /* @__PURE__ */ Symbol.for("nuxt:client-only");
defineComponent({
  name: "ClientOnly",
  inheritAttrs: false,
  props: ["fallback", "placeholder", "placeholderTag", "fallbackTag"],
  ...false,
  setup(props, { slots, attrs }) {
    const mounted = shallowRef(false);
    const vm = getCurrentInstance();
    if (vm) {
      vm._nuxtClientOnly = true;
    }
    provide(clientOnlySymbol, true);
    return () => {
      if (mounted.value) {
        const vnodes = slots.default?.();
        if (vnodes && vnodes.length === 1) {
          return [cloneVNode(vnodes[0], attrs)];
        }
        return vnodes;
      }
      const slot = slots.fallback || slots.placeholder;
      if (slot) {
        return h(slot);
      }
      const fallbackStr = props.fallback || props.placeholder || "";
      const fallbackTag = props.fallbackTag || props.placeholderTag || "span";
      return createElementBlock(fallbackTag, attrs, fallbackStr);
    };
  }
});
const useAuth = () => {
  const user = useState("auth:user", () => null);
  const token = useCookie("auth_token", {
    maxAge: 60 * 60 * 24 * 7,
    // 7 дней
    sameSite: "lax",
    secure: "production" === "production"
  });
  const refreshToken = useCookie("auth_refresh_token", {
    maxAge: 60 * 60 * 24 * 30,
    // 30 дней
    sameSite: "lax",
    secure: "production" === "production"
  });
  const isAuthenticated = computed(() => !!user.value && !!token.value);
  const isAdmin = computed(() => user.value?.role === "ADMIN");
  const isManager = computed(() => user.value?.role === "MANAGER");
  const isTeacher = computed(() => user.value?.role === "TEACHER");
  const isStudent = computed(() => user.value?.role === "STUDENT");
  const login = async (credentials, rememberMe = false) => {
    try {
      const response = await $fetch("/api/auth/login", {
        method: "POST",
        body: credentials
      });
      if (response.success) {
        token.value = response.token;
        if (response.refreshToken) {
          refreshToken.value = response.refreshToken;
        }
        if (rememberMe) {
          token.value = response.token;
        }
        user.value = response.user;
        return { success: true, user: response.user };
      }
      return { success: false, error: "Ошибка входа" };
    } catch (error) {
      console.error("Login error:", error);
      if (error.data?.message) {
        return { success: false, error: error.data.message };
      }
      return { success: false, error: "Ошибка подключения к серверу" };
    }
  };
  const register = async (data) => {
    try {
      const response = await $fetch("/api/auth/register", {
        method: "POST",
        body: data
      });
      if (response.success) {
        token.value = response.token;
        if (response.refreshToken) {
          refreshToken.value = response.refreshToken;
        }
        user.value = response.user;
        return { success: true, user: response.user };
      }
      return { success: false, error: "Ошибка регистрации" };
    } catch (error) {
      console.error("Registration error:", error);
      if (error.data?.message) {
        return { success: false, error: error.data.message, errors: error.data.errors };
      }
      return { success: false, error: "Ошибка подключения к серверу" };
    }
  };
  const logout = async () => {
    try {
      await $fetch("/api/auth/logout", {
        method: "POST"
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      user.value = null;
      token.value = null;
      refreshToken.value = null;
      await navigateTo("/auth/signin");
    }
  };
  const fetchUser = async () => {
    if (!token.value) {
      user.value = null;
      return null;
    }
    try {
      const response = await $fetch("/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      });
      if (response.success) {
        user.value = response.user;
        return response.user;
      }
      user.value = null;
      token.value = null;
      return null;
    } catch (error) {
      console.error("Fetch user error:", error);
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return await fetchUser();
      }
      user.value = null;
      token.value = null;
      return null;
    }
  };
  const refreshAccessToken = async () => {
    if (!refreshToken.value) {
      return false;
    }
    try {
      const response = await $fetch("/api/auth/refresh", {
        method: "POST",
        body: {
          refreshToken: refreshToken.value
        }
      });
      if (response.success) {
        token.value = response.token;
        refreshToken.value = response.refreshToken;
        return true;
      }
      return false;
    } catch (error) {
      console.error("Refresh token error:", error);
      return false;
    }
  };
  const hasRole = (roles) => {
    if (!user.value) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.value.role);
  };
  const hasMinRole = (minRole) => {
    if (!user.value) return false;
    const hierarchy = ["STUDENT", "TEACHER", "MANAGER", "ADMIN"];
    const userRoleIndex = hierarchy.indexOf(user.value.role);
    const minRoleIndex = hierarchy.indexOf(minRole);
    return userRoleIndex >= minRoleIndex;
  };
  const init = async () => {
    if (token.value) {
      await fetchUser();
    }
  };
  return {
    // Состояние
    user: readonly(user),
    token: readonly(token),
    isAuthenticated,
    isAdmin,
    isManager,
    isTeacher,
    isStudent,
    // Методы
    init,
    login,
    register,
    logout,
    fetchUser,
    refreshAccessToken,
    hasRole,
    hasMinRole
  };
};
const auth_H8gVM_hLMR4kH70PZQlWNqJIB9Rdr0rL0wFPPsoYoYA = /* @__PURE__ */ defineNuxtPlugin(async () => {
  let __temp, __restore;
  const { init } = useAuth();
  [__temp, __restore] = executeAsync(() => init()), await __temp, __restore();
});
const plugins = [
  unhead_k2P3m_ZDyjlr2mMYnoDPwavjsDN8hBlk9cFai0bbopU,
  plugin,
  revive_payload_server_MVtmlZaQpj6ApFmshWfUWl5PehCebzaBf2NuRMiIbms,
  components_plugin_4kY4pyzJIYX99vmMAAIorFf3CnAaptHitJgf7JxiED8,
  auth_H8gVM_hLMR4kH70PZQlWNqJIB9Rdr0rL0wFPPsoYoYA
];
const layouts = {
  blank: defineAsyncComponent(() => import('./blank-ygFNG1IG.mjs').then((m) => m.default || m)),
  default: defineAsyncComponent(() => import('./default-DTJSnjyb.mjs').then((m) => m.default || m)),
  fullscreen: defineAsyncComponent(() => import('./fullscreen-DdeUcnuK.mjs').then((m) => m.default || m))
};
const LayoutLoader = defineComponent({
  name: "LayoutLoader",
  inheritAttrs: false,
  props: {
    name: String,
    layoutProps: Object
  },
  setup(props, context) {
    return () => h(layouts[props.name], props.layoutProps, context.slots);
  }
});
const nuxtLayoutProps = {
  name: {
    type: [String, Boolean, Object],
    default: null
  },
  fallback: {
    type: [String, Object],
    default: null
  }
};
const __nuxt_component_1 = defineComponent({
  name: "NuxtLayout",
  inheritAttrs: false,
  props: nuxtLayoutProps,
  setup(props, context) {
    const nuxtApp = useNuxtApp();
    const injectedRoute = inject(PageRouteSymbol);
    const shouldUseEagerRoute = !injectedRoute || injectedRoute === useRoute();
    const route = shouldUseEagerRoute ? useRoute$1() : injectedRoute;
    const layout = computed(() => {
      let layout2 = unref(props.name) ?? route?.meta.layout ?? "default";
      if (layout2 && !(layout2 in layouts)) {
        if (props.fallback) {
          layout2 = unref(props.fallback);
        }
      }
      return layout2;
    });
    const layoutRef = shallowRef();
    context.expose({ layoutRef });
    const done = nuxtApp.deferHydration();
    let lastLayout;
    return () => {
      const hasLayout = layout.value && layout.value in layouts;
      const transitionProps = route?.meta.layoutTransition ?? appLayoutTransition;
      const previouslyRenderedLayout = lastLayout;
      lastLayout = layout.value;
      return _wrapInTransition(hasLayout && transitionProps, {
        default: () => h(Suspense, { suspensible: true, onResolve: () => {
          nextTick(done);
        } }, {
          default: () => h(
            LayoutProvider,
            {
              layoutProps: mergeProps(context.attrs, { ref: layoutRef }),
              key: layout.value || void 0,
              name: layout.value,
              shouldProvide: !props.name,
              isRenderingNewLayout: (name) => {
                return name !== previouslyRenderedLayout && name === layout.value;
              },
              hasTransition: !!transitionProps
            },
            context.slots
          )
        })
      }).default();
    };
  }
});
const LayoutProvider = defineComponent({
  name: "NuxtLayoutProvider",
  inheritAttrs: false,
  props: {
    name: {
      type: [String, Boolean]
    },
    layoutProps: {
      type: Object
    },
    hasTransition: {
      type: Boolean
    },
    shouldProvide: {
      type: Boolean
    },
    isRenderingNewLayout: {
      type: Function,
      required: true
    }
  },
  setup(props, context) {
    const name = props.name;
    if (props.shouldProvide) {
      provide(LayoutMetaSymbol, {
        isCurrent: (route) => name === (route.meta.layout ?? "default")
      });
    }
    const injectedRoute = inject(PageRouteSymbol);
    const isNotWithinNuxtPage = injectedRoute && injectedRoute === useRoute();
    if (isNotWithinNuxtPage) {
      const vueRouterRoute = useRoute$1();
      const reactiveChildRoute = {};
      for (const _key in vueRouterRoute) {
        const key = _key;
        Object.defineProperty(reactiveChildRoute, key, {
          enumerable: true,
          get: () => {
            return props.isRenderingNewLayout(props.name) ? vueRouterRoute[key] : injectedRoute[key];
          }
        });
      }
      provide(PageRouteSymbol, shallowReactive(reactiveChildRoute));
    }
    return () => {
      if (!name || typeof name === "string" && !(name in layouts)) {
        return context.slots.default?.();
      }
      return h(
        LayoutLoader,
        { key: name, layoutProps: props.layoutProps, name },
        context.slots
      );
    };
  }
});
const defineRouteProvider = (name = "RouteProvider") => defineComponent({
  name,
  props: {
    route: {
      type: Object,
      required: true
    },
    vnode: Object,
    vnodeRef: Object,
    renderKey: String,
    trackRootNodes: Boolean
  },
  setup(props) {
    const previousKey = props.renderKey;
    const previousRoute = props.route;
    const route = {};
    for (const key in props.route) {
      Object.defineProperty(route, key, {
        get: () => previousKey === props.renderKey ? props.route[key] : previousRoute[key],
        enumerable: true
      });
    }
    provide(PageRouteSymbol, shallowReactive(route));
    return () => {
      if (!props.vnode) {
        return props.vnode;
      }
      return h(props.vnode, { ref: props.vnodeRef });
    };
  }
});
const RouteProvider = defineRouteProvider();
const __nuxt_component_2 = defineComponent({
  name: "NuxtPage",
  inheritAttrs: false,
  props: {
    name: {
      type: String
    },
    transition: {
      type: [Boolean, Object],
      default: void 0
    },
    keepalive: {
      type: [Boolean, Object],
      default: void 0
    },
    route: {
      type: Object
    },
    pageKey: {
      type: [Function, String],
      default: null
    }
  },
  setup(props, { attrs, slots, expose }) {
    const nuxtApp = useNuxtApp();
    const pageRef = ref();
    inject(PageRouteSymbol, null);
    expose({ pageRef });
    inject(LayoutMetaSymbol, null);
    nuxtApp.deferHydration();
    return () => {
      return h(RouterView, { name: props.name, route: props.route, ...attrs }, {
        default: (routeProps) => {
          return h(Suspense, { suspensible: true }, {
            default() {
              return h(RouteProvider, {
                vnode: slots.default ? normalizeSlot(slots.default, routeProps) : routeProps.Component,
                route: routeProps.route,
                vnodeRef: pageRef
              });
            }
          });
        }
      });
    };
  }
});
function normalizeSlot(slot, data) {
  const slotContent = slot(data);
  return slotContent.length === 1 ? h(slotContent[0]) : h(Fragment, void 0, slotContent);
}
const useTheme = () => {
  const isDarkMode = useState("dark-mode", () => false);
  const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value;
  };
  return {
    isDarkMode,
    toggleTheme
  };
};
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "app",
  __ssrInlineRender: true,
  setup(__props) {
    useTheme();
    useHead({
      titleTemplate: (title) => title ? `${title} | ATC - Nuxt Dashboard` : "ATC - Nuxt Dashboard",
      htmlAttrs: {
        lang: "ru"
      },
      bodyAttrs: {
        class: "relative font-normal font-outfit z-1 bg-gray-50 dark:bg-gray-900"
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtRouteAnnouncer = __nuxt_component_0;
      const _component_NuxtLayout = __nuxt_component_1;
      const _component_NuxtPage = __nuxt_component_2;
      _push(`<div${ssrRenderAttrs(_attrs)}>`);
      _push(ssrRenderComponent(_component_NuxtRouteAnnouncer, null, null, _parent));
      _push(ssrRenderComponent(_component_NuxtLayout, null, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_NuxtPage, null, null, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_NuxtPage)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("app.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = {
  __name: "nuxt-error-page",
  __ssrInlineRender: true,
  props: {
    error: Object
  },
  setup(__props) {
    const props = __props;
    const _error = props.error;
    const statusCode = Number(_error.statusCode || 500);
    const is404 = statusCode === 404;
    const statusMessage = _error.statusMessage ?? (is404 ? "Page Not Found" : "Internal Server Error");
    const description = _error.message || _error.toString();
    const stack = void 0;
    const _Error404 = defineAsyncComponent(() => import('./error-404-kV1pD0Vh.mjs'));
    const _Error = defineAsyncComponent(() => import('./error-500-CRDMewqF.mjs'));
    const ErrorTemplate = is404 ? _Error404 : _Error;
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(unref(ErrorTemplate), mergeProps({ statusCode: unref(statusCode), statusMessage: unref(statusMessage), description: unref(description), stack: unref(stack) }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../node_modules/nuxt/dist/app/components/nuxt-error-page.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "nuxt-root",
  __ssrInlineRender: true,
  setup(__props) {
    const IslandRenderer = () => null;
    const nuxtApp = useNuxtApp();
    nuxtApp.deferHydration();
    nuxtApp.ssrContext.url;
    const SingleRenderer = false;
    provide(PageRouteSymbol, useRoute());
    nuxtApp.hooks.callHookWith((hooks) => hooks.map((hook) => hook()), "vue:setup");
    const error = /* @__PURE__ */ useError();
    const abortRender = error.value && !nuxtApp.ssrContext.error;
    onErrorCaptured((err, target, info) => {
      nuxtApp.hooks.callHook("vue:error", err, target, info).catch((hookError) => console.error("[nuxt] Error in `vue:error` hook", hookError));
      {
        const p = nuxtApp.runWithContext(() => showError(err));
        onServerPrefetch(() => p);
        return false;
      }
    });
    const islandContext = nuxtApp.ssrContext.islandContext;
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderSuspense(_push, {
        default: () => {
          if (unref(abortRender)) {
            _push(`<div></div>`);
          } else if (unref(error)) {
            _push(ssrRenderComponent(unref(_sfc_main$1), { error: unref(error) }, null, _parent));
          } else if (unref(islandContext)) {
            _push(ssrRenderComponent(unref(IslandRenderer), { context: unref(islandContext) }, null, _parent));
          } else if (unref(SingleRenderer)) {
            ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(SingleRenderer)), null, null), _parent);
          } else {
            _push(ssrRenderComponent(unref(_sfc_main$2), null, null, _parent));
          }
        },
        _: 1
      });
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../node_modules/nuxt/dist/app/components/nuxt-root.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
let entry;
{
  entry = async function createNuxtAppServer(ssrContext) {
    const vueApp = createApp(_sfc_main);
    const nuxt = createNuxtApp({ vueApp, ssrContext });
    try {
      await applyPlugins(nuxt, plugins);
      await nuxt.hooks.callHook("app:created", vueApp);
    } catch (error) {
      await nuxt.hooks.callHook("app:error", error);
      nuxt.payload.error ||= createError(error);
    }
    if (ssrContext?._renderResponse) {
      throw new Error("skipping render");
    }
    return vueApp;
  };
}
const entry_default = (ssrContext) => entry(ssrContext);

export { Permission as P, UserRole as U, useAuth as a, useState as b, useRoute as c, useRouter as d, entry_default as default, useNuxtApp as e, useRuntimeConfig as f, nuxtLinkDefaults as g, useCookie as h, getRolePermissions as i, roleHasPermission as j, roleHasAnyPermission as k, roleHasAllPermissions as l, useTheme as m, navigateTo as n, resolveRouteObject as r, useHead as u };
//# sourceMappingURL=server.mjs.map
