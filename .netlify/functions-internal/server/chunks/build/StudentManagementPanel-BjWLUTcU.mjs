import { _ as __nuxt_component_0$1 } from './nuxt-link-BHRIAP0y.mjs';
import { _ as __nuxt_component_1 } from './Button-DE8MjHjS.mjs';
import { defineComponent, ref, computed, mergeProps, withCtx, createBlock, createTextVNode, openBlock, createVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrRenderList, ssrRenderClass } from 'vue/server-renderer';
import { d as useRouter } from './server.mjs';
import { _ as __nuxt_component_2$2, a as __nuxt_component_3 } from './StudentCertificatesModal-B7TOFcV4.mjs';
import { _ as __nuxt_component_3$1 } from './ConfirmModal-GQ4JU241.mjs';
import { u as useAuthFetch } from './useAuthFetch-CmGEBSSi.mjs';
import { u as useNotification } from './useNotification-C2RwAN1X.mjs';

const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "StudentTable",
  __ssrInlineRender: true,
  props: {
    students: {},
    loading: { type: Boolean }
  },
  emits: ["edit", "delete", "view-certificates"],
  setup(__props) {
    useRouter();
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
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "overflow-x-auto" }, _attrs))}><table class="w-full table-auto"><thead><tr class="bg-gray-2 text-left dark:bg-meta-4"><th class="min-w-[250px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11"> Ф.И.О </th><th class="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white"> Организация </th><th class="min-w-[180px] px-4 py-4 font-medium text-black dark:text-white"> Должность </th><th class="px-4 py-4 font-medium text-black dark:text-white text-center"> Действия </th></tr></thead><tbody>`);
      if (__props.loading) {
        _push(`<tr><td colspan="4" class="text-center py-12"><div class="flex justify-center items-center"><div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div><span class="ml-3 text-gray-600 dark:text-gray-400">Загрузка...</span></div></td></tr>`);
      } else if (__props.students.length === 0) {
        _push(`<tr><td colspan="4" class="text-center py-12"><p class="text-gray-600 dark:text-gray-400">Студенты не найдены</p></td></tr>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--[-->`);
      ssrRenderList(__props.students, (student) => {
        _push(`<tr class="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors cursor-pointer"><td class="px-4 py-5 pl-9 xl:pl-11"><div class="flex items-center gap-3"><div class="flex-shrink-0"><div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"><span class="text-primary font-medium text-lg">${ssrInterpolate(getInitials(student.fullName))}</span></div></div><div><h5 class="font-medium text-black dark:text-white">${ssrInterpolate(student.fullName)}</h5><p class="text-sm text-gray-600 dark:text-gray-400"> ПИНФЛ: ${ssrInterpolate(student.pinfl)}</p></div></div></td><td class="px-4 py-5"><p class="text-black dark:text-white">${ssrInterpolate(student.organization)}</p></td><td class="px-4 py-5"><p class="text-black dark:text-white">${ssrInterpolate(student.position)}</p></td><td class="px-4 py-5"><div class="flex items-center justify-center gap-2">`);
        _push(ssrRenderComponent(_component_UiButton, {
          variant: "primary",
          size: "sm",
          onClick: ($event) => _ctx.$emit("edit", student),
          title: "Редактировать"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"${_scopeId}></path></svg>`);
            } else {
              return [
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
                    d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  })
                ]))
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(ssrRenderComponent(_component_UiButton, {
          variant: "danger",
          size: "sm",
          onClick: ($event) => _ctx.$emit("delete", student.id),
          title: "Удалить"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16"${_scopeId}></path></svg>`);
            } else {
              return [
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
                    d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16"
                  })
                ]))
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(`</div></td></tr>`);
      });
      _push(`<!--]--></tbody></table></div>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/database/StudentTable.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_2$1 = Object.assign(_sfc_main$2, { __name: "DatabaseStudentTable" });
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "Pagination",
  __ssrInlineRender: true,
  props: {
    currentPage: {},
    totalPages: {},
    total: {},
    limit: {},
    loading: { type: Boolean, default: false },
    limitOptions: { default: () => [10, 25, 50, 100] }
  },
  emits: ["update:page", "update:limit"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const from = computed(() => {
      if (props.total === 0) return 0;
      return (props.currentPage - 1) * props.limit + 1;
    });
    const to = computed(() => {
      return Math.min(props.currentPage * props.limit, props.total);
    });
    const visiblePages = computed(() => {
      const pages = [];
      const total = props.totalPages;
      const current = props.currentPage;
      const delta = 2;
      if (total <= 7) {
        for (let i = 1; i <= total; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        if (current > delta + 2) {
          pages.push("...");
        }
        for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
          pages.push(i);
        }
        if (current < total - delta - 1) {
          pages.push("...");
        }
        pages.push(total);
      }
      return pages;
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t border-stroke dark:border-strokedark" }, _attrs))}><div class="text-sm text-gray-600 dark:text-gray-400"> Показано <span class="font-medium text-black dark:text-white">${ssrInterpolate(from.value)}</span> — <span class="font-medium text-black dark:text-white">${ssrInterpolate(to.value)}</span> из <span class="font-medium text-black dark:text-white">${ssrInterpolate(__props.total)}</span> записей </div><div class="flex items-center gap-2"><button${ssrIncludeBooleanAttr(__props.currentPage === 1 || __props.loading) ? " disabled" : ""} class="${ssrRenderClass([[
        __props.currentPage === 1 ? "text-gray-400 dark:text-gray-600" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-meta-4"
      ], "p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"])}" title="Первая страница"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path></svg></button><button${ssrIncludeBooleanAttr(__props.currentPage === 1 || __props.loading) ? " disabled" : ""} class="${ssrRenderClass([[
        __props.currentPage === 1 ? "text-gray-400 dark:text-gray-600" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-meta-4"
      ], "p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"])}" title="Предыдущая страница"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg></button><div class="flex items-center gap-1"><!--[-->`);
      ssrRenderList(visiblePages.value, (page) => {
        _push(`<!--[-->`);
        if (page !== "...") {
          _push(`<button${ssrIncludeBooleanAttr(__props.loading) ? " disabled" : ""} class="${ssrRenderClass([[
            __props.currentPage === page ? "bg-primary text-white shadow-md" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-meta-4"
          ], "min-w-[40px] h-10 px-3 rounded-lg text-sm font-medium transition-all duration-200"])}">${ssrInterpolate(page)}</button>`);
        } else {
          _push(`<span class="min-w-[40px] h-10 px-3 flex items-center justify-center text-gray-400 dark:text-gray-600"> ⋯ </span>`);
        }
        _push(`<!--]-->`);
      });
      _push(`<!--]--></div><button${ssrIncludeBooleanAttr(__props.currentPage === __props.totalPages || __props.loading) ? " disabled" : ""} class="${ssrRenderClass([[
        __props.currentPage === __props.totalPages ? "text-gray-400 dark:text-gray-600" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-meta-4"
      ], "p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"])}" title="Следующая страница"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></button><button${ssrIncludeBooleanAttr(__props.currentPage === __props.totalPages || __props.loading) ? " disabled" : ""} class="${ssrRenderClass([[
        __props.currentPage === __props.totalPages ? "text-gray-400 dark:text-gray-600" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-meta-4"
      ], "p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"])}" title="Последняя страница"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg></button></div><div class="flex items-center gap-2"><label class="text-sm text-gray-600 dark:text-gray-400"> На странице: </label><select${ssrRenderAttr("value", __props.limit)}${ssrIncludeBooleanAttr(__props.loading) ? " disabled" : ""} class="rounded-lg border border-stroke bg-transparent py-2 px-3 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"><!--[-->`);
      ssrRenderList(__props.limitOptions, (option) => {
        _push(`<option${ssrRenderAttr("value", option)}>${ssrInterpolate(option)}</option>`);
      });
      _push(`<!--]--></select></div></div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ui/Pagination.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_2 = Object.assign(_sfc_main$1, { __name: "UiPagination" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "StudentManagementPanel",
  __ssrInlineRender: true,
  setup(__props) {
    const { authFetch } = useAuthFetch();
    const students = ref([]);
    const loading = ref(false);
    const isFormModalOpen = ref(false);
    const isCertificatesModalOpen = ref(false);
    const isDeleteModalOpen = ref(false);
    const isDeleting = ref(false);
    const selectedStudent = ref(null);
    const deleteStudent = ref(null);
    const pagination = ref({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    });
    const filters = ref({
      fullName: "",
      pinfl: "",
      organization: "",
      position: "",
      hasCertificates: false,
      noCertificates: false
    });
    const hasActiveFilters = computed(() => {
      return filters.value.fullName !== "" || filters.value.pinfl !== "" || filters.value.organization !== "" || filters.value.position !== "" || filters.value.hasCertificates || filters.value.noCertificates;
    });
    const handlePageChange = (page) => {
      pagination.value.page = page;
      fetchStudents();
    };
    const handleLimitChange = (limit) => {
      pagination.value.limit = limit;
      pagination.value.page = 1;
      fetchStudents();
    };
    const fetchStudents = async () => {
      loading.value = true;
      try {
        const params = new URLSearchParams();
        params.append("page", pagination.value.page.toString());
        params.append("limit", pagination.value.limit.toString());
        if (filters.value.fullName) {
          params.append("fullName", filters.value.fullName);
        }
        if (filters.value.pinfl) {
          params.append("pinfl", filters.value.pinfl);
        }
        if (filters.value.organization) {
          params.append("organization", filters.value.organization);
        }
        if (filters.value.position) {
          params.append("position", filters.value.position);
        }
        if (filters.value.hasCertificates) {
          params.append("hasCertificates", "true");
        }
        if (filters.value.noCertificates) {
          params.append("noCertificates", "true");
        }
        const response = await authFetch(
          `/api/students?${params.toString()}`,
          {
            method: "GET"
          }
        );
        if (response.success) {
          students.value = response.students;
          pagination.value.total = response.total;
          pagination.value.totalPages = response.totalPages;
          pagination.value.page = response.page;
          pagination.value.limit = response.limit;
        }
      } catch (error) {
        console.error("Ошибка загрузки студентов:", error);
      } finally {
        loading.value = false;
      }
    };
    const refreshStudent = async (studentId) => {
      try {
        const response = await authFetch(
          `/api/students/${studentId}`,
          {
            method: "GET"
          }
        );
        if (response.success) {
          const index = students.value.findIndex((s) => s.id === studentId);
          if (index !== -1) {
            students.value[index] = response.student;
            if (selectedStudent.value?.id === studentId) {
              selectedStudent.value = response.student;
            }
          }
        }
      } catch (error) {
        console.error("Ошибка обновления студента:", error);
      }
    };
    const openCreateModal = () => {
      selectedStudent.value = null;
      isFormModalOpen.value = true;
    };
    const openEditModal = (student) => {
      selectedStudent.value = student;
      isFormModalOpen.value = true;
    };
    const closeFormModal = () => {
      isFormModalOpen.value = false;
      selectedStudent.value = null;
    };
    const openCertificatesModal = (student) => {
      selectedStudent.value = student;
      isCertificatesModalOpen.value = true;
    };
    const closeCertificatesModal = () => {
      isCertificatesModalOpen.value = false;
      selectedStudent.value = null;
    };
    const openDeleteModal = (studentId) => {
      const student = students.value.find((s) => s.id === studentId);
      if (student) {
        deleteStudent.value = student;
        isDeleteModalOpen.value = true;
      }
    };
    const closeDeleteModal = () => {
      if (!isDeleting.value) {
        isDeleteModalOpen.value = false;
        deleteStudent.value = null;
      }
    };
    const confirmDelete = async () => {
      if (!deleteStudent.value) return;
      isDeleting.value = true;
      try {
        const response = await authFetch(
          `/api/students/${deleteStudent.value.id}`,
          {
            method: "DELETE"
          }
        );
        if (response.success) {
          await fetchStudents();
          closeDeleteModal();
        }
      } catch (error) {
        console.error("Ошибка удаления студента:", error);
      } finally {
        isDeleting.value = false;
      }
    };
    const handleCertificatesRefresh = () => {
      if (selectedStudent.value) {
        refreshStudent(selectedStudent.value.id);
      }
    };
    const handleSubmit = async (data) => {
      try {
        if (selectedStudent.value) {
          const response = await authFetch(
            `/api/students/${selectedStudent.value.id}`,
            {
              method: "PUT",
              body: data
            }
          );
          if (response.success) {
            const index = students.value.findIndex((s) => s.id === selectedStudent.value.id);
            if (index !== -1) {
              students.value[index] = response.student;
            }
            const notification = useNotification();
            notification.success("Студент успешно обновлен", "Успех");
            closeFormModal();
          }
        } else {
          const response = await authFetch("/api/students", {
            method: "POST",
            body: data
          });
          if (response.success) {
            await fetchStudents();
            const notification = useNotification();
            if (response.generatedPassword && response.accountEmail) {
              notification.success(
                `Учётная запись создана!
Email: ${response.accountEmail}
Пароль: ${response.generatedPassword}`,
                "Студент и аккаунт созданы",
                1e4
                // Показываем дольше для копирования
              );
            } else if (data.createAccount) {
              notification.success("Студент и учётная запись успешно созданы", "Успех");
            } else {
              notification.success("Студент успешно создан", "Успех");
            }
            closeFormModal();
          }
        }
      } catch (error) {
        console.error("Ошибка сохранения студента:", error);
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$1;
      const _component_UiButton = __nuxt_component_1;
      const _component_DatabaseStudentTable = __nuxt_component_2$1;
      const _component_UiPagination = __nuxt_component_2;
      const _component_DatabaseStudentFormModal = __nuxt_component_2$2;
      const _component_DatabaseStudentCertificatesModal = __nuxt_component_3;
      const _component_UiConfirmModal = __nuxt_component_3$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex flex-col gap-6" }, _attrs))}><div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 class="text-xl font-semibold text-black dark:text-white"> Управление студентами </h3><p class="mt-1 text-sm text-gray-600 dark:text-gray-400"> Всего студентов: ${ssrInterpolate(pagination.value.total)} `);
      if (hasActiveFilters.value) {
        _push(`<span class="text-primary"> (отфильтровано) </span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</p></div><div class="flex flex-wrap items-center gap-3">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/database/import",
        class: "inline-flex items-center gap-2 rounded-lg border-2 border-primary bg-transparent px-4 py-2 text-sm font-medium text-primary transition-all duration-200 hover:bg-primary hover:text-white"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"${_scopeId}></path></svg> Импорт студентов `);
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
                  d: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                })
              ])),
              createTextVNode(" Импорт студентов ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_UiButton, {
        variant: "primary",
        onClick: openCreateModal,
        class: "flex items-center gap-2"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"${_scopeId}></path></svg> Добавить студента `);
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
              createTextVNode(" Добавить студента ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div><div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6"><div class="flex items-center gap-3 mb-4"><div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg></div><h4 class="text-lg font-semibold text-black dark:text-white">Фильтры</h4>`);
      if (hasActiveFilters.value) {
        _push(`<button class="ml-auto text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg> Сбросить фильтры </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Поиск по ФИО </label><div class="relative"><input${ssrRenderAttr("value", filters.value.fullName)} type="text" placeholder="Введите имя..." class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"><svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></div></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Поиск по ПИНФЛ </label><div class="relative"><input${ssrRenderAttr("value", filters.value.pinfl)} type="text" placeholder="Введите ПИНФЛ..." class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"><svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path></svg></div></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Организация </label><div class="relative"><input${ssrRenderAttr("value", filters.value.organization)} type="text" placeholder="Введите организацию..." class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"><svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg></div></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Должность </label><div class="relative"><input${ssrRenderAttr("value", filters.value.position)} type="text" placeholder="Введите должность..." class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"><svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg></div></div></div><div class="mt-4 flex flex-wrap gap-3"><label class="inline-flex items-center gap-2 cursor-pointer"><input${ssrIncludeBooleanAttr(Array.isArray(filters.value.hasCertificates) ? ssrLooseContain(filters.value.hasCertificates, null) : filters.value.hasCertificates) ? " checked" : ""} type="checkbox" class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"><span class="text-sm text-gray-700 dark:text-gray-300">Только с сертификатами</span></label><label class="inline-flex items-center gap-2 cursor-pointer"><input${ssrIncludeBooleanAttr(Array.isArray(filters.value.noCertificates) ? ssrLooseContain(filters.value.noCertificates, null) : filters.value.noCertificates) ? " checked" : ""} type="checkbox" class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"><span class="text-sm text-gray-700 dark:text-gray-300">Только без сертификатов</span></label></div></div><div class="bg-white dark:bg-boxdark rounded-xl shadow-md overflow-hidden">`);
      _push(ssrRenderComponent(_component_DatabaseStudentTable, {
        students: students.value,
        loading: loading.value,
        onEdit: openEditModal,
        onDelete: openDeleteModal,
        onViewCertificates: openCertificatesModal
      }, null, _parent));
      if (pagination.value.totalPages > 0) {
        _push(ssrRenderComponent(_component_UiPagination, {
          "current-page": pagination.value.page,
          "total-pages": pagination.value.totalPages,
          total: pagination.value.total,
          limit: pagination.value.limit,
          loading: loading.value,
          "onUpdate:page": handlePageChange,
          "onUpdate:limit": handleLimitChange
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (isFormModalOpen.value) {
        _push(ssrRenderComponent(_component_DatabaseStudentFormModal, {
          student: selectedStudent.value,
          "is-open": isFormModalOpen.value,
          onClose: closeFormModal,
          onSubmit: handleSubmit
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (isCertificatesModalOpen.value) {
        _push(ssrRenderComponent(_component_DatabaseStudentCertificatesModal, {
          student: selectedStudent.value,
          "is-open": isCertificatesModalOpen.value,
          onClose: closeCertificatesModal,
          onRefresh: handleCertificatesRefresh
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_component_UiConfirmModal, {
        "is-open": isDeleteModalOpen.value,
        title: "Удаление студента",
        message: "Вы уверены, что хотите удалить этого студента?",
        "item-name": deleteStudent.value?.fullName,
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/database/StudentManagementPanel.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_0 = Object.assign(_sfc_main, { __name: "DatabaseStudentManagementPanel" });

export { __nuxt_component_0 as _, __nuxt_component_2 as a };
//# sourceMappingURL=StudentManagementPanel-BjWLUTcU.mjs.map
