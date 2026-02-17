import { _ as __nuxt_component_0 } from './nuxt-link-DnWQlAEm.mjs';
import { _ as __nuxt_component_1 } from './Button-D9CRGwzT.mjs';
import { _ as __nuxt_component_2 } from './InstructorFormModal-8D8lLyMB.mjs';
import { _ as __nuxt_component_3 } from './ConfirmModal-D4ued3Bi.mjs';
import { defineComponent, ref, watch, mergeProps, withCtx, unref, createVNode, createTextVNode, createBlock, openBlock, resolveDynamicComponent, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderVNode, ssrRenderStyle } from 'vue/server-renderer';
import { ArrowLeft, AlertCircle, User, Clock, History } from 'lucide-vue-next';
import { I as InstructorsHoursStats, a as InstructorsCourseHistory } from './CourseHistory-C2KH9Ed5.mjs';
import { l as useRoute, a as useRouter } from './server.mjs';
import { u as useAuthFetch } from './useAuthFetch-DSbqu-Nq.mjs';
import { u as useNotification } from './useNotification-B8oxL3PM.mjs';
import { u as usePermissions } from './usePermissions-Dc3CsxMS.mjs';
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
import './Modal-DQYphXo7.mjs';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue-router';
import './Notification-CQvvdM2O.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[id]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const router = useRouter();
    const instructorId = route.params.id;
    const { authFetch } = useAuthFetch();
    const notification = useNotification();
    usePermissions();
    const instructor = ref(null);
    const loading = ref(false);
    const error = ref(null);
    const isEditModalOpen = ref(false);
    const isDeleteModalOpen = ref(false);
    const isDeleting = ref(false);
    const activeTab = ref("info");
    const availableTabs = [
      { id: "info", label: "Информация", icon: User },
      { id: "hours", label: "Отчётность", icon: Clock },
      { id: "history", label: "История курсов", icon: History }
    ];
    const getInitials = (name) => {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    };
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    };
    const loadInstructor = async () => {
      loading.value = true;
      error.value = null;
      try {
        const response = await authFetch(`/api/instructors/${instructorId}`);
        if (response.success) {
          instructor.value = response.instructor;
        } else {
          error.value = "Не удалось загрузить данные инструктора";
        }
      } catch (err) {
        error.value = err.message || "Ошибка загрузки";
      } finally {
        loading.value = false;
      }
    };
    const editInstructor = () => {
      isEditModalOpen.value = true;
    };
    const closeEditModal = () => {
      isEditModalOpen.value = false;
    };
    const handleUpdate = async (data) => {
      try {
        const response = await authFetch(`/api/instructors/${instructorId}`, {
          method: "PUT",
          body: data
        });
        if (response.success) {
          instructor.value = response.instructor;
          closeEditModal();
          notification.success("Данные инструктора обновлены");
        }
      } catch (err) {
        console.error("Error updating instructor:", err);
        notification.error("Ошибка при обновлении инструктора");
      }
    };
    const handleDelete = () => {
      isDeleteModalOpen.value = true;
    };
    const closeDeleteModal = () => {
      isDeleteModalOpen.value = false;
    };
    const confirmDelete = async () => {
      isDeleting.value = true;
      try {
        await authFetch(`/api/instructors/${instructorId}`, {
          method: "DELETE"
        });
        notification.success("Инструктор удален");
        router.push("/users");
      } catch (err) {
        console.error("Error deleting instructor:", err);
        notification.error("Ошибка при удалении инструктора");
      } finally {
        isDeleting.value = false;
        closeDeleteModal();
      }
    };
    const hoursStatsRef = ref(
      null
    );
    const courseHistoryRef = ref(null);
    watch(activeTab, (newTab) => {
      if (newTab === "hours") {
        hoursStatsRef.value?.load();
      } else if (newTab === "history") {
        courseHistoryRef.value?.load();
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_UiButton = __nuxt_component_1;
      const _component_UsersInstructorFormModal = __nuxt_component_2;
      const _component_UiConfirmModal = __nuxt_component_3;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/users",
        class: "inline-flex items-center gap-2 text-primary hover:underline"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(unref(ArrowLeft), { class: "h-4 w-4" }, null, _parent2, _scopeId));
            _push2(` Назад к списку пользователей `);
          } else {
            return [
              createVNode(unref(ArrowLeft), { class: "h-4 w-4" }),
              createTextVNode(" Назад к списку пользователей ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
      if (loading.value) {
        _push(`<div class="flex justify-center items-center py-20"><div class="flex flex-col items-center gap-4"><div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div><p class="text-gray-600 dark:text-gray-400"> Загрузка данных инструктора... </p></div></div>`);
      } else if (error.value) {
        _push(`<div class="rounded-lg border border-danger/30 bg-danger/5 p-8 text-center">`);
        _push(ssrRenderComponent(unref(AlertCircle), { class: "mx-auto h-12 w-12 text-danger" }, null, _parent));
        _push(`<h3 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white"> Ошибка загрузки </h3><p class="mt-2 text-gray-600 dark:text-gray-400">${ssrInterpolate(error.value)}</p>`);
        _push(ssrRenderComponent(_component_UiButton, {
          variant: "primary",
          class: "mt-4",
          onClick: loadInstructor
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Попробовать снова `);
            } else {
              return [
                createTextVNode(" Попробовать снова ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else if (instructor.value) {
        _push(`<!--[--><div class="bg-white dark:bg-boxdark rounded-2xl shadow-lg overflow-hidden mb-6"><div class="h-32 bg-linear-to-r from-primary via-purple-500 to-pink-500 relative"><div class="absolute inset-0 bg-black/10"></div></div><div class="relative px-8 pb-8"><div class="flex flex-col sm:flex-row items-end gap-6 -mt-16 mb-6"><div class="relative"><div class="h-32 w-32 rounded-2xl bg-white dark:bg-boxdark shadow-xl flex items-center justify-center border-4 border-white dark:border-boxdark"><span class="text-5xl font-bold text-primary">${ssrInterpolate(getInitials(instructor.value.fullName))}</span></div><div class="absolute -bottom-2 -right-2 h-10 w-10 bg-success rounded-full border-4 border-white dark:border-boxdark flex items-center justify-center"><svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg></div></div><div class="flex-1 pb-2 text-center sm:text-left"><h1 class="text-3xl font-bold text-black dark:text-white mb-2">${ssrInterpolate(instructor.value.fullName)}</h1><p class="text-lg text-gray-600 dark:text-gray-400">${ssrInterpolate(instructor.value.email || "Email не указан")}</p></div><div class="flex gap-3 pb-2 w-full sm:w-auto justify-center sm:justify-end">`);
        _push(ssrRenderComponent(_component_UiButton, {
          variant: "primary",
          onClick: editInstructor,
          class: "flex items-center gap-2"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586"${_scopeId}></path></svg> Редактировать `);
            } else {
              return [
                (openBlock(), createBlock("svg", {
                  class: "w-5 h-5",
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24"
                }, [
                  createVNode("path", {
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                    "stroke-width": "2",
                    d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586"
                  })
                ])),
                createTextVNode(" Редактировать ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(_component_UiButton, {
          variant: "danger",
          onClick: handleDelete,
          class: "flex items-center gap-2"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16"${_scopeId}></path></svg> Удалить `);
            } else {
              return [
                (openBlock(), createBlock("svg", {
                  class: "w-5 h-5",
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24"
                }, [
                  createVNode("path", {
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                    "stroke-width": "2",
                    d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16"
                  })
                ])),
                createTextVNode(" Удалить ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></div></div></div><div class="flex flex-col gap-6"><div class="rounded-lg bg-gray-50 p-1 dark:bg-gray-800"><nav class="flex gap-1" aria-label="Tabs"><!--[-->`);
        ssrRenderList(availableTabs, (tab) => {
          _push(`<button class="${ssrRenderClass([
            "flex-1 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200",
            activeTab.value === tab.id ? "bg-primary text-white shadow-sm" : "text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          ])}"><span class="flex items-center justify-center gap-2">`);
          ssrRenderVNode(_push, createVNode(resolveDynamicComponent(tab.icon), { class: "h-5 w-5" }, null), _parent);
          _push(` ${ssrInterpolate(tab.label)}</span></button>`);
        });
        _push(`<!--]--></nav></div><div style="${ssrRenderStyle(activeTab.value === "info" ? null : { display: "none" })}"><div class="grid grid-cols-1 gap-6 lg:grid-cols-2"><div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6"><h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white"> Личная информация </h3><div class="space-y-3"><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400"> Полное имя </p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(instructor.value.fullName)}</p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400"> Email </p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(instructor.value.email || "—")}</p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400"> Телефон </p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(instructor.value.phone || "—")}</p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400"> ID </p><p class="font-medium text-gray-900 dark:text-white font-mono text-sm">${ssrInterpolate(instructor.value.id)}</p></div></div></div><div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6"><h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white"> Рабочая информация </h3><div class="space-y-3"><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400"> Дата приема на работу </p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(instructor.value.hireDate ? formatDate(instructor.value.hireDate) : "—")}</p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400"> Максимальное количество часов </p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(instructor.value.maxHours)} часов </p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400"> Информация о контракте </p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(instructor.value.contractInfo || "—")}</p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400"> Статус </p><span class="${ssrRenderClass([
          "inline-flex rounded-full px-3 py-1 text-sm font-medium",
          instructor.value.isActive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
        ])}">${ssrInterpolate(instructor.value.isActive ? "Активен" : "Неактивен")}</span></div></div></div></div></div><div style="${ssrRenderStyle(activeTab.value === "hours" ? null : { display: "none" })}">`);
        if (instructor.value) {
          _push(ssrRenderComponent(InstructorsHoursStats, {
            "instructor-id": instructor.value.id,
            "initial-load": false,
            ref_key: "hoursStatsRef",
            ref: hoursStatsRef
          }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div style="${ssrRenderStyle(activeTab.value === "history" ? null : { display: "none" })}">`);
        if (instructor.value) {
          _push(ssrRenderComponent(InstructorsCourseHistory, {
            "instructor-id": instructor.value.id,
            "initial-load": false,
            ref_key: "courseHistoryRef",
            ref: courseHistoryRef
          }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><!--]-->`);
      } else {
        _push(`<!---->`);
      }
      if (isEditModalOpen.value && instructor.value) {
        _push(ssrRenderComponent(_component_UsersInstructorFormModal, {
          instructor: instructor.value,
          "is-open": isEditModalOpen.value,
          onClose: closeEditModal,
          onSubmit: handleUpdate
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_component_UiConfirmModal, {
        "is-open": isDeleteModalOpen.value,
        title: "Удаление инструктора",
        message: "Вы уверены, что хотите удалить этого инструктора? Это действие может повлиять на связанные курсы и расписание.",
        "item-name": instructor.value?.fullName,
        warning: "Это действие нельзя отменить.",
        loading: isDeleting.value,
        onConfirm: confirmDelete,
        onCancel: closeDeleteModal
      }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/instructors/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_id_-DIsAP5Rj.mjs.map
