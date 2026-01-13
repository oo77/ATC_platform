<template>
  <UiModal
    :is-open="isOpen"
    :title="isEditMode ? 'Редактировать занятие' : 'Добавить занятие'"
    size="xl"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Ряд 1: Группа + Дисциплина -->
      <div class="grid grid-cols-2 gap-4">
        <!-- Группа -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Группа <span class="text-danger">*</span>
            </label>
            <span
              v-if="selectedGroupInfo"
              class="text-xs text-primary font-medium"
            >
              {{ formatDateShort(selectedGroupInfo.startDate) }} –
              {{ formatDateShort(selectedGroupInfo.endDate) }}
            </span>
          </div>
          <div class="relative">
            <select
              v-model="form.groupId"
              @change="handleGroupChange"
              class="w-full rounded-lg border border-stroke bg-transparent py-2.5 pl-3 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none text-sm"
              :class="{ 'border-danger': errors.groupId }"
            >
              <option value="">Выберите группу</option>
              <option v-for="group in groups" :key="group.id" :value="group.id">
                {{ group.code }} — {{ group.courseName }}
              </option>
            </select>
            <svg
              class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
          <p v-if="errors.groupId" class="mt-1 text-xs text-danger">
            {{ errors.groupId }}
          </p>
        </div>

        <!-- Дисциплина -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Дисциплина <span class="text-danger">*</span>
          </label>
          <div class="relative">
            <select
              v-model="form.disciplineId"
              @change="handleDisciplineChange"
              :disabled="!form.groupId || loadingDisciplines"
              class="w-full rounded-lg border border-stroke bg-transparent py-2.5 pl-3 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              :class="{ 'border-danger': errors.disciplineId }"
            >
              <option value="">
                {{
                  !form.groupId
                    ? "Сначала выберите группу"
                    : "Выберите дисциплину"
                }}
              </option>
              <option
                v-for="discipline in disciplines"
                :key="discipline.id"
                :value="discipline.id"
              >
                {{ discipline.name }}
              </option>
            </select>
            <svg
              v-if="!loadingDisciplines"
              class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
            <div v-else class="absolute right-3 top-1/2 -translate-y-1/2">
              <div
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"
              ></div>
            </div>
          </div>
          <p v-if="errors.disciplineId" class="mt-1 text-xs text-danger">
            {{ errors.disciplineId }}
          </p>
        </div>
      </div>

      <!-- Информация о часах (компактная) -->
      <div
        v-if="selectedDiscipline"
        class="flex items-center gap-4 p-2 bg-gray-50 dark:bg-meta-4 rounded-lg text-xs"
      >
        <span class="text-gray-500 dark:text-gray-400">Осталось:</span>
        <span :class="getHoursClass('theory')"
          >Теория: {{ selectedDiscipline.remainingHours.theory }}/{{
            selectedDiscipline.totalHours.theory
          }}ч</span
        >
        <span :class="getHoursClass('practice')"
          >Практика: {{ selectedDiscipline.remainingHours.practice }}/{{
            selectedDiscipline.totalHours.practice
          }}ч</span
        >
        <span :class="getHoursClass('assessment')"
          >Проверка: {{ selectedDiscipline.remainingHours.assessment }}/{{
            selectedDiscipline.totalHours.assessment
          }}ч</span
        >
      </div>

      <!-- Ряд 2: Инструктор + Тип + Цвет -->
      <div class="grid grid-cols-3 gap-4">
        <!-- Инструктор -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Инструктор <span class="text-danger">*</span>
          </label>
          <div class="relative">
            <select
              v-model="form.instructorId"
              :disabled="!form.disciplineId"
              class="w-full rounded-lg border border-stroke bg-transparent py-2.5 pl-3 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              :class="{ 'border-danger': errors.instructorId }"
            >
              <option value="">
                {{ !form.disciplineId ? "Сначала дисциплину" : "Выберите" }}
              </option>
              <option
                v-for="instructor in disciplineInstructors"
                :key="instructor.id"
                :value="instructor.id"
              >
                {{ instructor.fullName }}{{ instructor.isPrimary ? " ★" : "" }}
              </option>
            </select>
            <svg
              class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
          <p v-if="errors.instructorId" class="mt-1 text-xs text-danger">
            {{ errors.instructorId }}
          </p>
        </div>

        <!-- Тип занятия -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Тип <span class="text-danger">*</span>
          </label>
          <div class="relative">
            <select
              v-model="form.eventType"
              @change="handleEventTypeChange"
              class="w-full rounded-lg border border-stroke bg-transparent py-2.5 pl-3 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none text-sm"
            >
              <option value="theory">Теория</option>
              <option value="practice">Практика</option>
              <option value="assessment">Проверка знаний</option>
            </select>
            <svg
              class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        <!-- Цвет -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >Цвет</label
          >
          <div class="flex gap-2 py-1.5">
            <button
              v-for="color in colorOptions"
              :key="color.value"
              type="button"
              @click="form.color = color.value"
              class="w-7 h-7 rounded-full transition-transform hover:scale-110"
              :class="[
                color.bg,
                form.color === color.value
                  ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-boxdark'
                  : '',
              ]"
              :title="color.label"
            />
          </div>
        </div>
      </div>

      <!-- Секция выбора теста (при типе assessment) -->
      <div
        v-if="form.eventType === 'assessment'"
        class="rounded-lg border border-primary/30 bg-primary/5 p-4"
      >
        <div class="flex items-center gap-2 mb-3">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"
          >
            <svg
              class="w-4 h-4 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <div>
            <h4 class="text-sm font-medium text-gray-900 dark:text-white">
              Тестирование
            </h4>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Выберите тест для проведения контроля знаний
            </p>
          </div>
        </div>

        <div class="relative">
          <select
            v-model="form.testTemplateId"
            class="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary text-sm"
            :disabled="loadingTemplates"
          >
            <option value="">Без теста (только запись в расписании)</option>
            <option
              v-for="template in allTestTemplates"
              :key="template.id"
              :value="template.id"
            >
              {{ template.name }} ({{ template.code }})
            </option>
          </select>
          <div
            v-if="loadingTemplates"
            class="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <div
              class="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
            ></div>
          </div>
        </div>

        <!-- Ограничение доступа (Пересдача) -->
        <div
          v-if="form.testTemplateId"
          class="mt-4 border-t border-primary/20 pt-4"
        >
          <div class="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="isRetakeCheckbox"
              :checked="isRetake"
              @change="handleRetakeToggle"
              class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label
              for="isRetakeCheckbox"
              class="text-sm font-medium text-gray-700 dark:text-gray-300 select-none cursor-pointer"
            >
              Ограничить доступ (режим пересдачи)
            </label>
          </div>

          <div v-if="isRetake" class="pl-6">
            <p class="text-xs text-gray-500 mb-2">
              Выберите студентов, которым будет доступен этот тест. Остальные
              студенты группы не увидят это назначение.
            </p>
            <UiMultiSelect
              v-model="form.allowedStudentIds"
              :options="groupStudents"
              placeholder="Выберите студентов..."
              label="Студенты"
            />
            <div v-if="loadingStudents" class="text-xs text-primary mt-1">
              Загрузка списка студентов...
            </div>
          </div>
        </div>

        <p v-if="!form.testTemplateId" class="mt-2 text-xs text-warning">
          Внимание: Тест не выбран. Студенты не смогут пройти тестирование
          онлайн.
        </p>
      </div>

      <!-- Ряд 3: Дата + Аудитория -->
      <div class="grid grid-cols-2 gap-4">
        <!-- Дата -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Дата <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.date"
            type="date"
            :min="!isRetake ? selectedGroupInfo?.startDate : undefined"
            :max="!isRetake ? selectedGroupInfo?.endDate : undefined"
            class="w-full rounded-lg border border-stroke bg-transparent py-2.5 px-3 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary text-sm"
            :class="{ 'border-danger': errors.date }"
          />
          <p v-if="errors.date" class="mt-1 text-xs text-danger">
            {{ errors.date }}
          </p>
        </div>

        <!-- Аудитория -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >Аудитория</label
          >
          <div class="relative">
            <select
              v-model="form.classroomId"
              class="w-full rounded-lg border border-stroke bg-transparent py-2.5 pl-3 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none text-sm"
            >
              <option value="">Не выбрана</option>
              <option
                v-for="classroom in classrooms"
                :key="classroom.id"
                :value="classroom.id"
              >
                {{ classroom.name }} ({{ classroom.capacity }} мест)
              </option>
            </select>
            <svg
              class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      <!-- Время занятия -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Время <span class="text-danger">*</span>
          </label>
          <div
            class="flex rounded-lg border border-stroke dark:border-strokedark overflow-hidden"
          >
            <button
              type="button"
              @click="timeMode = 'pairs'"
              class="px-3 py-1 text-xs font-medium transition-colors"
              :class="[
                timeMode === 'pairs'
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-boxdark text-gray-700 dark:text-gray-300',
              ]"
            >
              По а-ч
            </button>
            <button
              type="button"
              @click="timeMode = 'exact'"
              class="px-3 py-1 text-xs font-medium transition-colors"
              :class="[
                timeMode === 'exact'
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-boxdark text-gray-700 dark:text-gray-300',
              ]"
            >
              Точное
            </button>
          </div>
        </div>

        <!-- Режим: Пары (компактный) -->
        <div v-if="timeMode === 'pairs'">
          <div class="grid grid-cols-4 gap-1.5">
            <label
              v-for="pair in lessonPairs"
              :key="pair.number"
              class="relative flex items-center justify-center p-2 rounded-lg border cursor-pointer transition-all text-center"
              :class="[
                selectedPairs.includes(pair.number)
                  ? 'border-primary bg-primary/10'
                  : 'border-stroke dark:border-strokedark hover:border-primary/50',
              ]"
            >
              <input
                type="checkbox"
                :value="pair.number"
                v-model="selectedPairs"
                @change="handlePairChange"
                class="sr-only"
              />
              <div>
                <div class="text-xs font-medium">{{ pair.number }} а-ч</div>
                <div class="text-[10px] text-gray-500">
                  {{ pair.startTime }}-{{ pair.endTime }}
                </div>
              </div>
              <div
                v-if="selectedPairs.includes(pair.number)"
                class="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center"
              >
                <svg
                  class="w-2 h-2 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="3"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </label>
          </div>
          <div
            v-if="selectedPairs.length > 0"
            class="mt-2 p-2 bg-success/10 rounded text-xs"
          >
            <span class="font-medium">Выбрано:</span>
            {{ selectedPairs.length }}
            {{ getAcademicHourWord(selectedPairs.length) }} •
            {{ computedTimeRange }}
            <span v-if="hasNonConsecutivePairs" class="text-warning ml-2"
              >(будет создано {{ consecutiveGroups.length }} занятия)</span
            >
          </div>
        </div>

        <!-- Режим: Точное время -->
        <div v-else class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-gray-500 mb-1">Начало</label>
            <input
              v-model="form.startTime"
              type="time"
              class="w-full rounded-lg border border-stroke bg-transparent py-2.5 px-3 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 text-sm"
              :class="{ 'border-danger': errors.startTime }"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Окончание</label>
            <input
              v-model="form.endTime"
              type="time"
              class="w-full rounded-lg border border-stroke bg-transparent py-2.5 px-3 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 text-sm"
              :class="{ 'border-danger': errors.endTime }"
            />
          </div>
        </div>

        <p
          v-if="errors.time || errors.startTime || errors.endTime"
          class="mt-1 text-xs text-danger"
        >
          {{ errors.time || errors.startTime || errors.endTime }}
        </p>

        <!-- Предупреждение о превышении часов -->
        <div
          v-if="hoursWarning"
          class="mt-2 p-2 bg-warning/10 rounded-lg border border-warning/30 flex items-start gap-2"
        >
          <svg
            class="w-4 h-4 text-warning shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p class="text-xs text-warning">{{ hoursWarning }}</p>
        </div>

        <!-- Предупреждение о превышении лимита часов инструктора -->
        <div
          v-if="instructorHoursWarning"
          class="mt-2 p-2 bg-danger/10 rounded-lg border border-danger/30 flex items-start gap-2"
        >
          <svg
            class="w-4 h-4 text-danger shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <p class="text-xs text-danger font-medium">
              Лимит часов инструктора
            </p>
            <p class="text-xs text-danger">{{ instructorHoursWarning }}</p>
          </div>
        </div>

        <!-- Индикатор проверки лимита часов -->
        <div
          v-if="instructorHoursCheckLoading"
          class="mt-2 flex items-center gap-2 text-xs text-gray-500"
        >
          <div
            class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"
          ></div>
          <span>Проверка лимита часов инструктора...</span>
        </div>
      </div>

      <!-- Описание (компактное) -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >Заметки</label
        >
        <input
          v-model="form.description"
          type="text"
          class="w-full rounded-lg border border-stroke bg-transparent py-2.5 px-3 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 text-sm"
          placeholder="Доп. информация о занятии..."
        />
      </div>
    </form>

    <template #footer>
      <div class="flex justify-between items-center">
        <button
          v-if="isEditMode"
          type="button"
          @click="handleDelete"
          class="px-4 py-2 text-sm font-medium text-danger hover:text-danger/80 transition-colors flex items-center gap-2"
          :disabled="submitting"
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Удалить
        </button>
        <div v-else></div>

        <div class="flex gap-3">
          <UiButton
            variant="outline"
            @click="handleClose"
            :disabled="submitting"
          >
            Отмена
          </UiButton>
          <UiButton
            @click="handleSubmit"
            :disabled="submitting || !!hoursWarning || !!instructorHoursWarning"
          >
            <span v-if="submitting" class="flex items-center gap-2">
              <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
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
              Сохранение...
            </span>
            <span v-else>{{ isEditMode ? "Сохранить" : "Добавить" }}</span>
          </UiButton>
        </div>
      </div>
    </template>
  </UiModal>

  <!-- Модальное подтверждение удаления -->
  <UiConfirmModal
    :is-open="showDeleteConfirm"
    variant="danger"
    title="Удалить занятие?"
    :message="`Вы уверены, что хотите удалить это занятие?`"
    :warning="'Это действие нельзя отменить.'"
    confirm-text="Удалить"
    cancel-text="Отмена"
    :loading="deleting"
    @confirm="confirmDelete"
    @cancel="showDeleteConfirm = false"
  />
