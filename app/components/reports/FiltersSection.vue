<template>
  <div class="px-4 py-2 space-y-3">
    <!-- Диапазон дат -->
    <div>
      <label
        class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
        >Диапазон дат</label
      >
      <div class="grid grid-cols-2 gap-2">
        <input
          type="date"
          :value="filters.date_from"
          class="w-full text-xs border border-stroke dark:border-strokedark rounded-lg bg-transparent py-1.5 px-2 outline-none focus:border-primary dark:text-gray-200"
          @change="
            update('date_from', ($event.target as HTMLInputElement).value)
          "
        />
        <input
          type="date"
          :value="filters.date_to"
          class="w-full text-xs border border-stroke dark:border-strokedark rounded-lg bg-transparent py-1.5 px-2 outline-none focus:border-primary dark:text-gray-200"
          @change="update('date_to', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <!-- Поле-дата для фильтра -->
    <div>
      <label
        class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
        >Применить дату к</label
      >
      <select
        :value="filters.date_field || 'group.start_date'"
        class="w-full text-xs border border-stroke dark:border-strokedark rounded-lg bg-transparent py-1.5 px-2 outline-none focus:border-primary dark:bg-gray-700 dark:text-gray-200"
        @change="
          update('date_field', ($event.target as HTMLSelectElement).value)
        "
      >
        <option value="group.start_date">Дата начала группы</option>
        <option value="group.end_date">Дата окончания группы</option>
        <option value="cert.issue_date">Дата выдачи сертификата</option>
        <option value="event.start_time">Дата занятия</option>
        <option value="student.created_at">Дата регистрации слушателя</option>
      </select>
    </div>

    <!-- Курсы -->
    <div>
      <label
        class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
        >Курсы</label
      >
      <select
        multiple
        class="w-full text-xs border border-stroke dark:border-strokedark rounded-lg bg-transparent py-1 px-2 outline-none focus:border-primary dark:bg-gray-700 dark:text-gray-200 max-h-24"
        :value="filters.course_ids || []"
        @change="updateMulti('course_ids', $event)"
      >
        <option v-for="c in lookup.courses" :key="c.id" :value="c.id">
          {{ c.short_name || c.name }}
        </option>
      </select>
    </div>

    <!-- Организации -->
    <div>
      <label
        class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
        >Организации</label
      >
      <select
        multiple
        class="w-full text-xs border border-stroke dark:border-strokedark rounded-lg bg-transparent py-1 px-2 outline-none focus:border-primary dark:bg-gray-700 dark:text-gray-200 max-h-24"
        :value="filters.org_ids || []"
        @change="updateMulti('org_ids', $event)"
      >
        <option v-for="o in lookup.organizations" :key="o.id" :value="o.id">
          {{ o.short_name || o.name }}
        </option>
      </select>
    </div>

    <!-- Группы -->
    <div>
      <label
        class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
        >Учебные группы</label
      >
      <select
        multiple
        class="w-full text-xs border border-stroke dark:border-strokedark rounded-lg bg-transparent py-1 px-2 outline-none focus:border-primary dark:bg-gray-700 dark:text-gray-200 max-h-24"
        :value="filters.group_ids || []"
        @change="updateMulti('group_ids', $event)"
      >
        <option v-for="g in lookup.groups" :key="g.id" :value="g.id">
          {{ g.code }}
        </option>
      </select>
    </div>

    <!-- Инструкторы -->
    <div>
      <label
        class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
        >Инструкторы</label
      >
      <select
        multiple
        class="w-full text-xs border border-stroke dark:border-strokedark rounded-lg bg-transparent py-1 px-2 outline-none focus:border-primary dark:bg-gray-700 dark:text-gray-200 max-h-24"
        :value="filters.instructor_ids || []"
        @change="updateMulti('instructor_ids', $event)"
      >
        <option v-for="i in lookup.instructors" :key="i.id" :value="i.id">
          {{ i.full_name }}
        </option>
      </select>
    </div>

    <!-- Сброс -->
    <button
      v-if="hasActiveFilters"
      class="w-full text-xs text-red-500 hover:text-red-600 py-1.5 border border-red-200 dark:border-red-900/40 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
      @click="$emit('update', {})"
    >
      Сбросить фильтры
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  filters: Record<string, any>;
  lookup: {
    courses: any[];
    organizations: any[];
    instructors: any[];
    groups: any[];
  };
}>();

const emit = defineEmits<{
  (e: "update", filters: Record<string, any>): void;
}>();

const hasActiveFilters = computed(
  () =>
    props.filters.date_from ||
    props.filters.date_to ||
    props.filters.course_ids?.length > 0 ||
    props.filters.org_ids?.length > 0 ||
    props.filters.group_ids?.length > 0 ||
    props.filters.instructor_ids?.length > 0,
);

const update = (key: string, value: any) => {
  emit("update", { ...props.filters, [key]: value || undefined });
};

const updateMulti = (key: string, event: Event) => {
  const sel = event.target as HTMLSelectElement;
  const values = Array.from(sel.selectedOptions).map((o) => o.value);
  emit("update", {
    ...props.filters,
    [key]: values.length > 0 ? values : undefined,
  });
};
</script>
