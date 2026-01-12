import { defineComponent, mergeProps, unref, computed, withCtx, createVNode, Transition, createBlock, openBlock, resolveDynamicComponent, createCommentVNode, toDisplayString, createTextVNode, ref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderClass, ssrRenderSlot, ssrRenderAttr, ssrRenderList, ssrInterpolate, ssrRenderVNode, ssrRenderStyle } from 'vue/server-renderer';
import { b as useState, c as useRoute, P as Permission, m as useTheme, a as useAuth } from './server.mjs';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';
import { p as publicAssetsURL } from '../routes/renderer.mjs';
import { RouterLink } from 'vue-router';
import { _ as __nuxt_component_0 } from './nuxt-link-BHRIAP0y.mjs';
import { _ as _imports_0$1 } from './virtual_public-IWZl7zz2.mjs';
import { u as usePermissions } from './usePermissions-C-v7fTov.mjs';
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
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';

const useSidebar = () => {
  const isExpanded = useState("sidebar-expanded", () => true);
  const isMobileOpen = useState("sidebar-mobile-open", () => false);
  const isHovered = useState("sidebar-hovered", () => false);
  const openSubmenu = useState("sidebar-submenu", () => null);
  const isMobile = useState("sidebar-is-mobile", () => false);
  const toggleSidebar = () => {
    if (isMobile.value) {
      isMobileOpen.value = !isMobileOpen.value;
    } else {
      isExpanded.value = !isExpanded.value;
    }
  };
  const toggleMobileSidebar = () => {
    isMobileOpen.value = !isMobileOpen.value;
  };
  const setIsHovered = (value) => {
    isHovered.value = value;
  };
  const toggleSubmenu = (item) => {
    openSubmenu.value = openSubmenu.value === item ? null : item;
  };
  return {
    isExpanded: computed(() => isMobile.value ? false : isExpanded.value),
    isMobileOpen,
    isHovered,
    openSubmenu,
    isMobile,
    toggleSidebar,
    toggleMobileSidebar,
    setIsHovered,
    toggleSubmenu
  };
};
const _sfc_main$m = /* @__PURE__ */ defineComponent({
  __name: "ThemeToggler",
  __ssrInlineRender: true,
  setup(__props) {
    useTheme();
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<button${ssrRenderAttrs(mergeProps({ class: "relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-dark-900 h-11 w-11 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white" }, _attrs))}><svg class="hidden dark:block" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M9.99998 1.5415C10.4142 1.5415 10.75 1.87729 10.75 2.2915V3.5415C10.75 3.95572 10.4142 4.2915 9.99998 4.2915C9.58577 4.2915 9.24998 3.95572 9.24998 3.5415V2.2915C9.24998 1.87729 9.58577 1.5415 9.99998 1.5415ZM10.0009 6.79327C8.22978 6.79327 6.79402 8.22904 6.79402 10.0001C6.79402 11.7712 8.22978 13.207 10.0009 13.207C11.772 13.207 13.2078 11.7712 13.2078 10.0001C13.2078 8.22904 11.772 6.79327 10.0009 6.79327ZM5.29402 10.0001C5.29402 7.40061 7.40135 5.29327 10.0009 5.29327C12.6004 5.29327 14.7078 7.40061 14.7078 10.0001C14.7078 12.5997 12.6004 14.707 10.0009 14.707C7.40135 14.707 5.29402 12.5997 5.29402 10.0001ZM15.9813 5.08035C16.2742 4.78746 16.2742 4.31258 15.9813 4.01969C15.6884 3.7268 15.2135 3.7268 14.9207 4.01969L14.0368 4.90357C13.7439 5.19647 13.7439 5.67134 14.0368 5.96423C14.3297 6.25713 14.8045 6.25713 15.0974 5.96423L15.9813 5.08035ZM18.4577 10.0001C18.4577 10.4143 18.1219 10.7501 17.7077 10.7501H16.4577C16.0435 10.7501 15.7077 10.4143 15.7077 10.0001C15.7077 9.58592 16.0435 9.25013 16.4577 9.25013H17.7077C18.1219 9.25013 18.4577 9.58592 18.4577 10.0001ZM14.9207 15.9806C15.2135 16.2735 15.6884 16.2735 15.9813 15.9806C16.2742 15.6877 16.2742 15.2128 15.9813 14.9199L15.0974 14.036C14.8045 13.7431 14.3297 13.7431 14.0368 14.036C13.7439 14.3289 13.7439 14.8038 14.0368 15.0967L14.9207 15.9806ZM9.99998 15.7088C10.4142 15.7088 10.75 16.0445 10.75 16.4588V17.7088C10.75 18.123 10.4142 18.4588 9.99998 18.4588C9.58577 18.4588 9.24998 18.123 9.24998 17.7088V16.4588C9.24998 16.0445 9.58577 15.7088 9.99998 15.7088ZM5.96356 15.0972C6.25646 14.8043 6.25646 14.3295 5.96356 14.0366C5.67067 13.7437 5.1958 13.7437 4.9029 14.0366L4.01902 14.9204C3.72613 15.2133 3.72613 15.6882 4.01902 15.9811C4.31191 16.274 4.78679 16.274 5.07968 15.9811L5.96356 15.0972ZM4.29224 10.0001C4.29224 10.4143 3.95645 10.7501 3.54224 10.7501H2.29224C1.87802 10.7501 1.54224 10.4143 1.54224 10.0001C1.54224 9.58592 1.87802 9.25013 2.29224 9.25013H3.54224C3.95645 9.25013 4.29224 9.58592 4.29224 10.0001ZM4.9029 5.9637C5.1958 6.25659 5.67067 6.25659 5.96356 5.9637C6.25646 5.6708 6.25646 5.19593 5.96356 4.90303L5.07968 4.01915C4.78679 3.72626 4.31191 3.72626 4.01902 4.01915C3.72613 4.31204 3.72613 4.78692 4.01902 5.07981L4.9029 5.9637Z" fill="currentColor"></path></svg><svg class="dark:hidden" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.4547 11.97L18.1799 12.1611C18.265 11.8383 18.1265 11.4982 17.8401 11.3266C17.5538 11.1551 17.1885 11.1934 16.944 11.4207L17.4547 11.97ZM8.0306 2.5459L8.57989 3.05657C8.80718 2.81209 8.84554 2.44682 8.67398 2.16046C8.50243 1.8741 8.16227 1.73559 7.83948 1.82066L8.0306 2.5459ZM12.9154 13.0035C9.64678 13.0035 6.99707 10.3538 6.99707 7.08524H5.49707C5.49707 11.1823 8.81835 14.5035 12.9154 14.5035V13.0035ZM16.944 11.4207C15.8869 12.4035 14.4721 13.0035 12.9154 13.0035V14.5035C14.8657 14.5035 16.6418 13.7499 17.9654 12.5193L16.944 11.4207ZM16.7295 11.7789C15.9437 14.7607 13.2277 16.9586 10.0003 16.9586V18.4586C13.9257 18.4586 17.2249 15.7853 18.1799 12.1611L16.7295 11.7789ZM10.0003 16.9586C6.15734 16.9586 3.04199 13.8433 3.04199 10.0003H1.54199C1.54199 14.6717 5.32892 18.4586 10.0003 18.4586V16.9586ZM3.04199 10.0003C3.04199 6.77289 5.23988 4.05695 8.22173 3.27114L7.83948 1.82066C4.21532 2.77574 1.54199 6.07486 1.54199 10.0003H3.04199ZM6.99707 7.08524C6.99707 5.52854 7.5971 4.11366 8.57989 3.05657L7.48132 2.03522C6.25073 3.35885 5.49707 5.13487 5.49707 7.08524H6.99707Z" fill="currentColor"></path></svg></button>`);
    };
  }
});
const _sfc_setup$m = _sfc_main$m.setup;
_sfc_main$m.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/common/ThemeToggler.vue");
  return _sfc_setup$m ? _sfc_setup$m(props, ctx) : void 0;
};
const ThemeToggler = Object.assign(_sfc_main$m, { __name: "CommonThemeToggler" });
const _sfc_main$l = {};
function _sfc_ssrRender$c(_ctx, _push, _parent, _attrs) {
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "hidden lg:block" }, _attrs))}><form><div class="relative"><button class="absolute -translate-y-1/2 left-4 top-1/2"><svg class="fill-gray-500 dark:fill-gray-400" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" fill=""></path></svg></button><input type="text" placeholder="Search or type command..." class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"><button class="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400"><span> ⌘ </span><span> K </span></button></div></form></div>`);
}
const _sfc_setup$l = _sfc_main$l.setup;
_sfc_main$l.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/layout/header/SearchBar.vue");
  return _sfc_setup$l ? _sfc_setup$l(props, ctx) : void 0;
};
const SearchBar = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$l, [["ssrRender", _sfc_ssrRender$c]]), { __name: "LayoutHeaderSearchBar" });
const _imports_0 = publicAssetsURL("/images/logo/logo.svg");
const _imports_1$1 = publicAssetsURL("/images/logo/logo-dark.svg");
const _sfc_main$k = {
  __name: "LayoutHeaderLogo",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(unref(RouterLink), mergeProps({
        to: "/",
        class: "lg:hidden"
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<img class="dark:hidden"${ssrRenderAttr("src", _imports_0)} alt="Logo"${_scopeId}><img class="hidden dark:block"${ssrRenderAttr("src", _imports_1$1)} alt="Logo"${_scopeId}>`);
          } else {
            return [
              createVNode("img", {
                class: "dark:hidden",
                src: _imports_0,
                alt: "Logo"
              }),
              createVNode("img", {
                class: "hidden dark:block",
                src: _imports_1$1,
                alt: "Logo"
              })
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
};
const _sfc_setup$k = _sfc_main$k.setup;
_sfc_main$k.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/layout/header/HeaderLogo.vue");
  return _sfc_setup$k ? _sfc_setup$k(props, ctx) : void 0;
};
const _sfc_main$j = /* @__PURE__ */ defineComponent({
  __name: "NotificationMenu",
  __ssrInlineRender: true,
  setup(__props) {
    const dropdownOpen = ref(false);
    const notifying = ref(true);
    const dropdownRef = ref(null);
    const notifications = ref([
      {
        id: 1,
        userName: "Terry Franci",
        userImage: "/images/user/user-02.jpg",
        action: "requests permission to change",
        project: "Project - Nganter App",
        type: "Project",
        time: "5 min ago",
        status: "online"
      },
      {
        id: 2,
        userName: "Terry Franci",
        userImage: "/images/user/user-03.jpg",
        action: "requests permission to change",
        project: "Project - Nganter App",
        type: "Project",
        time: "5 min ago",
        status: "offline"
      },
      {
        id: 3,
        userName: "Terry Franci",
        userImage: "/images/user/user-04.jpg",
        action: "requests permission to change",
        project: "Project - Nganter App",
        type: "Project",
        time: "5 min ago",
        status: "online"
      },
      {
        id: 4,
        userName: "Terry Franci",
        userImage: "/images/user/user-05.jpg",
        action: "requests permission to change",
        project: "Project - Nganter App",
        type: "Project",
        time: "5 min ago",
        status: "online"
      },
      {
        id: 5,
        userName: "Terry Franci",
        userImage: "/images/user/user-06.jpg",
        action: "requests permission to change",
        project: "Project - Nganter App",
        type: "Project",
        time: "5 min ago",
        status: "offline"
      },
      {
        id: 6,
        userName: "Terry Franci",
        userImage: "/images/user/user-07.jpg",
        action: "requests permission to change",
        project: "Project - Nganter App",
        type: "Project",
        time: "5 min ago",
        status: "online"
      },
      {
        id: 7,
        userName: "Terry Franci",
        userImage: "/images/user/user-08.jpg",
        action: "requests permission to change",
        project: "Project - Nganter App",
        type: "Project",
        time: "5 min ago",
        status: "online"
      },
      {
        id: 7,
        userName: "Terry Franci",
        userImage: "/images/user/user-09.jpg",
        action: "requests permission to change",
        project: "Project - Nganter App",
        type: "Project",
        time: "5 min ago",
        status: "online"
      }
      // Add more notifications here...
    ]);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "relative",
        ref_key: "dropdownRef",
        ref: dropdownRef
      }, _attrs))}><button class="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-dark-900 h-11 w-11 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"><span class="${ssrRenderClass([{ hidden: !notifying.value, flex: notifying.value }, "absolute right-0 top-0.5 z-1 h-2 w-2 rounded-full bg-orange-400"])}"><span class="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 -z-1 animate-ping"></span></span><svg class="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z" fill=""></path></svg></button>`);
      if (dropdownOpen.value) {
        _push(`<div class="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0 z-99999"><div class="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-800"><h5 class="text-lg font-semibold text-gray-800 dark:text-white/90">Notification</h5><button class="text-gray-500 dark:text-gray-400"><svg class="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z" fill=""></path></svg></button></div><ul class="flex flex-col h-auto overflow-y-auto custom-scrollbar"><!--[-->`);
        ssrRenderList(notifications.value, (notification) => {
          _push(`<li><a class="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5" href="#"><span class="relative block w-full h-10 rounded-full z-1 max-w-10"><img${ssrRenderAttr("src", notification.userImage)} alt="User" class="overflow-hidden rounded-full"><span class="${ssrRenderClass([notification.status === "online" ? "bg-success-500" : "bg-error-500", "absolute bottom-0 right-0 z-10 h-2.5 w-full max-w-2.5 rounded-full border-[1.5px] border-white dark:border-gray-900"])}"></span></span><span class="block"><span class="mb-1.5 block text-theme-sm text-gray-500 dark:text-gray-400"><span class="font-medium text-gray-800 dark:text-white/90">${ssrInterpolate(notification.userName)}</span> ${ssrInterpolate(notification.action)} <span class="font-medium text-gray-800 dark:text-white/90">${ssrInterpolate(notification.project)}</span></span><span class="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400"><span>${ssrInterpolate(notification.type)}</span><span class="w-1 h-1 bg-gray-400 rounded-full"></span><span>${ssrInterpolate(notification.time)}</span></span></span></a></li>`);
        });
        _push(`<!--]--></ul><button class="mt-3 flex justify-center rounded-lg border border-gray-300 bg-white p-3 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"> View All Notification </button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$j = _sfc_main$j.setup;
_sfc_main$j.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/layout/header/NotificationMenu.vue");
  return _sfc_setup$j ? _sfc_setup$j(props, ctx) : void 0;
};
const NotificationMenu = Object.assign(_sfc_main$j, { __name: "LayoutHeaderNotificationMenu" });
const _sfc_main$i = {};
function _sfc_ssrRender$b(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, _attrs))}><path fill-rule="evenodd" clip-rule="evenodd" d="M12 3.5C7.30558 3.5 3.5 7.30558 3.5 12C3.5 14.1526 4.3002 16.1184 5.61936 17.616C6.17279 15.3096 8.24852 13.5955 10.7246 13.5955H13.2746C15.7509 13.5955 17.8268 15.31 18.38 17.6167C19.6996 16.119 20.5 14.153 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5ZM17.0246 18.8566V18.8455C17.0246 16.7744 15.3457 15.0955 13.2746 15.0955H10.7246C8.65354 15.0955 6.97461 16.7744 6.97461 18.8455V18.856C8.38223 19.8895 10.1198 20.5 12 20.5C13.8798 20.5 15.6171 19.8898 17.0246 18.8566ZM2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM11.9991 7.25C10.8847 7.25 9.98126 8.15342 9.98126 9.26784C9.98126 10.3823 10.8847 11.2857 11.9991 11.2857C13.1135 11.2857 14.0169 10.3823 14.0169 9.26784C14.0169 8.15342 13.1135 7.25 11.9991 7.25ZM8.48126 9.26784C8.48126 7.32499 10.0563 5.75 11.9991 5.75C13.9419 5.75 15.5169 7.32499 15.5169 9.26784C15.5169 11.2107 13.9419 12.7857 11.9991 12.7857C10.0563 12.7857 8.48126 11.2107 8.48126 9.26784Z" fill="currentColor"></path></svg>`);
}
const _sfc_setup$i = _sfc_main$i.setup;
_sfc_main$i.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/UserCircleIcon.vue");
  return _sfc_setup$i ? _sfc_setup$i(props, ctx) : void 0;
};
const UserCircleIcon = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$i, [["ssrRender", _sfc_ssrRender$b]]), { __name: "UserCircleIcon" });
const _sfc_main$h = {};
function _sfc_ssrRender$a(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    width: "20",
    height: "20",
    viewBox: "0 0 20 20",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, _attrs))}><path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`);
}
const _sfc_setup$h = _sfc_main$h.setup;
_sfc_main$h.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/ChevronDownIcon.vue");
  return _sfc_setup$h ? _sfc_setup$h(props, ctx) : void 0;
};
const ChevronDownIcon = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$h, [["ssrRender", _sfc_ssrRender$a]]), { __name: "ChevronDownIcon" });
const _sfc_main$g = {};
function _sfc_ssrRender$9(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, _attrs))}><path fill-rule="evenodd" clip-rule="evenodd" d="M15.1007 19.247C14.6865 19.247 14.3507 18.9112 14.3507 18.497L14.3507 14.245H12.8507V18.497C12.8507 19.7396 13.8581 20.747 15.1007 20.747H18.5007C19.7434 20.747 20.7507 19.7396 20.7507 18.497L20.7507 5.49609C20.7507 4.25345 19.7433 3.24609 18.5007 3.24609H15.1007C13.8581 3.24609 12.8507 4.25345 12.8507 5.49609V9.74501L14.3507 9.74501V5.49609C14.3507 5.08188 14.6865 4.74609 15.1007 4.74609L18.5007 4.74609C18.9149 4.74609 19.2507 5.08188 19.2507 5.49609L19.2507 18.497C19.2507 18.9112 18.9149 19.247 18.5007 19.247H15.1007ZM3.25073 11.9984C3.25073 12.2144 3.34204 12.4091 3.48817 12.546L8.09483 17.1556C8.38763 17.4485 8.86251 17.4487 9.15549 17.1559C9.44848 16.8631 9.44863 16.3882 9.15583 16.0952L5.81116 12.7484L16.0007 12.7484C16.4149 12.7484 16.7507 12.4127 16.7507 11.9984C16.7507 11.5842 16.4149 11.2484 16.0007 11.2484L5.81528 11.2484L9.15585 7.90554C9.44864 7.61255 9.44847 7.13767 9.15547 6.84488C8.86248 6.55209 8.3876 6.55226 8.09481 6.84525L3.52309 11.4202C3.35673 11.5577 3.25073 11.7657 3.25073 11.9984Z" fill="currentColor"></path></svg>`);
}
const _sfc_setup$g = _sfc_main$g.setup;
_sfc_main$g.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/LogoutIcon.vue");
  return _sfc_setup$g ? _sfc_setup$g(props, ctx) : void 0;
};
const LogoutIcon = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$g, [["ssrRender", _sfc_ssrRender$9]]), { __name: "LogoutIcon" });
const _sfc_main$f = {};
function _sfc_ssrRender$8(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, _attrs))}><path fill-rule="evenodd" clip-rule="evenodd" d="M10.4858 3.5L13.5182 3.5C13.9233 3.5 14.2518 3.82851 14.2518 4.23377C14.2518 5.9529 16.1129 7.02795 17.602 6.1682C17.9528 5.96567 18.4014 6.08586 18.6039 6.43667L20.1203 9.0631C20.3229 9.41407 20.2027 9.86286 19.8517 10.0655C18.3625 10.9253 18.3625 13.0747 19.8517 13.9345C20.2026 14.1372 20.3229 14.5859 20.1203 14.9369L18.6039 17.5634C18.4013 17.9142 17.9528 18.0344 17.602 17.8318C16.1129 16.9721 14.2518 18.0471 14.2518 19.7663C14.2518 20.1715 13.9233 20.5 13.5182 20.5H10.4858C10.0804 20.5 9.75182 20.1714 9.75182 19.766C9.75182 18.0461 7.88983 16.9717 6.40067 17.8314C6.04945 18.0342 5.60037 17.9139 5.39767 17.5628L3.88167 14.937C3.67903 14.586 3.79928 14.1372 4.15026 13.9346C5.63949 13.0748 5.63946 10.9253 4.15025 10.0655C3.79926 9.86282 3.67901 9.41401 3.88165 9.06303L5.39764 6.43725C5.60034 6.08617 6.04943 5.96581 6.40065 6.16858C7.88982 7.02836 9.75182 5.9539 9.75182 4.23399C9.75182 3.82862 10.0804 3.5 10.4858 3.5ZM13.5182 2L10.4858 2C9.25201 2 8.25182 3.00019 8.25182 4.23399C8.25182 4.79884 7.64013 5.15215 7.15065 4.86955C6.08213 4.25263 4.71559 4.61859 4.0986 5.68725L2.58261 8.31303C1.96575 9.38146 2.33183 10.7477 3.40025 11.3645C3.88948 11.647 3.88947 12.3531 3.40026 12.6355C2.33184 13.2524 1.96578 14.6186 2.58263 15.687L4.09863 18.3128C4.71562 19.3814 6.08215 19.7474 7.15067 19.1305C7.64015 18.8479 8.25182 19.2012 8.25182 19.766C8.25182 20.9998 9.25201 22 10.4858 22H13.5182C14.7519 22 15.7518 20.9998 15.7518 19.7663C15.7518 19.2015 16.3632 18.8487 16.852 19.1309C17.9202 19.7476 19.2862 19.3816 19.9029 18.3134L21.4193 15.6869C22.0361 14.6185 21.6701 13.2523 20.6017 12.6355C20.1125 12.3531 20.1125 11.647 20.6017 11.3645C21.6701 10.7477 22.0362 9.38152 21.4193 8.3131L19.903 5.68667C19.2862 4.61842 17.9202 4.25241 16.852 4.86917C16.3632 5.15138 15.7518 4.79856 15.7518 4.23377C15.7518 3.00024 14.7519 2 13.5182 2ZM9.6659 11.9999C9.6659 10.7103 10.7113 9.66493 12.0009 9.66493C13.2905 9.66493 14.3359 10.7103 14.3359 11.9999C14.3359 13.2895 13.2905 14.3349 12.0009 14.3349C10.7113 14.3349 9.6659 13.2895 9.6659 11.9999ZM12.0009 8.16493C9.88289 8.16493 8.1659 9.88191 8.1659 11.9999C8.1659 14.1179 9.88289 15.8349 12.0009 15.8349C14.1189 15.8349 15.8359 14.1179 15.8359 11.9999C15.8359 9.88191 14.1189 8.16493 12.0009 8.16493Z" fill="currentColor"></path></svg>`);
}
const _sfc_setup$f = _sfc_main$f.setup;
_sfc_main$f.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/SettingsIcon.vue");
  return _sfc_setup$f ? _sfc_setup$f(props, ctx) : void 0;
};
const SettingsIcon = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$f, [["ssrRender", _sfc_ssrRender$8]]), { __name: "SettingsIcon" });
const _sfc_main$e = {};
function _sfc_ssrRender$7(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, _attrs))}><path fill-rule="evenodd" clip-rule="evenodd" d="M3.5 12C3.5 7.30558 7.30558 3.5 12 3.5C16.6944 3.5 20.5 7.30558 20.5 12C20.5 16.6944 16.6944 20.5 12 20.5C7.30558 20.5 3.5 16.6944 3.5 12ZM12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM11.0991 7.52507C11.0991 8.02213 11.5021 8.42507 11.9991 8.42507H12.0001C12.4972 8.42507 12.9001 8.02213 12.9001 7.52507C12.9001 7.02802 12.4972 6.62507 12.0001 6.62507H11.9991C11.5021 6.62507 11.0991 7.02802 11.0991 7.52507ZM12.0001 17.3714C11.5859 17.3714 11.2501 17.0356 11.2501 16.6214V10.9449C11.2501 10.5307 11.5859 10.1949 12.0001 10.1949C12.4143 10.1949 12.7501 10.5307 12.7501 10.9449V16.6214C12.7501 17.0356 12.4143 17.3714 12.0001 17.3714Z" fill="currentColor"></path></svg>`);
}
const _sfc_setup$e = _sfc_main$e.setup;
_sfc_main$e.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/InfoCircleIcon.vue");
  return _sfc_setup$e ? _sfc_setup$e(props, ctx) : void 0;
};
const InfoCircleIcon = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$e, [["ssrRender", _sfc_ssrRender$7]]), { __name: "InfoCircleIcon" });
const _sfc_main$d = /* @__PURE__ */ defineComponent({
  __name: "UserMenu",
  __ssrInlineRender: true,
  setup(__props) {
    const { user } = useAuth();
    const dropdownOpen = ref(false);
    const dropdownRef = ref(null);
    const menuItems = [
      { href: "/profile", icon: UserCircleIcon, text: "Профиль" },
      { href: "/settings", icon: SettingsIcon, text: "Настройки" },
      { href: "/support", icon: InfoCircleIcon, text: "Поддержка" }
    ];
    const userName = computed(() => {
      if (!user.value) return "Гость";
      return user.value.name || "Пользователь";
    });
    const userInitials = computed(() => {
      if (!user.value || !user.value.name) return "U";
      const parts = user.value.name.split(" ").filter((p) => p.length > 0);
      if (parts.length >= 2 && parts[0] && parts[1]) {
        const first = parts[0][0];
        const second = parts[1][0];
        if (first && second) {
          return (first + second).toUpperCase();
        }
      }
      if (parts.length >= 1 && parts[0]) {
        const first = parts[0][0];
        if (first) {
          return first.toUpperCase();
        }
      }
      return "U";
    });
    const getRoleLabel = (role) => {
      const labels = {
        "ADMIN": "Администратор",
        "MANAGER": "Менеджер",
        "TEACHER": "Преподаватель",
        "STUDENT": "Студент"
      };
      return labels[role || ""] || role || "Неизвестно";
    };
    const getRoleBadgeClass = (role) => {
      const classes = {
        "ADMIN": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        "MANAGER": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        "TEACHER": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        "STUDENT": "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
      };
      return classes[role || ""] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    };
    const closeDropdown = () => {
      dropdownOpen.value = false;
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "relative",
        ref_key: "dropdownRef",
        ref: dropdownRef
      }, _attrs))}><button class="flex items-center text-gray-700 dark:text-gray-400"><span class="mr-3 overflow-hidden rounded-full h-11 w-11 bg-linear-to-br from-primary to-purple-600 flex items-center justify-center text-white font-semibold">${ssrInterpolate(userInitials.value)}</span><span class="hidden sm:block mr-1 font-medium text-theme-sm">${ssrInterpolate(userName.value)}</span>`);
      _push(ssrRenderComponent(ChevronDownIcon, {
        class: { "rotate-180": dropdownOpen.value }
      }, null, _parent));
      _push(`</button>`);
      if (dropdownOpen.value) {
        _push(`<div class="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark z-99999"><div><span class="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">${ssrInterpolate(unref(user)?.name || "Пользователь")}</span><span class="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">${ssrInterpolate(unref(user)?.email || "Нет email")}</span><span class="${ssrRenderClass([getRoleBadgeClass(unref(user)?.role), "mt-1 inline-block px-2 py-0.5 text-xs font-medium rounded-full"])}">${ssrInterpolate(getRoleLabel(unref(user)?.role))}</span></div><ul class="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800"><!--[-->`);
        ssrRenderList(menuItems, (item) => {
          _push(`<li>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: item.href,
            onClick: closeDropdown,
            class: "flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                ssrRenderVNode(_push2, createVNode(resolveDynamicComponent(item.icon), { class: "text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" }, null), _parent2, _scopeId);
                _push2(` ${ssrInterpolate(item.text)}`);
              } else {
                return [
                  (openBlock(), createBlock(resolveDynamicComponent(item.icon), { class: "text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" })),
                  createTextVNode(" " + toDisplayString(item.text), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`</li>`);
        });
        _push(`<!--]--></ul><button class="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300">`);
        _push(ssrRenderComponent(LogoutIcon, { class: "text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" }, null, _parent));
        _push(` Выйти </button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$d = _sfc_main$d.setup;
_sfc_main$d.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/layout/header/UserMenu.vue");
  return _sfc_setup$d ? _sfc_setup$d(props, ctx) : void 0;
};
const UserMenu = Object.assign(_sfc_main$d, { __name: "LayoutHeaderUserMenu" });
const _sfc_main$c = /* @__PURE__ */ defineComponent({
  __name: "AppHeader",
  __ssrInlineRender: true,
  setup(__props) {
    const { isMobileOpen } = useSidebar();
    ref(false);
    ref(false);
    ref(false);
    const isApplicationMenuOpen = ref(false);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<header${ssrRenderAttrs(mergeProps({ class: "sticky top-0 flex w-full bg-white border-gray-200 z-99999 dark:border-gray-800 dark:bg-gray-900 lg:border-b" }, _attrs))}><div class="flex flex-col items-center justify-between grow lg:flex-row lg:px-6"><div class="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4"><button class="${ssrRenderClass([[
        unref(isMobileOpen) ? "lg:bg-transparent dark:lg:bg-transparent bg-gray-100 dark:bg-gray-800" : ""
      ], "flex items-center justify-center w-10 h-10 text-gray-500 border-gray-200 rounded-lg z-99999 dark:border-gray-800 dark:text-gray-400 lg:h-11 lg:w-11 lg:border"])}">`);
      if (unref(isMobileOpen)) {
        _push(`<svg class="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z" fill=""></path></svg>`);
      } else {
        _push(`<svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z" fill="currentColor"></path></svg>`);
      }
      _push(`</button>`);
      _push(ssrRenderComponent(_sfc_main$k, null, null, _parent));
      _push(`<button class="flex items-center justify-center w-10 h-10 text-gray-700 rounded-lg z-99999 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M5.99902 10.4951C6.82745 10.4951 7.49902 11.1667 7.49902 11.9951V12.0051C7.49902 12.8335 6.82745 13.5051 5.99902 13.5051C5.1706 13.5051 4.49902 12.8335 4.49902 12.0051V11.9951C4.49902 11.1667 5.1706 10.4951 5.99902 10.4951ZM17.999 10.4951C18.8275 10.4951 19.499 11.1667 19.499 11.9951V12.0051C19.499 12.8335 18.8275 13.5051 17.999 13.5051C17.1706 13.5051 16.499 12.8335 16.499 12.0051V11.9951C16.499 11.1667 17.1706 10.4951 17.999 10.4951ZM13.499 11.9951C13.499 11.1667 12.8275 10.4951 11.999 10.4951C11.1706 10.4951 10.499 11.1667 10.499 11.9951V12.0051C10.499 12.8335 11.1706 13.5051 11.999 13.5051C12.8275 13.5051 13.499 12.8335 13.499 12.0051V11.9951Z" fill="currentColor"></path></svg></button>`);
      _push(ssrRenderComponent(SearchBar, null, null, _parent));
      _push(`</div><div class="${ssrRenderClass([[isApplicationMenuOpen.value ? "flex" : "hidden"], "items-center justify-between w-full gap-4 px-5 py-4 shadow-theme-md lg:flex lg:justify-end lg:px-0 lg:shadow-none"])}"><div class="flex items-center gap-2 2xsm:gap-3">`);
      _push(ssrRenderComponent(ThemeToggler, null, null, _parent));
      _push(ssrRenderComponent(NotificationMenu, null, null, _parent));
      _push(`</div>`);
      _push(ssrRenderComponent(UserMenu, null, null, _parent));
      _push(`</div></div></header>`);
    };
  }
});
const _sfc_setup$c = _sfc_main$c.setup;
_sfc_main$c.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/layout/AppHeader.vue");
  return _sfc_setup$c ? _sfc_setup$c(props, ctx) : void 0;
};
const AppHeader = Object.assign(_sfc_main$c, { __name: "LayoutAppHeader" });
const _imports_1 = publicAssetsURL("/android-chrome-192x192.png");
const _sfc_main$b = {};
function _sfc_ssrRender$6(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    xmlns: "http://www.w3.org/2000/svg",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none"
  }, _attrs))}><path fill-rule="evenodd" clip-rule="evenodd" d="M8 2C8.41421 2 8.75 2.33579 8.75 2.75V3.75H15.25V2.75C15.25 2.33579 15.5858 2 16 2C16.4142 2 16.75 2.33579 16.75 2.75V3.75H18.5C19.7426 3.75 20.75 4.75736 20.75 6V9V19C20.75 20.2426 19.7426 21.25 18.5 21.25H5.5C4.25736 21.25 3.25 20.2426 3.25 19V9V6C3.25 4.75736 4.25736 3.75 5.5 3.75H7.25V2.75C7.25 2.33579 7.58579 2 8 2ZM8 5.25H5.5C5.08579 5.25 4.75 5.58579 4.75 6V8.25H19.25V6C19.25 5.58579 18.9142 5.25 18.5 5.25H16H8ZM19.25 9.75H4.75V19C4.75 19.4142 5.08579 19.75 5.5 19.75H18.5C18.9142 19.75 19.25 19.4142 19.25 19V9.75Z" fill="currentColor"></path></svg>`);
}
const _sfc_setup$b = _sfc_main$b.setup;
_sfc_main$b.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/CalenderIcon.vue");
  return _sfc_setup$b ? _sfc_setup$b(props, ctx) : void 0;
};
const CalenderIcon = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$b, [["ssrRender", _sfc_ssrRender$6]]), { __name: "CalenderIcon" });
const _sfc_main$a = {};
function _sfc_ssrRender$5(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    width: "20",
    height: "20",
    viewBox: "0 0 20 20",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, _attrs))}><path fill-rule="evenodd" clip-rule="evenodd" d="M7.33633 4.79297C6.39425 4.79297 5.63054 5.55668 5.63054 6.49876C5.63054 7.44084 6.39425 8.20454 7.33633 8.20454C8.27841 8.20454 9.04212 7.44084 9.04212 6.49876C9.04212 5.55668 8.27841 4.79297 7.33633 4.79297ZM4.13054 6.49876C4.13054 4.72825 5.56582 3.29297 7.33633 3.29297C9.10684 3.29297 10.5421 4.72825 10.5421 6.49876C10.5421 8.26926 9.10684 9.70454 7.33633 9.70454C5.56582 9.70454 4.13054 8.26926 4.13054 6.49876ZM4.24036 12.7602C3.61952 13.3265 3.28381 14.0575 3.10504 14.704C3.06902 14.8343 3.09994 14.9356 3.17904 15.0229C3.26864 15.1218 3.4319 15.2073 3.64159 15.2073H10.9411C11.1507 15.2073 11.314 15.1218 11.4036 15.0229C11.4827 14.9356 11.5136 14.8343 11.4776 14.704C11.2988 14.0575 10.9631 13.3265 10.3423 12.7602C9.73639 12.2075 8.7967 11.7541 7.29132 11.7541C5.78595 11.7541 4.84626 12.2075 4.24036 12.7602ZM3.22949 11.652C4.14157 10.82 5.4544 10.2541 7.29132 10.2541C9.12825 10.2541 10.4411 10.82 11.3532 11.652C12.2503 12.4703 12.698 13.4893 12.9234 14.3042C13.1054 14.9627 12.9158 15.5879 12.5152 16.03C12.1251 16.4605 11.5496 16.7073 10.9411 16.7073H3.64159C3.03301 16.7073 2.45751 16.4605 2.06745 16.03C1.66689 15.5879 1.47723 14.9627 1.65929 14.3042C1.88464 13.4893 2.33237 12.4703 3.22949 11.652ZM12.7529 9.70454C12.1654 9.70454 11.6148 9.54648 11.1412 9.27055C11.4358 8.86714 11.6676 8.4151 11.8226 7.92873C12.0902 8.10317 12.4097 8.20454 12.7529 8.20454C13.695 8.20454 14.4587 7.44084 14.4587 6.49876C14.4587 5.55668 13.695 4.79297 12.7529 4.79297C12.4097 4.79297 12.0901 4.89435 11.8226 5.0688C11.6676 4.58243 11.4357 4.13039 11.1412 3.72698C11.6147 3.45104 12.1654 3.29297 12.7529 3.29297C14.5235 3.29297 15.9587 4.72825 15.9587 6.49876C15.9587 8.26926 14.5235 9.70454 12.7529 9.70454ZM16.3577 16.7072H13.8902C14.1962 16.2705 14.4012 15.7579 14.4688 15.2072H16.3577C16.5674 15.2072 16.7307 15.1217 16.8203 15.0228C16.8994 14.9355 16.9303 14.8342 16.8943 14.704C16.7155 14.0574 16.3798 13.3264 15.759 12.7601C15.2556 12.301 14.5219 11.9104 13.425 11.7914C13.1434 11.3621 12.7952 10.9369 12.3641 10.5437C12.2642 10.4526 12.1611 10.3643 12.0548 10.2791C12.2648 10.2626 12.4824 10.2541 12.708 10.2541C14.5449 10.2541 15.8577 10.82 16.7698 11.6519C17.6669 12.4702 18.1147 13.4892 18.34 14.3042C18.5221 14.9626 18.3324 15.5879 17.9319 16.03C17.5418 16.4605 16.9663 16.7072 16.3577 16.7072Z" fill="currentColor"></path></svg>`);
}
const _sfc_setup$a = _sfc_main$a.setup;
_sfc_main$a.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/UserGroupIcon.vue");
  return _sfc_setup$a ? _sfc_setup$a(props, ctx) : void 0;
};
const UserGroupIcon = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$a, [["ssrRender", _sfc_ssrRender$5]]), { __name: "UserGroupIcon" });
const _sfc_main$9 = {};
function _sfc_ssrRender$4(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, _attrs))}><path fill-rule="evenodd" clip-rule="evenodd" d="M19.5 19.75C19.5 20.9926 18.4926 22 17.25 22H6.75C5.50736 22 4.5 20.9926 4.5 19.75V9.62105C4.5 9.02455 4.73686 8.45247 5.15851 8.03055L10.5262 2.65951C10.9482 2.23725 11.5207 2 12.1177 2H17.25C18.4926 2 19.5 3.00736 19.5 4.25V19.75ZM17.25 20.5C17.6642 20.5 18 20.1642 18 19.75V4.25C18 3.83579 17.6642 3.5 17.25 3.5H12.248L12.2509 7.49913C12.2518 8.7424 11.2442 9.75073 10.0009 9.75073H6V19.75C6 20.1642 6.33579 20.5 6.75 20.5H17.25ZM7.05913 8.25073L10.7488 4.55876L10.7509 7.5002C10.7512 7.91462 10.4153 8.25073 10.0009 8.25073H7.05913ZM8.25 14.5C8.25 14.0858 8.58579 13.75 9 13.75H15C15.4142 13.75 15.75 14.0858 15.75 14.5C15.75 14.9142 15.4142 15.25 15 15.25H9C8.58579 15.25 8.25 14.9142 8.25 14.5ZM8.25 17.5C8.25 17.0858 8.58579 16.75 9 16.75H12C12.4142 16.75 12.75 17.0858 12.75 17.5C12.75 17.9142 12.4142 18.25 12 18.25H9C8.58579 18.25 8.25 17.9142 8.25 17.5Z" fill="currentColor"></path></svg>`);
}
const _sfc_setup$9 = _sfc_main$9.setup;
_sfc_main$9.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/DocsIcon.vue");
  return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
const DocsIcon = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$9, [["ssrRender", _sfc_ssrRender$4]]), { __name: "DocsIcon" });
const _sfc_main$8 = {};
function _sfc_ssrRender$3(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, _attrs))}><path fill-rule="evenodd" clip-rule="evenodd" d="M5.99915 10.2451C6.96564 10.2451 7.74915 11.0286 7.74915 11.9951V12.0051C7.74915 12.9716 6.96564 13.7551 5.99915 13.7551C5.03265 13.7551 4.24915 12.9716 4.24915 12.0051V11.9951C4.24915 11.0286 5.03265 10.2451 5.99915 10.2451ZM17.9991 10.2451C18.9656 10.2451 19.7491 11.0286 19.7491 11.9951V12.0051C19.7491 12.9716 18.9656 13.7551 17.9991 13.7551C17.0326 13.7551 16.2491 12.9716 16.2491 12.0051V11.9951C16.2491 11.0286 17.0326 10.2451 17.9991 10.2451ZM13.7491 11.9951C13.7491 11.0286 12.9656 10.2451 11.9991 10.2451C11.0326 10.2451 10.2491 11.0286 10.2491 11.9951V12.0051C10.2491 12.9716 11.0326 13.7551 11.9991 13.7551C12.9656 13.7551 13.7491 12.9716 13.7491 12.0051V11.9951Z" fill="currentColor"></path></svg>`);
}
const _sfc_setup$8 = _sfc_main$8.setup;
_sfc_main$8.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/HorizontalDots.vue");
  return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