</template>

<script setup lang="ts">
import UiMultiSelect from "~/components/ui/MultiSelect.vue";
import type {
  ScheduleEvent,
  ScheduleEventColor,
  ScheduleEventType,
} from "~/types/schedule";
import {
  toLocalISOString,
  formatDateForDisplay,
  formatDateShort as formatDateShortUtil,
} from "~/utils/dateTime";

interface Group {
  id: string;
  code: string;
  courseName: string;
}

interface Discipline {
  id: string;
  courseId: string;
  name: string;
  description: string | null;
  orderIndex: number;
  totalHours: {
    theory: number;
    practice: number;
    assessment: number;
  };
  usedHours: {
    theory: number;
    practice: number;
    assessment: number;
  };
  remainingHours: {
    theory: number;
    practice: number;
    assessment: number;
  };
  instructors: Array<{
    id: string;
    fullName: string;
    email: string | null;
    isPrimary: boolean;
  }>;
}

interface GroupInfo {
  id: string;
  courseId: string;
  startDate: string;
  endDate: string;
}

interface Classroom {
  id: string;
  name: string;
  capacity: number;
}

interface Props {
  isOpen: boolean;
  event?: ScheduleEvent | null;
  defaultStart?: Date;
  defaultEnd?: Date;
}

const props = withDefaults(defineProps<Props>(), {
  event: null,
  defaultStart: undefined,
  defaultEnd: undefined,
});

