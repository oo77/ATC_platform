<template>
  <div class="mx-auto max-w-screen-2xl space-y-6">
    <Suspense>
      <component :is="activeDashboardComponent" />
      <template #fallback>
        <div class="space-y-4">
          <div class="h-24 rounded-2xl bg-white/80 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900/70 dark:ring-slate-800 skeleton" />
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div
              v-for="i in 4"
              :key="`dashboard-skeleton-card-${i}`"
              class="h-28 rounded-2xl bg-white/80 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900/70 dark:ring-slate-800 skeleton"
            />
          </div>
        </div>
      </template>
    </Suspense>
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

const DashboardStudentAsync = defineAsyncComponent(() => import("~/components/dashboard/Student.vue"));
const DashboardTeacherAsync = defineAsyncComponent(() => import("~/components/dashboard/Teacher.vue"));
const DashboardManagerAsync = defineAsyncComponent(() => import("~/components/dashboard/Manager.vue"));
const DashboardAdminAsync = defineAsyncComponent(() => import("~/components/dashboard/Admin.vue"));
const DashboardFallback = defineComponent({
  name: "DashboardFallback",
  setup() {
    return () =>
      h("div", { class: "rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70" }, [
        h("h1", { class: "text-xl font-bold text-slate-900 dark:text-white" }, "Панель управления"),
        h("p", { class: "mt-2 text-sm text-slate-600 dark:text-slate-300" }, "Для вашей роли пока не настроен отдельный дашборд."),
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