const HorizontalDots = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$8, [["ssrRender", _sfc_ssrRender$3]]), { __name: "HorizontalDots" });
const _sfc_main$7 = /* @__PURE__ */ defineComponent({
  __name: "DatabaseIcon",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<svg${ssrRenderAttrs(mergeProps({
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        "stroke-width": "1.5",
        stroke: "currentColor",
        class: "w-6 h-6"
      }, _attrs))}><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"></path></svg>`);
    };
  }
});
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/DatabaseIcon.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const DatabaseIcon = Object.assign(_sfc_main$7, { __name: "DatabaseIcon" });
const _sfc_main$6 = /* @__PURE__ */ defineComponent({
  __name: "AcademicCapIcon",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<svg${ssrRenderAttrs(mergeProps({
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        "stroke-width": "1.5",
        stroke: "currentColor",
        class: "w-6 h-6"
      }, _attrs))}><path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"></path></svg>`);
    };
  }
});
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/AcademicCapIcon.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const AcademicCapIcon = Object.assign(_sfc_main$6, { __name: "AcademicCapIcon" });
const _sfc_main$5 = {};
function _sfc_ssrRender$2(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, _attrs))}><path d="M11.05 6.9L10.45 7.35L11.05 6.9ZM4.25 5.25H8.5V3.75H4.25V5.25ZM3.5 18V6H2V18H3.5ZM19.75 18.75H4.25V20.25H19.75V18.75ZM20.5 9V18H22V9H20.5ZM19.75 6.75H12.25V8.25H19.75V6.75ZM11.65 6.45L10.3 4.65L9.1 5.55L10.45 7.35L11.65 6.45ZM12.25 6.75C12.0139 6.75 11.7916 6.63885 11.65 6.45L10.45 7.35C10.8749 7.91656 11.5418 8.25 12.25 8.25V6.75ZM22 9C22 7.75736 20.9926 6.75 19.75 6.75V8.25C20.1642 8.25 20.5 8.58579 20.5 9H22ZM19.75 20.25C20.9926 20.25 22 19.2426 22 18H20.5C20.5 18.4142 20.1642 18.75 19.75 18.75V20.25ZM2 18C2 19.2426 3.00736 20.25 4.25 20.25V18.75C3.83579 18.75 3.5 18.4142 3.5 18H2ZM8.5 5.25C8.73607 5.25 8.95836 5.36115 9.1 5.55L10.3 4.65C9.87508 4.08344 9.2082 3.75 8.5 3.75V5.25ZM4.25 3.75C3.00736 3.75 2 4.75736 2 6H3.5C3.5 5.58579 3.83579 5.25 4.25 5.25V3.75Z" fill="currentColor"></path></svg>`);
}
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/FolderIcon.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const FolderIcon = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$5, [["ssrRender", _sfc_ssrRender$2]]), { __name: "FolderIcon" });
const _sfc_main$4 = {};
function _sfc_ssrRender$1(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, _attrs))}><path fill-rule="evenodd" clip-rule="evenodd" d="M4 5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V15C20 16.1046 19.1046 17 18 17H6C4.89543 17 4 16.1046 4 15V5ZM6 4.5C5.72386 4.5 5.5 4.72386 5.5 5V15C5.5 15.2761 5.72386 15.5 6 15.5H18C18.2761 15.5 18.5 15.2761 18.5 15V5C18.5 4.72386 18.2761 4.5 18 4.5H6Z" fill="currentColor"></path><path d="M7.5 7.25C7.5 6.83579 7.83579 6.5 8.25 6.5H15.75C16.1642 6.5 16.5 6.83579 16.5 7.25C16.5 7.66421 16.1642 8 15.75 8H8.25C7.83579 8 7.5 7.66421 7.5 7.25Z" fill="currentColor"></path><path d="M7.5 10.25C7.5 9.83579 7.83579 9.5 8.25 9.5H13.75C14.1642 9.5 14.5 9.83579 14.5 10.25C14.5 10.6642 14.1642 11 13.75 11H8.25C7.83579 11 7.5 10.6642 7.5 10.25Z" fill="currentColor"></path><path d="M12 13C10.3431 13 9 14.3431 9 16C9 17.6569 10.3431 19 12 19C13.6569 19 15 17.6569 15 16C15 14.3431 13.6569 13 12 13ZM10.5 16C10.5 15.1716 11.1716 14.5 12 14.5C12.8284 14.5 13.5 15.1716 13.5 16C13.5 16.8284 12.8284 17.5 12 17.5C11.1716 17.5 10.5 16.8284 10.5 16Z" fill="currentColor"></path><path d="M10.5 18V21.5L12 20.5L13.5 21.5V18C13.0513 18.313 12.5 18.5 12 18.5C11.5 18.5 10.9487 18.313 10.5 18Z" fill="currentColor"></path></svg>`);
}
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/CertificateIcon.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const CertificateIcon = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$4, [["ssrRender", _sfc_ssrRender$1]]), { __name: "CertificateIcon" });
const _sfc_main$3 = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    "stroke-width": "1.5",
    stroke: "currentColor",
    class: "w-6 h-6"
  }, _attrs))}><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"></path></svg>`);
}
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/ClipboardCheckIcon.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const ClipboardCheckIcon = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$3, [["ssrRender", _sfc_ssrRender]]), { __name: "ClipboardCheckIcon" });
const _sfc_main$2 = {
  __name: "LayoutAppSidebar",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const { isExpanded, isMobileOpen, isHovered, openSubmenu } = useSidebar();
    const {
      hasPermission,
      hasAnyPermission,
      isStudent,
      isTeacher,
      isAdmin,
      isManager
    } = usePermissions();
    const allMenuGroups = [
      {
        title: "Меню",
        items: [
          {
            icon: AcademicCapIcon,
            name: "Учебные программы",
            path: "/programs",
            permission: Permission.COURSES_VIEW
          },
          {
            icon: UserGroupIcon,
            name: isTeacher.value ? "Мои группы" : "Учебные группы",
            path: "/groups",
            anyPermissions: [Permission.GROUPS_VIEW_ALL, Permission.GROUPS_VIEW_OWN]
          },
          {
            icon: CalenderIcon,
            name: isStudent.value || isTeacher.value ? "Моё расписание" : "Расписание",
            path: "/schedule",
            anyPermissions: [Permission.SCHEDULE_VIEW_ALL, Permission.SCHEDULE_VIEW_OWN]
          },
          {
            icon: DatabaseIcon,
            name: "База данных",
            path: "/database",
            permission: Permission.STUDENTS_VIEW_ALL
          },
          {
            icon: FolderIcon,
            name: "Файловый менеджер",
            path: "/files",
            permission: Permission.FILES_VIEW,
            // Скрываем для студентов и учителей, так как у них нет доступа
            hideForRoles: ["STUDENT"]
          },
          {
            icon: DocsIcon,
            name: "Шаблоны сертификатов",
            path: "/certificates/templates",
            permission: Permission.TEMPLATES_VIEW
          },
          {
            icon: ClipboardCheckIcon,
            name: "Банк тестов",
            path: "/test-bank",
            // Доступно для админов и менеджеров
            hideForRoles: ["STUDENT", "TEACHER"]
          },
          {
            icon: CertificateIcon,
            name: "Мои сертификаты",
            path: "/my-certificates",
            permission: Permission.CERTIFICATES_VIEW_OWN,
            // Показываем только студентам
            showOnlyForRoles: ["STUDENT"]
          },
          {
            icon: ClipboardCheckIcon,
            name: "Мои тесты",
            path: "/tests/my",
            // Показываем только студентам
            showOnlyForRoles: ["STUDENT"]
          }
        ]
      },
      {
        title: "Управление",
        items: [
          {
            icon: UserGroupIcon,
            name: "Управление пользователями",
            path: "/users",
            permission: Permission.USERS_VIEW
          }
        ]
      }
    ];
    const menuGroups = computed(() => {
      return allMenuGroups.map((group) => {
        const filteredItems = group.items.filter((item) => {
          if (item.showOnlyForRoles) {
            const currentRole = isAdmin.value ? "ADMIN" : isManager.value ? "MANAGER" : isTeacher.value ? "TEACHER" : isStudent.value ? "STUDENT" : null;
            if (!currentRole || !item.showOnlyForRoles.includes(currentRole)) {
              return false;
            }
          }
          if (item.hideForRoles) {
            const currentRole = isAdmin.value ? "ADMIN" : isManager.value ? "MANAGER" : isTeacher.value ? "TEACHER" : isStudent.value ? "STUDENT" : null;
            if (currentRole && item.hideForRoles.includes(currentRole)) {
              return false;
            }
          }
          if (item.permission && !hasPermission(item.permission)) {
            return false;
          }
          if (item.anyPermissions && !hasAnyPermission(item.anyPermissions)) {
            return false;
          }
          if (item.subItems) {
            const filteredSubItems = item.subItems.filter((subItem) => {
              if (subItem.permission && !hasPermission(subItem.permission)) {
                return false;
              }
              return true;
            });
            if (filteredSubItems.length === 0) {
              return false;
            }
            item.subItems = filteredSubItems;
          }
          return true;
        });
        return {
          ...group,
          items: filteredItems
        };
      }).filter((group) => group.items.length > 0);
    });
    const isActive = (path) => route.path === path;
    const isAnySubmenuRouteActive = computed(() => {
      return menuGroups.value.some(
        (group) => group.items.some(
          (item) => item.subItems && item.subItems.some((subItem) => isActive(subItem.path))
        )
      );
    });
    const isSubmenuOpen = (groupIndex, itemIndex) => {
      const key = `${groupIndex}-${itemIndex}`;
      return openSubmenu.value === key || isAnySubmenuRouteActive.value && menuGroups.value[groupIndex]?.items[itemIndex]?.subItems?.some(
        (subItem) => isActive(subItem.path)
      );
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<aside${ssrRenderAttrs(mergeProps({
        class: [
          "fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-99999 border-r border-gray-200",
          {
            "lg:w-[290px]": unref(isExpanded) || unref(isMobileOpen) || unref(isHovered),
            "lg:w-[90px]": !unref(isExpanded) && !unref(isHovered),
            "translate-x-0 w-[290px]": unref(isMobileOpen),
            "-translate-x-full": !unref(isMobileOpen),
            "lg:translate-x-0": true
          }
        ]
      }, _attrs))}><div class="${ssrRenderClass([
        "py-6 flex items-center justify-center",
        !unref(isExpanded) && !unref(isHovered) ? "lg:px-0" : "px-2"
      ])}">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "block w-full"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(``);
            if (unref(isExpanded) || unref(isHovered) || unref(isMobileOpen)) {
              _push2(`<img${ssrRenderAttr("src", _imports_0$1)} alt="АТЦ Logo" class="w-full h-auto object-contain max-h-20 transition-all duration-300"${_scopeId}>`);
            } else {
              _push2(`<div class="flex items-center justify-center mx-auto"${_scopeId}><div class="relative group"${_scopeId}><div class="absolute -inset-1 bg-linear-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-500"${_scopeId}></div><img${ssrRenderAttr("src", _imports_1)} alt="АТЦ" class="relative w-12 h-12 rounded-xl object-contain transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"${_scopeId}></div></div>`);
            }
          } else {
            return [
              createVNode(Transition, {
                "enter-active-class": "transition-all duration-500 ease-out",
                "enter-from-class": "opacity-0 scale-90",
                "enter-to-class": "opacity-100 scale-100",
                "leave-active-class": "transition-all duration-300 ease-in",
                "leave-from-class": "opacity-100 scale-100",
                "leave-to-class": "opacity-0 scale-90",
                mode: "out-in"
              }, {
                default: withCtx(() => [
                  unref(isExpanded) || unref(isHovered) || unref(isMobileOpen) ? (openBlock(), createBlock("img", {
                    key: "full-logo",
                    src: _imports_0$1,
                    alt: "АТЦ Logo",
                    class: "w-full h-auto object-contain max-h-20 transition-all duration-300"
                  })) : (openBlock(), createBlock("div", {
                    key: "favicon",
                    class: "flex items-center justify-center mx-auto"
                  }, [
                    createVNode("div", { class: "relative group" }, [
                      createVNode("div", { class: "absolute -inset-1 bg-linear-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-500" }),
                      createVNode("img", {
                        src: _imports_1,
                        alt: "АТЦ",
                        class: "relative w-12 h-12 rounded-xl object-contain transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                      })
                    ])
                  ]))
                ]),
                _: 1
              })
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar"><nav class="mb-6"><div class="flex flex-col gap-4"><!--[-->`);
      ssrRenderList(menuGroups.value, (menuGroup, groupIndex) => {
        _push(`<div><h2 class="${ssrRenderClass([
          "mb-4 text-xs uppercase flex leading-[20px] text-gray-400",
          !unref(isExpanded) && !unref(isHovered) ? "lg:justify-center" : "justify-start"
        ])}">`);
        if (unref(isExpanded) || unref(isHovered) || unref(isMobileOpen)) {
          _push(`<!--[-->${ssrInterpolate(menuGroup.title)}<!--]-->`);
        } else {
          _push(ssrRenderComponent(HorizontalDots, null, null, _parent));
        }
        _push(`</h2><ul class="flex flex-col gap-4"><!--[-->`);
        ssrRenderList(menuGroup.items, (item, index) => {
          _push(`<li>`);
          if (item.subItems) {
            _push(`<button class="${ssrRenderClass([
              "menu-item group w-full",
              {
                "menu-item-active": isSubmenuOpen(groupIndex, index),
                "menu-item-inactive": !isSubmenuOpen(groupIndex, index)
              },
              !unref(isExpanded) && !unref(isHovered) ? "lg:justify-center" : "lg:justify-start"
            ])}"><span class="${ssrRenderClass([
              isSubmenuOpen(groupIndex, index) ? "menu-item-icon-active" : "menu-item-icon-inactive"
            ])}">`);
            ssrRenderVNode(_push, createVNode(resolveDynamicComponent(item.icon), null, null), _parent);
            _push(`</span>`);
            if (unref(isExpanded) || unref(isHovered) || unref(isMobileOpen)) {
              _push(`<span class="menu-item-text">${ssrInterpolate(item.name)}</span>`);
            } else {
              _push(`<!---->`);
            }
            if (unref(isExpanded) || unref(isHovered) || unref(isMobileOpen)) {
              _push(ssrRenderComponent(ChevronDownIcon, {
                class: [
                  "ml-auto w-5 h-5 transition-transform duration-200",
                  {
                    "rotate-180 text-brand-500": isSubmenuOpen(
                      groupIndex,
                      index
                    )
                  }
                ]
              }, null, _parent));
            } else {
              _push(`<!---->`);
            }
            _push(`</button>`);
          } else if (item.path) {
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: item.path,
              class: [
                "menu-item group",
                {
                  "menu-item-active": isActive(item.path),
                  "menu-item-inactive": !isActive(item.path)
                }
              ]
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<span class="${ssrRenderClass([
                    isActive(item.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"
                  ])}"${_scopeId}>`);
                  ssrRenderVNode(_push2, createVNode(resolveDynamicComponent(item.icon), null, null), _parent2, _scopeId);
                  _push2(`</span>`);
                  if (unref(isExpanded) || unref(isHovered) || unref(isMobileOpen)) {
                    _push2(`<span class="menu-item-text"${_scopeId}>${ssrInterpolate(item.name)}</span>`);
                  } else {
                    _push2(`<!---->`);
                  }
                } else {
                  return [
                    createVNode("span", {
                      class: [
                        isActive(item.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"
                      ]
                    }, [
                      (openBlock(), createBlock(resolveDynamicComponent(item.icon)))
                    ], 2),
                    unref(isExpanded) || unref(isHovered) || unref(isMobileOpen) ? (openBlock(), createBlock("span", {
                      key: 0,
                      class: "menu-item-text"
                    }, toDisplayString(item.name), 1)) : createCommentVNode("", true)
                  ];
                }
              }),
              _: 2
            }, _parent));
          } else {
            _push(`<!---->`);
          }
          _push(`<div style="${ssrRenderStyle(isSubmenuOpen(groupIndex, index) && (unref(isExpanded) || unref(isHovered) || unref(isMobileOpen)) ? null : { display: "none" })}"><ul class="mt-2 space-y-1 ml-9"><!--[-->`);
          ssrRenderList(item.subItems, (subItem) => {
            _push(`<li>`);
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: subItem.path,
              class: [
                "menu-dropdown-item",
                {
                  "menu-dropdown-item-active": isActive(
                    subItem.path
                  ),
                  "menu-dropdown-item-inactive": !isActive(
                    subItem.path
                  )
                }
              ]
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`${ssrInterpolate(subItem.name)} <span class="flex items-center gap-1 ml-auto"${_scopeId}>`);
                  if (subItem.new) {
                    _push2(`<span class="${ssrRenderClass([
                      "menu-dropdown-badge",
                      {
                        "menu-dropdown-badge-active": isActive(
                          subItem.path
                        ),
                        "menu-dropdown-badge-inactive": !isActive(
                          subItem.path
                        )
                      }
                    ])}"${_scopeId}> new </span>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  if (subItem.pro) {
                    _push2(`<span class="${ssrRenderClass([
                      "menu-dropdown-badge",
                      {
                        "menu-dropdown-badge-active": isActive(
                          subItem.path
                        ),
                        "menu-dropdown-badge-inactive": !isActive(
                          subItem.path
                        )
                      }
                    ])}"${_scopeId}> pro </span>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</span>`);
                } else {
                  return [
                    createTextVNode(toDisplayString(subItem.name) + " ", 1),
                    createVNode("span", { class: "flex items-center gap-1 ml-auto" }, [
                      subItem.new ? (openBlock(), createBlock("span", {
                        key: 0,
                        class: [
                          "menu-dropdown-badge",
                          {
                            "menu-dropdown-badge-active": isActive(
                              subItem.path
                            ),
                            "menu-dropdown-badge-inactive": !isActive(
                              subItem.path
                            )
                          }
                        ]
                      }, " new ", 2)) : createCommentVNode("", true),
                      subItem.pro ? (openBlock(), createBlock("span", {
                        key: 1,
                        class: [
                          "menu-dropdown-badge",
                          {
                            "menu-dropdown-badge-active": isActive(
                              subItem.path
                            ),
                            "menu-dropdown-badge-inactive": !isActive(
                              subItem.path
                            )
                          }
                        ]
                      }, " pro ", 2)) : createCommentVNode("", true)
                    ])
                  ];
                }
              }),
              _: 2
            }, _parent));
            _push(`</li>`);
          });
          _push(`<!--]--></ul></div></li>`);
        });
        _push(`<!--]--></ul></div>`);
      });
      _push(`<!--]--></div></nav></div></aside>`);
    };
  }
};
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/layout/AppSidebar.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "Backdrop",
  __ssrInlineRender: true,
  setup(__props) {
    const { isMobileOpen } = useSidebar();
    return (_ctx, _push, _parent, _attrs) => {
      if (unref(isMobileOpen)) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "fixed inset-0 bg-gray-900/50 z-9999 lg:hidden" }, _attrs))}></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/layout/Backdrop.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const Backdrop = Object.assign(_sfc_main$1, { __name: "LayoutBackdrop" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "default",
  __ssrInlineRender: true,
  setup(__props) {
    const { isExpanded, isHovered } = useSidebar();
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex h-screen overflow-hidden" }, _attrs))}>`);
      _push(ssrRenderComponent(_sfc_main$2, null, null, _parent));
      _push(ssrRenderComponent(Backdrop, null, null, _parent));
      _push(`<div class="${ssrRenderClass([
        "flex flex-1 flex-col overflow-x-hidden overflow-y-auto transition-all duration-300 ease-in-out",
        {
          "lg:ml-[290px]": unref(isExpanded) || unref(isHovered),
          "lg:ml-[90px]": !unref(isExpanded) && !unref(isHovered)
        }
      ])}">`);
      _push(ssrRenderComponent(AppHeader, null, null, _parent));
      _push(`<main class="mx-auto w-full max-w-screen-2xl p-4 md:p-6 2xl:p-10">`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</main></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/default.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=default-DTJSnjyb.mjs.map
