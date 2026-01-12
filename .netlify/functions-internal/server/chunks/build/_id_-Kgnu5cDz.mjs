import { _ as __nuxt_component_0 } from './nuxt-link-BHRIAP0y.mjs';
import { _ as __nuxt_component_1 } from './Button-DE8MjHjS.mjs';
import { _ as __nuxt_component_2, a as __nuxt_component_3 } from './StudentCertificatesModal-B7TOFcV4.mjs';
import { _ as __nuxt_component_3$1 } from './ConfirmModal-GQ4JU241.mjs';
import { defineComponent, ref, mergeProps, withCtx, createBlock, createVNode, openBlock, unref, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderAttr } from 'vue/server-renderer';
import { c as useRoute, d as useRouter } from './server.mjs';
import { u as useAuthFetch } from './useAuthFetch-CmGEBSSi.mjs';
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
import './useNotification-C2RwAN1X.mjs';
import './Notification-Bd1V2gNg.mjs';
import './Modal-DQYphXo7.mjs';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue-router';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[id]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const router = useRouter();
    const studentId = route.params.id;
    const { authFetch } = useAuthFetch();
    const { canEditStudents, canDeleteStudents } = usePermissions();
    const student = ref(null);
    const loading = ref(false);
    const error = ref(null);
    const isEditModalOpen = ref(false);
    const isDeleteModalOpen = ref(false);
    const isDeleting = ref(false);
    const isCertificatesModalOpen = ref(false);
    const fetchStudent = async () => {
      loading.value = true;
      error.value = null;
      try {
        const response = await authFetch(
          `/api/students/${studentId}`,
          {
            method: "GET"
          }
        );
        if (response.success) {
          student.value = response.student;
        } else {
          error.value = "Студент не найден";
        }
      } catch (err) {
        console.error("Ошибка загрузки студента:", err);
        error.value = "Не удалось загрузить данные студента";
      } finally {
        loading.value = false;
      }
    };
    const openEditModal = () => {
      isEditModalOpen.value = true;
    };
    const closeEditModal = () => {
      isEditModalOpen.value = false;
    };
    const openCertificatesModal = () => {
      isCertificatesModalOpen.value = true;
    };
    const closeCertificatesModal = () => {
      isCertificatesModalOpen.value = false;
    };
    const handleUpdate = async (data) => {
      try {
        const response = await authFetch(
          `/api/students/${studentId}`,
          {
            method: "PUT",
            body: data
          }
        );
        if (response.success) {
          student.value = response.student;
          closeEditModal();
        }
      } catch (err) {
        console.error("Ошибка обновления студента:", err);
      }
    };
    const handleDelete = () => {
      isDeleteModalOpen.value = true;
    };
    const closeDeleteModal = () => {
      if (!isDeleting.value) {
        isDeleteModalOpen.value = false;
      }
    };
    const confirmDelete = async () => {
      isDeleting.value = true;
      try {
        const response = await authFetch(
          `/api/students/${studentId}`,
          {
            method: "DELETE"
          }
        );
        if (response.success) {
          router.push("/database");
        }
      } catch (err) {
        console.error("Ошибка удаления студента:", err);
      } finally {
        isDeleting.value = false;
        isDeleteModalOpen.value = false;
      }
    };
    const getInitials = (fullName) => {
      const parts = fullName.split(" ").filter((p) => p.length > 0);
      if (parts.length >= 2 && parts[0] && parts[1] && parts[0].length > 0 && parts[1].length > 0) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      if (fullName.length >= 2) {
        return fullName.substring(0, 2).toUpperCase();
      }
      return fullName.toUpperCase();
    };
    const formatDate = (date) => {
      const d = new Date(date);
      return d.toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    };
    const getExpiryStatus = (expiryDate) => {
      const expiry = new Date(expiryDate);
      const now = /* @__PURE__ */ new Date();
      const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1e3 * 60 * 60 * 24));
      if (daysUntilExpiry < 0) return "expired";
      if (daysUntilExpiry <= 30) return "expiring_soon";
      return "valid";
    };
    const getExpiryStatusClass = (expiryDate) => {
      const status = getExpiryStatus(expiryDate);
      switch (status) {
        case "expired":
          return "text-danger";
        case "expiring_soon":
          return "text-warning";
        default:
          return "text-black dark:text-white";
      }
    };
    const getExpiryBadgeClass = (expiryDate) => {
      const status = getExpiryStatus(expiryDate);
      switch (status) {
        case "expired":
          return "bg-danger/20 text-danger";
        case "expiring_soon":
          return "bg-warning/20 text-warning";
        default:
          return "";
      }
    };
    const getExpiryLabel = (expiryDate) => {
      const status = getExpiryStatus(expiryDate);
      if (status === "expired") return "Истёк";
      if (status === "expiring_soon") {
        const expiry = new Date(expiryDate);
        const now = /* @__PURE__ */ new Date();
        const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1e3 * 60 * 60 * 24));
        return `Истекает через ${daysUntilExpiry} дн.`;
      }
      return "";
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_UiButton = __nuxt_component_1;
      const _component_DatabaseStudentFormModal = __nuxt_component_2;
      const _component_DatabaseStudentCertificatesModal = __nuxt_component_3;
      const _component_UiConfirmModal = __nuxt_component_3$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8" }, _attrs))}><div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"><div class="mb-6">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/database",
        class: "inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors group"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg class="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"${_scopeId}></path></svg><span class="font-medium"${_scopeId}>Назад к списку</span>`);
          } else {
            return [
              (openBlock(), createBlock("svg", {
                class: "w-5 h-5 transform group-hover:-translate-x-1 transition-transform",
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24"
              }, [
                createVNode("path", {
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round",
                  "stroke-width": "2",
                  d: "M10 19l-7-7m0 0l7-7m-7 7h18"
                })
              ])),
              createVNode("span", { class: "font-medium" }, "Назад к списку")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
      if (loading.value) {
        _push(`<div class="flex justify-center items-center py-20"><div class="flex flex-col items-center gap-4"><div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div><p class="text-gray-600 dark:text-gray-400">Загрузка данных студента...</p></div></div>`);
      } else if (error.value) {
        _push(`<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6"><div class="flex items-center gap-3"><svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><div><h3 class="text-lg font-semibold text-red-900 dark:text-red-100">Ошибка загрузки</h3><p class="text-red-700 dark:text-red-300">${ssrInterpolate(error.value)}</p></div></div></div>`);
      } else if (student.value) {
        _push(`<div class="space-y-6"><div class="bg-white dark:bg-boxdark rounded-2xl shadow-lg overflow-hidden"><div class="h-32 bg-linear-to-r from-primary via-purple-500 to-pink-500 relative"><div class="absolute inset-0 bg-black/10"></div></div><div class="relative px-8 pb-8"><div class="flex items-end gap-6 -mt-16 mb-6"><div class="relative"><div class="h-32 w-32 rounded-2xl bg-white dark:bg-boxdark shadow-xl flex items-center justify-center border-4 border-white dark:border-boxdark"><span class="text-5xl font-bold text-primary">${ssrInterpolate(getInitials(student.value.fullName))}</span></div><div class="absolute -bottom-2 -right-2 h-10 w-10 bg-success rounded-full border-4 border-white dark:border-boxdark flex items-center justify-center"><svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg></div></div><div class="flex-1 pb-2"><h1 class="text-3xl font-bold text-black dark:text-white mb-2">${ssrInterpolate(student.value.fullName)}</h1><p class="text-lg text-gray-600 dark:text-gray-400">${ssrInterpolate(student.value.position)}</p></div><div class="flex gap-3 pb-2">`);
        if (unref(canEditStudents)) {
          _push(ssrRenderComponent(_component_UiButton, {
            variant: "primary",
            onClick: openEditModal,
            class: "flex items-center gap-2"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"${_scopeId}></path></svg> Редактировать `);
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
                      d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    })
                  ])),
                  createTextVNode(" Редактировать ")
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        if (unref(canDeleteStudents)) {
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
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div class="bg-white dark:bg-boxdark rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"><div class="flex items-center gap-3 mb-6"><div class="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center"><svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div><h2 class="text-xl font-bold text-black dark:text-white">Личные данные</h2></div><div class="space-y-4"><div class="group"><label class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1"> ПИНФЛ </label><div class="flex items-center gap-2"><p class="text-lg font-mono font-semibold text-black dark:text-white bg-gray-50 dark:bg-meta-4 px-4 py-2 rounded-lg flex-1">${ssrInterpolate(student.value.pinfl)}</p><button class="p-2 hover:bg-gray-100 dark:hover:bg-meta-4 rounded-lg transition-colors" title="Копировать"><svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></button></div></div><div><label class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1"> Дата регистрации </label><p class="text-lg text-black dark:text-white">${ssrInterpolate(formatDate(student.value.created_at))}</p></div><div><label class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1"> Последнее обновление </label><p class="text-lg text-black dark:text-white">${ssrInterpolate(formatDate(student.value.updated_at))}</p></div></div></div><div class="bg-white dark:bg-boxdark rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"><div class="flex items-center gap-3 mb-6"><div class="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center"><svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg></div><h2 class="text-xl font-bold text-black dark:text-white">Место работы</h2></div><div class="space-y-4"><div><label class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1"> Организация </label><p class="text-lg font-semibold text-black dark:text-white">${ssrInterpolate(student.value.organization)}</p></div><div><label class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1"> Должность </label><p class="text-lg text-black dark:text-white">${ssrInterpolate(student.value.position)}</p></div>`);
        if (student.value.department) {
          _push(`<div><label class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1"> Служба/Отдел </label><p class="text-lg text-black dark:text-white">${ssrInterpolate(student.value.department)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div><div class="bg-white dark:bg-boxdark rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"><div class="flex items-center justify-between mb-6"><div class="flex items-center gap-3"><div class="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center"><svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div><div><h2 class="text-xl font-bold text-black dark:text-white">Сертификаты</h2><p class="text-sm text-gray-600 dark:text-gray-400"> Всего: ${ssrInterpolate(student.value.certificates.length)}</p></div></div>`);
        _push(ssrRenderComponent(_component_UiButton, {
          variant: "primary",
          onClick: openCertificatesModal,
          class: "flex items-center gap-2"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"${_scopeId}></path></svg> Управление сертификатами `);
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
                    d: "M12 4v16m8-8H4"
                  })
                ])),
                createTextVNode(" Управление сертификатами ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
        if (student.value.certificates.length > 0) {
          _push(`<div class="space-y-4"><!--[-->`);
          ssrRenderList(student.value.certificates, (certificate) => {
            _push(`<div class="border border-gray-200 dark:border-strokedark rounded-xl p-4 hover:border-primary dark:hover:border-primary transition-colors"><div class="flex items-start justify-between gap-4"><div class="flex-1"><h3 class="font-semibold text-black dark:text-white mb-2">${ssrInterpolate(certificate.courseName)}</h3><div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm"><div><span class="text-gray-500 dark:text-gray-400">Номер:</span><span class="ml-2 font-mono text-black dark:text-white">${ssrInterpolate(certificate.certificateNumber)}</span></div><div><span class="text-gray-500 dark:text-gray-400">Дата выдачи:</span><span class="ml-2 text-black dark:text-white">${ssrInterpolate(formatDate(certificate.issueDate))}</span></div>`);
            if (certificate.expiryDate) {
              _push(`<div><span class="text-gray-500 dark:text-gray-400">Срок действия:</span><span class="${ssrRenderClass([getExpiryStatusClass(certificate.expiryDate), "ml-2 font-medium"])}">${ssrInterpolate(formatDate(certificate.expiryDate))} `);
              if (getExpiryStatus(certificate.expiryDate) !== "valid") {
                _push(`<span class="${ssrRenderClass([getExpiryBadgeClass(certificate.expiryDate), "ml-1 text-xs px-1.5 py-0.5 rounded-full"])}">${ssrInterpolate(getExpiryLabel(certificate.expiryDate))}</span>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</span></div>`);
            } else {
              _push(`<div><span class="text-gray-500 dark:text-gray-400">Срок действия:</span><span class="ml-2 text-success font-medium">Бессрочный</span></div>`);
            }
            _push(`</div></div>`);
            if (certificate.fileUrl) {
              _push(`<div class="shrink-0"><a${ssrRenderAttr("href", certificate.fileUrl)} target="_blank" class="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> Скачать </a></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div></div>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<div class="text-center py-12"><svg class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg><p class="text-gray-500 dark:text-gray-400 text-lg"> У студента пока нет сертификатов </p><p class="text-gray-400 dark:text-gray-500 text-sm mt-2"> Нажмите &quot;Управление сертификатами&quot; чтобы добавить </p></div>`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (isEditModalOpen.value && student.value) {
        _push(ssrRenderComponent(_component_DatabaseStudentFormModal, {
          student: student.value,
          "is-open": isEditModalOpen.value,
          onClose: closeEditModal,
          onSubmit: handleUpdate
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (isCertificatesModalOpen.value && student.value) {
        _push(ssrRenderComponent(_component_DatabaseStudentCertificatesModal, {
          student: student.value,
          "is-open": isCertificatesModalOpen.value,
          onClose: closeCertificatesModal,
          onRefresh: fetchStudent
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_component_UiConfirmModal, {
        "is-open": isDeleteModalOpen.value,
        title: "Удаление студента",
        message: "Вы уверены, что хотите удалить этого студента?",
        "item-name": student.value?.fullName,
        warning: "Это действие нельзя отменить. Все данные студента будут удалены.",
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/students/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_id_-Kgnu5cDz.mjs.map