const emit = defineEmits<{
  close: [];
  saved: [event: ScheduleEvent];
  deleted: [id: string];
}>();

const { authFetch } = useAuthFetch();
const notification = useNotification();

// ===================
// НАСТРОЙКИ РАСПИСАНИЯ (академические пары)
// ===================

const {
  periods,
  settings: scheduleSettings,
  loadSettings: loadScheduleSettings,
} = useScheduleSettings();

// ===================
// ДАННЫЕ ДЛЯ СЕЛЕКТОВ
// ===================

const groups = ref<Group[]>([]);
const disciplines = ref<Discipline[]>([]);
const classrooms = ref<Classroom[]>([]);
const selectedGroupInfo = ref<GroupInfo | null>(null);
const loadingDisciplines = ref(false);

// ===================
// ТЕСТЫ ДЛЯ ASSESSMENT
// ===================

interface TestTemplate {
  id: string;
  name: string;
  code: string;
}

const allTestTemplates = ref<TestTemplate[]>([]);
const loadingTemplates = ref(false);

const loadAllActiveTemplates = async () => {
  if (allTestTemplates.value.length > 0) return; // Уже загружено

  loadingTemplates.value = true;
  try {
    const response = await authFetch<{
      success: boolean;
      templates: TestTemplate[];
    }>("/api/test-bank/templates/select");
    if (response.success) {
      allTestTemplates.value = response.templates || [];
    }
  } catch (error) {
    console.error("Error loading test templates:", error);
  } finally {
    loadingTemplates.value = false;
  }
};

const loadCurrentAssignment = async (eventId: string) => {
  try {
    const response = await authFetch<{ success: boolean; assignment: any }>(
      `/api/tests/assignments/by-event/${eventId}`
    );
    if (response.success && response.assignment) {
      form.value.testTemplateId = response.assignment.test_template_id;

      // Handle allowed students (retake)
      if (
        response.assignment.allowed_student_ids &&
        response.assignment.allowed_student_ids.length > 0
      ) {
        isRetake.value = true;
        form.value.allowedStudentIds = response.assignment.allowed_student_ids;
        // We need to load students if not already loaded, but we don't know groupId yet purely from here (though we have props.event)
        // But initForm calls logic that eventually sets groupId.
        // We will handle student loading in initForm or watcher
      }
    }
  } catch (error) {
    console.error("Error loading current assignment:", error);
  }
};

