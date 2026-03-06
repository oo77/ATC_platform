<template>
  <div class="px-4 py-1 space-y-2">
    <!-- Диапазон дат -->
    <div>
      <label
        class="block text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5"
        >Период</label
      >
      <div class="grid grid-cols-2 gap-1.5">
        <input
          type="date"
          :value="filters.date_from"
          class="w-full text-[11px] border border-stroke dark:border-strokedark rounded-lg bg-transparent py-1 px-1.5 outline-none focus:border-primary dark:text-gray-200"
          @change="
            update('date_from', ($event.target as HTMLInputElement).value)
          "
        />
        <input
          type="date"
          :value="filters.date_to"
          class="w-full text-[11px] border border-stroke dark:border-strokedark rounded-lg bg-transparent py-1 px-1.5 outline-none focus:border-primary dark:text-gray-200"
          @change="update('date_to', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <!-- Поле-дата для фильтра -->
    <div>
      <label
        class="block text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5"
        >Применить к</label
      >
      <select
        :value="filters.date_field || 'group.start_date'"
        class="w-full text-[11px] border border-stroke dark:border-strokedark rounded-lg bg-transparent py-1 px-1.5 outline-none focus:border-primary dark:bg-gray-700 dark:text-gray-200 font-medium"
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
        class="block text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5"
        >Курсы</label
      >
      <UiMultiSelect
        :model-value="filters.course_ids"
        :options="
          lookup.courses.map((c) => ({
            id: String(c.id),
            label: c.short_name || c.name,
          }))
        "
        placeholder="Выберите курсы"
        @update:model-value="(v) => update('course_ids', v)"
      />
    </div>

    <!-- Организации -->
    <div>
      <label
        class="block text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5"
        >Организации</label
      >
      <UiMultiSelect
        :model-value="filters.org_ids"
        :options="
          lookup.organizations.map((o) => ({
            id: String(o.id),
            label: o.short_name || o.name,
            description: o.code,
          }))
        "
        placeholder="Выберите организации"
        @update:model-value="(v) => update('org_ids', v)"
      />
    </div>

    <!-- Группы -->
    <div>
      <label
        class="block text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5"
        >Учебные группы</label
      >
      <UiMultiSelect
        :model-value="filters.group_ids"
        :options="
          lookup.groups.map((g) => ({ id: String(g.id), label: g.code }))
        "
        placeholder="Выберите группы"
        @update:model-value="(v) => update('group_ids', v)"
      />
    </div>

    <!-- Инструкторы -->
    <div>
      <label
        class="block text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5"
        >Инструкторы</label
      >
      <UiMultiSelect
        :model-value="filters.instructor_ids"
        :options="
          lookup.instructors.map((i) => ({
            id: String(i.id),
            label: i.full_name,
          }))
        "
        placeholder="Выберите инструкторов"
        @update:model-value="(v) => update('instructor_ids', v)"
      />
    </div>

    <!-- Сброс -->
    <button
      v-if="hasActiveFilters"
      class="w-full flex items-center justify-center gap-2 mt-4 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-500 hover:text-white border border-red-200 dark:border-red-900/40 rounded-xl hover:bg-red-500 dark:hover:bg-red-600 transition-all"
      @click="$emit('update', {})"
    >
      <svg
        class="w-3.5 h-3.5"
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
  const newFilters = { ...props.filters };
  if (!value || (Array.isArray(value) && value.length === 0) || value === "") {
    delete newFilters[key];
  } else {
    newFilters[key] = value;
  }
  emit("update", newFilters);
};
</script>
