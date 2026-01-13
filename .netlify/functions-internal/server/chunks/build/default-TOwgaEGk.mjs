import { defineComponent, mergeProps, unref, computed, withCtx, createVNode, Transition, createBlock, openBlock, resolveDynamicComponent, createCommentVNode, createTextVNode, toDisplayString, withDirectives, vShow, ref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderClass, ssrRenderSlot, ssrRenderAttr, ssrRenderList, ssrInterpolate, ssrRenderVNode, ssrRenderStyle } from 'vue/server-renderer';
import { c as useState, P as Permission, m as useTheme, a as useAuth } from './server.mjs';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';
import { p as publicAssetsURL } from '../routes/renderer.mjs';
import { useRoute, RouterLink } from 'vue-router';
import { u as useImportStore } from './useImportStore-C7uKAALi.mjs';
import { u as useCertificateIssueStore } from './useCertificateIssueStore-C5OIM9Ic.mjs';
import { u as useAuthFetch } from './useAuthFetch-pXCaAdz0.mjs';
import { s as setInterval } from './interval-CUTXZwGJ.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-lE24s-NV.mjs';
import { G as GridIcon, C as CalenderIcon, A as AcademicCapIcon, U as UserGroupIcon, a as ClipboardCheckIcon, b as CertificateIcon, c as UserCircleIcon, S as SettingsIcon, I as InfoCircleIcon } from './GridIcon-BLZ9gkYi.mjs';
import { _ as _imports_0$1 } from './virtual_public-IWZl7zz2.mjs';
import { u as usePermissions } from './usePermissions-BBVzXuId.mjs';
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
import 'jsonwebtoken';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import './useNotification-B8oxL3PM.mjs';
import './Notification-CQvvdM2O.mjs';

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
const _sfc_main$d = /* @__PURE__ */ defineComponent({
  __name: "ThemeToggler",
  __ssrInlineRender: true,
  setup(__props) {
    useTheme();
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<button${ssrRenderAttrs(mergeProps({ class: "relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-dark-900 h-11 w-11 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white" }, _attrs))}><svg class="hidden dark:block" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M9.99998 1.5415C10.4142 1.5415 10.75 1.87729 10.75 2.2915V3.5415C10.75 3.95572 10.4142 4.2915 9.99998 4.2915C9.58577 4.2915 9.24998 3.95572 9.24998 3.5415V2.2915C9.24998 1.87729 9.58577 1.5415 9.99998 1.5415ZM10.0009 6.79327C8.22978 6.79327 6.79402 8.22904 6.79402 10.0001C6.79402 11.7712 8.22978 13.207 10.0009 13.207C11.772 13.207 13.2078 11.7712 13.2078 10.0001C13.2078 8.22904 11.772 6.79327 10.0009 6.79327ZM5.29402 10.0001C5.29402 7.40061 7.40135 5.29327 10.0009 5.29327C12.6004 5.29327 14.7078 7.40061 14.7078 10.0001C14.7078 12.5997 12.6004 14.707 10.0009 14.707C7.40135 14.707 5.29402 12.5997 5.29402 10.0001ZM15.9813 5.08035C16.2742 4.78746 16.2742 4.31258 15.9813 4.01969C15.6884 3.7268 15.2135 3.7268 14.9207 4.01969L14.0368 4.90357C13.7439 5.19647 13.7439 5.67134 14.0368 5.96423C14.3297 6.25713 14.8045 6.25713 15.0974 5.96423L15.9813 5.08035ZM18.4577 10.0001C18.4577 10.4143 18.1219 10.7501 17.7077 10.7501H16.4577C16.0435 10.7501 15.7077 10.4143 15.7077 10.0001C15.7077 9.58592 16.0435 9.25013 16.4577 9.25013H17.7077C18.1219 9.25013 18.4577 9.58592 18.4577 10.0001ZM14.9207 15.9806C15.2135 16.2735 15.6884 16.2735 15.9813 15.9806C16.2742 15.6877 16.2742 15.2128 15.9813 14.9199L15.0974 14.036C14.8045 13.7431 14.3297 13.7431 14.0368 14.036C13.7439 14.3289 13.7439 14.8038 14.0368 15.0967L14.9207 15.9806ZM9.99998 15.7088C10.4142 15.7088 10.75 16.0445 10.75 16.4588V17.7088C10.75 18.123 10.4142 18.4588 9.99998 18.4588C9.58577 18.4588 9.24998 18.123 9.24998 17.7088V16.4588C9.24998 16.0445 9.58577 15.7088 9.99998 15.7088ZM5.96356 15.0972C6.25646 14.8043 6.25646 14.3295 5.96356 14.0366C5.67067 13.7437 5.1958 13.7437 4.9029 14.0366L4.01902 14.9204C3.72613 15.2133 3.72613 15.6882 4.01902 15.9811C4.31191 16.274 4.78679 16.274 5.07968 15.9811L5.96356 15.0972ZM4.29224 10.0001C4.29224 10.4143 3.95645 10.7501 3.54224 10.7501H2.29224C1.87802 10.7501 1.54224 10.4143 1.54224 10.0001C1.54224 9.58592 1.87802 9.25013 2.29224 9.25013H3.54224C3.95645 9.25013 4.29224 9.58592 4.29224 10.0001ZM4.9029 5.9637C5.1958 6.25659 5.67067 6.25659 5.96356 5.9637C6.25646 5.6708 6.25646 5.19593 5.96356 4.90303L5.07968 4.01915C4.78679 3.72626 4.31191 3.72626 4.01902 4.01915C3.72613 4.31204 3.72613 4.78692 4.01902 5.07981L4.9029 5.9637Z" fill="currentColor"></path></svg><svg class="dark:hidden" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.4547 11.97L18.1799 12.1611C18.265 11.8383 18.1265 11.4982 17.8401 11.3266C17.5538 11.1551 17.1885 11.1934 16.944 11.4207L17.4547 11.97ZM8.0306 2.5459L8.57989 3.05657C8.80718 2.81209 8.84554 2.44682 8.67398 2.16046C8.50243 1.8741 8.16227 1.73559 7.83948 1.82066L8.0306 2.5459ZM12.9154 13.0035C9.64678 13.0035 6.99707 10.3538 6.99707 7.08524H5.49707C5.49707 11.1823 8.81835 14.5035 12.9154 14.5035V13.0035ZM16.944 11.4207C15.8869 12.4035 14.4721 13.0035 12.9154 13.0035V14.5035C14.8657 14.5035 16.6418 13.7499 17.9654 12.5193L16.944 11.4207ZM16.7295 11.7789C15.9437 14.7607 13.2277 16.9586 10.0003 16.9586V18.4586C13.9257 18.4586 17.2249 15.7853 18.1799 12.1611L16.7295 11.7789ZM10.0003 16.9586C6.15734 16.9586 3.04199 13.8433 3.04199 10.0003H1.54199C1.54199 14.6717 5.32892 18.4586 10.0003 18.4586V16.9586ZM3.04199 10.0003C3.04199 6.77289 5.23988 4.05695 8.22173 3.27114L7.83948 1.82066C4.21532 2.77574 1.54199 6.07486 1.54199 10.0003H3.04199ZM6.99707 7.08524C6.99707 5.52854 7.5971 4.11366 8.57989 3.05657L7.48132 2.03522C6.25073 3.35885 5.49707 5.13487 5.49707 7.08524H6.99707Z" fill="currentColor"></path></svg></button>`);
    };
  }
});
const _sfc_setup$d = _sfc_main$d.setup;
_sfc_main$d.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/common/ThemeToggler.vue");
  return _sfc_setup$d ? _sfc_setup$d(props, ctx) : void 0;
};
const ThemeToggler = Object.assign(_sfc_main$d, { __name: "CommonThemeToggler" });
const _sfc_main$c = {};
function _sfc_ssrRender$4(_ctx, _push, _parent, _attrs) {
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "hidden lg:block" }, _attrs))}><form><div class="relative"><button class="absolute -translate-y-1/2 left-4 top-1/2"><svg class="fill-gray-500 dark:fill-gray-400" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" fill=""></path></svg></button><input type="text" placeholder="Search or type command..." class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"><button class="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400"><span> ⌘ </span><span> K </span></button></div></form></div>`);
}
const _sfc_setup$c = _sfc_main$c.setup;
_sfc_main$c.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/layout/header/SearchBar.vue");
  return _sfc_setup$c ? _sfc_setup$c(props, ctx) : void 0;
};
const SearchBar = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$c, [["ssrRender", _sfc_ssrRender$4]]), { __name: "LayoutHeaderSearchBar" });
const _imports_0 = publicAssetsURL("/images/logo/logo.svg");
const _imports_1$1 = publicAssetsURL("/images/logo/logo-dark.svg");
const _sfc_main$b = {
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
const _sfc_setup$b = _sfc_main$b.setup;
_sfc_main$b.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/layout/header/HeaderLogo.vue");
  return _sfc_setup$b ? _sfc_setup$b(props, ctx) : void 0;
};
const useStudentNotifications = () => {
  const notifications = ref([]);
  const unreadCount = ref(0);
  const { user } = useAuth();
  const { authFetch } = useAuthFetch();
  const isStudent = computed(() => user.value?.role === "STUDENT");
  const fetchNotifications = async () => {
    if (!isStudent.value) return;
    try {
      const response = await authFetch("/api/students/notifications?unread=true");
      if (response.success && response.notifications) {
        notifications.value = response.notifications;
        unreadCount.value = notifications.value.length;
      }
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };
  const markAsRead = async (id) => {
    try {
      await authFetch(`/api/students/notifications/${id}/read`, { method: "POST" });
      notifications.value = notifications.value.filter((n) => n.id !== id);
      unreadCount.value = Math.max(0, notifications.value.length);
    } catch (e) {
      console.error("Failed to mark notification as read", e);
    }
  };
  let pollingInterval = null;
  const startPolling = (intervalMs = 3e4) => {
    if (pollingInterval) clearInterval(pollingInterval);
    fetchNotifications();
    pollingInterval = setInterval();
  };
  const stopPolling = () => {
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = null;
  };
  return {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    isStudent,
    startPolling,
    stopPolling
  };
};
const _sfc_main$a = /* @__PURE__ */ defineComponent({
  __name: "NotificationMenu",
  __ssrInlineRender: true,
  setup(__props) {
    const dropdownOpen = ref(false);
    const dropdownRef = ref(null);
    const importStore = useImportStore();
    const certIssueStore = useCertificateIssueStore();
    const {
      notifications: studentNotifications,
      unreadCount: studentUnreadCount,
      isStudent
    } = useStudentNotifications();
    const isImportActive = computed(() => importStore.isImporting.value);
    const importFileName = computed(() => importStore.fileName.value);
    const importPercentage = computed(() => importStore.percentage.value);
    const isCertIssueActive = computed(() => certIssueStore.isIssuing.value);
    const certIssuePercentage = computed(() => certIssueStore.percentage.value);
    const showImportNotification = computed(() => {
      const hasActiveImport = importStore.isImporting.value && importStore.jobId.value;
      const hasCompletedImport = importStore.currentStep.value === 4 && importStore.progress.value !== null;
      return hasActiveImport || hasCompletedImport;
    });
    const showCertificateNotification = computed(() => {
      return certIssueStore.isIssuing.value || certIssueStore.isCompleted.value && certIssueStore.results.value.length > 0;
    });
    const hasActiveNotification = computed(() => {
      if (isStudent.value) {
        return studentUnreadCount.value > 0;
      }
      return showImportNotification.value || showCertificateNotification.value;
    });
    const indicatorColor = computed(() => {
      if (isStudent.value) return "bg-blue-500";
      if (isCertIssueActive.value) return "bg-green-500";
      if (isImportActive.value) return "bg-blue-500";
      return "bg-orange-400";
    });
    const getPriorityClass = (priority) => {
      switch (priority) {
        case "high":
        case "critical":
          return "border-l-4 border-l-red-500";
        case "medium":
          return "border-l-4 border-l-orange-500";
        default:
          return "";
      }
    };
    const getIconColorClass = (type) => {
      switch (type) {
        case "TEST_TODAY":
        case "DEADLINE_CRITICAL":
        case "TEST_OVERDUE":
          return "bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400";
        case "TEST_UPCOMING":
        case "DEADLINE_WARNING":
          return "bg-orange-100 text-orange-500 dark:bg-orange-900/30 dark:text-orange-400";
        default:
          return "bg-blue-100 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400";
      }
    };
    const formatDate = (dateStr) => {
      return new Date(dateStr).toLocaleString("ru-RU", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit"
      });
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "relative",
        ref_key: "dropdownRef",
        ref: dropdownRef
      }, _attrs))}><button class="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-dark-900 h-11 w-11 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white" aria-label="Уведомления"><span class="${ssrRenderClass([[
        { hidden: !unref(hasActiveNotification), flex: unref(hasActiveNotification) },
        unref(indicatorColor)
      ], "absolute right-0 top-0.5 z-1 h-2 w-2 rounded-full"])}"><span class="${ssrRenderClass([unref(indicatorColor), "absolute inline-flex w-full h-full rounded-full opacity-75 -z-1 animate-ping"])}"></span></span><svg class="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z" fill=""></path></svg></button>`);
      if (unref(dropdownOpen)) {
        _push(`<div class="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0 z-99999"><div class="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-800"><h5 class="text-lg font-semibold text-gray-800 dark:text-white/90">Уведомления</h5><button class="text-gray-500 dark:text-gray-400"><svg class="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z" fill=""></path></svg></button></div><ul class="flex flex-col h-auto overflow-y-auto custom-scrollbar">`);
        if (unref(isStudent)) {
          _push(`<!--[-->`);
          ssrRenderList(unref(studentNotifications), (notification) => {
            _push(`<li class="mb-2"><div class="${ssrRenderClass([getPriorityClass(notification.priority), "flex gap-3 rounded-lg border p-3 border-gray-100 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 dark:hover:bg-gray-800 cursor-pointer relative group"])}"><span class="${ssrRenderClass([getIconColorClass(notification.type), "relative block h-10 w-10 shrink-0 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"])}">`);
            if (notification.type === "TEST_TODAY" || notification.type === "DEADLINE_CRITICAL") {
              _push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`);
            } else if (notification.type === "TEST_UPCOMING") {
              _push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`);
            } else {
              _push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>`);
            }
            _push(`</span><div class="block w-full pr-5"><span class="mb-1 block text-sm font-medium text-gray-800 dark:text-gray-200">${ssrInterpolate(notification.title)}</span><span class="block text-xs text-gray-500 dark:text-gray-400 line-clamp-2">${ssrInterpolate(notification.message)}</span><span class="block text-[10px] text-gray-400 mt-1">${ssrInterpolate(formatDate(notification.created_at))}</span></div><button class="absolute top-2 right-2 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" title="Отметить как прочитанное"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></button></div></li>`);
          });
          _push(`<!--]-->`);
        } else {
          _push(`<!--[-->`);
          if (unref(showCertificateNotification)) {
            _push(`<li class="mb-2"><a class="${ssrRenderClass([
              "flex gap-3 rounded-lg border p-3 px-4.5 py-3 cursor-pointer",
              unref(isCertIssueActive) ? "border-green-100 bg-green-50 hover:bg-green-100 dark:border-green-900/50 dark:bg-green-900/20 dark:hover:bg-green-900/30" : unref(certIssueStore).errorCount.value > 0 ? "border-red-100 bg-red-50 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:hover:bg-red-900/30" : "border-green-100 bg-green-50 hover:bg-green-100 dark:border-green-900/50 dark:bg-green-900/20 dark:hover:bg-green-900/30"
            ])}" href="#"><span class="${ssrRenderClass([unref(isCertIssueActive) ? "bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-200" : "bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-200", "relative block w-full h-10 rounded-full z-1 max-w-10 flex items-center justify-center"])}">`);
            if (unref(isCertIssueActive)) {
              _push(`<svg class="w-6 h-6 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`);
            } else {
              _push(`<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>`);
            }
            _push(`</span><span class="block w-full"><span class="mb-1.5 block text-theme-sm text-gray-800 dark:text-gray-200"><span class="font-medium"> Выдача сертификатов </span>`);
            if (unref(certIssueStore).currentJob.value) {
              _push(`<span class="text-xs text-gray-500 dark:text-gray-400 ml-1"> (${ssrInterpolate(unref(certIssueStore).currentJob.value.groupCode)}) </span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</span><span class="flex flex-col gap-1"><div class="flex items-center justify-between text-theme-xs text-gray-500 dark:text-gray-400"><span>${ssrInterpolate(unref(isCertIssueActive) ? unref(certIssueStore).currentStudentName.value || "Обработка..." : "Выдача завершена")}</span><span>${ssrInterpolate(unref(certIssuePercentage))}%</span></div><div class="w-full h-1.5 bg-gray-200 rounded-full dark:bg-gray-700 overflow-hidden"><div class="${ssrRenderClass([unref(certIssueStore).errorCount.value > 0 && !unref(isCertIssueActive) ? "bg-orange-500" : "bg-green-500", "h-full rounded-full transition-all duration-300"])}" style="${ssrRenderStyle({ width: `${unref(certIssuePercentage)}%` })}"></div></div>`);
            if (unref(certIssueStore).processedCount.value > 0) {
              _push(`<div class="flex items-center gap-2 text-theme-xs mt-1"><span class="text-green-600 dark:text-green-400">✓ ${ssrInterpolate(unref(certIssueStore).successCount.value)}</span>`);
              if (unref(certIssueStore).warningCount.value > 0) {
                _push(`<span class="text-yellow-600 dark:text-yellow-400">⚠ ${ssrInterpolate(unref(certIssueStore).warningCount.value)}</span>`);
              } else {
                _push(`<!---->`);
              }
              if (unref(certIssueStore).errorCount.value > 0) {
                _push(`<span class="text-red-600 dark:text-red-400">✕ ${ssrInterpolate(unref(certIssueStore).errorCount.value)}</span>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</span></span>`);
            if (!unref(isCertIssueActive)) {
              _push(`<button class="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title="Скрыть"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</a></li>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(showImportNotification)) {
            _push(`<li class="mb-2"><a class="flex gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3 px-4.5 py-3 hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 cursor-pointer" href="#"><span class="relative block w-full h-10 rounded-full z-1 max-w-10 flex items-center justify-center bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-200">`);
            if (unref(isImportActive)) {
              _push(`<svg class="w-6 h-6 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`);
            } else {
              _push(`<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`);
            }
            _push(`</span><span class="block w-full"><span class="mb-1.5 block text-theme-sm text-gray-800 dark:text-gray-200"><span class="font-medium">${ssrInterpolate(unref(importFileName) || "Импорт данных")}</span></span><span class="flex flex-col gap-1"><div class="flex items-center justify-between text-theme-xs text-gray-500 dark:text-gray-400"><span>${ssrInterpolate(unref(isImportActive) ? "Идет импорт..." : "Импорт завершен")}</span><span>${ssrInterpolate(unref(importPercentage))}%</span></div><div class="w-full h-1.5 bg-gray-200 rounded-full dark:bg-gray-700 overflow-hidden"><div class="h-full bg-blue-500 rounded-full transition-all duration-300" style="${ssrRenderStyle({ width: `${unref(importPercentage)}%` })}"></div></div></span></span></a></li>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<!--]-->`);
        }
        if (!unref(hasActiveNotification)) {
          _push(`<li class="flex flex-col items-center justify-center py-8"><div class="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-4"><svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg></div><p class="text-sm text-gray-500 dark:text-gray-400">Нет новых уведомлений</p></li>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</ul><button class="mt-3 flex justify-center rounded-lg border border-gray-300 bg-white p-3 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"> Все уведомления </button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$a = _sfc_main$a.setup;
_sfc_main$a.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/layout/header/NotificationMenu.vue");
  return _sfc_setup$a ? _sfc_setup$a(props, ctx) : void 0;
};
const NotificationMenu = Object.assign(_sfc_main$a, { __name: "LayoutHeaderNotificationMenu" });
const _sfc_main$9 = {};
function _sfc_ssrRender$3(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    width: "20",
    height: "20",
    viewBox: "0 0 20 20",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, _attrs))}><path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`);
}
const _sfc_setup$9 = _sfc_main$9.setup;
_sfc_main$9.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/ChevronDownIcon.vue");
  return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
const ChevronDownIcon = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$9, [["ssrRender", _sfc_ssrRender$3]]), { __name: "IconsChevronDownIcon" });
const _sfc_main$8 = {};
function _sfc_ssrRender$2(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, _attrs))}><path fill-rule="evenodd" clip-rule="evenodd" d="M15.1007 19.247C14.6865 19.247 14.3507 18.9112 14.3507 18.497L14.3507 14.245H12.8507V18.497C12.8507 19.7396 13.8581 20.747 15.1007 20.747H18.5007C19.7434 20.747 20.7507 19.7396 20.7507 18.497L20.7507 5.49609C20.7507 4.25345 19.7433 3.24609 18.5007 3.24609H15.1007C13.8581 3.24609 12.8507 4.25345 12.8507 5.49609V9.74501L14.3507 9.74501V5.49609C14.3507 5.08188 14.6865 4.74609 15.1007 4.74609L18.5007 4.74609C18.9149 4.74609 19.2507 5.08188 19.2507 5.49609L19.2507 18.497C19.2507 18.9112 18.9149 19.247 18.5007 19.247H15.1007ZM3.25073 11.9984C3.25073 12.2144 3.34204 12.4091 3.48817 12.546L8.09483 17.1556C8.38763 17.4485 8.86251 17.4487 9.15549 17.1559C9.44848 16.8631 9.44863 16.3882 9.15583 16.0952L5.81116 12.7484L16.0007 12.7484C16.4149 12.7484 16.7507 12.4127 16.7507 11.9984C16.7507 11.5842 16.4149 11.2484 16.0007 11.2484L5.81528 11.2484L9.15585 7.90554C9.44864 7.61255 9.44847 7.13767 9.15547 6.84488C8.86248 6.55209 8.3876 6.55226 8.09481 6.84525L3.52309 11.4202C3.35673 11.5577 3.25073 11.7657 3.25073 11.9984Z" fill="currentColor"></path></svg>`);
}
const _sfc_setup$8 = _sfc_main$8.setup;
_sfc_main$8.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/LogoutIcon.vue");
  return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
const LogoutIcon = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$8, [["ssrRender", _sfc_ssrRender$2]]), { __name: "IconsLogoutIcon" });
const _sfc_main$7 = /* @__PURE__ */ defineComponent({
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
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/layout/header/UserMenu.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const UserMenu = Object.assign(_sfc_main$7, { __name: "LayoutHeaderUserMenu" });
const _sfc_main$6 = /* @__PURE__ */ defineComponent({
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
      _push(ssrRenderComponent(_sfc_main$b, null, null, _parent));
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
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/layout/AppHeader.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const AppHeader = Object.assign(_sfc_main$6, { __name: "LayoutAppHeader" });
const _imports_1 = publicAssetsURL("/android-chrome-192x192.png");
const _sfc_main$5 = {};
function _sfc_ssrRender$1(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, _attrs))}><path fill-rule="evenodd" clip-rule="evenodd" d="M19.5 19.75C19.5 20.9926 18.4926 22 17.25 22H6.75C5.50736 22 4.5 20.9926 4.5 19.75V9.62105C4.5 9.02455 4.73686 8.45247 5.15851 8.03055L10.5262 2.65951C10.9482 2.23725 11.5207 2 12.1177 2H17.25C18.4926 2 19.5 3.00736 19.5 4.25V19.75ZM17.25 20.5C17.6642 20.5 18 20.1642 18 19.75V4.25C18 3.83579 17.6642 3.5 17.25 3.5H12.248L12.2509 7.49913C12.2518 8.7424 11.2442 9.75073 10.0009 9.75073H6V19.75C6 20.1642 6.33579 20.5 6.75 20.5H17.25ZM7.05913 8.25073L10.7488 4.55876L10.7509 7.5002C10.7512 7.91462 10.4153 8.25073 10.0009 8.25073H7.05913ZM8.25 14.5C8.25 14.0858 8.58579 13.75 9 13.75H15C15.4142 13.75 15.75 14.0858 15.75 14.5C15.75 14.9142 15.4142 15.25 15 15.25H9C8.58579 15.25 8.25 14.9142 8.25 14.5ZM8.25 17.5C8.25 17.0858 8.58579 16.75 9 16.75H12C12.4142 16.75 12.75 17.0858 12.75 17.5C12.75 17.9142 12.4142 18.25 12 18.25H9C8.58579 18.25 8.25 17.9142 8.25 17.5Z" fill="currentColor"></path></svg>`);
}
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/DocsIcon.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const DocsIcon = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$5, [["ssrRender", _sfc_ssrRender$1]]), { __name: "IconsDocsIcon" });
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
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
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/DatabaseIcon.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const DatabaseIcon = Object.assign(_sfc_main$4, { __name: "IconsDatabaseIcon" });
const _sfc_main$3 = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, _attrs))}><path d="M11.05 6.9L10.45 7.35L11.05 6.9ZM4.25 5.25H8.5V3.75H4.25V5.25ZM3.5 18V6H2V18H3.5ZM19.75 18.75H4.25V20.25H19.75V18.75ZM20.5 9V18H22V9H20.5ZM19.75 6.75H12.25V8.25H19.75V6.75ZM11.65 6.45L10.3 4.65L9.1 5.55L10.45 7.35L11.65 6.45ZM12.25 6.75C12.0139 6.75 11.7916 6.63885 11.65 6.45L10.45 7.35C10.8749 7.91656 11.5418 8.25 12.25 8.25V6.75ZM22 9C22 7.75736 20.9926 6.75 19.75 6.75V8.25C20.1642 8.25 20.5 8.58579 20.5 9H22ZM19.75 20.25C20.9926 20.25 22 19.2426 22 18H20.5C20.5 18.4142 20.1642 18.75 19.75 18.75V20.25ZM2 18C2 19.2426 3.00736 20.25 4.25 20.25V18.75C3.83579 18.75 3.5 18.4142 3.5 18H2ZM8.5 5.25C8.73607 5.25 8.95836 5.36115 9.1 5.55L10.3 4.65C9.87508 4.08344 9.2082 3.75 8.5 3.75V5.25ZM4.25 3.75C3.00736 3.75 2 4.75736 2 6H3.5C3.5 5.58579 3.83579 5.25 4.25 5.25V3.75Z" fill="currentColor"></path></svg>`);
}
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/FolderIcon.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const FolderIcon = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$3, [["ssrRender", _sfc_ssrRender]]), { __name: "IconsFolderIcon" });
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "AppSidebar",
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
    const userSettings = useState(
      "user-settings"
    );
    const sidebarColorClass = computed(() => {
      const color = userSettings.value?.sidebar_color || "default";
      switch (color) {
        case "primary":
          return "bg-blue-600/95 dark:bg-blue-700/95 border-blue-500/50 dark:border-blue-600/50 shadow-blue-500/20 text-white sidebar-primary";
        case "success":
          return "bg-emerald-600/95 dark:bg-emerald-700/95 border-emerald-500/50 dark:border-emerald-600/50 shadow-emerald-500/20 text-white sidebar-success";
        case "purple":
          return "bg-purple-600/95 dark:bg-purple-700/95 border-purple-500/50 dark:border-purple-600/50 shadow-purple-500/20 text-white sidebar-purple";
        default:
          return "bg-white/95 dark:bg-gray-900/95 border-gray-200/50 dark:border-gray-800/50 shadow-gray-200/50";
      }
    });
    const allMenuGroups = [
      {
        title: "Главная",
        items: [
          {
            icon: GridIcon,
            name: "Обзор",
            path: "/",
            permission: Permission.DASHBOARD_VIEW
          },
          {
            icon: CalenderIcon,
            name: isStudent.value || isTeacher.value ? "Моё расписание" : "Расписание",
            path: "/schedule",
            anyPermissions: [
              Permission.SCHEDULE_VIEW_ALL,
              Permission.SCHEDULE_VIEW_OWN
            ]
          }
        ]
      },
      {
        title: "Учебный процесс",
        items: [
          {
            icon: AcademicCapIcon,
            name: "Учебные программы",
            permission: Permission.COURSES_VIEW,
            path: "/programs",
            excludePaths: ["/programs/create"]
          },
          {
            icon: UserGroupIcon,
            name: isTeacher.value ? "Мои группы" : "Учебные группы",
            path: "/groups",
            anyPermissions: [
              Permission.GROUPS_VIEW_ALL,
              Permission.GROUPS_VIEW_OWN
            ]
          },
          {
            icon: CalenderIcon,
            name: "Отметка посещаемости",
            path: "/attendance/pending",
            permission: Permission.ATTENDANCE_MARK,
            showOnlyForRoles: ["TEACHER"]
          },
          {
            icon: ClipboardCheckIcon,
            name: "Банк тестирования",
            permission: Permission.TEST_BANKS_VIEW,
            hideForRoles: ["STUDENT"],
            subItems: [
              {
                name: "Банки вопросов",
                path: "/test-bank",
                excludePaths: ["/test-bank/templates"]
              },
              {
                name: "Шаблоны тестов",
                path: "/test-bank/templates",
                permission: Permission.TEST_TEMPLATES_VIEW
              }
            ]
          }
        ]
      },
      {
        title: "База данных",
        items: [
          {
            icon: DatabaseIcon,
            name: "База данных",
            permission: Permission.STUDENTS_VIEW_ALL,
            subItems: [
              {
                name: "База организаций",
                path: "/database?tab=organizations",
                permission: Permission.ORGANIZATIONS_VIEW
              },
              { name: "База студентов", path: "/database?tab=students" },
              {
                name: "База сертификатов",
                path: "/database?tab=certificates",
                permission: Permission.CERTIFICATES_VIEW
              }
            ]
          }
        ]
      },
      {
        title: "Ресурсы",
        items: [
          {
            icon: FolderIcon,
            name: "Файловый менеджер",
            path: "/files",
            permission: Permission.FILES_VIEW,
            hideForRoles: ["STUDENT"]
          }
        ]
      },
      {
        title: "Личный кабинет",
        items: [
          {
            icon: CertificateIcon,
            name: "Мои сертификаты",
            path: "/my-certificates",
            permission: Permission.CERTIFICATES_VIEW_OWN,
            showOnlyForRoles: ["STUDENT"]
          },
          {
            icon: ClipboardCheckIcon,
            name: "Мои тесты",
            path: "/tests/my",
            showOnlyForRoles: ["STUDENT"]
          },
          {
            icon: AcademicCapIcon,
            name: "Мои курсы",
            path: "/my-courses",
            showOnlyForRoles: ["STUDENT"]
          },
          {
            icon: DocsIcon,
            name: "Поддержка",
            path: "/support",
            showOnlyForRoles: ["STUDENT"]
          }
        ]
      },
      {
        title: "Администрирование",
        items: [
          {
            icon: UserGroupIcon,
            name: "Пользователи",
            path: "/users?tab=admin",
            permission: Permission.USERS_MANAGE_ROLES
          },
          {
            icon: DocsIcon,
            name: "Шаблоны сертификатов",
            path: "/certificates/templates",
            permission: Permission.TEMPLATES_VIEW
          },
          {
            icon: CalenderIcon,
            name: "Запросы на отметку",
            path: "/admin/attendance-requests",
            permission: Permission.ATTENDANCE_MANAGE,
            showOnlyForRoles: ["ADMIN", "MANAGER"]
          },
          {
            icon: ClipboardCheckIcon,
            name: "Журнал действий",
            path: "/activity-logs",
            permission: Permission.LOGS_VIEW
          }
        ]
      }
    ];
    const menuGroups = computed(() => {
      return allMenuGroups.map((group) => {
        const filteredItems = group.items.map((item) => {
          if (item.showOnlyForRoles) {
            const currentRole = isAdmin.value ? "ADMIN" : isManager.value ? "MANAGER" : isTeacher.value ? "TEACHER" : isStudent.value ? "STUDENT" : null;
            if (!currentRole || !item.showOnlyForRoles.includes(currentRole)) {
              return null;
            }
          }
          if (item.hideForRoles) {
            const currentRole = isAdmin.value ? "ADMIN" : isManager.value ? "MANAGER" : isTeacher.value ? "TEACHER" : isStudent.value ? "STUDENT" : null;
            if (currentRole && item.hideForRoles.includes(currentRole)) {
              return null;
            }
          }
          if (item.permission && !hasPermission(item.permission)) {
            return null;
          }
          if (item.anyPermissions && !hasAnyPermission(item.anyPermissions)) {
            return null;
          }
          if (item.subItems) {
            const filteredSubItems = item.subItems.filter((subItem) => {
              if (subItem.permission && !hasPermission(subItem.permission)) {
                return false;
              }
              return true;
            });
            if (filteredSubItems.length === 0) return null;
            return { ...item, subItems: filteredSubItems };
          }
          return item;
        }).filter((item) => item !== null);
        return {
          ...group,
          items: filteredItems
        };
      }).filter((group) => group.items.length > 0);
    });
    const isActive = (path, excludePaths) => {
      if (path === "/") return route.path === "/";
      if (excludePaths && excludePaths.some((excluded) => route.path.startsWith(excluded))) {
        return false;
      }
      if (path.includes("?")) {
        const [pathBase, queryString] = path.split("?");
        const params = new URLSearchParams(queryString);
        const tab = params.get("tab");
        return route.path === pathBase && route.query.tab === tab;
      }
      return route.path === path || route.path.startsWith(path + "/");
    };
    const isSubmenuOpen = (groupIndex, itemIndex) => {
      const key = `${groupIndex}-${itemIndex}`;
      if (openSubmenu.value === key) return true;
      const item = menuGroups.value[groupIndex]?.items[itemIndex];
      if (item?.subItems) {
        return item.subItems.some((sub) => isActive(sub.path, sub.excludePaths));
      }
      return false;
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<aside${ssrRenderAttrs(mergeProps({
        class: [
          "fixed mt-16 flex flex-col lg:mt-0 top-0 left-0 h-screen z-50 transition-all duration-300 ease-in-out",
          sidebarColorClass.value,
          "backdrop-blur-xl border-r shadow-xl dark:shadow-none",
          {
            "lg:w-[280px]": unref(isExpanded) || unref(isMobileOpen) || unref(isHovered),
            "lg:w-[80px]": !unref(isExpanded) && !unref(isHovered),
            "translate-x-0 w-[280px]": unref(isMobileOpen),
            "-translate-x-full": !unref(isMobileOpen),
            "lg:translate-x-0": true
          }
        ]
      }, _attrs))} data-v-04de0dbd><div class="${ssrRenderClass([
        "flex items-center justify-center relative border-b border-gray-100/50 dark:border-gray-800/50 mb-2 transition-all duration-300",
        unref(isExpanded) || unref(isHovered) || unref(isMobileOpen) ? "h-32 py-4" : "h-20",
        !unref(isExpanded) && !unref(isHovered) ? "lg:px-0" : "px-6"
      ])}" data-v-04de0dbd>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "block w-full text-center relative z-10 group"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex items-center justify-center h-full" data-v-04de0dbd${_scopeId}>`);
            if (unref(isExpanded) || unref(isHovered) || unref(isMobileOpen)) {
              _push2(`<img${ssrRenderAttr("src", _imports_0$1)} alt="Logo" class="h-24 object-contain mx-auto transition-all duration-300 group-hover:scale-105" data-v-04de0dbd${_scopeId}>`);
            } else {
              _push2(`<img${ssrRenderAttr("src", _imports_1)} alt="Logo" class="h-10 w-10 object-contain mx-auto rounded-xl shadow-md transition-all duration-300 hover:rotate-6" data-v-04de0dbd${_scopeId}>`);
            }
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "flex items-center justify-center h-full" }, [
                createVNode(Transition, {
                  "enter-active-class": "transition-all duration-300 ease-out",
                  "enter-from-class": "opacity-0 scale-90",
                  "enter-to-class": "opacity-100 scale-100",
                  "leave-active-class": "transition-all duration-200 ease-in",
                  "leave-from-class": "opacity-100 scale-100",
                  "leave-to-class": "opacity-0 scale-90",
                  mode: "out-in"
                }, {
                  default: withCtx(() => [
                    unref(isExpanded) || unref(isHovered) || unref(isMobileOpen) ? (openBlock(), createBlock("img", {
                      key: "full-logo",
                      src: _imports_0$1,
                      alt: "Logo",
                      class: "h-24 object-contain mx-auto transition-all duration-300 group-hover:scale-105"
                    })) : (openBlock(), createBlock("img", {
                      key: "mini-logo",
                      src: _imports_1,
                      alt: "Logo",
                      class: "h-10 w-10 object-contain mx-auto rounded-xl shadow-md transition-all duration-300 hover:rotate-6"
                    }))
                  ]),
                  _: 1
                })
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="flex flex-col flex-1 overflow-y-auto overflow-x-hidden no-scrollbar py-4 px-3 space-y-6" data-v-04de0dbd><!--[-->`);
      ssrRenderList(menuGroups.value, (menuGroup, groupIndex) => {
        _push(`<nav data-v-04de0dbd>`);
        if (menuGroup.title) {
          _push(`<h3 class="${ssrRenderClass([
            "px-4 mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 transition-opacity duration-300",
            !unref(isExpanded) && !unref(isHovered) ? "opacity-0 lg:hidden" : "opacity-100"
          ])}" data-v-04de0dbd>${ssrInterpolate(menuGroup.title)}</h3>`);
        } else {
          _push(`<!---->`);
        }
        if (!unref(isExpanded) && !unref(isHovered) && menuGroup.title && groupIndex > 0) {
          _push(`<div class="h-px bg-gray-100 dark:bg-gray-800 mx-4 mb-4 mt-2" data-v-04de0dbd></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<ul class="space-y-1.5" data-v-04de0dbd><!--[-->`);
        ssrRenderList(menuGroup.items, (item, index) => {
          _push(`<li data-v-04de0dbd>`);
          if (item.subItems && item.subItems.length > 0) {
            _push(`<div data-v-04de0dbd><button class="${ssrRenderClass([
              "group flex items-center justify-between w-full px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200",
              "hover:bg-gray-50 dark:hover:bg-gray-800/50",
              isSubmenuOpen(groupIndex, index) ? "text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800/30" : "text-gray-600 dark:text-gray-400",
              !unref(isExpanded) && !unref(isHovered) ? "justify-center px-0" : ""
            ])}" data-v-04de0dbd><div class="flex items-center gap-3 min-w-0" data-v-04de0dbd><div class="${ssrRenderClass([
              "relative flex items-center justify-center w-6 h-6 rounded-lg transition-all duration-300",
              isSubmenuOpen(groupIndex, index) ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400"
            ])}" data-v-04de0dbd>`);
            ssrRenderVNode(_push, createVNode(resolveDynamicComponent(item.icon), { class: "w-5 h-5" }, null), _parent);
            if (isSubmenuOpen(groupIndex, index)) {
              _push(`<span class="absolute inset-0 bg-blue-500/10 dark:bg-blue-400/10 rounded-lg blur-sm scale-150 opacity-50" data-v-04de0dbd></span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div><span class="truncate font-medium text-sm transition-all duration-300" style="${ssrRenderStyle(unref(isExpanded) || unref(isHovered) || unref(isMobileOpen) ? null : { display: "none" })}" data-v-04de0dbd>${ssrInterpolate(item.name)}</span></div>`);
            _push(ssrRenderComponent(ChevronDownIcon, {
              style: unref(isExpanded) || unref(isHovered) || unref(isMobileOpen) ? null : { display: "none" },
              class: [
                "w-4 h-4 transition-transform duration-300 opacity-50 group-hover:opacity-100",
                isSubmenuOpen(groupIndex, index) ? "rotate-180 text-blue-500 opacity-100" : "text-gray-400"
              ]
            }, null, _parent));
            _push(`</button><div class="overflow-hidden" style="${ssrRenderStyle(isSubmenuOpen(groupIndex, index) && (unref(isExpanded) || unref(isHovered) || unref(isMobileOpen)) ? null : { display: "none" })}" data-v-04de0dbd><ul class="pt-1 pb-2 pl-[1.15rem] ml-3 border-l-[1.5px] border-gray-100 dark:border-gray-800 space-y-1" data-v-04de0dbd><!--[-->`);
            ssrRenderList(item.subItems, (subItem) => {
              _push(`<li data-v-04de0dbd>`);
              _push(ssrRenderComponent(_component_NuxtLink, {
                to: subItem.path,
                class: [
                  "flex items-center px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 relative overflow-hidden",
                  isActive(subItem.path, subItem.excludePaths) ? "text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-500/10 translate-x-1" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50"
                ]
              }, {
                default: withCtx((_, _push2, _parent2, _scopeId) => {
                  if (_push2) {
                    if (isActive(subItem.path, subItem.excludePaths)) {
                      _push2(`<span class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3 bg-blue-500 rounded-r-full" data-v-04de0dbd${_scopeId}></span>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    _push2(` ${ssrInterpolate(subItem.name)}`);
                  } else {
                    return [
                      isActive(subItem.path, subItem.excludePaths) ? (openBlock(), createBlock("span", {
                        key: 0,
                        class: "absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3 bg-blue-500 rounded-r-full"
                      })) : createCommentVNode("", true),
                      createTextVNode(" " + toDisplayString(subItem.name), 1)
                    ];
                  }
                }),
                _: 2
              }, _parent));
              _push(`</li>`);
            });
            _push(`<!--]--></ul></div></div>`);
          } else {
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: item.path ?? "",
              class: [
                "group flex items-center px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 relative overflow-hidden",
                isActive(item.path ?? "", item.excludePaths) ? "bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white",
                !unref(isExpanded) && !unref(isHovered) ? "justify-center" : ""
              ]
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  if (!isActive(item.path ?? "", item.excludePaths)) {
                    _push2(`<div class="absolute inset-0 bg-linear-to-r from-blue-500/0 via-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" data-v-04de0dbd${_scopeId}></div>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`<div class="${ssrRenderClass([
                    "relative z-10 w-6 h-6 flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
                    isActive(item.path ?? "", item.excludePaths) ? "text-white" : "text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400"
                  ])}" data-v-04de0dbd${_scopeId}>`);
                  ssrRenderVNode(_push2, createVNode(resolveDynamicComponent(item.icon), { class: "w-5 h-5" }, null), _parent2, _scopeId);
                  _push2(`</div><span class="ml-3 truncate font-medium text-sm transition-opacity duration-300 relative z-10" style="${ssrRenderStyle(unref(isExpanded) || unref(isHovered) || unref(isMobileOpen) ? null : { display: "none" })}" data-v-04de0dbd${_scopeId}>${ssrInterpolate(item.name)}</span>`);
                  if (!unref(isExpanded) && !unref(isHovered) && !unref(isMobileOpen)) {
                    _push2(`<div class="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-60 shadow-xl whitespace-nowrap translate-x--2 group-hover:translate-x-0" data-v-04de0dbd${_scopeId}>${ssrInterpolate(item.name)} <div class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[4px] w-2 h-2 bg-gray-900 rotate-45" data-v-04de0dbd${_scopeId}></div></div>`);
                  } else {
                    _push2(`<!---->`);
                  }
                } else {
                  return [
                    !isActive(item.path ?? "", item.excludePaths) ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "absolute inset-0 bg-linear-to-r from-blue-500/0 via-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    })) : createCommentVNode("", true),
                    createVNode("div", {
                      class: [
                        "relative z-10 w-6 h-6 flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
                        isActive(item.path ?? "", item.excludePaths) ? "text-white" : "text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400"
                      ]
                    }, [
                      (openBlock(), createBlock(resolveDynamicComponent(item.icon), { class: "w-5 h-5" }))
                    ], 2),
                    withDirectives(createVNode("span", { class: "ml-3 truncate font-medium text-sm transition-opacity duration-300 relative z-10" }, toDisplayString(item.name), 513), [
                      [vShow, unref(isExpanded) || unref(isHovered) || unref(isMobileOpen)]
                    ]),
                    !unref(isExpanded) && !unref(isHovered) && !unref(isMobileOpen) ? (openBlock(), createBlock("div", {
                      key: 1,
                      class: "absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-60 shadow-xl whitespace-nowrap translate-x--2 group-hover:translate-x-0"
                    }, [
                      createTextVNode(toDisplayString(item.name) + " ", 1),
                      createVNode("div", { class: "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[4px] w-2 h-2 bg-gray-900 rotate-45" })
                    ])) : createCommentVNode("", true)
                  ];
                }
              }),
              _: 2
            }, _parent));
          }
          _push(`</li>`);
        });
        _push(`<!--]--></ul></nav>`);
      });
      _push(`<!--]--></div></aside>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/layout/AppSidebar.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const AppSidebar = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$2, [["__scopeId", "data-v-04de0dbd"]]), { __name: "LayoutAppSidebar" });
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
      _push(ssrRenderComponent(AppSidebar, null, null, _parent));
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
//# sourceMappingURL=default-TOwgaEGk.mjs.map