// ===================
// ПАРЫ (LESSON PAIRS) - вычисляемое свойство из настроек
// ===================

const lessonPairs = computed(() => {
  return periods.value.map((p) => ({
    number: p.periodNumber,
    startTime: p.startTime,
    endTime: p.endTime,
    isAfterBreak: p.isAfterBreak,
  }));
});

const timeMode = ref<"pairs" | "exact">("pairs");
const selectedPairs = ref<number[]>([]);

// ===================
// RETAKE SYSTEM (STUDENTS)
// ===================

interface StudentOption {
  id: string;
  label: string;
}

const groupStudents = ref<StudentOption[]>([]);
const loadingStudents = ref(false);
const isRetake = ref(false);

const loadGroupStudents = async (groupId: string) => {
  if (!groupId) return;
  // Reset students if group changes, or if we're loading for a new group
  if (
    groupStudents.value.length > 0 &&
    groupStudents.value[0]?.groupId !== groupId
  ) {
    groupStudents.value = [];
  }
  if (groupStudents.value.length > 0) return; // Already loaded for this group

  loadingStudents.value = true;
  try {
    const response = await authFetch<{ success: boolean; group: any }>(
      `/api/groups/${groupId}`
    );
    if (response.success && response.group && response.group.students) {
      groupStudents.value = response.group.students.map((s: any) => ({
        id: s.student.id,
        label: s.student.fullName,
        groupId: groupId, // Add groupId to option for tracking
      }));
    }
  } catch (error) {
    console.error("Error loading students:", error);
  } finally {
    loadingStudents.value = false;
  }
};

const handleRetakeToggle = async () => {
  isRetake.value = !isRetake.value;
  if (isRetake.value && form.value.groupId) {
    await loadGroupStudents(form.value.groupId);
  } else if (!isRetake.value) {
    form.value.allowedStudentIds = [];
  }
};

// ===================
// ФОРМА
// ===================

const form = ref({
  groupId: "",
  disciplineId: "",
  instructorId: "",
  classroomId: "",
  eventType: "theory" as ScheduleEventType,
  color: "primary" as ScheduleEventColor,
  date: "",
  startTime: "",
  endTime: "",
  description: "",
  testTemplateId: "",
  allowedStudentIds: [] as string[],
});

const errors = ref<Record<string, string>>({});
const submitting = ref(false);
const showDeleteConfirm = ref(false);
const deleting = ref(false);
const hoursWarning = ref<string | null>(null);
const instructorHoursWarning = ref<string | null>(null);
const instructorHoursCheckLoading = ref(false);

// ===================
// COMPUTED
// ===================

const isEditMode = computed(() => !!props.event);

const selectedDiscipline = computed(() => {
  if (!form.value.disciplineId) return null;
  return (
    disciplines.value.find((d) => d.id === form.value.disciplineId) || null
  );
});

const disciplineInstructors = computed(() => {
  return selectedDiscipline.value?.instructors || [];
});

// Первый тест дисциплины (для автоматического режима)
// This computed property seems unused and related to a previous feature.
// Keeping it for now as per instruction to not make unrelated edits.
const disciplineTests = ref([]); // Assuming this was meant to be a ref
const loadingTests = ref(false); // Assuming this was meant to be a ref
const firstDisciplineTest = computed(() => {
  return disciplineTests.value.length > 0 ? disciplineTests.value[0] : null;
});

const computedTimeRange = computed(() => {
  if (selectedPairs.value.length === 0) return "";

  const sorted = [...selectedPairs.value].sort((a, b) => a - b);
  const first = lessonPairs.value.find((p) => p.number === sorted[0]);
  const last = lessonPairs.value.find(
    (p) => p.number === sorted[sorted.length - 1]
  );

  if (!first || !last) return "";
  return `${first.startTime} - ${last.endTime}`;
});

const computedDuration = computed(() => {
  // Получаем длительность пары из настроек (в минутах)
  const periodDurationMinutes = parseInt(
    scheduleSettings.value.period_duration_minutes || "40",
    10
  );

  if (timeMode.value === "pairs") {
    // Каждая пара = periodDurationMinutes минут
    // Переводим в академические часы (по 45 минут)
    const totalMinutes = selectedPairs.value.length * periodDurationMinutes;
    return Math.ceil(totalMinutes / 45);
  }

  if (!form.value.startTime || !form.value.endTime) return 0;

  const startParts = form.value.startTime.split(":").map(Number);
  const endParts = form.value.endTime.split(":").map(Number);

  const startH = startParts[0] ?? 0;
  const startM = startParts[1] ?? 0;
  const endH = endParts[0] ?? 0;
  const endM = endParts[1] ?? 0;

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (endMinutes <= startMinutes) return 0;

  // Переводим в академические часы (1 ак. час = 45 минут)
  return Math.ceil((endMinutes - startMinutes) / 45);
});

// ===================
// ОПЦИИ
// ===================

const colorOptions = [
  { value: "primary" as ScheduleEventColor, bg: "bg-primary", label: "Синий" },
  {
    value: "success" as ScheduleEventColor,
    bg: "bg-success",
    label: "Зелёный",
  },
  {
    value: "warning" as ScheduleEventColor,
    bg: "bg-warning",
    label: "Оранжевый",
  },
  { value: "danger" as ScheduleEventColor, bg: "bg-danger", label: "Красный" },
];

// ===================
// МЕТОДЫ
// ===================

const formatDate = (dateStr: string): string => {
  return formatDateForDisplay(dateStr);
};

// Короткий формат даты: 24.12.24
const formatDateShort = (dateStr: string): string => {
  return formatDateShortUtil(dateStr);
};

const getAcademicHourWord = (count: number): string => {
  if (count === 1) return "а-ч";
  return "а-ч";
};

// Склонение слова "тест"
const getTestWord = (count: number): string => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return "тестов";
  if (lastDigit === 1) return "тест";
  if (lastDigit >= 2 && lastDigit <= 4) return "теста";
  return "тестов";
};

