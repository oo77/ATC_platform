<template>
  <!-- Обёртка без двойного отступа: внешние отступы даёт layout -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!--
      Дашборд зависит от роли и данных пользователя (имя, дата, статистика) — на сервере они
      отличаются от клиентских. Рассогласование гидратации оставляло серверные узлы в DOM,
      и после перехода на другую страницу блоки дашборда «торчали» под её содержимым.
      Поэтому дашборд рендерится только на клиенте, а на сервере показывается скелетон.
    -->
    <ClientOnly>
      <Suspense>
        <component :is="activeDashboardComponent" />
        <template #fallback>
          <DashboardSkeleton />
        </template>
      </Suspense>
      <template #fallback>
        <DashboardSkeleton />
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, defineComponent, h } from "vue";
import { usePermissions } from '~/composables/usePermissions';

definePageMeta({
  layout: 'default',
  title: 'Панель управления'
})

useHead({
  title: 'Панель управления'
})

const { isStudent, isTeacher, isManager, isAdmin } = usePermissions();

// Скелетон дашборда: единая нейтральная палитра gray, без теней (редизайн)
const DashboardSkeleton = defineComponent({
  name: "DashboardSkeleton",
  setup() {
    const card = (cls: string, key: string) =>
      h("div", { key, class: `${cls} rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] skeleton` });
    return () =>
      h("div", { class: "space-y-4" }, [
        card("h-24", "hero"),
        h(
          "div",
          { class: "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" },
          [1, 2, 3, 4].map((i) => card("h-28", `dashboard-skeleton-card-${i}`)),
        ),
      ]);
  },
});

const DashboardStudentAsync = defineAsyncComponent(() => import("~/components/dashboard/Student.vue"));
const DashboardTeacherAsync = defineAsyncComponent(() => import("~/components/dashboard/Teacher.vue"));
const DashboardManagerAsync = defineAsyncComponent(() => import("~/components/dashboard/Manager.vue"));
const DashboardAdminAsync = defineAsyncComponent(() => import("~/components/dashboard/Admin.vue"));
const DashboardFallback = defineComponent({
  name: "DashboardFallback",
  setup() {
    return () =>
      // Презентационно: карточка и заголовок приведены к общей системе (gray, font-semibold)
      h("div", { class: "rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]" }, [
        h("h1", { class: "text-2xl font-semibold text-gray-900 dark:text-white" }, "Панель управления"),
        h("p", { class: "mt-2 text-sm text-gray-600 dark:text-gray-300" }, "Для вашей роли пока не настроен отдельный дашборд."),
      ]);
  },
});

const activeDashboardComponent = computed(() => {
  if (isStudent.value) return DashboardStudentAsync;
  if (isTeacher.value) return DashboardTeacherAsync;
  if (isManager.value) return DashboardManagerAsync;
  if (isAdmin.value) return DashboardAdminAsync;
  return DashboardFallback;
});
</script>

<style scoped>
.skeleton {
  position: relative;
  overflow: hidden;
}

.skeleton::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.18), transparent);
  animation: shimmer 1.2s infinite;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>

