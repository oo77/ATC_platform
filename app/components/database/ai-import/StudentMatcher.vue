<template>
  <div
    class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
  >
    <div class="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
      <h3 class="font-medium text-black dark:text-white">Поиск слушателя</h3>
    </div>

    <div class="p-6.5">
      <!-- Search Input (Compact) -->
      <div class="relative mb-6">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск по ФИО или ПИНФЛ..."
          class="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-4 pr-10 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary text-sm"
          @input="handleSearch"
        />
        <span class="absolute right-3 top-2.5 text-gray-400">
          <svg
            v-if="!isSearching"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <svg
            v-else
            class="h-5 w-5 animate-spin text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </span>
      </div>

      <!-- Candidates List -->
      <div v-if="displayCandidates.length > 0">
        <h4
          class="mb-4 text-sm font-semibold text-black dark:text-white flex items-center justify-between"
        >
          <span>{{
            isSearching || searchQuery
              ? "Результаты поиска:"
              : "Топ-5 кандидатов:"
          }}</span>
          <span class="text-xs font-normal text-gray-500">Уверенность AI</span>
        </h4>

        <div class="flex flex-col gap-3">
          <div
            v-for="(student, index) in displayCandidates"
            :key="student.id"
            class="group relative flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-4 transition-all hover:shadow-md dark:hover:bg-meta-4"
            :class="
              modelValue?.id === student.id
                ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary'
                : 'border-stroke bg-white dark:border-strokedark dark:bg-boxdark'
            "
            @click="selectStudent(student)"
          >
            <!-- Left Side: Rank & Name -->
            <div class="flex items-center gap-4 overflow-hidden">
              <!-- Rank Badge -->
              <div
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors"
                :class="
                  index === 0 && !searchQuery
                    ? 'bg-success/10 text-success'
                    : 'bg-gray-100 text-gray-500 dark:bg-meta-4 dark:text-gray-400'
                "
              >
                {{ index + 1 }}
              </div>

              <!-- Name Info -->
              <div class="flex flex-col overflow-hidden">
                <span
                  class="truncate text-lg font-medium text-black dark:text-white"
                >
                  <!-- Highlight Surname (First Word) -->
                  <span class="font-bold">{{
                    getSurname(student.fullName)
                  }}</span>
                  <span class="opacity-70 font-normal">
                    {{ getRestOfName(student.fullName) }}</span
                  >
                </span>

                <span class="truncate text-xs text-gray-500 dark:text-gray-400">
                  {{ student.organization }}
                  {{ student.position ? `— ${student.position}` : "" }}
                </span>

                <!-- Debug info (hidden by default, uncomment if needed) -->
                <!-- <span v-if="student.matchDebug" class="text-[10px] text-gray-400 font-mono mt-0.5">{{ student.matchDebug }}</span> -->
              </div>
            </div>

            <!-- Right Side: Percentage & Select -->
            <div class="flex items-center gap-4 shrink-0">
              <!-- Percentage Score -->
              <div
                v-if="student.matchScore !== undefined"
                class="flex items-center gap-1.5 rounded-full px-3 py-1 font-bold text-sm"
                :class="getScoreColorClass(student.matchScore)"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {{ Math.round(student.matchScore * 100) }}%
              </div>

              <!-- Checkmark for Selected -->
              <div
                class="flex h-6 w-6 items-center justify-center rounded-full border transition-all"
                :class="
                  modelValue?.id === student.id
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-300 dark:border-gray-600 opacity-0 group-hover:opacity-100'
                "
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2.5"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="searchQuery && !isSearching"
        class="flex flex-col items-center justify-center py-10 text-gray-500"
      >
        <svg
          class="w-12 h-12 mb-3 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z"
          />
        </svg>
        <p class="text-sm font-medium">Ничего не найдено</p>
        <p class="text-xs opacity-70">Попробуйте изменить запрос</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { StudentMatchResult } from "~/../server/types/aiCertificateImport";
import type { Student } from "~/../server/types/student";
import { useAICertificateImport } from "~/composables/useAICertificateImport";

// Define an extended type for local usage since we know we added these fields
interface StudentWithMatchInfo extends Student {
  matchScore?: number;
  matchDebug?: string;
}

const props = defineProps<{
  modelValue: Student | null;
  matchResult: StudentMatchResult | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", student: Student): void;
}>();

const { searchStudents } = useAICertificateImport();

const searchQuery = ref("");
const searchResults = ref<StudentWithMatchInfo[]>([]);
const isSearching = ref(false);
const hasSearched = ref(false);
let searchTimeout: any = null;

const displayCandidates = computed<StudentWithMatchInfo[]>(() => {
  if (searchQuery.value.length > 0) {
    return searchResults.value;
  }

  const list: StudentWithMatchInfo[] = [];
  if (props.matchResult?.student) {
    list.push(props.matchResult.student as StudentWithMatchInfo);
  }
  if (props.matchResult?.alternatives) {
    list.push(...(props.matchResult.alternatives as StudentWithMatchInfo[]));
  }
  return list;
});

// Helpers for UI
const getSurname = (fullName: string) => {
  if (!fullName) return "";
  return fullName.trim().split(" ")[0];
};

const getRestOfName = (fullName: string) => {
  if (!fullName) return "";
  const parts = fullName.trim().split(" ");
  return parts.slice(1).join(" ");
};

const getScoreColorClass = (score: number) => {
  if (score >= 0.9)
    return "bg-success/10 text-success border border-success/20";
  if (score >= 0.7)
    return "bg-primary/10 text-primary border border-primary/20";
  if (score >= 0.5)
    return "bg-warning/10 text-warning border border-warning/20";
  return "bg-danger/10 text-danger border border-danger/20";
};

const formatScore = (score: number | undefined) => {
  if (score === undefined) return "—";
  return score.toFixed(2);
};

const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout);

  if (searchQuery.value.length < 2) {
    searchResults.value = [];
    hasSearched.value = false;
    return;
  }

  isSearching.value = true;
  searchTimeout = setTimeout(async () => {
    try {
      const results = await searchStudents(searchQuery.value);
      searchResults.value = results as StudentWithMatchInfo[];
      hasSearched.value = true;
    } finally {
      isSearching.value = false;
    }
  }, 500);
};

const selectStudent = (student: Student) => {
  emit("update:modelValue", student);
};
</script>