// Группировка последовательных а-ч для создания отдельных занятий
const consecutiveGroups = computed(() => {
  if (selectedPairs.value.length === 0) return [];

  const sorted = [...selectedPairs.value].sort((a, b) => a - b);
  const groups: number[][] = [];

  // Гарантированно есть хотя бы один элемент после проверки выше
  const firstElement = sorted[0]!;
  let currentGroup: number[] = [firstElement];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]!;
    const previous = sorted[i - 1]!;

    // Проверяем, являются ли а-ч последовательными
    if (current === previous + 1) {
      currentGroup.push(current);
    } else {
      groups.push(currentGroup);
      currentGroup = [current];
    }
  }
  groups.push(currentGroup);

  return groups;
});

// Есть ли непоследовательные а-ч
const hasNonConsecutivePairs = computed(() => {
  return consecutiveGroups.value.length > 1;
});

const getHoursClass = (type: "theory" | "practice" | "assessment"): string => {
  if (!selectedDiscipline.value) return "bg-gray-100 dark:bg-boxdark";

  const remaining = selectedDiscipline.value.remainingHours[type];
  const total = selectedDiscipline.value.totalHours[type];

  if (total === 0) return "bg-gray-100 dark:bg-boxdark";
  if (remaining === 0) return "bg-danger/10 text-danger";
  if (remaining <= total * 0.2) return "bg-warning/10 text-warning";
  return "bg-success/10 text-success";
};

// Загрузка групп
const loadGroups = async () => {
  try {
    const response = await authFetch<{ success: boolean; groups: any[] }>(
      "/api/groups?limit=1000&isActive=true"
    );
    console.log("[EventModal] Ответ API groups:", response);

    if (response.success && response.groups) {
      // Логируем первую группу для понимания структуры
      if (response.groups.length > 0) {
        console.log(
          "[EventModal] Первая группа:",
          JSON.stringify(response.groups[0], null, 2)
        );
      }

      groups.value = response.groups.map((g) => ({
        id: g.id,
        code: g.code,
        // API возвращает course как объект с полем name
        courseName: g.course?.name || "",
      }));

      console.log("[EventModal] Загружено групп:", groups.value.length);
    }
  } catch (error) {
    console.error("[EventModal] Error loading groups:", error);
  }
};

// Загрузка аудиторий
const loadClassrooms = async () => {
  try {
    const response = await authFetch<{
      success: boolean;
      classrooms: Classroom[];
    }>("/api/classrooms");
    if (response.success) {
      classrooms.value = response.classrooms;
    }
  } catch (error) {
    console.error("Error loading classrooms:", error);
  }
};

// Загрузка дисциплин группы
// preserveSelection - если true, сохраняем текущие значения disciplineId и instructorId после загрузки
const loadGroupDisciplines = async (
  groupId: string,
  preserveSelection: boolean = false
) => {
  if (!groupId) {
    disciplines.value = [];
    selectedGroupInfo.value = null;
    return;
  }

  // Сохраняем текущие выбранные значения
  const savedDisciplineId = preserveSelection ? form.value.disciplineId : "";
  const savedInstructorId = preserveSelection ? form.value.instructorId : "";

  loadingDisciplines.value = true;
  try {
    const response = await authFetch<{
      success: boolean;
      disciplines: Discipline[];
      group: GroupInfo;
    }>(`/api/groups/${groupId}/disciplines`);

    if (response.success) {
      disciplines.value = response.disciplines;
      selectedGroupInfo.value = response.group;

      // Восстанавливаем выбранные значения, если они всё ещё валидны
      if (preserveSelection && savedDisciplineId) {
        const disciplineExists = disciplines.value.some(
          (d) => d.id === savedDisciplineId
        );
        if (disciplineExists) {
          form.value.disciplineId = savedDisciplineId;

          // Восстанавливаем инструктора
          if (savedInstructorId) {
            const discipline = disciplines.value.find(
              (d) => d.id === savedDisciplineId
            );
            const instructorExists = discipline?.instructors.some(
              (i) => i.id === savedInstructorId
            );
            if (instructorExists) {
              form.value.instructorId = savedInstructorId;
            }
          }

          // Загружаем тесты если тип события = assessment
          if (form.value.eventType === "assessment") {
            loadAllActiveTemplates();
          }

          // Запускаем валидацию часов после восстановления
          validateHours();
        }
      }
    }
  } catch (error) {
    console.error("Error loading group disciplines:", error);
    notification.show({
      type: "error",
      title: "Ошибка",
      message: "Не удалось загрузить дисциплины группы",
    });
  } finally {
    loadingDisciplines.value = false;
  }
};

// Обработчик смены группы
const handleGroupChange = () => {
  form.value.disciplineId = "";
  form.value.instructorId = "";
  disciplines.value = [];
  groupStudents.value = []; // Reset students
  isRetake.value = false;
  form.value.allowedStudentIds = [];

  if (form.value.groupId) {
    loadGroupDisciplines(form.value.groupId);
  } else {
    selectedGroupInfo.value = null;
  }

  validateHours();
};

// Обработчик смены дисциплины
const handleDisciplineChange = () => {
  form.value.instructorId = "";
  // disciplineTests.value = []; // This line was commented out in the original, keeping it that way.

  // Автовыбор основного инструктора
  if (selectedDiscipline.value?.instructors.length) {
    const primary = selectedDiscipline.value.instructors.find(
      (i) => i.isPrimary
    );
    if (primary) {
      form.value.instructorId = primary.id;
    }
  }

  // Загружаем тесты если тип = assessment
  // This logic is now handled by handleEventTypeChange or initForm

  validateHours();
};

