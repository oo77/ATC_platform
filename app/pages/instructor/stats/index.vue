<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <div
      class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <h2 class="text-title-md2 font-bold text-black dark:text-white">
        Моя статистика
      </h2>
      <nav>
        <ol class="flex items-center gap-2">
          <li>
            <NuxtLink class="font-medium" to="/">Главная /</NuxtLink>
          </li>
          <li class="font-medium text-primary">Статистика</li>
        </ol>
      </nav>
    </div>

    <div v-if="!isAuthenticated" class="text-center py-20">
      <p>Пожалуйста, войдите в систему.</p>
    </div>

    <div v-else-if="loading" class="flex justify-center py-20">
      <div
        class="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"
      ></div>
    </div>

    <div v-else-if="!isInstructor" class="text-center py-20">
      <div
        class="mx-auto mb-4 h-16 w-16 rounded-full bg-danger/10 flex items-center justify-center"
      >
        <svg
          class="h-8 w-8 text-danger"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 class="text-xl font-bold text-black dark:text-white mb-2">
        Нет доступа
      </h3>
      <p class="text-gray-500">Ваш аккаунт не связан с профилем инструктора.</p>
    </div>

    <div v-else>
      <!-- Tabs -->
      <div
        class="mb-6 flex flex-wrap gap-5 border-b border-stroke dark:border-strokedark sm:gap-10"
      >
        <button
          @click="activeTab = 'hours'"
          class="border-b-2 py-4 text-sm font-medium hover:text-primary md:text-base transition-colors"
          :class="
            activeTab === 'hours'
              ? 'border-primary text-primary'
              : 'border-transparent text-body-color dark:text-bodydark'
          "
        >
          Отчётность по часам
        </button>
        <button
          @click="activeTab = 'history'"
          class="border-b-2 py-4 text-sm font-medium hover:text-primary md:text-base transition-colors"
          :class="
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-body-color dark:text-bodydark'
          "
        >
          История курсов
        </button>
      </div>

      <!-- Content -->
      <div v-show="activeTab === 'hours'">
        <InstructorsHoursStats
          v-if="instructorId"
          :instructor-id="instructorId"
          :initial-load="true"
          ref="hoursStatsRef"
        />
      </div>

      <div v-show="activeTab === 'history'">
        <InstructorsCourseHistory
          v-if="instructorId"
          :instructor-id="instructorId"
          :initial-load="true"
          ref="courseHistoryRef"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import InstructorsHoursStats from "~/components/instructors/HoursStats.vue";
import InstructorsCourseHistory from "~/components/instructors/CourseHistory.vue";

definePageMeta({
  layout: "default",
});

useHead({
  title: "Моя статистика | ATC Platform",
});

const { user, isAuthenticated, hasRole } = useAuth();
const loading = ref(true);
const activeTab = ref("hours");

// Computed property to get instructor ID safely
const instructorId = computed(() => user.value?.instructorId);
const isInstructor = computed(
  () => !!instructorId.value && hasRole(["TEACHER", "ADMIN", "MANAGER"]),
); // Admin/Manager with linked instructor profile can also see this

onMounted(async () => {
  // Check auth and role
  // user is usually already loaded by middleware/plugin, but just in case
  if (!user.value) {
    // Should be handled by middleware, but good for safety
  }
  loading.value = false;
});
</script>
