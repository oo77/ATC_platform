<template>
  <div class="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
    <!-- Заголовок вкладки -->
    <button
      class="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
      @click="open = !open"
    >
      <span
        class="text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors uppercase tracking-wider"
      >
        {{ group.label }}
      </span>
      <div class="flex items-center gap-1.5">
        <!-- Бейдж — количество выбранных полей -->
        <span
          v-if="selectedCount > 0"
          class="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full"
        >
          {{ selectedCount }}
        </span>
        <svg
          class="w-4 h-4 text-gray-400 transition-transform duration-200"
          :class="open ? 'rotate-180' : ''"
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
    </button>

    <!-- Список полей -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 max-h-0"
      enter-to-class="opacity-100 max-h-[1000px]"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 max-h-[1000px]"
      leave-to-class="opacity-0 max-h-0"
    >
      <div v-show="open" class="overflow-hidden">
        <div class="pb-1.5 space-y-0">
          <div v-for="field in group.fields" :key="field.key" class="px-3">
            <!-- Строка поля -->
            <div
              class="flex items-center gap-2 py-0.5 rounded-lg cursor-pointer group/field"
              @click="toggle(field)"
            >
              <!-- Чекбокс -->
              <div
                class="w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-all duration-150"
                :class="
                  isSelected(field.key)
                    ? 'bg-primary border-primary'
                    : 'border-gray-300 dark:border-gray-600'
                "
              >
                <svg
                  v-if="isSelected(field.key)"
                  class="w-2.5 h-2.5 text-white"
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
              <span
                class="text-[13px] text-gray-700 dark:text-gray-300 flex-1 leading-tight"
                >{{ field.label }}</span
              >
            </div>

            <!-- Inline-настройки (если поле выбрано) -->
            <div
              v-if="isSelected(field.key)"
              class="ml-4 mb-1 p-1.5 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-100 dark:border-gray-700/40"
              @click.stop
            >
              <div class="flex items-center gap-2 flex-wrap">
                <!-- Агрегация -->
                <div class="flex items-center gap-1">
                  <span
                    class="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold"
                    >Σ</span
                  >
                  <select
                    :value="getColumn(field.key)?.aggregation"
                    class="text-[10px] font-bold border-none bg-white dark:bg-gray-700 text-primary px-1 py-0.5 outline-none cursor-pointer rounded"
                    @change="
                      onAggregationChange(
                        field.key,
                        ($event.target as HTMLSelectElement).value,
                      )
                    "
                  >
                    <option
                      v-for="agg in field.allowedAggregations"
                      :key="agg"
                      :value="agg"
                    >
                      {{ AGG_LABELS[agg] || agg }}
                    </option>
                  </select>
                </div>

                <!-- Итог -->
                <label class="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="getColumn(field.key)?.show_in_total"
                    class="w-3 h-3 rounded accent-primary cursor-pointer"
                    @change="
                      updateColumn(field.key, {
                        show_in_total: ($event.target as HTMLInputElement)
                          .checked,
                      })
                    "
                  />
                  <span class="text-[10px] text-gray-500 font-bold uppercase"
                    >Σ Итог</span
                  >
                </label>
              </div>

              <!-- Заголовок (редактируемый) -->
              <div class="mt-1">
                <input
                  :value="getColumn(field.key)?.label"
                  class="w-full text-[11px] border border-stroke dark:border-strokedark rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-1.5 py-0.5 outline-none focus:border-primary"
                  placeholder="Заголовок столбца"
                  @blur="
                    updateColumn(field.key, {
                      label: ($event.target as HTMLInputElement).value,
                    })
                  "
                  @click.stop
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from "vue";

interface FieldDef {
  key: string;
  label: string;
  type: string;
  allowedAggregations: string[];
  defaultAggregation: string;
  isDateField: boolean;
}

interface GroupDef {
  key: string;
  label: string;
  icon: string;
  fields: FieldDef[];
}

interface ColumnConfig {
  field_key: string;
  label: string;
  aggregation: string;
  show_in_total: boolean;
  total_aggregation: string;
  width: number;
  align: string;
}

const props = defineProps<{
  group: GroupDef;
  selectedColumns: ColumnConfig[];
}>();

const emit = defineEmits<{
  (
    e: "toggle-field",
    fieldKey: string,
    label: string,
    defaultAgg: string,
  ): void;
  (e: "update-column", fieldKey: string, updates: Partial<ColumnConfig>): void;
}>();

const open = ref(false);

const AGG_LABELS: Record<string, string> = {
  none: "Как есть",
  count: "COUNT",
  count_distinct: "COUNT DISTINCT",
  sum: "SUM",
  avg: "AVG",
  min: "MIN",
  max: "MAX",
  list: "Список",
};

// isSelected должна быть объявлена ДО computed, который её использует
const isSelected = (key: string) =>
  props.selectedColumns.some((c) => c.field_key === key);

const selectedCount = computed(
  () => props.group.fields.filter((f) => isSelected(f.key)).length,
);

// Открываем вкладку если есть выбранные поля (безопасный watchEffect вместо прямого вызова)
watchEffect(() => {
  if (selectedCount.value > 0) open.value = true;
});

const getColumn = (key: string) =>
  props.selectedColumns.find((c) => c.field_key === key);

const toggle = (field: FieldDef) => {
  emit("toggle-field", field.key, field.label, field.defaultAggregation);
};

const onAggregationChange = (fieldKey: string, value: string) => {
  emit("update-column", fieldKey, { aggregation: value });
};

const updateColumn = (fieldKey: string, updates: object) => {
  emit("update-column", fieldKey, updates);
};
</script>