// Загрузка тестов дисциплины
// This function seems unused and related to a previous feature.
// Keeping it for now as per instruction to not make unrelated edits.
const loadDisciplineTests = async (disciplineId: string) => {
  if (!disciplineId) {
    disciplineTests.value = [];
    return;
  }

  console.log("[EventModal] Загрузка тестов для дисциплины:", disciplineId);

  loadingTests.value = true;
  try {
    const response = await authFetch<{
      success: boolean;
      tests: any[]; // Changed from DisciplineTest[] to any[] as DisciplineTest is not defined
    }>(`/api/discipline-tests?discipline_id=${disciplineId}`);
    console.log("[EventModal] Ответ API discipline-tests:", response);

    if (response.success) {
      disciplineTests.value = response.tests || [];
      console.log(
        "[EventModal] Загружено тестов:",
        disciplineTests.value.length
      );
    }
  } catch (err) {
    console.error("[EventModal] Error loading discipline tests:", err);
    disciplineTests.value = [];
  } finally {
    loadingTests.value = false;
  }
};

// Обработчик смены типа события
const handleEventTypeChange = () => {
  // Загружаем шаблоны тестов если тип = assessment
  if (form.value.eventType === "assessment") {
    loadAllActiveTemplates();
  } else {
    form.value.testTemplateId = "";
    isRetake.value = false;
    form.value.allowedStudentIds = [];
  }

  validateHours();
};

// Обработчик выбора пар
const handlePairChange = () => {
  // Сортируем выбранные пары
  selectedPairs.value.sort((a, b) => a - b);
  validateHours();
};

// Валидация часов
const validateHours = () => {
  hoursWarning.value = null;

  if (!selectedDiscipline.value || !form.value.eventType) return;

  const eventType = form.value.eventType;

  // Проверяем, что тип события поддерживает часы (не 'other')
  if (
    eventType !== "theory" &&
    eventType !== "practice" &&
    eventType !== "assessment"
  ) {
    return;
  }

  const remainingHours = selectedDiscipline.value.remainingHours[eventType];
  const plannedHours = computedDuration.value;

  if (plannedHours > remainingHours) {
    const typeNames: Record<"theory" | "practice" | "assessment", string> = {
      theory: "теории",
      practice: "практики",
      assessment: "проверки знаний",
    };
    hoursWarning.value = `Превышение лимита часов! Для ${typeNames[eventType]} осталось ${remainingHours} ч., а запланировано ${plannedHours} ч.`;
  }

  // Также проверяем лимит часов инструктора
  validateInstructorHours();
};

// Проверка лимита часов инструктора по договору
const validateInstructorHours = async () => {
  instructorHoursWarning.value = null;

  // Если нет инструктора или продолжительности — пропускаем
  if (!form.value.instructorId || computedDuration.value <= 0) {
    return;
  }

  // Вычисляем продолжительность в минутах (из академических часов)
  // computedDuration возвращает академические часы (1 ак.ч = 45 мин)
  const durationMinutes = computedDuration.value * 45;

  if (durationMinutes <= 0) return;

  instructorHoursCheckLoading.value = true;

  try {
    const response = await authFetch<{
      success: boolean;
      canTake: boolean;
      remainingHours: number;
      requestedHours: number;
      message?: string;
      instructorName?: string;
      maxHours?: number;
    }>(
      `/api/instructors/${form.value.instructorId}/hours/check?minutes=${durationMinutes}`,
      {
        method: "GET",
      }
    );

    if (response.success && !response.canTake) {
      // Если maxHours = 0, значит без ограничений
      if (response.maxHours && response.maxHours > 0) {
        instructorHoursWarning.value =
          response.message ||
          `Превышен лимит часов инструктора! Доступно: ${response.remainingHours} ч., запрашивается: ${response.requestedHours} ч.`;
      }
    }
  } catch (err: any) {
    // Не блокируем на ошибку — просто пропускаем проверку
    console.warn("Failed to check instructor hours limit:", err);
  } finally {
    instructorHoursCheckLoading.value = false;
  }
};

// Валидация формы
const validate = (): boolean => {
  errors.value = {};

  if (!form.value.groupId) {
    errors.value.groupId = "Выберите группу";
  }

  if (!form.value.disciplineId) {
    errors.value.disciplineId = "Выберите дисциплину";
  }

  if (!form.value.instructorId) {
    errors.value.instructorId = "Выберите инструктора";
  }

  if (!form.value.date) {
    errors.value.date = "Укажите дату занятия";
  } else if (selectedGroupInfo.value && !isRetake.value) {
    // В режиме пересдачи не проверяем пределы курса
    const date = form.value.date;
    if (
      date < selectedGroupInfo.value.startDate ||
      date > selectedGroupInfo.value.endDate
    ) {
      errors.value.date = "Дата должна быть в пределах периода обучения группы";
    }
  }

  if (timeMode.value === "pairs") {
    if (selectedPairs.value.length === 0) {
      errors.value.time = "Выберите хотя бы одну пару";
    }
  } else {
    if (!form.value.startTime) {
      errors.value.startTime = "Укажите время начала";
    }
    if (!form.value.endTime) {
      errors.value.endTime = "Укажите время окончания";
    }
    if (
      form.value.startTime &&
      form.value.endTime &&
      form.value.endTime <= form.value.startTime
    ) {
      errors.value.endTime = "Время окончания должно быть позже начала";
    }
  }

  if (hoursWarning.value) {
    errors.value.time = "Исправьте превышение лимита часов";
  }

  if (isRetake.value && form.value.allowedStudentIds.length === 0) {
    errors.value.allowedStudentIds = "Выберите студентов для пересдачи";
  }

  return Object.keys(errors.value).length === 0;
};

// toLocalISOString нов импортируется из '~/utils/dateTime'

// Формирование данных для одной группы а-ч
const getSubmitDataForGroup = (pairNumbers: number[]) => {
  const sorted = [...pairNumbers].sort((a, b) => a - b);
  const first = lessonPairs.value.find((p) => p.number === sorted[0])!;
  const last = lessonPairs.value.find(
    (p) => p.number === sorted[sorted.length - 1]
  )!;

  const startTimeStr = toLocalISOString(form.value.date, first.startTime);
  const endTimeStr = toLocalISOString(form.value.date, last.endTime);

  const title = selectedDiscipline.value?.name || "Занятие";

  return {
    title,
    description: form.value.description.trim() || undefined,
    groupId: form.value.groupId,
    disciplineId: form.value.disciplineId,
    instructorId: form.value.instructorId,
    classroomId: form.value.classroomId || undefined,
    startTime: startTimeStr,
    endTime: endTimeStr,
    isAllDay: false,
    color: form.value.color,
    eventType: form.value.eventType,
    testTemplateId: form.value.testTemplateId || undefined,
    allowedStudentIds:
      isRetake.value && form.value.testTemplateId
        ? form.value.allowedStudentIds
        : undefined,
  };
};

