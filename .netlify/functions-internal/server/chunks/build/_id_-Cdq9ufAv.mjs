import { _ as __nuxt_component_0 } from './nuxt-link-BHRIAP0y.mjs';
import { _ as __nuxt_component_1 } from './Button-DE8MjHjS.mjs';
import { _ as __nuxt_component_2 } from './CreateDisciplineModal-CkB6K1Pj.mjs';
import { defineComponent, ref, computed, mergeProps, unref, withCtx, createBlock, createTextVNode, openBlock, createVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrRenderClass, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList } from 'vue/server-renderer';
import { u as useHead, c as useRoute, d as useRouter } from './server.mjs';
import { u as useAuthFetch } from './useAuthFetch-CmGEBSSi.mjs';
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
import './Modal-DQYphXo7.mjs';
import './useNotification-C2RwAN1X.mjs';
import './Notification-Bd1V2gNg.mjs';
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
    useHead({
      title: "Редактирование программы - АТЦ Платформа"
    });
    const route = useRoute();
    useRouter();
    const id = route.params.id;
    const { authFetch } = useAuthFetch();
    const pageLoading = ref(true);
    const pageError = ref(null);
    const loading = ref(false);
    const certificateTemplates = ref([]);
    const instructors = ref([]);
    const isDisciplineModalOpen = ref(false);
    const editingDisciplineIndex = ref(null);
    const editingDiscipline = ref(void 0);
    const formData = ref({
      name: "",
      shortName: "",
      code: "",
      description: "",
      certificateTemplateId: void 0,
      certificateValidityMonths: void 0,
      isActive: true,
      disciplines: []
    });
    const errors = ref({});
    const totalHours = computed(() => {
      return formData.value.disciplines.reduce((sum, d) => {
        return sum + (d.theoryHours || 0) + (d.practiceHours || 0) + (d.assessmentHours || 0);
      }, 0);
    });
    const getDisciplineTotal = (discipline) => {
      return (discipline.theoryHours || 0) + (discipline.practiceHours || 0) + (discipline.assessmentHours || 0);
    };
    const instructorOptions = computed(() => {
      return instructors.value.map((instructor) => ({
        id: instructor.id,
        label: instructor.fullName,
        description: instructor.email
      }));
    });
    const loadCourse = async () => {
      pageLoading.value = true;
      pageError.value = null;
      try {
        const response = await authFetch(
          `/api/courses/${id}`,
          { method: "GET" }
        );
        if (response.success && response.course) {
          const course = response.course;
          formData.value = {
            name: course.name,
            shortName: course.shortName,
            code: course.code,
            description: course.description || "",
            certificateTemplateId: course.certificateTemplateId,
            certificateValidityMonths: course.certificateValidityMonths || void 0,
            isActive: course.isActive,
            disciplines: (course.disciplines || []).map((d, index) => ({
              id: d.id,
              name: d.name,
              description: d.description || "",
              theoryHours: d.theoryHours || 0,
              practiceHours: d.practiceHours || 0,
              assessmentHours: d.assessmentHours || 0,
              orderIndex: d.orderIndex ?? index,
              instructorIds: d.instructors?.map((di) => di.instructorId) || []
            }))
          };
        } else {
          pageError.value = response.message || "Не удалось загрузить данные учебной программы";
        }
      } catch (err) {
        console.error("Error loading course:", err);
        pageError.value = err.data?.message || err.message || "Не удалось загрузить данные учебной программы";
      } finally {
        pageLoading.value = false;
      }
    };
    const addDiscipline = () => {
      editingDisciplineIndex.value = null;
      editingDiscipline.value = void 0;
      isDisciplineModalOpen.value = true;
    };
    const closeDisciplineModal = () => {
      isDisciplineModalOpen.value = false;
      editingDisciplineIndex.value = null;
      editingDiscipline.value = void 0;
    };
    const handleDisciplineSave = (discipline) => {
      if (editingDisciplineIndex.value !== null) {
        const existingDiscipline = formData.value.disciplines[editingDisciplineIndex.value];
        const existingId = existingDiscipline?.id;
        formData.value.disciplines[editingDisciplineIndex.value] = {
          ...discipline,
          id: existingId,
          orderIndex: editingDisciplineIndex.value
        };
      } else {
        formData.value.disciplines.push({
          ...discipline,
          orderIndex: formData.value.disciplines.length
        });
      }
      closeDisciplineModal();
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_UiButton = __nuxt_component_1;
      const _component_ProgramsCreateDisciplineModal = __nuxt_component_2;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6"><div class="flex items-center gap-3 mb-4">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: `/programs/${unref(id)}`,
        class: "flex items-center gap-2 text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"${_scopeId}></path></svg> Назад к программе `);
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
                  d: "M15 19l-7-7 7-7"
                })
              ])),
              createTextVNode(" Назад к программе ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><h2 class="text-title-md2 font-bold text-black dark:text-white"> Редактирование учебной программы </h2><p class="mt-2 text-sm text-gray-600 dark:text-gray-400"> Внесите изменения в информацию о курсе и дисциплинах </p></div>`);
      if (unref(pageLoading)) {
        _push(`<div class="flex justify-center items-center py-20"><div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div></div>`);
      } else if (unref(pageError)) {
        _push(`<div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-8"><div class="text-center"><div class="mx-auto mb-4 h-16 w-16 rounded-full bg-danger/10 flex items-center justify-center"><svg class="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><h3 class="mb-2 text-xl font-semibold text-black dark:text-white">Ошибка загрузки</h3><p class="text-gray-600 dark:text-gray-400 mb-4">${ssrInterpolate(unref(pageError))}</p>`);
        _push(ssrRenderComponent(_component_UiButton, {
          variant: "primary",
          onClick: loadCourse
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
        _push(`</div></div>`);
      } else {
        _push(`<form class="space-y-6"><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md"><h3 class="text-lg font-semibold text-black dark:text-white mb-4"> Основная информация </h3><div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div class="md:col-span-2"><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Название курса <span class="text-danger">*</span></label><input${ssrRenderAttr("value", unref(formData).name)} type="text" placeholder="Например: Основы программирования на Python" class="${ssrRenderClass([{ "border-danger": unref(errors).name }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"])}" required>`);
        if (unref(errors).name) {
          _push(`<p class="mt-1 text-sm text-danger">${ssrInterpolate(unref(errors).name)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Короткое название <span class="text-danger">*</span></label><input${ssrRenderAttr("value", unref(formData).shortName)} type="text" placeholder="PYTHON" maxlength="10" class="${ssrRenderClass([{ "border-danger": unref(errors).shortName }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary uppercase"])}" required><p class="mt-1 text-xs text-gray-500 dark:text-gray-400">4-10 заглавных букв</p>`);
        if (unref(errors).shortName) {
          _push(`<p class="mt-1 text-sm text-danger">${ssrInterpolate(unref(errors).shortName)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Код курса <span class="text-danger">*</span></label><input${ssrRenderAttr("value", unref(formData).code)} type="text" placeholder="2400001" class="${ssrRenderClass([{ "border-danger": unref(errors).code }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"])}" required>`);
        if (unref(errors).code) {
          _push(`<p class="mt-1 text-sm text-danger">${ssrInterpolate(unref(errors).code)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Шаблон сертификата </label><select class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"><option${ssrRenderAttr("value", void 0)}${ssrIncludeBooleanAttr(Array.isArray(unref(formData).certificateTemplateId) ? ssrLooseContain(unref(formData).certificateTemplateId, void 0) : ssrLooseEqual(unref(formData).certificateTemplateId, void 0)) ? " selected" : ""}>Не выбран</option><!--[-->`);
        ssrRenderList(unref(certificateTemplates), (template) => {
          _push(`<option${ssrRenderAttr("value", template.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(formData).certificateTemplateId) ? ssrLooseContain(unref(formData).certificateTemplateId, template.id) : ssrLooseEqual(unref(formData).certificateTemplateId, template.id)) ? " selected" : ""}>${ssrInterpolate(template.name)}</option>`);
        });
        _push(`<!--]--></select></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Срок действия сертификата </label><div class="flex items-center gap-3"><input${ssrRenderAttr("value", unref(formData).certificateValidityMonths)} type="number" min="1" max="120" placeholder="Не ограничен" class="w-40 rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"><span class="text-sm text-gray-500 dark:text-gray-400">месяцев</span></div><p class="mt-1 text-xs text-gray-500 dark:text-gray-400"> Оставьте пустым для бессрочных сертификатов </p></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Статус </label><div class="flex items-center gap-3"><label class="inline-flex items-center cursor-pointer"><input${ssrIncludeBooleanAttr(Array.isArray(unref(formData).isActive) ? ssrLooseContain(unref(formData).isActive, null) : unref(formData).isActive) ? " checked" : ""} type="checkbox" class="sr-only peer"><div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[&#39;&#39;] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div><span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">${ssrInterpolate(unref(formData).isActive ? "Активен" : "Неактивен")}</span></label></div></div><div class="md:col-span-2"><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Описание </label><textarea rows="4" placeholder="Краткое описание курса..." class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary">${ssrInterpolate(unref(formData).description)}</textarea></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md"><div class="flex items-center justify-between mb-4"><div><h3 class="text-lg font-semibold text-black dark:text-white"> Дисциплины курса </h3><p class="mt-1 text-sm text-gray-600 dark:text-gray-400"> Всего часов: ${ssrInterpolate(unref(totalHours))}</p></div>`);
        _push(ssrRenderComponent(_component_UiButton, {
          type: "button",
          onClick: addDiscipline,
          class: "flex items-center gap-2"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"${_scopeId}></path></svg> Добавить дисциплину `);
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
                    d: "M12 4v16m8-8H4"
                  })
                ])),
                createTextVNode(" Добавить дисциплину ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
        if (unref(formData).disciplines.length === 0) {
          _push(`<div class="text-center py-8 text-gray-500 dark:text-gray-400"><svg class="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg><p>Дисциплины не добавлены</p><p class="text-sm mt-1">Нажмите &quot;Добавить дисциплину&quot; чтобы начать</p></div>`);
        } else {
          _push(`<div class="space-y-3"><!--[-->`);
          ssrRenderList(unref(formData).disciplines, (discipline, index) => {
            _push(`<div class="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary/50 transition-colors"><div class="flex items-center gap-3 flex-1"><div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">${ssrInterpolate(index + 1)}</div><div class="flex-1"><div class="flex items-center gap-2"><h4 class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(discipline.name)}</h4>`);
            if (discipline.id) {
              _push(`<span class="text-xs text-gray-400">(существующая)</span>`);
            } else {
              _push(`<span class="text-xs text-success">(новая)</span>`);
            }
            _push(`</div><div class="flex items-center gap-3 mt-1"><span class="text-xs text-gray-500 dark:text-gray-400"> Теория: ${ssrInterpolate(discipline.theoryHours)}ч | Практика: ${ssrInterpolate(discipline.practiceHours)}ч | Проверка: ${ssrInterpolate(discipline.assessmentHours)}ч </span><span class="text-xs font-semibold text-primary"> Всего: ${ssrInterpolate(getDisciplineTotal(discipline))}ч </span></div></div></div><div class="flex items-center gap-2"><button type="button" class="p-2 text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors" title="Редактировать"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button><button type="button" class="p-2 text-danger hover:text-danger/80 transition-colors" title="Удалить"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></div></div>`);
          });
          _push(`<!--]--></div>`);
        }
        _push(`</div><div class="flex items-center justify-end gap-4">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/programs/${unref(id)}`
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_component_UiButton, { variant: "danger" }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(` Отмена `);
                  } else {
                    return [
                      createTextVNode(" Отмена ")
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
            } else {
              return [
                createVNode(_component_UiButton, { variant: "danger" }, {
                  default: withCtx(() => [
                    createTextVNode(" Отмена ")
                  ]),
                  _: 1
                })
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(_component_UiButton, {
          type: "submit",
          variant: "success",
          loading: unref(loading)
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Сохранить изменения `);
            } else {
              return [
                createTextVNode(" Сохранить изменения ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></form>`);
      }
      _push(ssrRenderComponent(_component_ProgramsCreateDisciplineModal, {
        "is-open": unref(isDisciplineModalOpen),
        discipline: unref(editingDiscipline),
        "instructor-options": unref(instructorOptions),
        onClose: closeDisciplineModal,
        onSave: handleDisciplineSave
      }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/programs/edit/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_id_-Cdq9ufAv.mjs.map
