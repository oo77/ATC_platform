import { _ as __nuxt_component_1 } from './Button-DE8MjHjS.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-BHRIAP0y.mjs';
import { _ as __nuxt_component_2 } from './GroupFormModal-Do0sTku8.mjs';
import { _ as __nuxt_component_0$1 } from './Modal-DQYphXo7.mjs';
import { _ as __nuxt_component_3$1 } from './ConfirmModal-GQ4JU241.mjs';
import { defineComponent, ref, computed, watch, mergeProps, unref, withCtx, createTextVNode, createBlock, openBlock, createVNode, toDisplayString, Fragment, renderList, createCommentVNode, withDirectives, isRef, vModelText, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderStyle } from 'vue/server-renderer';
import { u as useAuthFetch } from './useAuthFetch-CmGEBSSi.mjs';
import { u as useNotification } from './useNotification-C2RwAN1X.mjs';
import { c as useRoute, d as useRouter } from './server.mjs';
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
import './Notification-Bd1V2gNg.mjs';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue-router';

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "ManageStudentsModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean },
    group: {}
  },
  emits: ["close", "updated"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const { authFetch } = useAuthFetch();
    const toast = useNotification();
    const searchQuery = ref("");
    const searchResults = ref([]);
    const selectedStudentIds = ref([]);
    const loading = ref(false);
    const addingStudents = ref(false);
    const showTransferModal = ref(false);
    const studentToTransfer = ref(null);
    const availableGroups = ref([]);
    const loadingGroups = ref(false);
    let searchTimeout = null;
    const showDeleteConfirm = ref(false);
    const studentToDelete = ref(null);
    const deletingStudent = ref(false);
    const currentStudents = computed(() => props.group?.students || []);
    const existingStudentIds = computed(() => currentStudents.value.map((s) => s.studentId));
    const searchStudents = async () => {
      if (!searchQuery.value || searchQuery.value.length < 2) {
        searchResults.value = [];
        return;
      }
      loading.value = true;
      try {
        const response = await authFetch("/api/students", {
          method: "GET",
          params: {
            search: searchQuery.value,
            limit: 30
          }
        });
        if (response.success && response.students) {
          searchResults.value = response.students;
        }
      } catch (error) {
        console.error("Error searching students:", error);
        searchResults.value = [];
      } finally {
        loading.value = false;
      }
    };
    const debouncedSearch = () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      searchTimeout = setTimeout(() => {
        searchStudents();
      }, 300);
    };
    const toggleStudent = (student) => {
      if (existingStudentIds.value.includes(student.id)) return;
      const index = selectedStudentIds.value.indexOf(student.id);
      if (index === -1) {
        selectedStudentIds.value.push(student.id);
      } else {
        selectedStudentIds.value.splice(index, 1);
      }
    };
    const addSelectedStudents = async () => {
      if (selectedStudentIds.value.length === 0 || !props.group) return;
      addingStudents.value = true;
      try {
        const response = await authFetch(
          `/api/groups/${props.group.id}/students`,
          {
            method: "POST",
            body: { studentIds: selectedStudentIds.value }
          }
        );
        if (response.success) {
          toast.success(response.message || "Слушатели добавлены");
          selectedStudentIds.value = [];
          searchQuery.value = "";
          searchResults.value = [];
          emit("updated");
        } else if (response.conflicts && response.conflicts.length > 0) {
          const conflictNames = response.conflicts.map((c) => c.studentName).join(", ");
          toast.error(`Конфликт дат: ${conflictNames}`);
        } else {
          toast.error(response.message || "Ошибка добавления");
        }
      } catch (error) {
        toast.error("Ошибка при добавлении слушателей");
      } finally {
        addingStudents.value = false;
      }
    };
    const removeStudentConfirm = (gs) => {
      studentToDelete.value = gs;
      showDeleteConfirm.value = true;
    };
    const confirmDeleteStudent = async () => {
      if (!studentToDelete.value) return;
      deletingStudent.value = true;
      await removeStudent(studentToDelete.value.studentId);
      deletingStudent.value = false;
      showDeleteConfirm.value = false;
      studentToDelete.value = null;
    };
    const cancelDeleteStudent = () => {
      showDeleteConfirm.value = false;
      studentToDelete.value = null;
    };
    const removeStudent = async (studentId) => {
      if (!props.group) return;
      try {
        const response = await authFetch(
          `/api/groups/${props.group.id}/students/${studentId}`,
          { method: "DELETE" }
        );
        if (response.success) {
          toast.success("Слушатель удалён");
          emit("updated");
        } else {
          toast.error(response.message || "Ошибка удаления");
        }
      } catch (error) {
        toast.error("Ошибка удаления слушателя");
      }
    };
    const openTransferModal = async (gs) => {
      studentToTransfer.value = gs;
      showTransferModal.value = true;
      loadingGroups.value = true;
      try {
        const response = await authFetch(
          "/api/groups/select",
          { params: { excludeGroupId: props.group?.id } }
        );
        if (response.success) {
          availableGroups.value = response.groups;
        }
      } catch (error) {
        console.error("Error loading groups:", error);
        availableGroups.value = [];
      } finally {
        loadingGroups.value = false;
      }
    };
    const transferStudentToGroup = async (toGroupId) => {
      if (!props.group || !studentToTransfer.value) return;
      try {
        const response = await authFetch(
          `/api/groups/${props.group.id}/students/transfer`,
          {
            method: "POST",
            body: {
              studentId: studentToTransfer.value.studentId,
              toGroupId
            }
          }
        );
        if (response.success) {
          toast.success(response.message || "Слушатель перемещён");
          showTransferModal.value = false;
          studentToTransfer.value = null;
          emit("updated");
        } else {
          toast.error(response.message || "Ошибка перемещения");
        }
      } catch (error) {
        toast.error("Ошибка перемещения слушателя");
      }
    };
    const getInitials = (name) => {
      if (!name) return "??";
      const parts = name.split(" ");
      const first = parts[0] || "";
      const second = parts[1] || "";
      if (first.length > 0 && second.length > 0) {
        return (first.charAt(0) + second.charAt(0)).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    };
    watch(() => props.isOpen, (isOpen) => {
      if (isOpen) {
        searchQuery.value = "";
        searchResults.value = [];
        selectedStudentIds.value = [];
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0$1;
      const _component_UiButton = __nuxt_component_1;
      const _component_UiConfirmModal = __nuxt_component_3$1;
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_UiModal, {
        "is-open": __props.isOpen,
        title: "Управление слушателями",
        size: "xl",
        onClose: ($event) => _ctx.$emit("close")
      }, {
        footer: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex justify-end"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "outline",
              onClick: ($event) => _ctx.$emit("close")
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(` Закрыть `);
                } else {
                  return [
                    createTextVNode(" Закрыть ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "flex justify-end" }, [
                createVNode(_component_UiButton, {
                  variant: "outline",
                  onClick: ($event) => _ctx.$emit("close")
                }, {
                  default: withCtx(() => [
                    createTextVNode(" Закрыть ")
                  ]),
                  _: 1
                }, 8, ["onClick"])
              ])
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-4"${_scopeId}><div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800"${_scopeId}><div class="flex items-center gap-3"${_scopeId}><div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"${_scopeId}><svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"${_scopeId}></path></svg></div><div${_scopeId}><h4 class="font-semibold text-gray-900 dark:text-white"${_scopeId}>${ssrInterpolate(__props.group?.code)}</h4><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>${ssrInterpolate(__props.group?.course?.name)}</p></div></div></div><div class="grid grid-cols-1 lg:grid-cols-2 gap-4"${_scopeId}><div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"${_scopeId}><div class="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700"${_scopeId}><h5 class="font-medium text-gray-900 dark:text-white flex items-center gap-2"${_scopeId}><svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"${_scopeId}></path></svg> База слушателей </h5></div><div class="p-3 space-y-3"${_scopeId}><div class="flex gap-2"${_scopeId}><div class="relative flex-1"${_scopeId}><input${ssrRenderAttr("value", unref(searchQuery))} type="text" placeholder="Поиск по ФИО, ПИНФЛ..." class="w-full rounded border border-stroke bg-transparent py-2 pl-9 pr-3 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"${_scopeId}><svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"${_scopeId}></path></svg></div>`);
            if (unref(selectedStudentIds).length > 0) {
              _push2(`<button type="button"${ssrIncludeBooleanAttr(unref(addingStudents)) ? " disabled" : ""} class="px-3 py-2 bg-primary text-white text-sm rounded hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1"${_scopeId}>`);
              if (unref(addingStudents)) {
                _push2(`<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"${_scopeId}><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"${_scopeId}></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"${_scopeId}></path></svg>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`<span${_scopeId}>Добавить (${ssrInterpolate(unref(selectedStudentIds).length)})</span></button>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
            if (unref(loading)) {
              _push2(`<div class="text-center py-6"${_scopeId}><div class="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"${_scopeId}></div><p class="mt-2 text-sm text-gray-500"${_scopeId}>Поиск...</p></div>`);
            } else if (unref(searchResults).length > 0) {
              _push2(`<div class="max-h-72 overflow-y-auto space-y-1"${_scopeId}><!--[-->`);
              ssrRenderList(unref(searchResults), (student) => {
                _push2(`<label class="${ssrRenderClass([
                  "flex items-center gap-3 p-2 rounded cursor-pointer transition-colors",
                  unref(existingStudentIds).includes(student.id) ? "bg-gray-100 dark:bg-gray-700 opacity-50 cursor-not-allowed" : unref(selectedStudentIds).includes(student.id) ? "bg-primary/10 border border-primary/30" : "hover:bg-gray-50 dark:hover:bg-gray-700"
                ])}"${_scopeId}><input type="checkbox"${ssrIncludeBooleanAttr(unref(selectedStudentIds).includes(student.id)) ? " checked" : ""}${ssrIncludeBooleanAttr(unref(existingStudentIds).includes(student.id)) ? " disabled" : ""} class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"${_scopeId}><div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold"${_scopeId}>${ssrInterpolate(getInitials(student.fullName))}</div><div class="min-w-0 flex-1"${_scopeId}><p class="text-sm font-medium text-gray-900 dark:text-white truncate"${_scopeId}>${ssrInterpolate(student.fullName)}</p><p class="text-xs text-gray-500 dark:text-gray-400 truncate"${_scopeId}>${ssrInterpolate(student.pinfl)} • ${ssrInterpolate(student.organization)}</p></div>`);
                if (unref(existingStudentIds).includes(student.id)) {
                  _push2(`<span class="text-xs text-gray-400"${_scopeId}>В группе</span>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</label>`);
              });
              _push2(`<!--]--></div>`);
            } else if (unref(searchQuery) && !unref(loading)) {
              _push2(`<div class="text-center py-6 text-gray-500 dark:text-gray-400"${_scopeId}><svg class="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg><p class="mt-2 text-sm"${_scopeId}>Слушатели не найдены</p></div>`);
            } else {
              _push2(`<div class="text-center py-6 text-gray-500 dark:text-gray-400"${_scopeId}><svg class="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"${_scopeId}></path></svg><p class="mt-2 text-sm"${_scopeId}>Введите минимум 2 символа для поиска</p></div>`);
            }
            _push2(`</div></div><div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"${_scopeId}><div class="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700"${_scopeId}><h5 class="font-medium text-gray-900 dark:text-white flex items-center gap-2"${_scopeId}><svg class="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"${_scopeId}></path></svg> В группе (${ssrInterpolate(unref(currentStudents).length)}) </h5></div><div class="p-3"${_scopeId}>`);
            if (unref(currentStudents).length === 0) {
              _push2(`<div class="text-center py-6 text-gray-500 dark:text-gray-400"${_scopeId}><svg class="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"${_scopeId}></path></svg><p class="mt-2 text-sm"${_scopeId}>Группа пуста</p><p class="text-xs text-gray-400 mt-1"${_scopeId}>Выберите слушателей слева для добавления</p></div>`);
            } else {
              _push2(`<div class="max-h-72 overflow-y-auto space-y-1"${_scopeId}><!--[-->`);
              ssrRenderList(unref(currentStudents), (gs) => {
                _push2(`<div class="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800 group"${_scopeId}><div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/10 text-success text-xs font-semibold"${_scopeId}>${ssrInterpolate(getInitials(gs.student?.fullName))}</div><div class="min-w-0 flex-1"${_scopeId}><p class="text-sm font-medium text-gray-900 dark:text-white truncate"${_scopeId}>${ssrInterpolate(gs.student?.fullName)}</p><p class="text-xs text-gray-500 dark:text-gray-400 truncate"${_scopeId}>${ssrInterpolate(gs.student?.organization)}</p></div><div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"${_scopeId}><button type="button" class="p-1.5 text-gray-400 hover:text-primary rounded transition-colors" title="Переместить"${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"${_scopeId}></path></svg></button><button type="button" class="p-1.5 text-gray-400 hover:text-danger rounded transition-colors" title="Удалить"${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"${_scopeId}></path></svg></button></div></div>`);
              });
              _push2(`<!--]--></div>`);
            }
            _push2(`</div></div></div>`);
            _push2(ssrRenderComponent(_component_UiModal, {
              "is-open": unref(showTransferModal),
              title: "Переместить слушателя",
              size: "sm",
              onClose: ($event) => showTransferModal.value = false
            }, {
              footer: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="flex justify-end"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_UiButton, {
                    variant: "outline",
                    onClick: ($event) => showTransferModal.value = false
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(` Отмена `);
                      } else {
                        return [
                          createTextVNode(" Отмена ")
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(`</div>`);
                } else {
                  return [
                    createVNode("div", { class: "flex justify-end" }, [
                      createVNode(_component_UiButton, {
                        variant: "outline",
                        onClick: ($event) => showTransferModal.value = false
                      }, {
                        default: withCtx(() => [
                          createTextVNode(" Отмена ")
                        ]),
                        _: 1
                      }, 8, ["onClick"])
                    ])
                  ];
                }
              }),
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="space-y-4"${_scopeId2}><p class="text-gray-600 dark:text-gray-400"${_scopeId2}> Выберите группу для перемещения: <strong class="block mt-1 text-gray-900 dark:text-white"${_scopeId2}>${ssrInterpolate(unref(studentToTransfer)?.student?.fullName)}</strong></p>`);
                  if (unref(loadingGroups)) {
                    _push3(`<div class="text-center py-4"${_scopeId2}><div class="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"${_scopeId2}></div></div>`);
                  } else if (unref(availableGroups).length === 0) {
                    _push3(`<div class="text-center py-4 text-gray-500"${_scopeId2}> Нет доступных групп для перемещения </div>`);
                  } else {
                    _push3(`<div class="space-y-2 max-h-60 overflow-y-auto"${_scopeId2}><!--[-->`);
                    ssrRenderList(unref(availableGroups), (g) => {
                      _push3(`<button type="button" class="w-full p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-colors"${_scopeId2}><p class="font-medium text-gray-900 dark:text-white"${_scopeId2}>${ssrInterpolate(g.code)}</p><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId2}>${ssrInterpolate(g.courseName)}</p></button>`);
                    });
                    _push3(`<!--]--></div>`);
                  }
                  _push3(`</div>`);
                } else {
                  return [
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("p", { class: "text-gray-600 dark:text-gray-400" }, [
                        createTextVNode(" Выберите группу для перемещения: "),
                        createVNode("strong", { class: "block mt-1 text-gray-900 dark:text-white" }, toDisplayString(unref(studentToTransfer)?.student?.fullName), 1)
                      ]),
                      unref(loadingGroups) ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "text-center py-4"
                      }, [
                        createVNode("div", { class: "inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent" })
                      ])) : unref(availableGroups).length === 0 ? (openBlock(), createBlock("div", {
                        key: 1,
                        class: "text-center py-4 text-gray-500"
                      }, " Нет доступных групп для перемещения ")) : (openBlock(), createBlock("div", {
                        key: 2,
                        class: "space-y-2 max-h-60 overflow-y-auto"
                      }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(unref(availableGroups), (g) => {
                          return openBlock(), createBlock("button", {
                            key: g.id,
                            type: "button",
                            onClick: ($event) => transferStudentToGroup(g.id),
                            class: "w-full p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-colors"
                          }, [
                            createVNode("p", { class: "font-medium text-gray-900 dark:text-white" }, toDisplayString(g.code), 1),
                            createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, toDisplayString(g.courseName), 1)
                          ], 8, ["onClick"]);
                        }), 128))
                      ]))
                    ])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "space-y-4" }, [
                createVNode("div", { class: "p-3 rounded-lg bg-gray-50 dark:bg-gray-800" }, [
                  createVNode("div", { class: "flex items-center gap-3" }, [
                    createVNode("div", { class: "flex h-10 w-10 items-center justify-center rounded-full bg-primary/10" }, [
                      (openBlock(), createBlock("svg", {
                        class: "w-5 h-5 text-primary",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        })
                      ]))
                    ]),
                    createVNode("div", null, [
                      createVNode("h4", { class: "font-semibold text-gray-900 dark:text-white" }, toDisplayString(__props.group?.code), 1),
                      createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, toDisplayString(__props.group?.course?.name), 1)
                    ])
                  ])
                ]),
                createVNode("div", { class: "grid grid-cols-1 lg:grid-cols-2 gap-4" }, [
                  createVNode("div", { class: "border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden" }, [
                    createVNode("div", { class: "bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700" }, [
                      createVNode("h5", { class: "font-medium text-gray-900 dark:text-white flex items-center gap-2" }, [
                        (openBlock(), createBlock("svg", {
                          class: "w-4 h-4 text-primary",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24"
                        }, [
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "2",
                            d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          })
                        ])),
                        createTextVNode(" База слушателей ")
                      ])
                    ]),
                    createVNode("div", { class: "p-3 space-y-3" }, [
                      createVNode("div", { class: "flex gap-2" }, [
                        createVNode("div", { class: "relative flex-1" }, [
                          withDirectives(createVNode("input", {
                            "onUpdate:modelValue": ($event) => isRef(searchQuery) ? searchQuery.value = $event : null,
                            type: "text",
                            placeholder: "Поиск по ФИО, ПИНФЛ...",
                            class: "w-full rounded border border-stroke bg-transparent py-2 pl-9 pr-3 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary",
                            onInput: debouncedSearch
                          }, null, 40, ["onUpdate:modelValue"]), [
                            [vModelText, unref(searchQuery)]
                          ]),
                          (openBlock(), createBlock("svg", {
                            class: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400",
                            fill: "none",
                            stroke: "currentColor",
                            viewBox: "0 0 24 24"
                          }, [
                            createVNode("path", {
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                              "stroke-width": "2",
                              d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            })
                          ]))
                        ]),
                        unref(selectedStudentIds).length > 0 ? (openBlock(), createBlock("button", {
                          key: 0,
                          type: "button",
                          onClick: addSelectedStudents,
                          disabled: unref(addingStudents),
                          class: "px-3 py-2 bg-primary text-white text-sm rounded hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1"
                        }, [
                          unref(addingStudents) ? (openBlock(), createBlock("svg", {
                            key: 0,
                            class: "animate-spin w-4 h-4",
                            fill: "none",
                            viewBox: "0 0 24 24"
                          }, [
                            createVNode("circle", {
                              class: "opacity-25",
                              cx: "12",
                              cy: "12",
                              r: "10",
                              stroke: "currentColor",
                              "stroke-width": "4"
                            }),
                            createVNode("path", {
                              class: "opacity-75",
                              fill: "currentColor",
                              d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            })
                          ])) : createCommentVNode("", true),
                          createVNode("span", null, "Добавить (" + toDisplayString(unref(selectedStudentIds).length) + ")", 1)
                        ], 8, ["disabled"])) : createCommentVNode("", true)
                      ]),
                      unref(loading) ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "text-center py-6"
                      }, [
                        createVNode("div", { class: "inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent" }),
                        createVNode("p", { class: "mt-2 text-sm text-gray-500" }, "Поиск...")
                      ])) : unref(searchResults).length > 0 ? (openBlock(), createBlock("div", {
                        key: 1,
                        class: "max-h-72 overflow-y-auto space-y-1"
                      }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(unref(searchResults), (student) => {
                          return openBlock(), createBlock("label", {
                            key: student.id,
                            class: [
                              "flex items-center gap-3 p-2 rounded cursor-pointer transition-colors",
                              unref(existingStudentIds).includes(student.id) ? "bg-gray-100 dark:bg-gray-700 opacity-50 cursor-not-allowed" : unref(selectedStudentIds).includes(student.id) ? "bg-primary/10 border border-primary/30" : "hover:bg-gray-50 dark:hover:bg-gray-700"
                            ]
                          }, [
                            createVNode("input", {
                              type: "checkbox",
                              checked: unref(selectedStudentIds).includes(student.id),
                              disabled: unref(existingStudentIds).includes(student.id),
                              onChange: ($event) => toggleStudent(student),
                              class: "w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                            }, null, 40, ["checked", "disabled", "onChange"]),
                            createVNode("div", { class: "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold" }, toDisplayString(getInitials(student.fullName)), 1),
                            createVNode("div", { class: "min-w-0 flex-1" }, [
                              createVNode("p", { class: "text-sm font-medium text-gray-900 dark:text-white truncate" }, toDisplayString(student.fullName), 1),
                              createVNode("p", { class: "text-xs text-gray-500 dark:text-gray-400 truncate" }, toDisplayString(student.pinfl) + " • " + toDisplayString(student.organization), 1)
                            ]),
                            unref(existingStudentIds).includes(student.id) ? (openBlock(), createBlock("span", {
                              key: 0,
                              class: "text-xs text-gray-400"
                            }, "В группе")) : createCommentVNode("", true)
                          ], 2);
                        }), 128))
                      ])) : unref(searchQuery) && !unref(loading) ? (openBlock(), createBlock("div", {
                        key: 2,
                        class: "text-center py-6 text-gray-500 dark:text-gray-400"
                      }, [
                        (openBlock(), createBlock("svg", {
                          class: "mx-auto h-8 w-8 text-gray-400",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24"
                        }, [
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "2",
                            d: "M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          })
                        ])),
                        createVNode("p", { class: "mt-2 text-sm" }, "Слушатели не найдены")
                      ])) : (openBlock(), createBlock("div", {
                        key: 3,
                        class: "text-center py-6 text-gray-500 dark:text-gray-400"
                      }, [
                        (openBlock(), createBlock("svg", {
                          class: "mx-auto h-8 w-8 text-gray-400",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24"
                        }, [
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "2",
                            d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          })
                        ])),
                        createVNode("p", { class: "mt-2 text-sm" }, "Введите минимум 2 символа для поиска")
                      ]))
                    ])
                  ]),
                  createVNode("div", { class: "border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden" }, [
                    createVNode("div", { class: "bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700" }, [
                      createVNode("h5", { class: "font-medium text-gray-900 dark:text-white flex items-center gap-2" }, [
                        (openBlock(), createBlock("svg", {
                          class: "w-4 h-4 text-success",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24"
                        }, [
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "2",
                            d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          })
                        ])),
                        createTextVNode(" В группе (" + toDisplayString(unref(currentStudents).length) + ") ", 1)
                      ])
                    ]),
                    createVNode("div", { class: "p-3" }, [
                      unref(currentStudents).length === 0 ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "text-center py-6 text-gray-500 dark:text-gray-400"
                      }, [
                        (openBlock(), createBlock("svg", {
                          class: "mx-auto h-8 w-8 text-gray-400",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24"
                        }, [
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "2",
                            d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          })
                        ])),
                        createVNode("p", { class: "mt-2 text-sm" }, "Группа пуста"),
                        createVNode("p", { class: "text-xs text-gray-400 mt-1" }, "Выберите слушателей слева для добавления")
                      ])) : (openBlock(), createBlock("div", {
                        key: 1,
                        class: "max-h-72 overflow-y-auto space-y-1"
                      }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(unref(currentStudents), (gs) => {
                          return openBlock(), createBlock("div", {
                            key: gs.id,
                            class: "flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800 group"
                          }, [
                            createVNode("div", { class: "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/10 text-success text-xs font-semibold" }, toDisplayString(getInitials(gs.student?.fullName)), 1),
                            createVNode("div", { class: "min-w-0 flex-1" }, [
                              createVNode("p", { class: "text-sm font-medium text-gray-900 dark:text-white truncate" }, toDisplayString(gs.student?.fullName), 1),
                              createVNode("p", { class: "text-xs text-gray-500 dark:text-gray-400 truncate" }, toDisplayString(gs.student?.organization), 1)
                            ]),
                            createVNode("div", { class: "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" }, [
                              createVNode("button", {
                                type: "button",
                                onClick: ($event) => openTransferModal(gs),
                                class: "p-1.5 text-gray-400 hover:text-primary rounded transition-colors",
                                title: "Переместить"
                              }, [
                                (openBlock(), createBlock("svg", {
                                  class: "w-4 h-4",
                                  fill: "none",
                                  stroke: "currentColor",
                                  viewBox: "0 0 24 24"
                                }, [
                                  createVNode("path", {
                                    "stroke-linecap": "round",
                                    "stroke-linejoin": "round",
                                    "stroke-width": "2",
                                    d: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                  })
                                ]))
                              ], 8, ["onClick"]),
                              createVNode("button", {
                                type: "button",
                                onClick: ($event) => removeStudentConfirm(gs),
                                class: "p-1.5 text-gray-400 hover:text-danger rounded transition-colors",
                                title: "Удалить"
                              }, [
                                (openBlock(), createBlock("svg", {
                                  class: "w-4 h-4",
                                  fill: "none",
                                  stroke: "currentColor",
                                  viewBox: "0 0 24 24"
                                }, [
                                  createVNode("path", {
                                    "stroke-linecap": "round",
                                    "stroke-linejoin": "round",
                                    "stroke-width": "2",
                                    d: "M6 18L18 6M6 6l12 12"
                                  })
                                ]))
                              ], 8, ["onClick"])
                            ])
                          ]);
                        }), 128))
                      ]))
                    ])
                  ])
                ]),
                createVNode(_component_UiModal, {
                  "is-open": unref(showTransferModal),
                  title: "Переместить слушателя",
                  size: "sm",
                  onClose: ($event) => showTransferModal.value = false
                }, {
                  footer: withCtx(() => [
                    createVNode("div", { class: "flex justify-end" }, [
                      createVNode(_component_UiButton, {
                        variant: "outline",
                        onClick: ($event) => showTransferModal.value = false
                      }, {
                        default: withCtx(() => [
                          createTextVNode(" Отмена ")
                        ]),
                        _: 1
                      }, 8, ["onClick"])
                    ])
                  ]),
                  default: withCtx(() => [
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("p", { class: "text-gray-600 dark:text-gray-400" }, [
                        createTextVNode(" Выберите группу для перемещения: "),
                        createVNode("strong", { class: "block mt-1 text-gray-900 dark:text-white" }, toDisplayString(unref(studentToTransfer)?.student?.fullName), 1)
                      ]),
                      unref(loadingGroups) ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "text-center py-4"
                      }, [
                        createVNode("div", { class: "inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent" })
                      ])) : unref(availableGroups).length === 0 ? (openBlock(), createBlock("div", {
                        key: 1,
                        class: "text-center py-4 text-gray-500"
                      }, " Нет доступных групп для перемещения ")) : (openBlock(), createBlock("div", {
                        key: 2,
                        class: "space-y-2 max-h-60 overflow-y-auto"
                      }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(unref(availableGroups), (g) => {
                          return openBlock(), createBlock("button", {
                            key: g.id,
                            type: "button",
                            onClick: ($event) => transferStudentToGroup(g.id),
                            class: "w-full p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-colors"
                          }, [
                            createVNode("p", { class: "font-medium text-gray-900 dark:text-white" }, toDisplayString(g.code), 1),
                            createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, toDisplayString(g.courseName), 1)
                          ], 8, ["onClick"]);
                        }), 128))
                      ]))
                    ])
                  ]),
                  _: 1
                }, 8, ["is-open", "onClose"])
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_UiConfirmModal, {
        "is-open": unref(showDeleteConfirm),
        title: "Удаление слушателя",
        message: "Вы уверены, что хотите удалить слушателя из группы?",
        "item-name": unref(studentToDelete)?.student?.fullName,
        "confirm-text": "Удалить",
        "cancel-text": "Отмена",
        variant: "danger",
        loading: unref(deletingStudent),
        onConfirm: confirmDeleteStudent,
        onCancel: cancelDeleteStudent
      }, null, _parent));
      _push(`<!--]-->`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/groups/ManageStudentsModal.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_3 = Object.assign(_sfc_main$1, { __name: "GroupsManageStudentsModal" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const router = useRouter();
    const { authFetch } = useAuthFetch();
    const toast = useNotification();
    const {
      canEditGroups,
      canDeleteGroups,
      canManageGroupStudents,
      canIssueCertificates
    } = usePermissions();
    const loading = ref(true);
    const group = ref(null);
    const showEditModal = ref(false);
    const showManageStudentsModal = ref(false);
    const showDeleteModal = ref(false);
    const isDeleting = ref(false);
    const loadingSchedule = ref(false);
    const scheduleEvents = ref([]);
    const disciplines = ref([]);
    const scheduleExpanded = ref(false);
    const studentAttendanceData = ref(/* @__PURE__ */ new Map());
    const currentStudentsPage = ref(1);
    const studentsPerPage = ref(10);
    const getStudentAttendance = (studentId) => {
      const data = studentAttendanceData.value.get(studentId);
      if (!data || data.total === 0) return 0;
      return data.attended / data.total * 100;
    };
    const getAttendanceColorClass = (percent) => {
      if (percent >= 75) return "bg-success/10 text-success";
      if (percent >= 50) return "bg-warning/10 text-warning";
      return "bg-danger/10 text-danger";
    };
    const eventTypeLabels = {
      theory: "Теория",
      practice: "Практика",
      assessment: "Проверка знаний",
      other: "Другое"
    };
    const statusClass = computed(() => {
      if (!group.value) return "";
      const today = /* @__PURE__ */ new Date();
      const endDate = new Date(group.value.endDate);
      const startDate = new Date(group.value.startDate);
      if (!group.value.isActive) {
        return "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400";
      }
      if (endDate < today) {
        return "bg-warning/10 text-warning";
      }
      if (startDate > today) {
        return "bg-info/10 text-info";
      }
      return "bg-success/10 text-success";
    });
    const statusText = computed(() => {
      if (!group.value) return "";
      const today = /* @__PURE__ */ new Date();
      const endDate = new Date(group.value.endDate);
      const startDate = new Date(group.value.startDate);
      if (!group.value.isActive) {
        return "Неактивна";
      }
      if (endDate < today) {
        return "Завершена";
      }
      if (startDate > today) {
        return "Ожидает начала";
      }
      return "В процессе";
    });
    const daysInfo = computed(() => {
      if (!group.value) return "";
      const today = /* @__PURE__ */ new Date();
      const startDate = new Date(group.value.startDate);
      const endDate = new Date(group.value.endDate);
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1e3 * 60 * 60 * 24));
      if (startDate > today) {
        const daysUntilStart = Math.ceil((startDate.getTime() - today.getTime()) / (1e3 * 60 * 60 * 24));
        return `Начнётся через ${daysUntilStart} дн.`;
      }
      if (endDate < today) {
        return `Завершено (${totalDays} дн.)`;
      }
      const daysPassed = Math.ceil((today.getTime() - startDate.getTime()) / (1e3 * 60 * 60 * 24));
      return `${daysPassed} из ${totalDays} дн.`;
    });
    const totalStudentsPages = computed(() => {
      if (!group.value?.students) return 1;
      return Math.ceil(group.value.students.length / studentsPerPage.value) || 1;
    });
    const paginatedStudents = computed(() => {
      if (!group.value?.students) return [];
      const start = (currentStudentsPage.value - 1) * studentsPerPage.value;
      const end = start + studentsPerPage.value;
      return group.value.students.slice(start, end);
    });
    const paginationInfo = computed(() => {
      if (!group.value?.students) return "";
      const total = group.value.students.length;
      const start = (currentStudentsPage.value - 1) * studentsPerPage.value + 1;
      const end = Math.min(currentStudentsPage.value * studentsPerPage.value, total);
      return `${start}–${end} из ${total}`;
    });
    const visiblePages = computed(() => {
      const total = totalStudentsPages.value;
      const current = currentStudentsPage.value;
      const pages = [];
      if (total <= 7) {
        for (let i = 1; i <= total; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        if (current > 3) {
          pages.push("...");
        }
        const start = Math.max(2, current - 1);
        const end = Math.min(total - 1, current + 1);
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
        if (current < total - 2) {
          pages.push("...");
        }
        pages.push(total);
      }
      return pages;
    });
    const loadGroup = async () => {
      loading.value = true;
      try {
        const id = route.params.id;
        const response = await authFetch(
          `/api/groups/${id}`
        );
        if (response.success && response.group) {
          group.value = response.group;
        } else {
          group.value = null;
        }
      } catch (error) {
        console.error("Error loading group:", error);
        group.value = null;
      } finally {
        loading.value = false;
      }
    };
    const handleGroupUpdated = (updatedGroup) => {
      group.value = updatedGroup;
      showEditModal.value = false;
      loadGroup();
    };
    const deleteGroup = async () => {
      if (!group.value) return;
      isDeleting.value = true;
      try {
        const response = await authFetch(
          `/api/groups/${group.value.id}`,
          { method: "DELETE" }
        );
        if (response.success) {
          toast.success("Группа успешно удалена");
          router.push("/groups");
        } else {
          toast.error(response.message || "Ошибка при удалении группы");
        }
      } catch (error) {
        toast.error("Произошла ошибка при удалении");
      } finally {
        isDeleting.value = false;
        showDeleteModal.value = false;
      }
    };
    const formatDate = (date) => {
      if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date)) {
        const datePart = date.split("T")[0] || date;
        const parts = datePart.split("-").map(Number);
        const year = parts[0] ?? 0;
        const month = parts[1] ?? 1;
        const day = parts[2] ?? 1;
        const d2 = new Date(year, month - 1, day);
        return d2.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
      }
      const d = new Date(date);
      return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
    };
    const formatTime = (date) => {
      const d = new Date(date);
      return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    };
    const getInitials = (name) => {
      if (!name) return "??";
      const parts = name.split(" ");
      const first = parts[0] || "";
      const second = parts[1] || "";
      if (first.length > 0 && second.length > 0) {
        return (first.charAt(0) + second.charAt(0)).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    };
    const loadSchedule = async () => {
      if (!group.value) return;
      loadingSchedule.value = true;
      try {
        const response = await authFetch(
          `/api/schedule?groupId=${group.value.id}`
        );
        if (response.success && response.events) {
          const now = /* @__PURE__ */ new Date();
          scheduleEvents.value = response.events.sort((a, b) => {
            const dateA = new Date(a.startTime);
            const dateB = new Date(b.startTime);
            const aFuture = dateA >= now;
            const bFuture = dateB >= now;
            if (aFuture && !bFuture) return -1;
            if (!aFuture && bFuture) return 1;
            return aFuture ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
          });
        } else {
          scheduleEvents.value = [];
        }
      } catch (error) {
        console.error("Error loading schedule:", error);
        scheduleEvents.value = [];
      } finally {
        loadingSchedule.value = false;
      }
    };
    const loadDisciplines = async () => {
      if (!group.value?.courseId) {
        disciplines.value = [];
        return;
      }
      try {
        const response = await authFetch(
          `/api/courses/${group.value.courseId}`
        );
        if (response.success && response.course?.disciplines) {
          disciplines.value = response.course.disciplines;
        } else {
          disciplines.value = [];
        }
      } catch (error) {
        console.error("Error loading disciplines:", error);
        disciplines.value = [];
      }
    };
    watch(() => route.params.id, async () => {
      await loadGroup();
      await Promise.all([loadSchedule(), loadDisciplines()]);
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1;
      const _component_NuxtLink = __nuxt_component_0;
      const _component_GroupsGroupFormModal = __nuxt_component_2;
      const _component_GroupsManageStudentsModal = __nuxt_component_3;
      const _component_UiConfirmModal = __nuxt_component_3$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}>`);
      if (unref(loading)) {
        _push(`<div class="flex items-center justify-center min-h-[400px]"><div class="text-center"><div class="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div><p class="mt-4 text-gray-600 dark:text-gray-400">Загрузка информации о группе...</p></div></div>`);
      } else if (!unref(group)) {
        _push(`<div class="flex items-center justify-center min-h-[400px]"><div class="text-center"><svg class="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">Группа не найдена</h3><p class="mt-2 text-gray-500 dark:text-gray-400">Возможно, группа была удалена или перемещена</p>`);
        _push(ssrRenderComponent(_component_UiButton, {
          class: "mt-6",
          onClick: ($event) => _ctx.$router.push("/groups")
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Вернуться к списку групп `);
            } else {
              return [
                createTextVNode(" Вернуться к списку групп ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></div>`);
      } else {
        _push(`<!--[--><div class="mb-6"><div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/groups",
          class: "hover:text-primary transition-colors"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Учебные группы`);
            } else {
              return [
                createTextVNode("Учебные группы")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg><span class="text-gray-900 dark:text-white">${ssrInterpolate(unref(group).code)}</span></div><div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div class="flex items-center gap-4"><div class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl">${ssrInterpolate(unref(group).code.substring(0, 2).toUpperCase())}</div><div><h1 class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(unref(group).code)}</h1><p class="text-gray-500 dark:text-gray-400">${ssrInterpolate(unref(group).course?.name)}</p></div></div><div class="flex items-center gap-3">`);
        if (unref(canIssueCertificates)) {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/groups/${unref(group).id}/certificates`
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(ssrRenderComponent(_component_UiButton, { variant: "primary" }, {
                  default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      _push3(`<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"${_scopeId2}></path></svg> Выдача сертификатов `);
                    } else {
                      return [
                        (openBlock(), createBlock("svg", {
                          class: "w-4 h-4 mr-2",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24"
                        }, [
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "2",
                            d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          })
                        ])),
                        createTextVNode(" Выдача сертификатов ")
                      ];
                    }
                  }),
                  _: 1
                }, _parent2, _scopeId));
              } else {
                return [
                  createVNode(_component_UiButton, { variant: "primary" }, {
                    default: withCtx(() => [
                      (openBlock(), createBlock("svg", {
                        class: "w-4 h-4 mr-2",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        })
                      ])),
                      createTextVNode(" Выдача сертификатов ")
                    ]),
                    _: 1
                  })
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        if (unref(canEditGroups)) {
          _push(ssrRenderComponent(_component_UiButton, {
            variant: "outline",
            onClick: ($event) => showEditModal.value = true
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"${_scopeId}></path></svg> Редактировать `);
              } else {
                return [
                  (openBlock(), createBlock("svg", {
                    class: "w-4 h-4 mr-2",
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
        if (unref(canDeleteGroups)) {
          _push(ssrRenderComponent(_component_UiButton, {
            variant: "danger",
            onClick: ($event) => showDeleteModal.value = true
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"${_scopeId}></path></svg> Удалить `);
              } else {
                return [
                  (openBlock(), createBlock("svg", {
                    class: "w-4 h-4 mr-2",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24"
                  }, [
                    createVNode("path", {
                      "stroke-linecap": "round",
                      "stroke-linejoin": "round",
                      "stroke-width": "2",
                      d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
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
        _push(`</div></div></div>`);
        if (unref(disciplines).length > 0) {
          _push(`<div class="mb-6 rounded-xl bg-white dark:bg-boxdark shadow-md p-6"><div class="flex items-center justify-between mb-4"><div class="flex items-center gap-3"><div class="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center"><svg class="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg></div><div><h3 class="text-lg font-semibold text-black dark:text-white">Журналы дисциплин</h3><p class="text-sm text-gray-500 dark:text-gray-400">${ssrInterpolate(unref(disciplines).length)} дисциплин в программе</p></div></div></div><div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"><!--[-->`);
          ssrRenderList(unref(disciplines), (discipline) => {
            _push(ssrRenderComponent(_component_NuxtLink, {
              key: discipline.id,
              to: `/groups/journal/${unref(group)?.id}_${discipline.id}`,
              class: "group p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary hover:shadow-lg transition-all duration-200"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<div class="flex items-start justify-between mb-3"${_scopeId}><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors"${_scopeId}><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"${_scopeId}></path></svg></div><svg class="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"${_scopeId}></path></svg></div><h4 class="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2"${_scopeId}>${ssrInterpolate(discipline.name)}</h4><div class="flex flex-wrap items-center gap-2 text-xs"${_scopeId}><span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"${_scopeId}><span class="w-1.5 h-1.5 rounded-full bg-current"${_scopeId}></span> ${ssrInterpolate(discipline.theoryHours)} т </span><span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"${_scopeId}><span class="w-1.5 h-1.5 rounded-full bg-current"${_scopeId}></span> ${ssrInterpolate(discipline.practiceHours)} п </span><span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"${_scopeId}><span class="w-1.5 h-1.5 rounded-full bg-current"${_scopeId}></span> ${ssrInterpolate(discipline.assessmentHours)} о </span></div>`);
                } else {
                  return [
                    createVNode("div", { class: "flex items-start justify-between mb-3" }, [
                      createVNode("div", { class: "flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors" }, [
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
                            d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          })
                        ]))
                      ]),
                      (openBlock(), createBlock("svg", {
                        class: "w-5 h-5 text-gray-400 group-hover:text-primary transition-colors",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M9 5l7 7-7 7"
                        })
                      ]))
                    ]),
                    createVNode("h4", { class: "font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2" }, toDisplayString(discipline.name), 1),
                    createVNode("div", { class: "flex flex-wrap items-center gap-2 text-xs" }, [
                      createVNode("span", { class: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" }, [
                        createVNode("span", { class: "w-1.5 h-1.5 rounded-full bg-current" }),
                        createTextVNode(" " + toDisplayString(discipline.theoryHours) + " т ", 1)
                      ]),
                      createVNode("span", { class: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" }, [
                        createVNode("span", { class: "w-1.5 h-1.5 rounded-full bg-current" }),
                        createTextVNode(" " + toDisplayString(discipline.practiceHours) + " п ", 1)
                      ]),
                      createVNode("span", { class: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300" }, [
                        createVNode("span", { class: "w-1.5 h-1.5 rounded-full bg-current" }),
                        createTextVNode(" " + toDisplayString(discipline.assessmentHours) + " о ", 1)
                      ])
                    ])
                  ];
                }
              }),
              _: 2
            }, _parent));
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"><div class="rounded-xl bg-white dark:bg-boxdark shadow-md p-6"><h3 class="text-lg font-semibold text-black dark:text-white mb-4">Информация о группе</h3><div class="grid grid-cols-2 gap-4"><div><label class="text-sm text-gray-500 dark:text-gray-400">Код группы</label><p class="text-gray-900 dark:text-white font-medium">${ssrInterpolate(unref(group).code)}</p></div><div><label class="text-sm text-gray-500 dark:text-gray-400">Статус</label><p><span class="${ssrRenderClass([
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium",
          unref(statusClass)
        ])}">${ssrInterpolate(unref(statusText))}</span></p></div><div><label class="text-sm text-gray-500 dark:text-gray-400">Даты обучения</label><p class="text-gray-900 dark:text-white font-medium">${ssrInterpolate(formatDate(unref(group).startDate))} — ${ssrInterpolate(formatDate(unref(group).endDate))}</p><p class="text-sm text-gray-500 dark:text-gray-400">${ssrInterpolate(unref(daysInfo))}</p></div><div><label class="text-sm text-gray-500 dark:text-gray-400">Аудитория</label><p class="text-gray-900 dark:text-white font-medium">${ssrInterpolate(unref(group).classroom || "—")}</p></div>`);
        if (unref(group).description) {
          _push(`<div class="col-span-2"><label class="text-sm text-gray-500 dark:text-gray-400">Описание</label><p class="text-gray-900 dark:text-white">${ssrInterpolate(unref(group).description)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
        if (unref(group).course) {
          _push(`<div class="rounded-xl bg-white dark:bg-boxdark shadow-md p-6"><h3 class="text-lg font-semibold text-black dark:text-white mb-4">Учебная программа</h3><div class="space-y-3"><div><label class="text-sm text-gray-500 dark:text-gray-400">Название</label><p class="text-gray-900 dark:text-white font-medium">${ssrInterpolate(unref(group).course.name)}</p></div><div class="flex gap-6"><div><label class="text-sm text-gray-500 dark:text-gray-400">Код</label><p class="text-gray-900 dark:text-white font-medium">${ssrInterpolate(unref(group).course.code)}</p></div><div><label class="text-sm text-gray-500 dark:text-gray-400">Всего часов</label><p class="text-gray-900 dark:text-white font-medium">${ssrInterpolate(unref(group).course.totalHours)} а-ч</p></div><div><label class="text-sm text-gray-500 dark:text-gray-400">Дисциплин</label><p class="text-gray-900 dark:text-white font-medium">${ssrInterpolate(unref(disciplines).length)}</p></div></div>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/programs/${unref(group).courseId}`,
            class: "inline-flex items-center gap-1 text-primary hover:underline text-sm"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` Перейти к программе <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"${_scopeId}></path></svg>`);
              } else {
                return [
                  createTextVNode(" Перейти к программе "),
                  (openBlock(), createBlock("svg", {
                    class: "w-4 h-4",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24"
                  }, [
                    createVNode("path", {
                      "stroke-linecap": "round",
                      "stroke-linejoin": "round",
                      "stroke-width": "2",
                      d: "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    })
                  ]))
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`</div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="mb-6 rounded-xl bg-white dark:bg-boxdark shadow-md overflow-hidden"><div class="p-6 border-b border-gray-200 dark:border-gray-700"><div class="flex items-center justify-between"><div class="flex items-center gap-3"><div class="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center"><svg class="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg></div><div><h3 class="text-lg font-semibold text-black dark:text-white">Слушатели</h3><p class="text-sm text-gray-500 dark:text-gray-400">${ssrInterpolate(unref(group).students?.length || 0)} человек</p></div></div>`);
        if (unref(canManageGroupStudents)) {
          _push(ssrRenderComponent(_component_UiButton, {
            onClick: ($event) => showManageStudentsModal.value = true
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"${_scopeId}></path></svg> Управление слушателями `);
              } else {
                return [
                  (openBlock(), createBlock("svg", {
                    class: "w-4 h-4 mr-2",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24"
                  }, [
                    createVNode("path", {
                      "stroke-linecap": "round",
                      "stroke-linejoin": "round",
                      "stroke-width": "2",
                      d: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    })
                  ])),
                  createTextVNode(" Управление слушателями ")
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
        if (!unref(group).students || unref(group).students.length === 0) {
          _push(`<div class="p-12 text-center text-gray-500 dark:text-gray-400"><svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg><p class="mt-4">В группе пока нет слушателей</p>`);
          if (unref(canManageGroupStudents)) {
            _push(ssrRenderComponent(_component_UiButton, {
              class: "mt-4",
              onClick: ($event) => showManageStudentsModal.value = true
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(` Добавить слушателей `);
                } else {
                  return [
                    createTextVNode(" Добавить слушателей ")
                  ];
                }
              }),
              _: 1
            }, _parent));
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else {
          _push(`<!--[--><div class="overflow-x-auto"><table class="w-full"><thead><tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"> Слушатель </th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"> Организация </th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"> Должность </th><th class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"> Посещаемость </th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"> Дата зачисления </th></tr></thead><tbody class="divide-y divide-gray-200 dark:divide-gray-700"><!--[-->`);
          ssrRenderList(unref(paginatedStudents), (gs) => {
            _push(`<tr class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><td class="px-6 py-4 whitespace-nowrap"><div class="flex items-center gap-3"><div class="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success font-semibold">${ssrInterpolate(getInitials(gs.student?.fullName))}</div><span class="font-medium text-gray-900 dark:text-white truncate max-w-[200px]"${ssrRenderAttr("title", gs.student?.fullName)}>${ssrInterpolate(gs.student?.fullName)}</span></div></td><td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap"><span class="truncate max-w-[200px] inline-block"${ssrRenderAttr("title", gs.student?.organization)}>${ssrInterpolate(gs.student?.organization || "—")}</span></td><td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap"><span class="truncate max-w-[180px] inline-block"${ssrRenderAttr("title", gs.student?.position)}>${ssrInterpolate(gs.student?.position || "—")}</span></td><td class="px-6 py-4 text-center whitespace-nowrap"><span class="${ssrRenderClass([getAttendanceColorClass(getStudentAttendance(gs.studentId)), "inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium"])}">${ssrInterpolate(getStudentAttendance(gs.studentId).toFixed(0))}% </span></td><td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">${ssrInterpolate(formatDate(gs.enrolledAt))}</td></tr>`);
          });
          _push(`<!--]--></tbody></table></div><div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4"><div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"><span>Показать:</span><select class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"><option${ssrRenderAttr("value", 10)}${ssrIncludeBooleanAttr(Array.isArray(unref(studentsPerPage)) ? ssrLooseContain(unref(studentsPerPage), 10) : ssrLooseEqual(unref(studentsPerPage), 10)) ? " selected" : ""}>10</option><option${ssrRenderAttr("value", 20)}${ssrIncludeBooleanAttr(Array.isArray(unref(studentsPerPage)) ? ssrLooseContain(unref(studentsPerPage), 20) : ssrLooseEqual(unref(studentsPerPage), 20)) ? " selected" : ""}>20</option><option${ssrRenderAttr("value", 50)}${ssrIncludeBooleanAttr(Array.isArray(unref(studentsPerPage)) ? ssrLooseContain(unref(studentsPerPage), 50) : ssrLooseEqual(unref(studentsPerPage), 50)) ? " selected" : ""}>50</option></select><span>записей</span></div><div class="flex items-center gap-2"><span class="text-sm text-gray-500 dark:text-gray-400">${ssrInterpolate(unref(paginationInfo))}</span></div><div class="flex items-center gap-1"><button${ssrIncludeBooleanAttr(unref(currentStudentsPage) === 1) ? " disabled" : ""} class="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path></svg></button><button${ssrIncludeBooleanAttr(unref(currentStudentsPage) === 1) ? " disabled" : ""} class="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg></button><!--[-->`);
          ssrRenderList(unref(visiblePages), (page) => {
            _push(`<!--[-->`);
            if (page !== "...") {
              _push(`<button class="${ssrRenderClass([
                "px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors",
                page === unref(currentStudentsPage) ? "bg-primary text-white border-primary" : "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              ])}">${ssrInterpolate(page)}</button>`);
            } else {
              _push(`<span class="px-2 text-gray-400">...</span>`);
            }
            _push(`<!--]-->`);
          });
          _push(`<!--]--><button${ssrIncludeBooleanAttr(unref(currentStudentsPage) === unref(totalStudentsPages)) ? " disabled" : ""} class="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></button><button${ssrIncludeBooleanAttr(unref(currentStudentsPage) === unref(totalStudentsPages)) ? " disabled" : ""} class="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg></button></div></div><!--]-->`);
        }
        _push(`</div><div class="rounded-xl bg-white dark:bg-boxdark shadow-md overflow-hidden"><button class="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><div class="flex items-center gap-3"><div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div><div class="text-left"><h3 class="text-lg font-semibold text-black dark:text-white">Расписание занятий</h3><p class="text-sm text-gray-500 dark:text-gray-400">${ssrInterpolate(unref(scheduleEvents).length)} запланировано</p></div></div><div class="flex items-center gap-4">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/schedule",
          class: "text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1",
          onClick: () => {
          }
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Открыть расписание <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"${_scopeId}></path></svg>`);
            } else {
              return [
                createTextVNode(" Открыть расписание "),
                (openBlock(), createBlock("svg", {
                  class: "w-4 h-4",
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24"
                }, [
                  createVNode("path", {
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                    "stroke-width": "2",
                    d: "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  })
                ]))
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<svg class="${ssrRenderClass([{ "rotate-180": unref(scheduleExpanded) }, "w-5 h-5 text-gray-500 transition-transform duration-200"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></div></button><div class="overflow-hidden border-t border-gray-200 dark:border-gray-700" style="${ssrRenderStyle(unref(scheduleExpanded) ? null : { display: "none" })}">`);
        if (unref(loadingSchedule)) {
          _push(`<div class="p-12 text-center"><div class="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div><p class="mt-2 text-gray-500 dark:text-gray-400">Загрузка расписания...</p></div>`);
        } else if (unref(scheduleEvents).length === 0) {
          _push(`<div class="p-12 text-center text-gray-500 dark:text-gray-400"><svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><p class="mt-4">Занятия не запланированы</p>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/schedule",
            class: "inline-block mt-4 text-primary hover:underline"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` Добавить занятие `);
              } else {
                return [
                  createTextVNode(" Добавить занятие ")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`</div>`);
        } else {
          _push(`<div class="divide-y divide-gray-200 dark:divide-gray-700"><!--[-->`);
          ssrRenderList(unref(scheduleEvents).slice(0, 10), (event) => {
            _push(`<div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><div class="flex items-start gap-4"><div class="shrink-0 w-16 text-center"><div class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(new Date(event.startTime).getDate())}</div><div class="text-xs text-gray-500 dark:text-gray-400 uppercase">${ssrInterpolate(new Date(event.startTime).toLocaleDateString("ru-RU", { month: "short" }))}</div></div><div class="flex-1 min-w-0"><div class="flex items-center gap-2 mb-1"><span class="${ssrRenderClass([{
              "bg-primary": event.color === "primary",
              "bg-success": event.color === "success",
              "bg-warning": event.color === "warning",
              "bg-danger": event.color === "danger"
            }, "inline-block w-3 h-3 rounded-full"])}"></span><h4 class="font-medium text-black dark:text-white truncate">${ssrInterpolate(event.title)}</h4></div><div class="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400"><span class="flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ${ssrInterpolate(formatTime(event.startTime))} - ${ssrInterpolate(formatTime(event.endTime))}</span>`);
            if (event.classroom) {
              _push(`<span class="flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg> ${ssrInterpolate(event.classroom.name)}</span>`);
            } else {
              _push(`<!---->`);
            }
            if (event.instructor) {
              _push(`<span class="flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg> ${ssrInterpolate(event.instructor.fullName)}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div><span class="${ssrRenderClass([{
              "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400": event.eventType === "theory",
              "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400": event.eventType === "practice",
              "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400": event.eventType === "assessment",
              "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300": event.eventType === "other"
            }, "inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium"])}">${ssrInterpolate(eventTypeLabels[event.eventType])}</span></div></div></div>`);
          });
          _push(`<!--]-->`);
          if (unref(scheduleEvents).length > 10) {
            _push(`<div class="p-4 text-center">`);
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: `/schedule?groupId=${unref(group)?.id}`,
              class: "text-primary hover:underline text-sm font-medium"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(` Показать все ${ssrInterpolate(unref(scheduleEvents).length)} занятий → `);
                } else {
                  return [
                    createTextVNode(" Показать все " + toDisplayString(unref(scheduleEvents).length) + " занятий → ", 1)
                  ];
                }
              }),
              _: 1
            }, _parent));
            _push(`</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        }
        _push(`</div></div><!--]-->`);
      }
      _push(ssrRenderComponent(_component_GroupsGroupFormModal, {
        "is-open": unref(showEditModal),
        group: unref(group),
        onClose: ($event) => showEditModal.value = false,
        onUpdated: handleGroupUpdated
      }, null, _parent));
      _push(ssrRenderComponent(_component_GroupsManageStudentsModal, {
        "is-open": unref(showManageStudentsModal),
        group: unref(group),
        onClose: ($event) => showManageStudentsModal.value = false,
        onUpdated: loadGroup
      }, null, _parent));
      _push(ssrRenderComponent(_component_UiConfirmModal, {
        "is-open": unref(showDeleteModal),
        title: "Удаление группы",
        message: "Вы уверены, что хотите удалить эту группу?",
        "item-name": unref(group)?.code,
        warning: "Все слушатели будут удалены из этой группы. Это действие нельзя отменить.",
        loading: unref(isDeleting),
        onConfirm: deleteGroup,
        onCancel: ($event) => showDeleteModal.value = false
      }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/groups/[id]/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-N2YtvEOs.mjs.map