// Формирование данных для режима точного времени или редактирования
const getSubmitData = () => {
  let startTimeStr: string;
  let endTimeStr: string;

  if (timeMode.value === "pairs" && selectedPairs.value.length > 0) {
    // Используем все выбранные а-ч (для последовательных)
    return getSubmitDataForGroup(selectedPairs.value);
  } else {
    // Режим точного времени
    startTimeStr = toLocalISOString(form.value.date, form.value.startTime);
    endTimeStr = toLocalISOString(form.value.date, form.value.endTime);
  }

  const title = selectedDiscipline.value?.name || "Занятие";

  return {
    title,
    description: form.value.description.trim() || undefined,
    groupId: form.value.groupId,
    disciplineId: form.value.disciplineId,
    instructorId: form.value.instructorId,
    classroomId: form.value.classroomId || undefined,
    startTime: startTimeStr,
    endTime: endTimeStr,
    isAllDay: false,
    color: form.value.color,
    eventType: form.value.eventType,
    testTemplateId: form.value.testTemplateId || undefined,
    allowedStudentIds:
      isRetake.value && form.value.testTemplateId
        ? form.value.allowedStudentIds
        : undefined,
  };
};

// Отправка формы
const handleSubmit = async () => {
  // Защита от двойного клика
  if (submitting.value) {
    return;
  }

  if (!validate()) {
    notification.show({
      type: "error",
      title: "Ошибка валидации",
      message: "Проверьте правильность заполнения формы",
    });
    return;
  }

  submitting.value = true;

  try {
    // Режим редактирования - обновляем одно событие
    if (isEditMode.value && props.event) {
      const data = getSubmitData();
      console.log(
        "[Schedule] Обновление занятия:",
        JSON.stringify(data, null, 2)
      );

      const response = await authFetch<{
        success: boolean;
        event: ScheduleEvent;
      }>(`/api/schedule/${props.event.id}`, { method: "PUT", body: data });

      if (response.success) {
        notification.show({
          type: "success",
          title: "Занятие обновлено",
          message: `Занятие "${response.event.title}" успешно обновлено`,
        });
        emit("saved", response.event);
      }
    }
    // Режим создания - проверяем непоследовательные а-ч
    else if (timeMode.value === "pairs" && hasNonConsecutivePairs.value) {
      // Создаём отдельные занятия для каждой группы последовательных а-ч
      console.log(
        "[Schedule] Создание нескольких занятий:",
        consecutiveGroups.value
      );

      const createdEvents: ScheduleEvent[] = [];

      for (const group of consecutiveGroups.value) {
        const data = getSubmitDataForGroup(group);
        console.log("[Schedule] Создание занятия для группы а-ч:", group, data);

        const response = await authFetch<{
          success: boolean;
          event: ScheduleEvent;
        }>("/api/schedule", { method: "POST", body: data });

        if (response.success) {
          createdEvents.push(response.event);
        }
      }

      if (createdEvents.length > 0) {
        notification.show({
          type: "success",
          title: "Занятия созданы",
          message: `Создано ${createdEvents.length} занятий`,
        });
        // Emit'им последнее созданное событие для обновления календаря
        const lastEvent = createdEvents[createdEvents.length - 1];
        if (lastEvent) {
          emit("saved", lastEvent);
        }
      }
    }
    // Режим создания - одно занятие
    else {
      const data = getSubmitData();
      console.log(
        "[Schedule] Создание занятия:",
        JSON.stringify(data, null, 2)
      );

      const response = await authFetch<{
        success: boolean;
        event: ScheduleEvent;
      }>("/api/schedule", { method: "POST", body: data });

      if (response.success) {
        notification.show({
          type: "success",
          title: "Занятие создано",
          message: `Занятие "${response.event.title}" успешно добавлено`,
        });
        emit("saved", response.event);
      }
    }
  } catch (error: any) {
    console.error("Error saving event:", error);
    notification.show({
      type: "error",
      title: "Ошибка",
      message:
        error.data?.statusMessage ||
        error.message ||
        "Не удалось сохранить занятие",
    });
  } finally {
    submitting.value = false;
  }
};

// Создание назначений тестов для всех привязанных тестов дисциплины
// eventStartTime - время начала занятия, с которого тест станет доступен
// This function seems unused and related to a previous feature.

// Удаление
const handleDelete = () => {
  if (!props.event) return;
  showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
  if (!props.event) return;

  deleting.value = true;

  try {
    const response = await authFetch<{ success: boolean }>(
      `/api/schedule/${props.event.id}`,
      { method: "DELETE" }
    );

    if (response.success) {
      notification.show({
        type: "success",
        title: "Занятие удалено",
        message: "Занятие успешно удалено из расписания",
      });
      showDeleteConfirm.value = false;
      emit("deleted", props.event.id);
    }
  } catch (error: any) {
    console.error("Error deleting event:", error);
    notification.show({
      type: "error",
      title: "Ошибка",
      message:
        error.data?.statusMessage ||
        error.message ||
        "Не удалось удалить занятие",
    });
  } finally {
    deleting.value = false;
  }
};

const handleClose = () => {
  emit("close");
};

