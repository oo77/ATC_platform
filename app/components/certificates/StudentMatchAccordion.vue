<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h5 class="text-sm font-semibold text-slate-800 dark:text-white">
        Выбор слушателя
      </h5>
      <span v-if="selectedStudent" class="text-xs text-emerald-500 font-medium flex items-center gap-1">
        <CheckCircle2 class="w-3.5 h-3.5" /> Выбран
      </span>
    </div>

    <!-- Top Matches -->
    <div
      v-if="
        matchResult?.topAlternatives && matchResult.topAlternatives.length > 0
      "
      class="space-y-2"
    >
      <div
        v-for="(alternative, index) in matchResult.topAlternatives"
        :key="alternative.student.id"
        @click="selectStudent(alternative.student)"
        :class="[
          'relative rounded-xl border-2 transition-all duration-200 cursor-pointer overflow-hidden',
          isSelected(alternative.student.id)
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 shadow-sm'
            : 'border-slate-200 dark:border-slate-700/50 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xs',
        ]"
      >
        <div class="p-4">
          <div class="flex items-start gap-4">
            <!-- Radio Button -->
            <div class="shrink-0 pt-1">
              <div
                :class="[
                  'h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all',
                  isSelected(alternative.student.id)
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-slate-300 dark:border-slate-600',
                ]"
              >
                <div
                  v-if="isSelected(alternative.student.id)"
                  class="h-2 w-2 rounded-full bg-white"
                ></div>
              </div>
            </div>

            <!-- Student Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <!-- Name with Rank Badge -->
                  <div class="flex items-center gap-2 mb-2.5">
                    <span
                      :class="[
                        'inline-flex items-center justify-center h-6 w-6 rounded-lg text-xs font-bold leading-none',
                        index === 0
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                          : index === 1
                            ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            : 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50',
                      ]"
                    >
                      {{ index + 1 }}
                    </span>
                    <h6
                      class="text-sm font-bold text-slate-900 dark:text-white truncate"
                    >
                      {{ alternative.student.fullName }}
                    </h6>
                  </div>

                  <!-- Additional Info -->
                  <div class="space-y-1.5">
                    <div
                      v-if="alternative.student.pinfl"
                      class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/50 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 inline-flex w-fit"
                    >
                      <IdCard class="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span class="truncate font-medium">ПИНФЛ: {{ alternative.student.pinfl }}</span>
                    </div>

                    <div
                      v-if="alternative.student.organization"
                      class="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400"
                    >
                      <Building2 class="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span class="truncate">{{ alternative.student.organization }}</span>
                    </div>

                    <div
                      v-if="alternative.student.department"
                      class="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400"
                    >
                      <Briefcase class="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span class="truncate">{{ alternative.student.department }}</span>
                    </div>

                    <div
                      v-if="alternative.student.email"
                      class="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400"
                    >
                      <Mail class="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span class="truncate">{{ alternative.student.email }}</span>
                    </div>
                  </div>
                </div>

                <!-- Match Score -->
                <div class="shrink-0 text-right">
                  <div
                    :class="[
                      'text-2xl font-black tracking-tight',
                      getScoreColor(alternative.matchScore),
                    ]"
                  >
                    {{ alternative.matchScore }}%
                  </div>
                  <div class="text-[10px] uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">
                    совпадение
                  </div>
                </div>
              </div>

              <!-- Match Score Progress Bar -->
              <div class="mt-4">
                <div
                  class="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
                >
                  <div
                    :class="[
                      'h-full transition-all duration-500 ease-out rounded-full',
                      getScoreBarColor(alternative.matchScore),
                    ]"
                    :style="{ width: `${alternative.matchScore}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Selected Indicator -->
        <div
          v-if="isSelected(alternative.student.id)"
          class="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider"
        >
          Выбран
        </div>
      </div>
    </div>

    <!-- No Matches Found -->
    <div
      v-else-if="
        matchResult &&
        (!matchResult.topAlternatives ||
          matchResult.topAlternatives.length === 0)
      "
      class="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-8 text-center bg-slate-50/50 dark:bg-slate-900/30"
    >
      <div class="flex flex-col items-center">
        <div
          class="h-14 w-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-700 shadow-sm"
        >
          <SearchX class="h-6 w-6 text-slate-400" />
        </div>
        <h6 class="text-base font-bold text-slate-900 dark:text-white mb-1.5">
          Совпадений не найдено
        </h6>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">
          В базе данных нет подходящих слушателей
        </p>
        <button
          @click="$emit('create-new')"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
        >
          <Plus class="h-4 w-4" />
          Создать слушателя
        </button>
      </div>
    </div>

    <!-- Create New Student Option -->
    <div
      v-if="
        matchResult?.topAlternatives && matchResult.topAlternatives.length > 0
      "
      class="pt-3 border-t border-slate-100 dark:border-slate-800"
    >
      <button
        @click="$emit('create-new')"
        class="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
      >
        <Plus class="h-4 w-4" />
        Создать нового слушателя
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { CheckCircle2, IdCard, Building2, Briefcase, Mail, SearchX, Plus } from "lucide-vue-next";

const props = defineProps({
  fileId: {
    type: String,
    required: true,
  },
  matchResult: {
    type: Object,
    default: null,
  },
  selectedStudent: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["select", "create-new"]);

// Methods
const isSelected = (studentId) => {
  return props.selectedStudent?.id === studentId;
};

const selectStudent = (student) => {
  emit("select", student);
};

const getScoreColor = (score) => {
  if (score >= 90) return "text-success";
  if (score >= 70) return "text-primary";
  if (score >= 50) return "text-warning";
  return "text-danger";
};

const getScoreBarColor = (score) => {
  if (score >= 90) return "bg-success";
  if (score >= 70) return "bg-primary";
  if (score >= 50) return "bg-warning";
  return "bg-danger";
};
</script>

<style scoped>
/* Анимация для выбранного элемента */
@keyframes pulse-border {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0);
  }
}

.border-primary {
  animation: pulse-border 2s infinite;
}
</style>