// Вспомогательная функция для определения пар по времени
const findMatchingPairs = (startTime: string, endTime: string): number[] => {
  const matchingPairs: number[] = [];

  for (const pair of lessonPairs.value) {
    // Преобразуем время пары и выбранное время в минуты для сравнения
    const pairStartParts = pair.startTime.split(":").map(Number);
    const pairEndParts = pair.endTime.split(":").map(Number);
    const pairStartMinutes =
      (pairStartParts[0] ?? 0) * 60 + (pairStartParts[1] ?? 0);
    const pairEndMinutes = (pairEndParts[0] ?? 0) * 60 + (pairEndParts[1] ?? 0);

    const selectedStartParts = startTime.split(":").map(Number);
    const selectedEndParts = endTime.split(":").map(Number);
    const selectedStartMinutes =
      (selectedStartParts[0] ?? 0) * 60 + (selectedStartParts[1] ?? 0);
    const selectedEndMinutes =
      (selectedEndParts[0] ?? 0) * 60 + (selectedEndParts[1] ?? 0);

    // Проверяем, пересекается ли пара с выбранным диапазоном
    // Пара входит в диапазон, если её начало >= выбранное начало И её конец <= выбранное окончание
    if (
      pairStartMinutes >= selectedStartMinutes &&
      pairEndMinutes <= selectedEndMinutes
    ) {
      matchingPairs.push(pair.number);
    }
  }

  return matchingPairs;
};

// Инициализация формы
const initForm = () => {
  timeMode.value = "pairs";
  selectedPairs.value = [];
  hoursWarning.value = null;
  instructorHoursWarning.value = null;
  errors.value = {};

  // Сброс данных о тестах
  disciplineTests.value = [];
  isRetake.value = false;
  form.value.allowedStudentIds = [];

  if (props.event) {
    // Редактирование существующего
    // Извлекаем дату и время напрямую из ISO строки без конвертации часовых поясов
    // props.event.startTime = "2025-12-23T10:00:00.000Z"
    const startTimeStr = props.event.startTime;
    const endTimeStr = props.event.endTime;

    // Парсим ISO строку напрямую
    const datePart = startTimeStr.substring(0, 10); // "2025-12-23"
    const startTimePart = startTimeStr.substring(11, 16); // "10:00"
    const endTimePart = endTimeStr.substring(11, 16); // "11:20"

    form.value = {
      groupId: props.event.groupId || "",
      disciplineId: props.event.disciplineId || "",
      instructorId: props.event.instructorId || "",
      classroomId: props.event.classroomId || "",
      eventType: props.event.eventType,
      color: props.event.color,
      date: datePart,
      startTime: startTimePart,
      endTime: endTimePart,
      description: props.event.description || "",
      testTemplateId: "", // Will be loaded by loadCurrentAssignment
      allowedStudentIds: props.event.allowedStudentIds || [],
    };

    // Определяем, является ли это пересдачей
    if (
      (props.event.allowedStudentIds &&
        props.event.allowedStudentIds.length > 0) ||
      props.event.originalEventId
    ) {
      isRetake.value = true;
    }

    // Загружаем дисциплины если есть группа (с сохранением выбранных значений)
    if (form.value.groupId) {
      loadGroupDisciplines(form.value.groupId, true);

      // Если это пересдача, сразу загружаем студентов
      if (isRetake.value) {
        loadGroupStudents(form.value.groupId);
      }
    }

    // Загружаем тесты если это проверка знаний
    if (form.value.eventType === "assessment") {
      loadAllActiveTemplates().then(() => {
        loadCurrentAssignment(props.event!.id).then(() => {
          // Если после загрузки назначения выяснилось, что это пересдача (isRetake=true), загружаем студентов
          // (хотя мы уже могли загрузить их выше, проверка не повредит)
          if (isRetake.value && form.value.groupId) {
            loadGroupStudents(form.value.groupId);
          }
        });
      });
    }

    // Переключаем на точное время для редактирования
    timeMode.value = "exact";
  } else {
    // Создание нового
    const now = props.defaultStart ?? new Date();
    const endDate =
      props.defaultEnd ?? new Date(now.getTime() + 90 * 60 * 1000);

    // Используем локальные методы для избежания сдвига временной зоны
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    // Извлекаем время из defaultStart и defaultEnd
    const startHours = String(now.getHours()).padStart(2, "0");
    const startMinutes = String(now.getMinutes()).padStart(2, "0");
    const startTimeStr = `${startHours}:${startMinutes}`;

    const endHours = String(endDate.getHours()).padStart(2, "0");
    const endMinutes = String(endDate.getMinutes()).padStart(2, "0");
    const endTimeStr = `${endHours}:${endMinutes}`;

    // Проверяем, есть ли реальное время (не полночь, что означает выбор только даты в месячном виде)
    const hasTimeSelection =
      now.getHours() !== 0 ||
      now.getMinutes() !== 0 ||
      endDate.getHours() !== 0 ||
      endDate.getMinutes() !== 0;

    form.value = {
      groupId: "",
      disciplineId: "",
      instructorId: "",
      classroomId: "",
      eventType: "theory",
      color: "primary",
      date: dateStr,
      startTime: hasTimeSelection ? startTimeStr : "",
      endTime: hasTimeSelection ? endTimeStr : "",
      description: "",
    };

    disciplines.value = [];
    selectedGroupInfo.value = null;

    // Если создаем новое событие типа "Проверка знаний" (маловероятно при старте, но для консистентности)
    if (form.value.eventType === "assessment") {
      loadAllActiveTemplates();
    }

    // Если выбрано время, пытаемся найти подходящие пары
    if (hasTimeSelection) {
      const matchingPairs = findMatchingPairs(startTimeStr, endTimeStr);

      if (matchingPairs.length > 0) {
        // Если нашли совпадающие пары — используем режим пар
        timeMode.value = "pairs";
        selectedPairs.value = matchingPairs;
      } else {
        // Если пары не совпали — используем точное время
        timeMode.value = "exact";
      }
    } else {
      // Если время не выбрано (только дата) — режим пар без выбора
      timeMode.value = "pairs";
      selectedPairs.value = [];
    }
  }
};

// ===================
// WATCHERS
// ===================

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen) {
      // Загружаем настройки расписания (академические пары)
      await loadScheduleSettings();

      // Загружаем данные параллельно, но ждём завершения перед initForm
      await Promise.all([loadGroups(), loadClassrooms()]);

      // Инициализируем форму после загрузки данных
      initForm();
    }
  }
);

// Пересчёт часов при изменении времени или типа
watch(
  [
    () => form.value.startTime,
    () => form.value.endTime,
    () => selectedPairs.value.length,
  ],
  () => {
    validateHours();
  }
);
</script>
